import React from "react";
import { ImageBackground, StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getHomeData } from "../api/endpoints";
import { Screen, Card, Badge, Spinner, Empty } from "../components/ui";
import { colors, radius, spacing } from "../theme";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function StatChip({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["home"], queryFn: getHomeData });

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <View style={styles.hero}>
          <LinearGradient colors={["#1d4ed8", "#2563eb", "#1e40af"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroInner}>
            <Text style={styles.heroApp}>MadaColis</Text>
            <Text style={styles.heroTitle}>Vos achats en ligne, livrés à Madagascar.</Text>
            <Text style={styles.heroSub}>Commandez en ligne ou collez un lien produit : nous gérons transport, douane et livraison.</Text>
            <View style={styles.heroActions}>
              <Pressable style={styles.heroBtnPrimary} onPress={() => navigation.navigate("Quote")}>
                <Ionicons name="calculator-outline" size={16} color="#1d4ed8" />
                <Text style={styles.heroBtnPrimaryText}>Estimer un prix</Text>
              </Pressable>
              <Pressable style={styles.heroBtnGhost} onPress={() => navigation.navigate("Tracking")}>
                <Ionicons name="navigate-outline" size={16} color="#fff" />
                <Text style={styles.heroBtnGhostText}>Suivre un colis</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>

        {isLoading && <Spinner label="Chargement des données…" />}
        {isError && <Empty title="Erreur de chargement" subtitle="Vérifiez votre connexion." />}

        {!isLoading && !isError && data && (
          <>
            <View style={styles.statsRow}>
              <StatChip value={data.stats.shipments} label="Colis" />
              <StatChip value={data.stats.delivered} label="Livrés" />
              <StatChip value={data.stats.inTransit} label="En transit" />
              <StatChip value={data.cities.length} label="Villes" />
            </View>

            <Text style={styles.sectionTitle}>Nos services & tarifs</Text>
            <View style={styles.servicesList}>
              {data.services.map((s) => (
                <Card key={s.id} style={styles.serviceCard}>
                  <View style={styles.serviceTop}>
                    <Badge label={s.serviceType.toLowerCase()} color="blue" />
                    <Text style={styles.serviceRoute}>
                      {s.originCountry} → {s.destinationCountry}
                    </Text>
                  </View>
                  <View style={styles.serviceBottom}>
                    <Text style={styles.servicePrice}>
                      {s.pricePerKg} {s.currency}
                      <Text style={styles.servicePerKg}> /kg</Text>
                    </Text>
                    <Text style={styles.serviceMin}>min {s.minimumPrice} {s.currency}</Text>
                  </View>
                </Card>
              ))}
            </View>

            <View style={styles.actionsGrid}>
              <Pressable style={styles.actionCard} onPress={() => navigation.navigate("Tabs", { screen: "Catalog" })}>
                <Ionicons name="grid" size={22} color={colors.primary} />
                <Text style={styles.actionLabel}>Catalogue</Text>
              </Pressable>
              <Pressable style={styles.actionCard} onPress={() => navigation.navigate("Quote")}>
                <Ionicons name="calculator" size={22} color={colors.primary} />
                <Text style={styles.actionLabel}>Devis</Text>
              </Pressable>
              <Pressable style={styles.actionCard} onPress={() => navigation.navigate("Tracking")}>
                <Ionicons name="navigate" size={22} color={colors.primary} />
                <Text style={styles.actionLabel}>Suivi</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.lg, overflow: "hidden", marginBottom: spacing.lg },
  heroInner: { padding: spacing.xl, borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg },
  heroApp: { color: "#bfdbfe", fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.2 },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: spacing.sm, lineHeight: 30 },
  heroSub: { color: "#dbeafe", fontSize: 13, marginTop: spacing.sm, lineHeight: 18 },
  heroActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  heroBtnPrimary: { backgroundColor: "#fff", borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  heroBtnPrimaryText: { color: "#1d4ed8", fontSize: 13, fontWeight: "700" },
  heroBtnGhost: { borderColor: "rgba(255,255,255,0.5)", borderWidth: 1.5, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  heroBtnGhostText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xl },
  statChip: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800", color: colors.primary },
  statLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: "center" },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
  servicesList: { gap: spacing.md, marginBottom: spacing.xl },
  serviceCard: {},
  serviceTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  serviceRoute: { fontSize: 12, color: colors.textSecondary, flexShrink: 1 },
  serviceBottom: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: spacing.md },
  servicePrice: { fontSize: 22, fontWeight: "800", color: colors.text },
  servicePerKg: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  serviceMin: { fontSize: 12, color: colors.textMuted },
  actionsGrid: { flexDirection: "row", gap: spacing.md },
  actionCard: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingVertical: spacing.lg, alignItems: "center", gap: 6 },
  actionLabel: { fontSize: 12, fontWeight: "700", color: colors.text },
});