import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";

export const DEFAULT_DISTANCE_KM = 8200;

interface GeocodedPlace {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
}

/** Géocode une adresse/libellé de lieu via Google Maps (retourne null si introuvable). */
export async function geocodePlace(query: string): Promise<GeocodedPlace | null> {
  if (!env.GOOGLE_MAPS_API_KEY) return null;
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}` +
    `&key=${encodeURIComponent(env.GOOGLE_MAPS_API_KEY)}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = (await response.json()) as { status: string; results?: Array<{ geometry: { location: { lat: number; lng: number } }; formatted_address?: string }> };
  if (data.status !== "OK" || !data.results?.[0]) return null;
  const place = data.results[0];
  return {
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
    formattedAddress: place.formatted_address,
  };
}

/** Distance orthodromique (grand cercle en kilomètres) entre deux coordonnées GPS. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function geocode(country: string, city: string): Promise<GeocodedPlace> {
  if (!env.GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY manquante");
  }
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(`${city}, ${country}`)}` +
    `&key=${encodeURIComponent(env.GOOGLE_MAPS_API_KEY)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Geocoding HTTP ${response.status}`);
  const data = (await response.json()) as {
    status: string;
    results?: Array<{
      geometry: { location: { lat: number; lng: number } };
      formatted_address?: string;
    }>;
  };
  if (data.status !== "OK" || !data.results?.[0]) {
    throw new Error(`Geocoding ${data.status} pour ${city}, ${country}`);
  }
  const place = data.results[0];
  return {
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
    formattedAddress: place.formatted_address,
  };
}

async function geocodeCached(country: string, city: string, cached?: { latitude: unknown; longitude: unknown }) {
  if (cached?.latitude != null && cached?.longitude != null) {
    return { latitude: Number(cached.latitude), longitude: Number(cached.longitude) };
  }
  const place = await geocode(country, city);
  return { latitude: place.latitude, longitude: place.longitude };
}

/**
 * Distance réelle (grand cercle, km) entre deux villes à partir de Google Maps Geocoding.
 * Le résultat est mis en cache dans DistanceRate pour ne pas refacturer Google.
 * Sans clé API : on retourne la distance éventuellement stockée, sinon DEFAULT_DISTANCE_KM.
 */
export async function getDistanceKm(
  originCountry: string,
  originCity: string,
  destinationCountry: string,
  destinationCity: string,
): Promise<number> {
  const rate = await prisma.distanceRate.findFirst({
    where: {
      originCountry: { equals: originCountry, mode: "insensitive" },
      originCity: { equals: originCity, mode: "insensitive" },
      destinationCountry: { equals: destinationCountry, mode: "insensitive" },
      destinationCity: { equals: destinationCity, mode: "insensitive" },
    },
  });

  if (rate) return Number(rate.distanceKm);

  if (!env.GOOGLE_MAPS_API_KEY) return DEFAULT_DISTANCE_KM;

  const [origin, destination] = await Promise.all([
    geocodeCached(originCountry, originCity),
    geocodeCached(destinationCountry, destinationCity),
  ]);

  const distanceKm = Number(haversineKm(origin.latitude, origin.longitude, destination.latitude, destination.longitude).toFixed(3));

  await prisma.distanceRate.create({
    data: {
      originCountry,
      originCity,
      destinationCountry,
      destinationCity,
      distanceKm,
      originLatitude: origin.latitude,
      originLongitude: origin.longitude,
      destinationLatitude: destination.latitude,
      destinationLongitude: destination.longitude,
    },
  });

  return distanceKm;
}

/** Met à jour (ou insère) les distances connues d'une liste de paires — pour warm-up du cache. */
export async function warmUpDistances(pairs: Array<{ originCountry: string; originCity: string; destinationCountry: string; destinationCity: string }>): Promise<number> {
  if (!env.GOOGLE_MAPS_API_KEY) return 0;
  let updated = 0;
  for (const pair of pairs) {
    try {
      const distanceKm = await getDistanceKm(pair.originCountry, pair.originCity, pair.destinationCountry, pair.destinationCity);
      await prisma.distanceRate.upsert({
        where: {
          originCountry_originCity_destinationCountry_destinationCity: {
            originCountry: pair.originCountry,
            originCity: pair.originCity,
            destinationCountry: pair.destinationCountry,
            destinationCity: pair.destinationCity,
          },
        },
        update: { distanceKm },
        create: { ...pair, distanceKm },
      });
      updated += 1;
    } catch {
      // On continue sans casser le calcul : la distance par défaut sera utilisée.
      continue;
    }
  }
  return updated;
}