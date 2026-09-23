import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadows, spacing } from "../theme";
import { fetchProduct } from "../api/endpoints";
import { toCartItem, useCart } from "../context/CartContext";
import { Button, EmptyState } from "../components/ui";
import type { AmazonProduct } from "../types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ProductDetail">;

const formatEUR = (v: number) => `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const formatMGA = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} Ar`;

export function ProductDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const detail = useQuery({
    queryKey: ["product", route.params?.productId],
    queryFn: () => fetchProduct(route.params!.productId!),
    enabled: !!route.params?.productId,
  });

  const product: AmazonProduct | undefined = route.params?.product ?? detail.data?.product;
  const loading = !!route.params?.productId && detail.isFetching;
  const error = !!route.params?.productId && detail.isError;

  if (loading && !product) {
    return <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }}><EmptyState icon="hourglass-outline" title="Chargement…" /></View>;
  }
  if (!product) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Header insets={insets} onBack={() => navigation.goBack()} />
        <EmptyState icon="alert-circle-outline" title="Produit introuvable" subtitle="Ce produit n'existe plus ou n'est pas dans notre catalogue." />
      </View>
    );
  }

  const price = product.priceEUR ?? null;
  const mga = price != null ? price * 5000 : null;

  const handleAdd = () => {
    addItem({ ...toCartItem(product), quantity: qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const dims = product.lengthCm || product.widthCm || product.heightCm
    ? { L: product.lengthCm, l: product.widthCm, H: product.heightCm }
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header insets={insets} onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 180 }}>
        <View style={styles.imageWrap}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, { alignItems: "center", justifyContent: "center" }]}>
              <Ionicons name="cube-outline" size={48} color={colors.muted} />
            </View>
          )}
        </View>

        <View style={styles.body}>
          {product.category ? (
            <View style={styles.categoryBadge}>
              <Ionicons name="pricetag" size={11} color={colors.primary} />
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          ) : null}
          <Text style={styles.title}>{product.title}</Text>

          <View style={styles.priceCard}>
            {price != null ? (
              <>
                <Text style={styles.price}>{formatEUR(price)}</Text>
                <Text style={styles.mga}>≈ {formatMGA(mga ?? 0)}</Text>
              </>
            ) : (
              <Text style={styles.noPrice}>Prix à confirmer via devis</Text>
            )}
          </View>

          {product.weightKg != null || dims ? (
            <View style={styles.specsRow}>
              {product.weightKg != null ? (
                <View style={styles.spec}>
                  <Ionicons name="barbell-outline" size={16} color={colors.primary} />
                  <Text style={styles.specText}>{product.weightKg} kg</Text>
                </View>
              ) : null}
              {dims ? (
                <View style={styles.spec}>
                  <Ionicons name="cube-outline" size={16} color={colors.primary} />
                  <Text style={styles.specText}>
                    {dims.L ?? "?"}×{dims.l ?? "?"}×{dims.H ?? "?"} cm
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {product.features?.length ? (
            <View style={styles.features}>
              <Text style={styles.sectionTitle}>Points clés</Text>
              {product.features.slice(0, 8).map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {product.url ? (
            <Text style={styles.sourceNote}>Proposé via notre catalogue sélectionné · commande gérée à Madagascar.</Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.qtyWrap}>
          <Pressable style={styles.qtyBtn} onPress={() => setQty((q) => Math.max(1, q - 1))} accessibilityRole="button">
            <Ionicons name="remove" size={18} color={colors.primary} />
          </Pressable>
          <Text style={styles.qtyText}>{qty}</Text>
          <Pressable style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => setQty((q) => Math.min(10, q + 1))} accessibilityRole="button">
            <Ionicons name="add" size={18} color={colors.primary} />
          </Pressable>
        </View>
        <Button
          title={added ? "Ajouté au panier" : "Ajouter au panier"}
          icon={added ? "checkmark-circle-outline" : "cart-outline"}
          variant={added ? "outline" : "gradient"}
          style={{ flex: 1 }}
          onPress={handleAdd}
        />
        <Button
          title="Devis"
          icon="calculator-outline"
          variant="outline"
          onPress={() => navigation.navigate("Quote", { product, prefill: { quantity: qty } })}
        />
      </View>
    </View>
  );
}

function Header({ insets, onBack }: { insets: ReturnType<typeof useSafeAreaInsets>; onBack: () => void }) {
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable style={styles.headerBtn} onPress={onBack}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </Pressable>
      <Text style={styles.headerTitle}>Fiche produit</Text>
      <View style={{ width: 36 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  imageWrap: { aspectRatio: 1, width: "100%", backgroundColor: colors.card },
  image: { width: "100%", height: "100%" },
  body: { padding: spacing.lg, gap: spacing.md },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
  },
  categoryText: { color: colors.primary, fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4 },
  title: { fontSize: 19, fontWeight: "800", color: colors.text, lineHeight: 26 },
  priceCard: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 2,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  price: { fontSize: 24, fontWeight: "900", color: colors.dark },
  mga: { fontSize: 13, fontWeight: "700", color: colors.success },
  noPrice: { fontSize: 14, fontWeight: "700", color: colors.subtext },
  specsRow: { flexDirection: "row", gap: spacing.md, flexWrap: "wrap" },
  spec: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  specText: { fontSize: 13, fontWeight: "700", color: colors.text },
  features: { marginTop: spacing.sm, gap: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  featureText: { flex: 1, fontSize: 13, color: colors.subtext, lineHeight: 19 },
  sourceNote: { fontSize: 12, color: colors.muted, fontStyle: "italic" },
  footer: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: 0,
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.md,
  },
  qtyWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: 3,
    gap: 2,
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    ...shadows.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnAdd: {
    backgroundColor: "#FFFFFF",
  },
  qtyText: { fontSize: 16, fontWeight: "800", color: colors.primary, minWidth: 26, textAlign: "center" },
});