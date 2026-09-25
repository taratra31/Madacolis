import React from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../api/endpoints";
import { Screen, Spinner, Empty, Badge } from "../components/ui";
import { colors, radius, spacing } from "../theme";
import { useCart } from "../context/CartContext";
import type { CatalogProduct } from "../types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function ProductCard({ product }: { product: CatalogProduct }) {
  const navigation = useNavigation<Nav>();
  const { addItem } = useCart();

  return (
    <Pressable style={styles.product} onPress={() => navigation.navigate("ProductDetail", { product })}>
      {product.image ? (
        <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
      ) : (
        <View style={[styles.productImage, styles.noImage]}>
          <Ionicons name="cube-outline" size={28} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.productBody}>
        <Badge label={product.category} color="blue" />
        <Text numberOfLines={2} style={styles.productName}>
          {product.name}
        </Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>{product.priceEUR.toFixed(2)} €</Text>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              addItem(product);
            }}
            hitSlop={8}
            style={styles.addBtn}
          >
            <Ionicons name="add" size={16} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export function CatalogScreen() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["products"], queryFn: () => getProducts(20, 0) });

  return (
    <Screen>
      <Text style={styles.title}>Catalogue</Text>
      <Text style={styles.subtitle}>Produits commandables, livrés à Madagascar.</Text>
      {isLoading && <Spinner label="Chargement du catalogue…" />}
      {isError && <Empty title="Erreur" subtitle="Impossible de charger le catalogue." />}
      {!isLoading && !isError && data && (
        <FlatList
          data={data.products}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.md }}
          contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xxl }}
          renderItem={({ item }) => <ProductCard product={item} />}
          ListEmptyComponent={<Empty title="Aucun produit" subtitle="Le catalogue arrive bientôt." />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg },
  product: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: 0,
  },
  productImage: { width: "100%", height: 130, backgroundColor: colors.subtle },
  noImage: { alignItems: "center", justifyContent: "center" },
  productBody: { padding: spacing.md },
  productName: { fontSize: 13, fontWeight: "600", color: colors.text, marginTop: spacing.sm, minHeight: 34 },
  productFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm },
  productPrice: { fontSize: 15, fontWeight: "800", color: colors.primary },
  addBtn: { width: 28, height: 28, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
});