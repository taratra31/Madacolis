import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { colors, radius, spacing } from "../theme";
import { transitaireRates } from "../api/endpoints";
import { EmptyState } from "../components/ui";

const fmtAr = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " Ar";

export function TransitaireTarifsScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["transitaire-rates"],
    queryFn: ({ signal }) => transitaireRates(signal),
  });

  const rates = data?.rates;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={["#1E3A8A", "#4338CA", "#6366F1"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.orbTop} />
        <View style={styles.orbBottom} />
        <Text style={styles.heroTitle}>Mes tarifs</Text>
        <Text style={styles.heroSub}>Tarifs publiés sur la plateforme MadaColis</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: insets.bottom + spacing.xxl }}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.centerText}>Chargement des tarifs…</Text>
          </View>
        ) : isError || !rates ? (
          <EmptyState icon="cloud-offline-outline" title="Impossible de charger les tarifs" subtitle="Vérifiez votre connexion au serveur.">
            <Text onPress={() => void refetch()} style={{ color: colors.primary, fontWeight: "800", marginTop: spacing.sm }}>
              Réessayer
            </Text>
          </EmptyState>
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}>
              <View style={styles.cardRow}>
                <View style={[styles.cardIcon, { backgroundColor: "#DBEAFE" }]}>
                  <Ionicons name="business-outline" size={20} color={colors.primaryDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardLabel}>{rates.carrier.name}</Text>
                  <Text style={styles.cardHint}>{rates.carrier.shortName} · partenaire MadaColis</Text>
                </View>
              </View>
            </View>

            <View style={styles.grid}>
              <View style={[styles.card, styles.gridCard, { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }]}>
                <Ionicons name="airplane-outline" size={20} color="#B45309" />
                <Text style={styles.cardValue}>{fmtAr(rates.carrier.airPerKgAr)}</Text>
                <Text style={styles.cardLabel}>Fret aérien / kg</Text>
                <Text style={styles.cardHint}>{rates.carrier.airDays} jours · ≈ {rates.carrier.airPerKgEur.toFixed(2)} €</Text>
              </View>
              <View style={[styles.card, styles.gridCard, { backgroundColor: "#ECFEFF", borderColor: "#A5F3FC" }]}>
                <Ionicons name="boat-outline" size={20} color="#0E7490" />
                <Text style={styles.cardValue}>{fmtAr(rates.carrier.seaPerM3Ar)}</Text>
                <Text style={styles.cardLabel}>Fret maritime / m³</Text>
                <Text style={styles.cardHint}>{rates.carrier.seaDays} jours · ≈ {rates.carrier.seaPerM3Eur.toFixed(2)} €</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Row icon="document-text-outline" label="Frais de dossier / manutention" value={fmtAr(rates.carrier.baseHandlingAr)} />
              <Row icon="calculator-outline" label="Commission MadaColis" value={rates.commissionRateLabel} />
              <Row icon="swap-horizontal-outline" label="Taux de change affiché" value={`1 € ≈ ${rates.eurToMga.toLocaleString("fr-FR")} Ar`} />
            </View>

            <Text style={styles.footer}>Les tarifs sont configurés par MadaColis et appliqués lors des devis clients.</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Row({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    overflow: "hidden",
  },
  orbTop: {
    position: "absolute",
    top: -70,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  orbBottom: {
    position: "absolute",
    bottom: -90,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(165,180,252,0.16)",
  },
  heroTitle: { color: "#FFFFFF", fontSize: 26, fontWeight: "900" },
  heroSub: { color: "#C7D2FE", fontSize: 13, fontWeight: "600", marginTop: 4 },
  center: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xxl },
  centerText: { fontSize: 13, color: colors.subtext, fontWeight: "600" },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cardValue: { fontSize: 24, fontWeight: "900", color: colors.text, marginTop: spacing.md },
  cardLabel: { fontSize: 14, fontWeight: "800", color: colors.text, marginTop: 2 },
  cardHint: { fontSize: 11, fontWeight: "600", color: colors.subtext, marginTop: 2 },
  grid: { flexDirection: "row", gap: spacing.md },
  gridCard: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, fontSize: 13, fontWeight: "600", color: colors.subtext },
  rowValue: { fontSize: 14, fontWeight: "800", color: colors.text },
  footer: { textAlign: "center", fontSize: 11, color: colors.muted },
});