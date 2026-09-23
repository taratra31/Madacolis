import React from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadows, spacing } from "../theme";
import { useCart } from "../context/CartContext";
import { Button, EmptyState, Screen } from "../components/ui";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { type CompositeScreenProps } from "@react-navigation/native";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Cart">,
  NativeStackScreenProps<RootStackParamList>
>;

const formatEUR = (v: number) => `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const formatMGA = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} Ar`;

export function CartScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { items, updateQuantity, removeItem, clear, total, count } = useCart();

  if (items.length === 0) {
    return (
      <Screen>
        <View style={{ padding: spacing.lg }}>
          <Text style={styles.pageTitle}>Panier</Text>
        </View>
        <View style={{ flex: 1 }}>
          <EmptyState icon="cart-outline" title="Votre panier est vide" subtitle="Parcourez le catalogue et ajoutez des produits.">
            <Button style={{ marginTop: spacing.md }} title="Découvrir le catalogue" onPress={() => navigation.navigate("Catalog")} />
          </EmptyState>
        </View>
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <View style={{ width: 42, height: 42, borderRadius: radius.lg, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="cart" size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pageTitle, { color: "#FFFFFF" }]}>Panier</Text>
            <Text style={[styles.pageSub, { color: "rgba(255,255,255,0.85)" }]}>{count} article(s) · ≈ {formatMGA(total * 5000)}</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={items}
        keyExtractor={(i) => i.productId}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.thumbWrap}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <Ionicons name="cube-outline" size={26} color={colors.muted} />
              )}
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.cardPrice}>{formatEUR(item.price * item.quantity)} · ≈ {formatMGA(item.price * item.quantity * 5000)}</Text>
              <View style={styles.cardActions}>
                <View style={styles.stepper}>
                  <Pressable style={styles.stepBtn} onPress={() => updateQuantity(item.productId, item.quantity - 1)}>
                    <Ionicons name="remove" size={16} color={colors.primary} />
                  </Pressable>
                  <Text style={styles.stepText}>{item.quantity}</Text>
                  <Pressable style={styles.stepBtn} onPress={() => updateQuantity(item.productId, item.quantity + 1)}>
                    <Ionicons name="add" size={16} color={colors.primary} />
                  </Pressable>
                </View>
                <Pressable onPress={() => removeItem(item.productId)} style={styles.removeBtn}>
                  <Ionicons name="trash-outline" size={17} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.totalRow}>
          <View style={{ gap: 2 }}>
            <Text style={styles.totalLabel}>Total estimé</Text>
            <Text style={styles.totalHint}>hors livraison</Text>
          </View>
          <View style={styles.totalPill}>
            <Text style={styles.totalEUR}>{formatEUR(total)}</Text>
            <Text style={styles.totalMGA}>≈ {formatMGA(total * 5000)}</Text>
          </View>
        </View>
        <Button title="Calculer la livraison" icon="calculator-outline" variant="gradient" onPress={() => navigation.navigate("Quote")} />
        <Button title="Vider le panier" icon="trash-outline" variant="ghost" onPress={clear} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontSize: 24, fontWeight: "900", color: colors.dark },
  pageSub: { fontSize: 13, color: colors.subtext, marginTop: 2 },
  card: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  thumbWrap: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumb: { width: "100%", height: "100%" },
  cardBody: { flex: 1, gap: 6 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: colors.text, lineHeight: 18 },
  cardPrice: { fontSize: 13, fontWeight: "800", color: colors.primary },
  cardActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  stepper: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  stepText: { fontSize: 15, fontWeight: "800", color: colors.text, minWidth: 20, textAlign: "center" },
  removeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.dangerLight, alignItems: "center", justifyContent: "center" },
  footer: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.md,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  totalLabel: { fontSize: 15, fontWeight: "800", color: colors.text },
  totalHint: { fontSize: 11, color: colors.muted, fontWeight: "600" },
  totalPill: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "flex-end",
    gap: 1,
  },
  totalEUR: { fontSize: 20, fontWeight: "900", color: colors.primaryDark },
  totalMGA: { fontSize: 12, fontWeight: "800", color: colors.emerald },
});