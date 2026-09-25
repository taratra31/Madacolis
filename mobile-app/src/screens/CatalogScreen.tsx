import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import type { RouteProp } from "@react-navigation/native";
import { getProducts } from "../api/endpoints";
import { Screen, Spinner, Empty } from "../components/ui";
import { colors, radius, spacing } from "../theme";
import { ProductGrid } from "../components/ProductCard";
import type { TabParamList } from "../navigation/types";

type Props = { route: RouteProp<TabParamList, "Catalog"> };

export function CatalogScreen({ route }: Props) {
  const initial = route.params?.q ?? "";
  const [query, setQuery] = useState(initial);
  const { data, isLoading, isError } = useQuery({ queryKey: ["products"], queryFn: () => getProducts(50, 0) });

  const products = useMemo(() => {
    const all = (data?.products ?? []).filter((p) => p.priceEUR != null);
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((p) => p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q));
  }, [data, query]);

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

      <Text style={styles.count}>{products.length} articles disponibles</Text>

      {isLoading && <Spinner label="Chargement du catalogue…" />}
      {isError && <Empty title="Erreur" subtitle="Impossible de charger le catalogue." />}
      {!isLoading && !isError && (
        <View style={{ marginTop: spacing.md }}>
          {products.length === 0 ? (
            <Empty title="Aucun résultat" subtitle={`Aucun produit ne correspond à « ${query} ».`} />
          ) : (
            <ProductGrid products={products} />
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
});