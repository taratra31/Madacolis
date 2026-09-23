import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { cn } from "@/utils";
import "leaflet/dist/leaflet.css";

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Location {
  city: string;
  country: string;
  coordinates?: Coordinate;
  /** Distance (km) d'estimation — fournie par le devis backend si dispo. */
}

// -- Types minimalistes Google Maps (uniquement ce qu'on consomme) --
interface GPolyLatLng {
  lat(): number;
  lng(): number;
}
interface GPrediction {
  place_id: string;
  description: string;
  distance_meters?: number;
}
interface GPlaceResult {
  geometry?: { location?: GPolyLatLng };
  formatted_address?: string;
}
interface GSession {
  _mc?: boolean;
}
interface GAutocompleteService {
  getPlacePredictions(request: {
    input: string;
    sessionToken: GSession;
    types?: string[];
    componentRestrictions?: { country: string };
    bounds?: { north: number; south: number; west: number; east: number };
  }, cb: (predictions: GPrediction[] | null, status: string) => void): void;
}
interface GPlacesService {
  getDetails(request: { placeId: string; sessionToken: GSession; fields: string[] }, cb: (place: GPlaceResult | null, status: string) => void): void;
}
interface GPlaces {
  AutocompleteService: new () => GAutocompleteService;
  PlacesService: new (node: HTMLElement) => GPlacesService;
  AutocompleteSessionToken: new () => GSession;
  PlacesServiceStatus: { OK: string };
}
interface GMapNamedLib { places?: GPlaces }
interface GGoogle { maps?: GMapNamedLib }

function getGoogle(): GGoogle | null {
  return (window as unknown as { google?: GGoogle }).google ?? null;
}

// ---------------------------------------------------------------------------
// Geolocalisation : Google d'abord, sinon endpoint backend /pricing/geocode
// ---------------------------------------------------------------------------

async function geocodeCity(city: string, country: string): Promise<Coordinate | null> {
  const g = getGoogle();
  if (g?.maps?.places) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(`${city}, ${country}`)}&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY ?? "")}`,
      );
      const data = (await res.json()) as { results?: Array<{ geometry: { location: { lat: number; lng: number } } }> };
      if (data.results?.[0]) {
        return { lat: data.results[0].geometry.location.lat, lng: data.results[0].geometry.location.lng };
      }
      return null;
    } catch {
      return null;
    }
  }
  try {
    const res = await fetch(`/api/v1/pricing/geocode?q=${encodeURIComponent(`${city}, ${country}`)}`);
    const data = (await res.json()) as { data?: { latitude: number; longitude: number } };
    if (data.data) return { lat: data.data.latitude, lng: data.data.longitude };
    return null;
  } catch {
    return null;
  }
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

let placesReady: boolean | null = null;
let placesPromise: Promise<boolean> | null = null;
function loadGooglePlaces(): Promise<boolean> {
  if (!GOOGLE_MAPS_API_KEY) return Promise.resolve(false);
  if (placesReady !== null) return Promise.resolve(placesReady);
  if (placesPromise) return placesPromise;
  placesPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&libraries=places&loading=async`;
    script.async = true;
    script.dataset.madacolisMaps = "true";
    script.addEventListener("load", () => {
      placesReady = Boolean(getGoogle()?.maps?.places);
      resolve(placesReady);
    });
    script.addEventListener("error", () => {
      placesReady = false;
      resolve(false);
    });
    document.head.appendChild(script);
  });
  return placesPromise;
}

function haversineKm(a: Coordinate, b: Coordinate): number {
  const toRad = (r: number): number => (r * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

// ---------------------------------------------------------------------------
// RouteMap — carte des deux villes + distance
// ---------------------------------------------------------------------------

const originIcon = L.divIcon({ className: "mc-pin", html: '<div class="mc-origin">D</div>', iconSize: [26, 26], iconAnchor: [13, 13] });
const destinationIcon = L.divIcon({ className: "mc-pin", html: '<div class="mc-dest">A</div>', iconSize: [26, 26], iconAnchor: [13, 13] });

function FitView({ points }: { points: Coordinate[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length <= 1) return;
    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])), { padding: [42, 42] });
  }, [map, points]);
  return null;
}

