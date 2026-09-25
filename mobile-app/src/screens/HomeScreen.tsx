import React, { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getHomeData, getProducts } from "../api/endpoints";
import { Screen } from "../components/ui";
import { colors, radius, spacing } from "../theme";
import { ProductGrid } from "../components/ProductCard";
import { formatCurrency, whatsappLink } from "../utils/format";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import type { HomeTariff, ServiceType } from "../types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SERVICES: ServiceType[] = ["STANDARD", "EXPRESS", "ECONOMY"];

const STEPS = [
  { icon: "cart", title: "1. Achetez en ligne", desc: "Choisissez un produit ou collez le lien de votre boutique préférée." },
  { icon: "clipboard", title: "2. Commande enregistrée", desc: "Nous recevons et contrôlons votre colis en France." },
  { icon: "airplane", title: "3. Acheminement", desc: "Transport aérien ou maritime jusqu'à Madagascar, suivi en temps réel." },
  { icon: "home", title: "4. Livraison à domicile", desc: "Payez et recevez votre colis à Antananarivo ou dans votre ville." },
] as const;

const ADVANTAGES = [
  { icon: "truck", title: "Porte-à-porte", desc: "Collecte et livraison à domicile, des deux côtés de la route." },
  { icon: "search", title: "Suivi en temps réel", desc: "Un numéro de tracking unique et un historique détaillé." },
  { icon: "wallet", title: "Paiement mobile", desc: "Réglez avec MVola, Orange Money, carte bancaire ou espèce." },
  { icon: "shield-checkmark", title: "Colis protégés", desc: "Manutention soignée et prise en charge adaptée aux fragiles." },
  { icon: "checkmark-done", title: "Tarifs transparents", desc: "Frais calculés selon poids, volume et distance." },
  { icon: "chatbubble", title: "Support 7j/7", desc: "Une équipe disponible sur WhatsApp pour vous accompagner." },
] as const;

