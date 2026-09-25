import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Screen, InputField, Button, Card } from "../components/ui";
import { colors, spacing } from "../theme";
import { quoteShipment } from "../api/endpoints";
import type { QuoteResult, ServiceType } from "../types";

const SERVICE_LABELS: Record<ServiceType, string> = {
  STANDARD: "STANDARD",
  EXPRESS: "EXPRESS",
  ECONOMY: "ECONOMY",
};

export function QuoteScreen() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [weight, setWeight] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("STANDARD");
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuote = async () => {
    setError(null);
    setResult(null);
    if (!origin.trim() || !destination.trim() || !weight) {
      setError("Renseignez la ville de départ, la destination et le poids.");
      return;
    }
    const weightKg = Number(weight);
    if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 500) {
      setError("Poids invalide (1 à 500 kg).");
      return;
    }
    const [, originCity = ""] = origin.split(",");
    const [originCountry = "France"] = origin.split(",");
    const [, destCity = ""] = destination.split(",");
    const [destCountry = "Madagascar"] = destination.split(",");
    setLoading(true);
    try {
      const res = await quoteShipment({
        originCountry: originCountry.trim(),
        originCity: (originCity || originCountry).trim(),
        destinationCountry: destCountry.trim(),
        destinationCity: (destCity || destCountry).trim(),
        serviceType,
        weightKg,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Estimation impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Estimer un prix</Text>
      <Text style={styles.subtitle}>Estimation indicative du transport de votre colis.</Text>

      <InputField label="Départ (pays, ville)" placeholder="France, Paris" value={origin} onChangeText={setOrigin} />
      <InputField label="Destination (pays, ville)" placeholder="Madagascar, Antananarivo" value={destination} onChangeText={setDestination} />
      <InputField label="Poids (kg)" placeholder="ex : 5" keyboardType="numeric" value={weight} onChangeText={setWeight} />

      <Text style={styles.label}>Service</Text>
      <View style={styles.segment}>
        {(Object.keys(SERVICE_LABELS) as ServiceType[]).map((s) => (
          <View key={s} style={[styles.segmentItem, serviceType === s && styles.segmentActive]}>
            <Button
              variant={serviceType === s ? "primary" : "ghost"}
              label={s}
              onPress={() => setServiceType(s)}
            />
          </View>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ marginTop: spacing.md }}>
        <Button label="Estimer" onPress={() => void handleQuote()} loading={loading} />
      </View>

      {result ? (
        <Card style={styles.resultCard}>
          <Text style={styles.resultLabel}>Estimation</Text>
          <Text style={styles.resultPrice}>
            {result.estimatedPrice} {result.currency}
          </Text>
          <Text style={styles.resultDetail}>
            Base {result.breakdown.basePrice} · Poids {result.breakdown.weightCost} · Distance {result.breakdown.distanceCost} · Livraison estimée {result.deliveryDays[0]}–{result.deliveryDays[1]} jours
          </Text>
          <Text style={styles.resultNote}>
            Service {result.serviceType} · Prix indicatif. Le tarif définitif sera validé à l'expédition.
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xl },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: spacing.sm },
  segment: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  segmentItem: { flex: 1 },
  segmentActive: { transform: [{ scale: 1.02 }] },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.lg },
  resultCard: { marginTop: spacing.xl, alignItems: "center" },
  resultLabel: { fontSize: 12, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 },
  resultPrice: { fontSize: 32, fontWeight: "800", color: colors.primary, marginTop: 4 },
  resultDetail: { fontSize: 12, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm, lineHeight: 17 },
  resultNote: { fontSize: 11, color: colors.textMuted, textAlign: "center", marginTop: spacing.sm, fontStyle: "italic" },
});