export function RouteMap({ origin, destination, distanceKm, className }: { origin?: Coordinate; destination?: Coordinate; distanceKm?: number; className?: string }) {
  const points = useMemo(() => [origin, destination].filter((p): p is Coordinate => Boolean(p)), [origin, destination]);
  const distance = distanceKm ?? (origin && destination ? haversineKm(origin, destination) : undefined);
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800", className)}>
      {points.length > 0 ? (
        <>
          <MapContainer
            center={[points[0].lat, points[0].lng]}
            zoom={6}
            style={{ height: "240px", width: "100%" }}
            attributionControl={false}
            preferCanvas
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            {origin && <Marker position={[origin.lat, origin.lng]} icon={originIcon} />}
            {destination && <Marker position={[destination.lat, destination.lng]} icon={destinationIcon} />}
            {origin && destination && (
              <Polyline positions={[[origin.lat, origin.lng], [destination.lat, destination.lng]]} pathOptions={{ color: "#059669", weight: 3, dashArray: "6 8" }} />
            )}
            <FitView points={points} />
          </MapContainer>
          <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-stone-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <span className="truncate font-medium text-slate-600 dark:text-slate-300">
              {origin ? "D" : ""} {destination ? "→ A" : ""}
            </span>
            {distance !== undefined && <span className="shrink-0 font-semibold text-blue-600 dark:text-blue-400">≈ {distance.toLocaleString("fr-FR")} km</span>}
          </div>
        </>
      ) : (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-slate-400">
          <MapPin className="size-5" />
          Sélectionnez le départ et l'arrivée pour visualiser l'itinéraire.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LocationPicker — autocomplete Google Places ou sélecteur, + mini-carte
// ---------------------------------------------------------------------------

export interface LocationPickerProps {
  label: string;
  value: string;
  region: string;
  options?: string[];
  onChange: (location: Location) => void;
  placeholder?: string;
  error?: string;
}

export function LocationPicker({ label, value, region, options = [], onChange, placeholder, error }: LocationPickerProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<GPrediction[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [maps, setMaps] = useState<"loading" | "ready" | "none">("loading");
  const [coords, setCoords] = useState<Coordinate | undefined>();
  const [resolving, setResolving] = useState(false);
  const sessionRef = useRef<GSession | null>(null);
  const debounceRef = useRef<number | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement>(null);
  const gcSeq = useRef(0);

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    let active = true;
    void loadGooglePlaces().then((ok) => active && setMaps(ok ? "ready" : "none"));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const emitCity = (city: string, gps?: Coordinate) => {
    setQuery(city);
    if (gps) setCoords(gps);
    onChange({ city, country: region, coordinates: gps });
  };

  const resolveFallback = async (city: string) => {
    if (!city.trim()) return;
    const seq = ++gcSeq.current;
    setResolving(true);
    const gps = await geocodeCity(city, region);
    if (seq !== gcSeq.current) return;
    setResolving(false);
    if (gps) {
      setCoords(gps);
      onChange({ city, country: region, coordinates: gps });
    }
  };

  const runSearch = (raw: string) => {
    if (!raw.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const g = getGoogle();
    const places = g?.maps?.places;
    if (!g || !places) return;
    let session = sessionRef.current;
    if (!session) session = sessionRef.current = new places.AutocompleteSessionToken();
    setBusy(true);
    const service = new places.AutocompleteService();
    service.getPlacePredictions(
      {
        input: raw,
        sessionToken: session,
        types: ["(cities)"],
        componentRestrictions: { country: region === "Madagascar" ? "mg" : "fr" },
        bounds: { north: region === "Madagascar" ? -11 : 51.5, south: region === "Madagascar" ? -26 : 41, west: region === "Madagascar" ? 42 : -5.5, east: region === "Madagascar" ? 51 : 9.5 },
      },
      (predictions, status) => {
        setBusy(false);
        if (status !== "OK" || !predictions) {
          setSuggestions([]);
          setOpen(false);
          return;
        }
        setSuggestions(predictions);
        setOpen(true);
      },
    );
  };

  const handleTyping = (raw: string) => {
    setQuery(raw);
    window.clearTimeout(debounceRef.current);
    if (maps !== "ready") {
      debounceRef.current = window.setTimeout(() => void resolveFallback(raw), 400);
      return;
    }
    if (raw.trim().length >= 2) {
      debounceRef.current = window.setTimeout(() => runSearch(raw), 200);
    }
  };

  const pickSuggestion = async (prediction: GPrediction) => {
    setOpen(false);
    const g = getGoogle();
    const places = g?.maps?.places;
    if (!places || !sessionRef.current) {
      emitCity(prediction.description.split(",")[0].trim());
      return;
    }
    const service = new places.PlacesService(document.createElement("div") as HTMLElement);
    service.getDetails(
      { placeId: prediction.place_id, sessionToken: sessionRef.current, fields: ["geometry"] },
      (place, status) => {
        sessionRef.current = new places.AutocompleteSessionToken();
        const gps = status === "OK" && place?.geometry?.location
          ? { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
          : undefined;
        emitCity(prediction.description.split(",")[0].trim(), gps);
      },
    );
  };

  return (
    <div ref={rootRef} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      {maps === "ready" ? (
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            placeholder={placeholder ?? "Tapez un nom de ville…"}
            onChange={(e) => handleTyping(e.target.value)}
            onFocus={() => query.trim() && runSearch(query)}
            className={cn(
              "h-11 w-full rounded-xl border bg-white pl-9 pr-8 text-sm text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100",
              error ? "border-red-300 focus:border-red-400 focus:ring-red-500/30 dark:border-red-700" : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/25 dark:border-slate-700 dark:focus:border-blue-500",
            )}
          />
          {busy && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-blue-600" />}
        </div>
      ) : (
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400" />
          {options.length > 0 ? (
            <select
              value={query && options.includes(query) ? query : ""}
              onChange={(e) => emitCity(e.target.value)}
              aria-invalid={Boolean(error)}
              className={cn(
                "h-11 w-full appearance-none rounded-xl border bg-white pl-9 pr-3.5 text-sm text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100",
                error ? "border-red-300 focus:border-red-400 focus:ring-red-500/30 dark:border-red-700" : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/25 dark:border-slate-700 dark:focus:border-blue-500",
              )}
            >
              {(!value || !options.includes(value)) && <option value="">{placeholder ?? "Choisir…"}</option>}
              {options.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={query}
                placeholder={placeholder ?? "Tapez un nom de ville…"}
                onChange={(e) => handleTyping(e.target.value)}
                className={cn(
                  "h-11 w-full rounded-xl border bg-white pl-9 pr-8 text-sm text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100",
                  error ? "border-red-300 focus:border-red-400 focus:ring-red-500/30 dark:border-red-700" : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/25 dark:border-slate-700 dark:focus:border-blue-500",
                )}
              />
              {(busy || resolving) && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-blue-600" />}
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {suggestions.map((suggestion) => (
            <li key={suggestion.place_id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void pickSuggestion(suggestion)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-blue-950/40"
              >
                <Navigation className="size-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{suggestion.description}</span>
                {suggestion.distance_meters !== undefined && (
                  <span className="ml-auto shrink-0 text-xs text-slate-400">≈ {Math.max(1, Math.round(suggestion.distance_meters / 1000))} km</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <RouteMap origin={coords} className="mt-3" />
    </div>
  );
}