import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../theme";
import { trackShipment } from "../api/endpoints";
import { Button } from "../components/ui";
import type { TrackingInfo } from "../types";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "../navigation/types";

type Props = BottomTabScreenProps<MainTabParamList, "Tracking">;

const STATUS_ORDER = ["CREE", "EN_CENTRE_TRI", "EN_TRANSIT", "ARRIVE_DESTINATION", "EN_LIVRAISON", "LIVRE"] as const;

const STATUS_LABEL: Record<string, string> = {
  CREE: "Colis créé",
  EN_CENTRE_TRI: "Au centre de tri",
  EN_TRANSIT: "En transit",
  ARRIVE_DESTINATION: "Arrivé à destination",
  EN_LIVRAISON: "En livraison",
  LIVRE: "Livre",
};

function normalize(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z]/g, "_").toUpperCase();
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export function TrackingScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const [trackingNumber, setTrackingNumber] = useState(route.params?.number ?? "");
  const [result, setResult] = useState<TrackingInfo | null>(null);

  const track = useMutation({
    mutationFn: trackShipment,
    onSuccess: (data) => setResult(data.tracking),
  });

  const submit = () => {
    const num = trackingNumber.trim();
    if (!num) return;
    setResult(null);
    track.mutate(num);
  };

  const currentIdx = result
    ? Math.max(
        0,
        ...STATUS_ORDER.map((s, i) => (normalize(result.status).startsWith(normalize(s)) || normalize(result.status) === normalize(s) ? i : -1)),
      )
    : -1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={["#0F172A", "#1E3A8A", "#2563EB"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
      >
        <View style={styles.orbTop} />
        <View style={styles.orbBottom} />

        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <View style={styles.headerIcon}>
            <Ionicons name="cube" size={24} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pageTitle, { color: "#FFFFFF" }]}>Suivi colis</Text>
            <Text style={[styles.pageSub, { color: "#BFDBFE" }]}>Entrez votre numéro de tracking MadaColis.</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="locate" size={18} color={colors.primary} />
          <TextInput
            value={trackingNumber}
            onChangeText={setTrackingNumber}
            onSubmitEditing={submit}
            placeholder="MC-2024-XXXXX"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {trackingNumber.length > 0 ? (
            <Pressable onPress={() => { setTrackingNumber(""); setResult(null); }} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
        <Button title="Suivre mon colis" icon="search" loading={track.isPending} disabled={!trackingNumber.trim()} onPress={submit} />
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: spacing.lg }} showsVerticalScrollIndicator={false}>
        {track.isError ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={28} color={colors.danger} />
            <Text style={styles.errorText}>{track.error instanceof Error ? track.error.message : "Colis introuvable."}</Text>
          </View>
        ) : null}

        {result ? (
          <>
            <View style={styles.statusCard}>
              <View style={styles.statusHead}>
                <View>
                  <Text style={styles.trackingNum}>{result.trackingNumber}</Text>
                  <Text style={styles.statusLabel}>{STATUS_LABEL[result.status] ?? result.status}</Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: currentIdx >= STATUS_ORDER.length - 1 ? colors.successLight : colors.primaryLight },
                  ]}
                >
                  <Ionicons
                    name={currentIdx >= STATUS_ORDER.length - 1 ? "checkmark-circle" : "airplane"}
                    size={14}
                    color={currentIdx >= STATUS_ORDER.length - 1 ? colors.success : colors.primary}
                  />
                  <Text style={[styles.statusPillText, { color: currentIdx >= STATUS_ORDER.length - 1 ? colors.success : colors.primary }]}>
                    {currentIdx >= STATUS_ORDER.length - 1 ? "Livre" : "En cours"}
                  </Text>
                </View>
              </View>

              <View style={styles.routeRow}>
                <Ionicons name="airplane" size={14} color={colors.primary} />
                <Text style={styles.routeText}>
                  {result.originCity}, {result.originCountry} → {result.destinationCity}, {result.destinationCountry}
                </Text>
              </View>
              {result.estimatedDeliveryDate ? (
                <Text style={styles.eta}>
                  Livraison estimée : <Text style={{ fontWeight: "800", color: colors.text }}>{fmtDate(result.estimatedDeliveryDate)}</Text>
                  {result.estimatedPrice != null ? ` · ${result.estimatedPrice.toLocaleString("fr-FR")} ${result.currency ?? "MGA"}` : ""}
                </Text>
              ) : null}
            </View>

            <View style={styles.timeline}>
              {result.statusHistory.map((ev, i) => {
                const isCurrent = i === result!.statusHistory.length - 1;
                return (
                  <View key={i} style={styles.eventRow}>
                    <View style={styles.timelineCol}>
                      <View style={[styles.dot, isCurrent && styles.dotCurrent]} />
                      {i < result!.statusHistory.length - 1 ? <View style={styles.line} /> : null}
                    </View>
                    <View style={styles.eventBody}>
                      <Text style={[styles.eventStatus, isCurrent && { color: colors.primary }]}>
                        {STATUS_LABEL[ev.status] ?? ev.status}
                      </Text>
                      {ev.comment ? <Text style={styles.eventComment}>{ev.comment}</Text> : null}
                      <Text style={styles.eventMeta}>
                        {ev.location ? `${ev.location} · ` : ""}{fmtDate(ev.createdAt)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : null}

        <Pressable style={styles.helpCard}>
          <Ionicons name="help-circle-outline" size={18} color={colors.subtext} />
          <Text style={styles.helpText}>
            Vous venez de commander ? Un numéro de tracking vous sera envoyé par SMS et e-mail dès que le colis partira de France.
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  orbTop: {
    position: "absolute",
    top: -70,
    right: -50,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  orbBottom: {
    position: "absolute",
    bottom: -90,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(96,165,250,0.14)",
  },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: { fontSize: 26, fontWeight: "900", color: colors.dark },
  pageSub: { fontSize: 13, fontWeight: "600", marginTop: 2 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 50,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text, padding: 0 },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.dangerLight,
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: "600", color: colors.danger },
  statusCard: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  statusHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  trackingNum: { fontSize: 18, fontWeight: "900", color: colors.dark, letterSpacing: 0.5 },
  statusLabel: { fontSize: 13, fontWeight: "700", color: colors.subtext, marginTop: 2 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 999 },
  statusPillText: { fontSize: 12, fontWeight: "800" },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  routeText: { fontSize: 13, fontWeight: "700", color: colors.text },
  eta: { fontSize: 12, color: colors.subtext },
  timeline: { marginTop: spacing.lg, gap: 0 },
  eventRow: { flexDirection: "row", gap: spacing.md },
  timelineCol: { alignItems: "center", width: 16 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.border, borderWidth: 2, borderColor: colors.card },
  dotCurrent: { backgroundColor: colors.primary, borderColor: colors.primaryLight },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
  eventBody: { flex: 1, paddingBottom: spacing.lg, gap: 2, paddingTop: 0 },
  eventStatus: { fontSize: 14, fontWeight: "800", color: colors.text },
  eventComment: { fontSize: 12, color: colors.subtext },
  eventMeta: { fontSize: 11, color: colors.muted },
  helpCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  helpText: { flex: 1, fontSize: 12, color: colors.subtext, lineHeight: 18 },
});