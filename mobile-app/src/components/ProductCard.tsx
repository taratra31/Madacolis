import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../theme";
import { useCart } from "../context/CartContext";
import { formatAriary, formatCurrency, priceOf } from "../utils/format";
import type { CatalogProduct } from "../types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProductCard({ product }: { product: CatalogProduct }) {
  const navigation = useNavigation<Nav>();
  const { addItem } = useCart();
  const price = priceOf(product);

  return (
    <Pressable style={styles.card} onPress={() => navigation.navigate("ProductDetail", { product })}>
      {product.image ? (
        <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.noImage]}>
          <Ionicons name="cube-outline" size={28} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.meta}>
          {product.brand && product.brand.trim() ? `${product.brand} · ` : ""}
          {product.category}
        </Text>
        <Text numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>
        <Text style={styles.weight}>
          {product.weightKg ?? 0.5} kg · {product.lengthCm ?? 20}×{product.widthCm ?? 15}×{product.heightCm ?? 10} cm
        </Text>
        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>{formatCurrency(price)}</Text>
            <Text style={styles.ar}>{price > 0 ? `≈ ${formatAriary(price)}` : "—"}</Text>
          </View>
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

export function ProductGrid({ products }: { products: CatalogProduct[] }) {
  return (
    <View style={styles.grid}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  card: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  image: { width: "100%", aspectRatio: 1, backgroundColor: colors.subtle },
  noImage: { alignItems: "center", justifyContent: "center" },
  body: { padding: spacing.md },
  meta: { fontSize: 10, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4 },
  name: { fontSize: 13, fontWeight: "600", color: colors.text, marginTop: spacing.xs, minHeight: 34, lineHeight: 17 },
  weight: { fontSize: 11, color: colors.textMuted, marginTop: spacing.xs },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm },
  price: { fontSize: 14, fontWeight: "800", color: colors.text },
  ar: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  addBtn: { width: 28, height: 28, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
});