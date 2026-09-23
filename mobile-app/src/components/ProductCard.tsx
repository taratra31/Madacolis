import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, radius, shadows, spacing } from "../theme";
import type { AmazonProduct } from "../types";

interface Props {
  product: AmazonProduct;
  onPress: () => void;
  onAdd?: () => void;
  compact?: boolean;
}

const formatEUR = (v: number) => `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const formatMGA = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} Ar`;

export function ProductCard({ product, onPress, onAdd, compact = false }: Props) {
  const price = product.priceEUR != null ? product.priceEUR : null;
  const mga = price != null ? price * 5000 : null;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, compact && { flex: 1 }, pressed && { transform: [{ scale: 0.98 }] }]}>
      <View style={styles.imageWrap}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="cube-outline" size={28} color={colors.muted} />
          </View>
        )}
        {product.category ? (
          <LinearGradient colors={["rgba(11,18,32,0.85)", "rgba(30,64,175,0.85)"]} style={styles.badge}>
            <Text style={styles.badgeText} numberOfLines={1}>{product.category}</Text>
          </LinearGradient>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{product.title}</Text>
        <View style={styles.priceRow}>
          {price != null ? (
            <>
              <Text style={styles.price}>{formatEUR(price)}</Text>
              {mga != null ? <Text style={styles.mga}>≈ {formatMGA(mga)}</Text> : null}
            </>
          ) : (
            <Text style={styles.noPrice}>Prix à confirmer</Text>
          )}
        </View>
        {onAdd ? (
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addGradientShadow}>
            <Pressable onPress={onAdd} style={styles.addBtn}>
              <Ionicons name="cart" size={15} color="#FFFFFF" />
              <Text style={styles.addText}>Ajouter</Text>
            </Pressable>
          </LinearGradient>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.8)",
    overflow: "hidden",
    ...shadows.md,
  },
  imageWrap: { position: "relative", aspectRatio: 1, width: "100%", backgroundColor: colors.background },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  badge: {
    position: "absolute",
    left: spacing.sm,
    top: spacing.sm,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    maxWidth: "75%",
  },
  badgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  body: { padding: spacing.md, gap: spacing.sm },
  title: { fontSize: 13, fontWeight: "700", color: colors.text, lineHeight: 18, minHeight: 36 },
  priceRow: { gap: 2 },
  price: { fontSize: 16, fontWeight: "800", color: colors.dark },
  mga: { fontSize: 11, fontWeight: "700", color: colors.success },
  noPrice: { fontSize: 12, fontWeight: "600", color: colors.subtext },
  addGradientShadow: {
    marginTop: 2,
    borderRadius: radius.md,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: radius.md,
    paddingVertical: 9,
  },
  addText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
});