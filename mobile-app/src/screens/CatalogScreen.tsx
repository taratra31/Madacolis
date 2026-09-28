import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { RouteProp } from "@react-navigation/native";
import { getProducts, searchProducts } from "../api/endpoints";
import { Screen, Spinner, Empty } from "../components/ui";
import { colors, radius, spacing } from "../theme";
import { ProductGrid } from "../components/ProductCard";
import type { TabParamList } from "../navigation/types";

type Props = { route: RouteProp<TabParamList, "Catalog"> };
const PAGE = 50;

export function CatalogScreen({ route }: Props) {
  const initial = route.params?.q ?? "";
  const [query, setQuery] = useState(initial);
  const searchActive = query.trim().length > 0;

  const { data: searchData, isFetching: searchFetching } = useQuery({
    queryKey: ["product-search", query.trim()],
    queryFn: () => searchProducts(query.trim(), 100),
    enabled: searchActive,
  });

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["products"],
    queryFn: ({ pageParam }) => getProducts(PAGE, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const total = lastPage.total ?? 0;
      const loaded = allPages.reduce((n, p) => n + p.products.filter((x) => x.priceEUR != null).length, 0);
      return loaded < total ? allPages.length * PAGE : undefined;
    },
  });

  const products = searchActive
    ? (searchData?.products ?? []).filter((p) => p.priceEUR != null)
    : (data?.pages ?? []).flatMap((p) => p.products).filter((p) => p.priceEUR != null);
  const total = searchActive ? (searchData?.total ?? products.length) : (data?.pages[0]?.total ?? products.length);

  return (
    <Screen>
      <Text style={styles.title}>Catalogue</Text>
      <Text style={styles.subtitle}>Achetez en ligne en France, recevez vos colis à Madagascar.</Text>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un produit (ex : smartphone…)"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.count}>{total.toLocaleString("fr-FR")} articles disponibles</Text>

      {isLoading && <Spinner label="Chargement du catalogue…" />}
      {isError && <Empty title="Erreur" subtitle="Impossible de charger le catalogue." />}
      {!isLoading && !isError && (
        <View style={{ marginTop: spacing.md }}>
          {products.length === 0 ? (
            <Empty title="Aucun résultat" subtitle={searchActive ? `Aucun produit ne correspond à « ${query.trim()} ».` : "Aucun produit disponible."} />
          ) : (
            <>
              <ProductGrid products={products} />
              {(searchActive ? searchFetching && products.length === 0 : hasNextPage) ? (
                <View style={styles.loadMore}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.loadMoreText}>Chargement…</Text>
                </View>
              ) : !searchActive && hasNextPage ? (
                <Pressable style={styles.loadMoreBtn} onPress={() => fetchNextPage()} disabled={isFetchingNextPage}>
                  <Text style={styles.loadMoreBtnText}>{isFetchingNextPage ? "Chargement…" : "Voir plus de produits"}</Text>
                  <Ionicons name="chevron-down" size={16} color={colors.primary} />
                </Pressable>
              ) : null}
              {!searchActive && !hasNextPage && products.length > 0 ? (
                <Text style={styles.allShown}>Tous les produits sont affichés ({total}).</Text>
              ) : null}
            </>
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 46,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, height: "100%" },
  count: { fontSize: 12, color: colors.textMuted, marginTop: spacing.md },
  loadMore: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.lg },
  loadMoreText: { fontSize: 13, color: colors.textSecondary },
  loadMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.subtle,
  },
  loadMoreBtnText: { fontSize: 14, fontWeight: "700", color: colors.primary },
  allShown: { fontSize: 12, color: colors.primary, textAlign: "center", fontWeight: "600", marginTop: spacing.lg },
});