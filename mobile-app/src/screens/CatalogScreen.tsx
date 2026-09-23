import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, gradients, radius, shadows, spacing } from "../theme";
import { fetchProducts, searchMarketplace } from "../api/endpoints";
import { toCartItem, useCart } from "../context/CartContext";
import { ProductCard } from "../components/ProductCard";
import { Button, Chip, EmptyState, Screen, SkeletonCard } from "../components/ui";
import type { AmazonProduct } from "../types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { type CompositeScreenProps } from "@react-navigation/native";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Catalog">,
  NativeStackScreenProps<RootStackParamList>
>;

const PRESETS = ["smartphone", "robot pâtissier", "montre connectée", "air fryer", "écouteurs bluetooth", "machine à café", "parfum", "aspirateur"];

const PAGE = 24;

export function CatalogScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const isBrowsing = active === null || active === "";

  const browse = useQuery({
    queryKey: ["catalog", limit],
    queryFn: () => fetchProducts({ q: "", limit, skip: 0 }),
    staleTime: 5 * 60 * 1000,
  });

  const search = useQuery({
    queryKey: ["search", active],
    queryFn: () => searchMarketplace(active as string, 30),
    enabled: active != null && active !== "",
  });

  const products: AmazonProduct[] = isBrowsing ? (browse.data?.products ?? []) : (search.data?.products ?? []);
  const total = isBrowsing ? (browse.data?.total ?? 0) : (search.data?.total ?? 0);
  const loading = isBrowsing ? browse.isFetching : search.isFetching;
  const error = isBrowsing ? browse.isError : search.isError;
  const refetch = isBrowsing ? browse.refetch : search.refetch;

  const changeSearch = (raw: string) => {
    const q = raw.trim();
    setActive(q.length > 0 ? q : null);
  };

  const keyExtractor = useCallback((p: AmazonProduct) => p.asin, []);
  const inputRef = useRef<TextInput>(null);

  return (
    <Screen edges={["top"]}>
      <LinearGradient colors={["#0F172A", "#1E3A8A", "#2563EB"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: insets.top, paddingBottom: spacing.xl }}>
        <View style={styles.headerInner}>
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Ionicons name="airplane" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.brand}>MadaColis</Text>
              <Text style={styles.tagline}>Livraison France → Madagascar</Text>
            </View>
          </View>

          <View style={styles.searchBox}>
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.searchIcon}>
              <Ionicons name="search" size={16} color="#FFFFFF" />
            </LinearGradient>
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={(t) => {
                setQuery(t);
                if (t.trim() === "") {
                  setActive(null);
                  setLimit(PAGE);
                }
              }}
              onSubmitEditing={() => changeSearch(query)}
              placeholder="iPhone 15, robot pâtissier, parfum…"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <Pressable onPress={() => {
                setQuery("");
                setActive(null);
                inputRef.current?.blur();
              }}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {PRESETS.map((preset) => (
              <Chip key={preset} label={preset} active={active === preset} onPress={() => { setQuery(preset); changeSearch(preset); }} />
            ))}
          </ScrollView>
        </View>
      </LinearGradient>

      <FlatList
        data={products}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void refetch()} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.summary}>
            {active ? (
              <Text style={styles.summaryText}>Résultats pour « {active} »</Text>
            ) : (
              <>
                <Text style={styles.summaryTitle}>Toute la boutique</Text>
                <Text style={styles.summaryText}>Sélectionnez ou recherchez vos articles</Text>
              </>
            )}
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.totalPill}>
              <Ionicons name="cube-outline" size={13} color="#FFFFFF" />
              <Text style={styles.totalPillText}>{total} produits</Text>
            </LinearGradient>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.gridRow}>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : error ? (
            <EmptyState icon="cloud-offline-outline" title="Problème de connexion" subtitle="Vérifiez que le serveur MadaColis est démarré, puis réessayez.">
              <Button style={{ marginTop: spacing.md }} title="Réessayer" onPress={() => void refetch()} />
            </EmptyState>
          ) : (
            <EmptyState icon="search-outline" title="Aucun résultat" subtitle={`Nous n'avons rien pour « ${active} ». Essayez un autre mot.`} />
          )
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
        onEndReached={() => {
          if (isBrowsing && !loading && products.length < total) setLimit((n) => n + PAGE);
        }}
        onEndReachedThreshold={1.5}
        ListFooterComponent={
          !isBrowsing || products.length >= total ? null : (
            <Pressable style={styles.moreBtn} onPress={() => setLimit((n) => n + PAGE)}>
              <Text style={styles.moreText}>Voir plus ({products.length}/{total})</Text>
            </Pressable>
          )
        }
      />
    </Screen>
  );
}

function RefreshControlFresh({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
  const { RefreshControl } = require("react-native");
  return <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />;
}

const styles = StyleSheet.create({
  headerInner: { paddingHorizontal: spacing.lg, gap: spacing.lg },
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
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    height: 50,
    ...shadows.md,
  },
  searchIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text, padding: 0 },
  chipsRow: { flexDirection: "row", gap: spacing.sm, paddingRight: spacing.lg },
  summary: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: 6 },
  summaryTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  summaryText: { fontSize: 13, color: colors.subtext },
  totalPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    ...shadows.sm,
  },
  totalPillText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  gridRow: { gap: spacing.md, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  gridCell: { flex: 1 },
  gridContent: { paddingBottom: spacing.xxl },
  moreBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  moreText: { color: colors.primary, fontWeight: "700", fontSize: 14 },
});