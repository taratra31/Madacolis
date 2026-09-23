import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../theme";
import { requestQuote } from "../api/endpoints";
import { Button, EmptyState, Field } from "../components/ui";
import type { QuoteResult } from "../types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Quote">;

const formatAr = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} Ar`;
const formatEUR = (v: number) => `${v.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €`;

const SERVICES = [
  { value: "STANDARD", label: "Standard" },
  { value: "EXPRESS", label: "Express" },
  { value: "ECONOMY", label: "Économique" },
] as const;

const METHODS = [
  { value: "AIR", label: "Avion", icon: "airplane" as const, days: "5-8 j" },
  { value: "SEA", label: "Bateau", icon: "boat" as const, days: "25-40 j" },
] as const;

export function QuoteScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const prefill = route.params?.product;
  const isStack = !!prefill;

  const [title, setTitle] = useState(prefill?.title ?? "");
  const [quantity, setQuantity] = useState(String(prefill ? (route.params?.prefill?.quantity ?? 1) : 1));
  const [weight, setWeight] = useState(prefill?.weightKg != null ? String(prefill.weightKg) : "");
  const [len, setLen] = useState(prefill?.lengthCm != null ? String(prefill.lengthCm) : "");
  const [width, setWidth] = useState(prefill?.widthCm != null ? String(prefill.widthCm) : "");
  const [height, setHeight] = useState(prefill?.heightCm != null ? String(prefill.heightCm) : "");
  const [city, setCity] = useState("Antananarivo");
  const [serviceType, setServiceType] = useState<"STANDARD" | "EXPRESS" | "ECONOMY">("STANDARD");
  const [method, setMethod] = useState<"AIR" | "SEA">("AIR");
  const [result, setResult] = useState<QuoteResult | null>(null);

  const quote = useMutation({
    mutationFn: requestQuote,
    onSuccess: (data) => setResult(data.quote),
  });

  const calculated = useMemo(() => {
    const w = parseFloat(weight) || 0;
    const l = parseFloat(len) || 0;
    const wi = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    const vol = (l * wi * h) / 5000;
    const billing = Math.max(w, vol);
    return { billing };
  }, [weight, len, width, height]);

  const submit = () => {
    if (!title.trim()) return;
    setResult(null);
    quote.mutate({
      title: title.trim(),
      quantity: parseInt(quantity) || 1,
      weightKg: parseFloat(weight) || 0,
      lengthCm: parseFloat(len) || undefined,
      widthCm: parseFloat(width) || undefined,
      heightCm: parseFloat(height) || undefined,
      destinationCountry: "Madagascar",
      destinationCity: city.trim() || "Antananarivo",
      serviceType,
      shippingMethod: method,
    });
  };

  const q = result?.quote;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {isStack ? (
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Estimer le devis</Text>
          <View style={{ width: 36 }} />
        </View>
      ) : (
        <LinearGradient
          colors={["#1E40AF", "#2563EB", "#3B82F6"]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <View style={{ width: 42, height: 42, borderRadius: radius.lg, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="calculator" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pageTitle, { color: "#FFFFFF" }]}>Devis</Text>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>Coût livraison France → Madagascar.</Text>
            </View>
          </View>
        </LinearGradient>
      )}

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        {prefill?.imageUrl ? (
          <View style={styles.prefillCard}>
            <Text style={styles.prefillLabel}>Produit sélectionné</Text>
            <Text style={styles.prefillTitle}>{prefill.title}</Text>
          </View>
        ) : null}

        <Field label="Nom du produit / lien" value={title} onChangeText={setTitle} placeholder="Ex : Robot pâtissier Kenwood" />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field label="Quantité" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Poids (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="0.5" />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Dimensions (optionnel — L × l × H, cm)</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}><Field label="Longueur" value={len} onChangeText={setLen} keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><Field label="Largeur" value={width} onChangeText={setWidth} keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><Field label="Hauteur" value={height} onChangeText={setHeight} keyboardType="numeric" /></View>
        </View>

        <View style={styles.segmentWrap}>
          <Text style={styles.sectionLabel}>Mode d'expédition</Text>
          <View style={styles.methodRow}>
            {METHODS.map((m) => (
              <Pressable
                key={m.value}
                onPress={() => setMethod(m.value)}
                style={[styles.methodCard, method === m.value && styles.methodCardActive]}
              >
                <View style={[styles.methodIcon, method === m.value && styles.methodIconActive]}>
                  <Ionicons name={m.icon} size={18} color={method === m.value ? "#FFFFFF" : colors.primary} />
                </View>
                <Text style={[styles.methodLabel, method === m.value && { color: colors.primary }]}>{m.label}</Text>
                <Text style={styles.methodDays}>{m.days}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.segmentWrap}>
          <Text style={styles.sectionLabel}>Type de service</Text>
          <View style={styles.methodRow}>
            {SERVICES.map((s) => (
              <Pressable
                key={s.value}
                onPress={() => setServiceType(s.value)}
                style={[styles.serviceCard, serviceType === s.value && styles.serviceCardActive]}
              >
                <Text style={[styles.serviceText, serviceType === s.value && { color: "#FFFFFF" }]}>{s.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Field label="Ville de destination (Madagascar)" value={city} onChangeText={setCity} placeholder="Antananarivo" />

        {calculated.billing > 0 ? (
          <Text style={styles.hint}>Poids facturable : <Text style={{ fontWeight: "800", color: colors.text }}>{calculated.billing.toFixed(1)} kg</Text> (réel vs volumétrique)</Text>
        ) : null}

        {result && q ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName}>{q.transitaireName}</Text>
                <Text style={styles.resultMeta}>
                  {q.shippingMethod === "AIR" ? "Avion" : "Bateau"} · livraison estimée sous {q.estimatedDeliveryDays} jours
                </Text>
                <Text style={styles.resultMeta}>
                  {q.distanceKm.toLocaleString("fr-FR")} km · {q.usingVolumetric ? "poids volumétrique appliqué" : "poids réel"}
                </Text>
              </View>
              {q.shippingMethod === "AIR" ? (
                <View style={styles.resultIcon}>
                  <Ionicons name="airplane" size={20} color={colors.primary} />
                </View>
              ) : (
                <View style={styles.resultIcon}>
                  <Ionicons name="boat" size={20} color={colors.primary} />
                </View>
              )}
            </View>

            <View style={styles.resultRow}>
              <Ionicons name="cube-outline" size={16} color={colors.subtext} />
              <Text style={styles.resultRowLabel}>Poids facturé</Text>
              <Text style={styles.resultRowValue}>
                {q.billingWeight} kg{q.usingVolumetric ? " (volumétrique)" : ""}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Ionicons name="speedometer-outline" size={16} color={colors.subtext} />
              <Text style={styles.resultRowLabel}>Tarif</Text>
              <Text style={styles.resultRowValue}>
                {q.shippingMethod === "AIR" ? `${q.ratePerKgAr.toLocaleString("fr-FR")} Ar/kg` : `${q.ratePerM3Ar.toLocaleString("fr-FR")} Ar/m³`}
                {q.isFragile ? " · fragile +15%" : ""}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Ionicons name="trail-sign-outline" size={16} color={colors.subtext} />
              <Text style={styles.resultRowLabel}>Frais de dossier</Text>
              <Text style={styles.resultRowValue}>{formatAr(q.breakdown.baseHandlingAr)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Ionicons name="construct-outline" size={16} color={colors.subtext} />
              <Text style={styles.resultRowLabel}>Transport</Text>
              <Text style={styles.resultRowValue}>{formatAr(q.breakdown.transportAr)}</Text>
            </View>
            {q.breakdown.fragileSurchargeAr > 0 && (
              <View style={styles.resultRow}>
                <Ionicons name="warning-outline" size={16} color={colors.subtext} />
                <Text style={styles.resultRowLabel}>Surcharge fragile</Text>
                <Text style={styles.resultRowValue}>{formatAr(q.breakdown.fragileSurchargeAr)}</Text>
              </View>
            )}

            <View style={styles.resultTotalBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultTotalLabel}>Total estimé</Text>
                <Text style={styles.resultTotalMeta}>Prix calculé par le backend, non contractuel</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.resultPriceMGA}>{formatAr(q.priceAr)}</Text>
                <Text style={styles.resultPriceEUR}>≈ {formatEUR(q.price)}</Text>
              </View>
            </View>
            <Text style={styles.resultNote}>Livraison estimée sous {q.estimatedDeliveryDays} jours · Le transitaire confirmera le tarif final après contrôle du colis.</Text>
          </View>
        ) : null}

        <Button
          title="Calculer le devis"
          icon="calculator-outline"
          loading={quote.isPending}
          disabled={!title.trim()}
          onPress={submit}
          style={{ marginTop: spacing.sm }}
        />
        {quote.isError ? <EmptyState icon="alert-circle-outline" title="Devis impossible" subtitle={quote.error instanceof Error ? quote.error.message : "Réessayez plus tard."} /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  pageTitle: { fontSize: 24, fontWeight: "900", color: colors.dark },
  pageSub: { fontSize: 13, color: colors.subtext, marginTop: 2 },
  prefillCard: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  prefillLabel: { fontSize: 11, fontWeight: "700", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  prefillTitle: { fontSize: 14, fontWeight: "700", color: colors.text, lineHeight: 20 },
  row: { flexDirection: "row", gap: spacing.md },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: colors.subtext, marginTop: spacing.sm },
  segmentWrap: { gap: spacing.sm },
  methodRow: { flexDirection: "row", gap: spacing.md },
  methodCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    gap: 6,
  },
  methodCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  methodIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  methodIconActive: { backgroundColor: colors.primary },
  methodLabel: { fontSize: 13, fontWeight: "800", color: colors.text },
  methodDays: { fontSize: 11, color: colors.muted, fontWeight: "600" },
  serviceCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  serviceCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  serviceText: { fontSize: 13, fontWeight: "800", color: colors.subtext },
  hint: { fontSize: 12, color: colors.subtext },
  resultCard: {
    backgroundColor: colors.successLight,
    borderWidth: 1.5,
    borderColor: colors.success,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  resultHead: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md, marginBottom: spacing.xs },
  resultName: { fontSize: 16, fontWeight: "800", color: colors.text },
  resultMeta: { fontSize: 12, color: colors.subtext, marginTop: 2 },
  resultIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  resultRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  resultRowLabel: { flex: 1, fontSize: 13, color: colors.subtext, fontWeight: "600" },
  resultRowValue: { fontSize: 13, fontWeight: "700", color: colors.text },
  resultTotalBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.success,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  resultTotalLabel: { fontSize: 15, fontWeight: "900", color: "#FFFFFF" },
  resultTotalMeta: { fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 2 },
  resultPriceMGA: { fontSize: 18, fontWeight: "900", color: "#FFFFFF" },
  resultPriceEUR: { fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: "700" },
  resultNote: { fontSize: 12, color: colors.subtext, fontStyle: "italic", marginTop: spacing.xs },
});