function SectionTitle({ title, subtitle, center }: { title: string; subtitle?: string; center?: boolean }) {
  return (
    <View style={center ? styles.secTitleCenter : styles.secTitle}>
      <Text style={styles.secTitleText}>{title}</Text>
      {subtitle ? <Text style={styles.secSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function IconTile({ icon, size = 20 }: { icon: string; size?: number }) {
  return (
    <View style={styles.iconTile}>
      <Ionicons name={icon as never} size={size} color={colors.primary} />
    </View>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [searchQuery, setSearchQuery] = useState("");
  const [showQueryError, setShowQueryError] = useState(false);

  const { data: home } = useQuery({ queryKey: ["home"], queryFn: getHomeData });
  const { data: productsData } = useQuery({ queryKey: ["home-products"], queryFn: () => getProducts(8, 0) });

  const visible = (productsData?.products ?? []).filter((p) => p.priceEUR != null);
  const featured = visible.slice(0, 4);
  const newcomers = visible.slice(4, 8);

  const tariffFor = (service: ServiceType): HomeTariff | undefined =>
    (home?.services ?? []).find((r) => r.serviceType === service && r.originCountry === "France" && r.destinationCountry === "Madagascar") ??
    (home?.services ?? []).find((r) => r.serviceType === service);

  const submitSearch = () => {
    if (!searchQuery.trim()) {
      setShowQueryError(true);
      return;
    }
    setShowQueryError(false);
    navigation.navigate("Tabs", { screen: "Catalog", params: { q: searchQuery.trim() } });
  };

  const stats = home?.stats;
  const routes = home?.topRoutes ?? [];

  return (
    <Screen scroll={false}>
      {/* ===== HERO (comme le site) ===== */}
      <View style={styles.hero}>
        <View style={styles.badge}>
          <Ionicons name="storefront" size={13} color={colors.primaryDark} />
          <Text style={styles.badgeText}>Boutiques en ligne → Madagascar</Text>
        </View>
        <Text style={styles.heroTitle}>
          Vos achats en ligne,{"\n"}
          <Text style={styles.heroTitleAccent}>livrés à Madagascar au meilleur prix.</Text>
        </Text>
        <Text style={styles.heroSubtitle}>
          Commandez sur les boutiques en ligne ou collez un lien produit : MadaColis se charge du transport, de la douane et livre votre colis à Antananarivo.
        </Text>

        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un produit (ex : smartphone, robot cuiseur…)…"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={submitSearch}
            autoCapitalize="none"
          />
          <Pressable style={styles.searchBtn} onPress={submitSearch}>
            <Text style={styles.searchBtnText}>Rechercher</Text>
          </Pressable>
        </View>
        {showQueryError ? <Text style={styles.searchError}>Saisissez un mot-clé pour rechercher.</Text> : null}

        <View style={styles.heroCtas}>
          <Pressable style={styles.ctaPrimary} onPress={() => navigation.navigate("Tabs", { screen: "Catalog" })}>
            <Ionicons name="bag-handle" size={16} color="#fff" />
            <Text style={styles.ctaPrimaryText}>Voir le catalogue</Text>
          </Pressable>
          <Pressable style={styles.ctaOutline} onPress={() => navigation.navigate("Tracking")}>
            <Ionicons name="navigate" size={16} color={colors.primaryDark} />
            <Text style={styles.ctaOutlineText}>Suivre un colis</Text>
          </Pressable>
        </View>

        <View style={styles.bullets}>
          {["Frais calculés automatiquement", "Tracking unique", "Paiement MVola / Orange Money"].map((b) => (
            <View key={b} style={styles.bullet}>
              <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ===== RACCOURCIS ===== */}
      <View style={[styles.section, styles.sectionSlate, { paddingTop: spacing.lg }]}>
        <View style={styles.quickRow}>
          {[
            { icon: "navigate", label: "Suivre un colis", action: () => navigation.navigate("Tracking") },
            { icon: "calculator", label: "Estimer un prix", action: () => navigation.navigate("Quote") },
            { icon: "send", label: "Créer un envoi", action: () => navigation.navigate("Quote") },
          ].map((q) => (
            <Pressable key={q.label} style={styles.quickCard} onPress={q.action}>
              <IconTile icon={q.icon} size={18} />
              <Text style={styles.quickLabel}>{q.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ===== COMMENT ÇA MARCHE ===== */}
      <View style={styles.section}>
        <SectionTitle title="Comment ça marche ?" subtitle="Quatre étapes simples pour expédier un colis entre les deux pays." center />
        <View style={styles.stepsGrid}>
          {STEPS.map((s) => (
            <View key={s.title} style={styles.stepCard}>
              <IconTile icon={s.icon} />
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepDesc}>{s.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ===== NOS SERVICES ===== */}
      <View style={[styles.section, styles.sectionSlate]}>
        <SectionTitle title="Nos services" subtitle="Choisissez le service adapté à votre colis." />
        <View style={styles.servicesList}>
          {SERVICES.map((s) => {
            const t = tariffFor(s);
            return (
              <View key={s} style={styles.serviceCard}>
                <View style={styles.serviceTop}>
                  <IconTile icon="airplane" size={18} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName}>{t?.name ?? s.toLowerCase()}</Text>
                    {t ? (
                      <Text style={styles.serviceRoute}>
                        {t.originCountry} → {t.destinationCountry}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.servicePriceRow}>
                  <Text style={styles.servicePrice}>{t ? formatCurrency(t.pricePerKg, t.currency) : "—"}</Text>
                  <Text style={styles.servicePerKg}>/ kg</Text>
                </View>
                {t ? (
                  <Text style={styles.serviceNote}>
                    estimé · non contractuel · base {formatCurrency(t.basePrice, t.currency)} · min {formatCurrency(t.minimumPrice, t.currency)}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
        <Pressable style={styles.linkRow} onPress={() => navigation.navigate("Quote")}>
          <Text style={styles.linkText}>Voir les tarifs</Text>
          <Ionicons name="arrow-forward" size={15} color={colors.primary} />
        </Pressable>
      </View>

      {/* ===== STATS (bande bleue) ===== */}
      {stats && (
        <LinearGradient colors={["#2563eb", "#1d4ed8", "#3730a3"]} style={styles.statsBand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.statsEyebrow}>
            <Ionicons name="globe" size={13} color="#dbeafe" />
            <Text style={styles.statsEyebrowText}>MadaColis en chiffres</Text>
          </View>
          <Text style={styles.statsTitle}>Des milliers de colis entre la France et Madagascar</Text>
          <Text style={styles.statsSubtitle}>Statistiques calculées en temps réel à partir de nos colis.</Text>

          <View style={styles.statsGrid}>
            {[
              { label: "Colis acheminés", value: stats.shipments },
              { label: "Colis livrés", value: stats.delivered },
              { label: "Colis en transit", value: stats.inTransit },
              { label: "Villes desservies", value: (home?.cities ?? []).length },
              { label: "Clients inscrits", value: stats.users },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {routes.length > 0 ? (
            <View style={styles.routesBlock}>
              <Text style={styles.routesTitle}>Routes les plus fréquentées</Text>
              <View style={styles.routesChips}>
                {routes.map((r) => (
                  <View key={`${r.originCity}-${r.destinationCity}`} style={styles.routeChip}>
                    <Text style={styles.routeChipText}>
                      {r.originCity} → {r.destinationCity}
                    </Text>
                    <Text style={styles.routeChipCount}>{r.count}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </LinearGradient>
      )}

      {/* ===== BANDEAU COMMANDER ===== */}
      <View style={styles.section}>
        <View style={styles.orderBand}>
          <View style={styles.orderBandHeader}>
            <Ionicons name="add-circle" size={22} color={colors.primary} />
            <Text style={styles.orderBandTitle}>Commander par lien produit</Text>
          </View>
          <Text style={styles.orderBandText}>
            Collez le lien du produit : MadaColis calcule automatiquement le poids volumétrique, la distance de livraison et vos frais complets. Vous recevez ensuite votre colis à Madagascar.
          </Text>
          <Pressable style={styles.ctaPrimary} onPress={() => navigation.navigate("Quote")}>
            <Text style={styles.ctaPrimaryText}>Commander →</Text>
          </Pressable>
        </View>
      </View>

      {/* ===== PRODUITS À LA UNE ===== */}
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <SectionTitle title="Produits les plus demandés" subtitle="Les produits les plus commandés en ligne, livrés à Madagascar." />
          </View>
          <Pressable style={styles.seeAll} onPress={() => navigation.navigate("Tabs", { screen: "Catalog" })}>
            <Text style={styles.linkText}>Tout le catalogue</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </Pressable>
        </View>
        {featured.length > 0 && <ProductGrid products={featured} />}
      </View>

      {/* ===== NOUVEAUTÉS ===== */}
      <View style={[styles.section, styles.sectionSlate]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <SectionTitle title="Nouveaux arrivages en ligne" subtitle="Commandez en ligne ou parcourez notre catalogue toujours plus riche." />
          </View>
          <Pressable style={styles.seeAll} onPress={() => navigation.navigate("Tabs", { screen: "Catalog" })}>
            <Text style={styles.linkText}>Découvrir</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </Pressable>
        </View>
        {newcomers.length > 0 && <ProductGrid products={newcomers} />}
      </View>

      {/* ===== CALCULATEUR ===== */}
      <View style={styles.section}>
        <SectionTitle title="Estimez votre prix en quelques secondes" subtitle="Le prix est calculé en temps réel par nos règles tarifaires, sans engagement." center />
        <Pressable style={styles.calcCard} onPress={() => navigation.navigate("Quote")}>
          <View style={styles.calcCardRow}>
            <IconTile icon="calculator" />
            <Text style={styles.calcCardText}>Ouvrir le simulateur de prix</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {/* ===== POURQUOI MADACOLIS ===== */}
      <View style={[styles.section, styles.sectionSlate]}>
        <SectionTitle title="Pourquoi MadaColis ?" subtitle="Une expérience d'expédition pensée pour vous." center />
        <View style={styles.advList}>
          {ADVANTAGES.map((a) => (
            <View key={a.title} style={styles.advCard}>
              <IconTile icon={a.icon} size={18} />
              <View style={{ flex: 1 }}>
                <Text style={styles.advTitle}>{a.title}</Text>
                <Text style={styles.advDesc}>{a.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ===== WHATSAPP ===== */}
      <View style={styles.section}>
        <View style={styles.waCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.waTitle}>Une question ? Contactez-nous sur WhatsApp</Text>
            <Text style={styles.waText}>Notre équipe vous répond 7 jours sur 7 pour toute demande : devis, douane, échéance de livraison…</Text>
          </View>
          <Pressable style={styles.waBtn} onPress={() => void Linking.openURL(whatsappLink())}>
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            <Text style={styles.waBtnText}>Discuter</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { padding: spacing.lg, paddingBottom: spacing.xl, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.subtle,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  badgeText: { fontSize: 12, fontWeight: "700", color: colors.primaryDark },
  heroTitle: { fontSize: 26, fontWeight: "800", lineHeight: 32, color: "#0f172a", marginTop: spacing.lg, letterSpacing: -0.4 },
  heroTitleAccent: { color: colors.primary },
  heroSubtitle: { fontSize: 14, lineHeight: 21, color: colors.textSecondary, marginTop: spacing.md },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingLeft: spacing.lg,
    height: 48,
    marginTop: spacing.lg,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, height: "100%" },
  searchBtn: {
    height: "100%",
    paddingHorizontal: spacing.lg,
    borderTopRightRadius: radius.md,
    borderBottomRightRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  searchError: { color: colors.danger, fontSize: 12, marginTop: spacing.sm },
  heroCtas: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  ctaPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
  },
  ctaPrimaryText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  ctaOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
  },
  ctaOutlineText: { color: colors.primaryDark, fontSize: 14, fontWeight: "700" },
  bullets: { marginTop: spacing.lg, gap: spacing.sm },
  bullet: { flexDirection: "row", alignItems: "center", gap: 6 },
  bulletText: { fontSize: 12, color: colors.textSecondary },
  section: { paddingVertical: spacing.xl * 1.4, paddingHorizontal: spacing.lg },
  sectionSlate: { backgroundColor: "#f8fafc" },
  secTitle: { marginBottom: spacing.lg },
  secTitleCenter: { marginBottom: spacing.lg, alignItems: "center" },
  secTitleText: { fontSize: 22, fontWeight: "800", color: "#0f172a", letterSpacing: -0.3 },
  secSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 19 },
  quickRow: { flexDirection: "row", gap: spacing.md, marginTop: -spacing.xl * 1.4 - spacing.md },
  quickCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  quickLabel: { fontSize: 12, fontWeight: "700", color: colors.text },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  stepsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  stepCard: {
    width: "47%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  stepTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginTop: spacing.md },
  stepDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 },
  servicesList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  serviceCard: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  serviceTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  serviceName: { fontSize: 16, fontWeight: "700", color: "#0f172a", textTransform: "capitalize" },
  serviceRoute: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  servicePriceRow: { flexDirection: "row", alignItems: "flex-end", gap: 4, marginTop: spacing.md },
  servicePrice: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  servicePerKg: { fontSize: 12, color: colors.textMuted, paddingBottom: 3 },
  serviceNote: { fontSize: 11, color: colors.textSecondary, marginTop: spacing.sm },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.lg, alignSelf: "flex-start" },
  linkText: { fontSize: 13, fontWeight: "700", color: colors.primary },
  statsBand: { paddingVertical: spacing.xl * 1.6, paddingHorizontal: spacing.lg },
  statsEyebrow: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  statsEyebrowText: { color: "#eff6ff", fontSize: 12, fontWeight: "700" },
  statsTitle: { fontSize: 22, fontWeight: "800", color: "#fff", textAlign: "center", marginTop: spacing.lg, lineHeight: 28 },
  statsSubtitle: { fontSize: 13, color: "#dbeafe", textAlign: "center", marginTop: spacing.sm },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.xl },
  statCard: {
    width: "30%",
    flexGrow: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  statValue: { fontSize: 24, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 10, color: "#dbeafe", textAlign: "center", marginTop: 4, paddingHorizontal: 6 },
  routesBlock: { marginTop: spacing.xl },
  routesTitle: { color: "#bfdbfe", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, textAlign: "center" },
  routesChips: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: spacing.sm, marginTop: spacing.md },
  routeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  routeChipText: { fontSize: 11, fontWeight: "600", color: "#eff6ff" },
  routeChipCount: { backgroundColor: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 10, fontWeight: "800", borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 1, overflow: "hidden" },
  orderBand: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  orderBandHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  orderBandTitle: { fontSize: 17, fontWeight: "800", color: "#0f172a" },
  orderBandText: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 19 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 2, alignSelf: "flex-start" },
  calcCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  calcCardRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  calcCardText: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  advList: { gap: spacing.md },
  advCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  advTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  advDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },
  waCard: { flexDirection: "row", alignItems: "center", gap: spacing.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg },
  waTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a", flex: 1 },
  waText: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 17 },
  waBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#16a34a",
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  waBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});