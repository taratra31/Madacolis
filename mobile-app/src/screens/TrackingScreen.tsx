import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, InputField, Button, Card, Badge, Empty } from "../components/ui";
import { colors, radius, spacing } from "../theme";
import { trackShipment } from "../api/endpoints";
import type { TrackingResult } from "../types";

const statusColor = (s: string) => {
  const upper = s.toUpperCase();
  if (["DELIVERED", "COMPLETED"].includes(upper)) return "green" as const;
  if (["IN_TRANSIT", "PROCESSING", "PENDING"].includes(upper)) return "amber" as const;
  if (["CANCELLED", "FAILED"].includes(upper)) return "red" as const;
  return "blue" as const;
};

export function TrackingScreen() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async () => {
    setError(null);
    setResult(null);
    if (!trackingNumber.trim()) {
      setError("Saisissez votre numéro de colis.");
      return;
    }
    setLoading(true);
    try {
      const res = await trackShipment(trackingNumber.trim().toUpperCase());
      setResult(res.shipment);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Colis introuvable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Suivre un colis</Text>
      <Text style={styles.subtitle}>Entrez votre numéro de suivi (ex : SHP-XXXX-001).</Text>

      <InputField
        label="Numéro de suivi"
        placeholder="SHP-..."
        autoCapitalize="characters"
        value={trackingNumber}
        onChangeText={setTrackingNumber}
        onSubmitEditing={() => void handleTrack()}
      />
      <Button label="Suivre" onPress={() => void handleTrack()} loading={loading} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {result ? (
        <View style={{ marginTop: spacing.lg }}>
          <Card>
            <View style={styles.topRow}>
              <Badge label={result.status.toLowerCase().replace(/_/g, " ")} color={statusColor(result.status)} />
              <Text style={styles.trackingNum}>{result.trackingNumber}</Text>
            </View>
            <Text style={styles.route}>
              {result.originCity} → {result.destinationCity}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>
                {result.serviceType} · {result.estimatedPrice} {result.currency}
              </Text>
              {result.estimatedDeliveryDate ? <Text style={styles.meta}>Arrivée estimée : {result.estimatedDeliveryDate}</Text> : null}
            </View>
            {result.items.length > 0 ? (
              <Text style={styles.itemsLabel}>
                {result.items.map((i) => `${i.quantity}× ${i.description}`).join(" · ")}
              </Text>
            ) : null}
          </Card>

          <Text style={styles.timelineTitle}>Suivi</Text>
          {result.history.length === 0 ? <Empty title="Aucun événement" /> : null}
          {[...result.history].reverse().map((h, idx) => (
            <View key={h.id} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.dot, idx === 0 && styles.dotActive]} />
                {idx !== result.history.length - 1 ? <View style={styles.line} /> : null}
              </View>
              <View style={styles.timelineBody}>
                <Badge label={h.status.toLowerCase().replace(/_/g, " ")} color={statusColor(h.status)} />
                <Text style={styles.timelineDate}>
                  {new Date(h.createdAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                </Text>
                {h.comment ? <Text style={styles.timelineComment}>{h.comment}</Text> : null}
                {h.location ? <Text style={styles.timelineLocation}>{h.location}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xl },
  error: { color: colors.danger, fontSize: 13, marginTop: spacing.lg },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  trackingNum: { fontSize: 12, fontWeight: "700", color: colors.textSecondary },
  route: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: spacing.md },
  metaRow: { marginTop: spacing.sm, gap: 2 },
  meta: { fontSize: 12, color: colors.textSecondary },
  itemsLabel: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  timelineTitle: { fontSize: 17, fontWeight: "800", color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
  timelineItem: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
  timelineLeft: { alignItems: "center", width: 12 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 4, minHeight: 24 },
  timelineBody: { flex: 1, gap: 4 },
  timelineDate: { fontSize: 12, color: colors.textSecondary },
  timelineComment: { fontSize: 13, color: colors.text },
  timelineLocation: { fontSize: 12, color: colors.textMuted },
});