import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, gradients, radius, shadows, spacing } from "../theme";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { fetchProducts } from "../api/endpoints";
import { ProductCard } from "../components/ProductCard";
import { toCartItem } from "../context/CartContext";
import { Screen, SectionHeader, SkeletonCard } from "../components/ui";
import type { AmazonProduct } from "../types";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

const ACTIONS = [
  { key: "Catalog", label: "Catalogue", hint: "Boutique en ligne", icon: "storefront-outline", activeIcon: "storefront", color: "#2563EB" },
  { key: "Tracking", label: "Suivi", hint: "Votre colis", icon: "locate-outline", activeIcon: "locate", color: "#DB2777" },
  { key: "Cart", label: "Panier", hint: "Vos articles", icon: "cart-outline", activeIcon: "cart", color: "#EA580C" },
  { key: "Account", label: "Compte", hint: "Profil & réglages", icon: "person-circle-outline", activeIcon: "person-circle", color: "#059669" },
] as const;

const STEPS = [
  { title: "Trouvez vos articles", text: "Parcourez le catalogue Amazon et choisissez vos produits en euros." },
  { title: "Obtenez un devis", text: "Poids, dimensions, destination : le prix est estimé instantanément." },
  { title: "Recevez à Madagascar", text: "Vos colis arrivent en Ariary, suivez-les jusqu'à la livraison." },
];

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addItem, count } = useCart();
  const [trackNumber, setTrackNumber] = useState("");

  const trending = useQuery({
    queryKey: ["catalog", "home", 8],
    queryFn: () => fetchProducts({ q: "", limit: 8, skip: 0 }),
    staleTime: 5 * 60 * 1000,
  });

  const products: AmazonProduct[] = trending.data?.products ?? [];

  const firstName = user?.name?.split(" ")[0] ?? "cher client";

  return (
    <Screen edges={["top"]}>
      <FlatList
        data={products}
        keyExtractor={(p) => p.asin}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <LinearGradient colors={["#0F172A", "#1E3A8A", "#2563EB"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
              <View style={styles.brandRow}>
                <View style={styles.logo}>
                  <Ionicons name="cube" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.brand}>MadaColis</Text>
                  <Text style={styles.tagline}>Livraison France → Madagascar</Text>
                </View>
                {user ? (
                  <View style={styles.avatarChip}>
                    <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.greeting}>Salama, {firstName}</Text>
              <Text style={styles.heroText}>
                Commandez en France, recevez à Madagascar. Profitez de vos articles préférés livrés chez vous.
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{count}</Text>
                  <Text style={styles.statLabel}>Panier</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{products.length}+</Text>
                  <Text style={styles.statLabel}>Articles</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>7j</Text>
                  <Text style={styles.statLabel}>Livraison</Text>
                </View>
              </View>

              <Pressable style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]} onPress={() => navigation.navigate("Catalog")}>
                <LinearGradient colors={["#FFFFFF", "#E0EAFE"]} style={styles.ctaGradient}>
                  <Text style={styles.ctaText}>Commencer un achat</Text>
                  <Ionicons name="arrow-forward" size={18} color={colors.primaryDark} />
                </LinearGradient>
              </Pressable>
            </LinearGradient>

            <LinearGradient colors={["#1E293B", "#0B3A66", "#1D4ED8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.trackCard}>
              <View style={styles.orbTrackOne} />
              <View style={styles.orbTrackTwo} />
              <View style={styles.trackHead}>
                <View style={styles.trackIcon}>
                  <Ionicons name="locate" size={22} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trackTitle}>Suivi colis</Text>
                  <Text style={styles.trackSub}>Suivez votre colis France → Madagascar</Text>
                </View>
              </View>
              <View style={styles.trackSearchBox}>
                <Ionicons name="qr-code-outline" size={18} color={colors.primary} />
                <TextInput
                  value={trackNumber}
                  onChangeText={setTrackNumber}
                  onSubmitEditing={() => trackNumber.trim() && navigation.navigate("Tracking", { number: trackNumber.trim() })}
                  placeholder="MC-2024-XXXXX"
                  placeholderTextColor={colors.muted}
                  style={styles.trackSearchInput}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <Pressable
                  style={styles.trackGoBtn}
                  onPress={() => trackNumber.trim() && navigation.navigate("Tracking", { number: trackNumber.trim() })}
                >
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </Pressable>
              </View>
              <Pressable style={styles.trackOpen} onPress={() => navigation.navigate("Tracking")}>
                <Text style={styles.trackOpenText}>Ouvrir le suivi</Text>
                <Ionicons name="chevron-forward" size={14} color="#93C5FD" />
              </Pressable>
            </LinearGradient>

            <View style={styles.section}>
              <SectionHeader title="Accès rapide" subtitle="Vos raccourcis MadaColis" />
              <View style={styles.actionsGrid}>
                {ACTIONS.map((a) => (
                  <Pressable key={a.key} style={({ pressed }) => [styles.actionCard, pressed && { transform: [{ scale: 0.97 }] }]} onPress={() => navigation.navigate(a.key)}>
                    <View style={[styles.actionIcon, { backgroundColor: `${a.color}1A` }]}>
                      <Ionicons name={a.icon} size={22} color={a.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.actionLabel}>{a.label}</Text>
                      <Text style={styles.actionHint}>{a.hint}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeader title="Comment ça marche ?" subtitle="Trois étapes simples" />
              <View style={styles.stepsCard}>
                {STEPS.map((s, i) => (
                  <View key={s.title} style={styles.stepRow}>
                    <View style={styles.stepRail}>
                      <LinearGradient colors={gradients.primary} style={styles.stepNum}>
                        <Text style={styles.stepNumText}>{i + 1}</Text>
                      </LinearGradient>
                      {i < STEPS.length - 1 ? <View style={styles.stepLine} /> : null}
                    </View>
                    <View style={[styles.stepContent, i === STEPS.length - 1 && { paddingBottom: 0 }]}>
                      <Text style={styles.stepTitle}>{s.title}</Text>
                      <Text style={styles.stepText}>{s.text}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.trendingHeader}>
              <Text style={styles.sectionTitle}>Tendances</Text>
              <Pressable onPress={() => navigation.navigate("Catalog")} style={styles.viewAll}>
                <Text style={styles.viewAllText}>Voir tout</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          trending.isFetching ? (
            <View style={styles.gridRow}>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.gridCell}>
            <ProductCard
              product={item}
              onPress={() => navigation.navigate("ProductDetail", { product: item })}
              onAdd={() => addItem({ ...toCartItem(item), quantity: 1 })}
            />
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  hero: { paddingBottom: spacing.xl, paddingHorizontal: spacing.lg, gap: spacing.lg },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { color: "#FFFFFF", fontSize: 20, fontWeight: "800", letterSpacing: 0.2 },
  tagline: { color: "#BFDBFE", fontSize: 12, fontWeight: "500" },
  avatarChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  greeting: { color: "#FFFFFF", fontSize: 26, fontWeight: "900", marginTop: spacing.sm },
  heroText: { color: "#CFE0FA", fontSize: 13, lineHeight: 20 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  statLabel: { color: "#BFDBFE", fontSize: 11, fontWeight: "600" },
  statDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.2)" },
  cta: { borderRadius: radius.lg, overflow: "hidden" },
  ctaGradient: {
    minHeight: 52,
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  ctaText: { color: colors.primaryDark, fontSize: 16, fontWeight: "800" },
  trackCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.lg,
    overflow: "hidden",
    shadowColor: "#1D4ED8",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  orbTrackOne: {
    position: "absolute",
    top: -60,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(96,165,250,0.18)",
  },
  orbTrackTwo: {
    position: "absolute",
    bottom: -70,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  trackHead: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  trackIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  trackTitle: { color: "#FFFFFF", fontSize: 19, fontWeight: "900" },
  trackSub: { color: "#93C5FD", fontSize: 12, fontWeight: "600", marginTop: 2 },
  trackSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  trackSearchInput: { flex: 1, fontSize: 15, color: colors.text, padding: 0 },
  trackGoBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  trackOpen: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
  trackOpenText: { color: "#BFDBFE", fontSize: 13, fontWeight: "800" },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: colors.text, marginBottom: spacing.lg },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  actionCard: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.85)",
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    ...shadows.sm,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontSize: 14, fontWeight: "800", color: colors.text },
  actionHint: { fontSize: 11, color: colors.muted, fontWeight: "600", marginTop: 1 },
  stepsCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.85)",
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  stepRow: { flexDirection: "row", gap: spacing.md },
  stepRail: { alignItems: "center", width: 34 },
  stepNum: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  stepNumText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  stepLine: { flex: 1, width: 2, backgroundColor: colors.primaryLight, marginVertical: 4 },
  stepContent: { flex: 1, paddingBottom: spacing.lg },
  stepTitle: { fontSize: 14, fontWeight: "800", color: colors.text },
  stepText: { fontSize: 12, color: colors.subtext, lineHeight: 17, marginTop: 2 },
  trendingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  gridRow: { gap: spacing.md, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  gridCell: { flex: 1 },
  viewAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewAllText: { fontSize: 13, fontWeight: "800", color: colors.primary },
});