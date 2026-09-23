import React, { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { colors, radius, spacing } from "../theme";
import { transitaireShipments, transitaireUpdateStatus } from "../api/endpoints";
import { Button, EmptyState } from "../components/ui";
import type { TransitaireShipment } from "../types";

const STATUS_FLOW = ["PENDING", "RECEIVED", "IN_TRANSIT", "IN_CUSTOMS", "OUT_FOR_DELIVERY", "DELIVERED"];

const STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  PENDING: { label: "En attente", bg: "#F1F5F9", fg: "#64748B" },
  RECEIVED: { label: "Reçu", bg: "#DBEAFE", fg: "#1D4ED8" },
  IN_TRANSIT: { label: "En transit", bg: "#FEF3C7", fg: "#B45309" },
  IN_CUSTOMS: { label: "En douane", bg: "#EDE9FE", fg: "#6D28D9" },
  OUT_FOR_DELIVERY: { label: "En cours de livraison", bg: "#CFFAFE", fg: "#0E7490" },
  DELIVERED: { label: "Livré", bg: "#DCFCE7", fg: "#15803D" },
  CANCELLED: { label: "Annulé", bg: "#FEE2E2", fg: "#B91C1C" },
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, bg: "#F1F5F9", fg: "#64748B" };
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Text style={[styles.badgeText, { color: meta.fg }]}>{meta.label}</Text>
    </View>
  );
}

export function TransitaireColisScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["transitaire-shipments", status, query],
    queryFn: ({ signal }) => transitaireShipments({ status: status || undefined, q: query || undefined, pageSize: 50 }, signal),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status: st, comment, location }: { id: string; status: string; comment?: string; location?: string }) =>
      transitaireUpdateStatus(id, { status: st, comment, location }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transitaire-shipments"] });
      setExpandedId(null);
    },
  });

  const shipments = data?.shipments ?? [];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={["#1E3A8A", "#4338CA", "#6366F1"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.orbTop} />
        <View style={styles.orbBottom} />
        <Text style={styles.heroTitle}>Colis</Text>
        <Text style={styles.heroSub}>Expéditions assignées à votre transporteur · {data?.pagination.total ?? 0}</Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => setQuery(search.trim())}
            placeholder="Rechercher par tracking…"
            placeholderTextColor={colors.muted}
            returnKeyType="search"
          />
          {search.length > 0 ? (
            <Pressable
              onPress={() => {
                setSearch("");
                setQuery("");
              }}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </LinearGradient>

      <View style={styles.chips}>
        <StatusChip label="Tous" active={!status} onPress={() => setStatus("")} />
        {STATUS_FLOW.map((s) => (
          <StatusChip key={s} label={STATUS_META[s].label} active={status === s} onPress={() => setStatus(status === s ? "" : s)} />
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.centerText}>Chargement des colis…</Text>
        </View>
      ) : shipments.length === 0 ? (
        <EmptyState icon="cube-outline" title="Aucun colis" subtitle={query || status ? "Modifiez vos filtres pour élargir la recherche." : "Aucune expédition assignée pour le moment."} />
      ) : (
        <FlatList
          data={shipments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: insets.bottom + spacing.xxl }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />}
          ListFooterComponent={mutation.isPending ? <ActivityIndicator color={colors.primary} /> : null}
          renderItem={({ item }) => (
            <ShipmentCard
              shipment={item}
              expanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              onUpdate={(payload) => mutation.mutate({ ...payload, id: item.id })}
              updating={mutation.isPending && mutation.variables?.id === item.id && !mutation.isError}
            />
          )}
        />
      )}
    </View>
  );
}

function StatusChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
      <Text style={[styles.chipText, active && { color: "#FFFFFF", fontWeight: "800" }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function ShipmentCard({
  shipment,
  expanded,
  onToggle,
  onUpdate,
  updating,
}: {
  shipment: TransitaireShipment;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (payload: { status: string; comment?: string; location?: string }) => void;
  updating: boolean;
}) {
  const [nextStatus, setNextStatus] = useState(shipment.status);
  const [location, setLocation] = useState("");
  const [comment, setComment] = useState("");

  return (
    <View style={[styles.card, expanded && styles.cardOpen]}>
      <Pressable onPress={onToggle} style={styles.cardHead}>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={styles.trackingRow}>
            <Text style={styles.tracking} numberOfLines={1}>{shipment.trackingNumber}</Text>
            <StatusBadge status={shipment.status} />
          </View>
          <Text style={styles.route}>
            {shipment.originCity}, {shipment.originCountry} → {shipment.destinationCity}, {shipment.destinationCountry}
          </Text>
          <Text style={styles.meta}>
            {fmtDate(shipment.createdAt)} · {shipment.user?.name ?? "Client MadaColis"} · {shipment.totalWeight} kg
          </Text>
          {expanded ? <Text style={styles.updateLabel}>Choisissez un nouveau statut puis « Appliquer ».</Text> : null}
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <Text style={styles.price}>{shipment.estimatedPrice.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €</Text>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} />
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.updateBox}>
          <Text style={styles.updateFieldLabel}>Nouveau statut</Text>
          <View style={styles.flowRow}>
            {STATUS_FLOW.map((s) => (
              <Pressable
                key={s}
                onPress={() => setNextStatus(s)}
                style={[styles.flowChip, nextStatus === s && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Text style={[styles.flowChipText, nextStatus === s && { color: "#FFFFFF", fontWeight: "800" }]} numberOfLines={1}>
                  {STATUS_META[s].label}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.updateInput}
            value={location}
            onChangeText={setLocation}
            placeholder="Ville / lieu (ex : Ivato, Paris…)"
            placeholderTextColor={colors.muted}
          />
          <TextInput
            style={styles.updateInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Commentaire (optionnel)"
            placeholderTextColor={colors.muted}
          />
          <Button
            title="Appliquer"
            icon="checkmark-circle-outline"
            loading={updating}
            onPress={() => onUpdate({ status: nextStatus, comment: comment.trim() || undefined, location: location.trim() || undefined })}
          />
        </View>
      ) : null}
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
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.subtext },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  centerText: { fontSize: 13, color: colors.subtext, fontWeight: "600" },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: "hidden",
  },
  cardOpen: { borderColor: colors.primaryLight },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  trackingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  tracking: { fontFamily: "monospace", fontSize: 13, fontWeight: "800", color: colors.primaryDark },
  route: { fontSize: 14, fontWeight: "700", color: colors.text },
  meta: { fontSize: 11, fontWeight: "600", color: colors.muted },
  updateLabel: { fontSize: 12, fontWeight: "600", color: colors.primary },
  price: { fontSize: 16, fontWeight: "900", color: colors.text },
  badge: { borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "800" },
  updateBox: {
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    backgroundColor: "#F8FAFC",
  },
  updateFieldLabel: { fontSize: 12, fontWeight: "700", color: colors.subtext, textTransform: "uppercase", letterSpacing: 0.3 },
  flowRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  flowChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  flowChipText: { fontSize: 11, fontWeight: "600", color: colors.subtext },
  updateInput: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
});