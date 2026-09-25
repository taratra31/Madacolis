import React from "react";
import { StyleSheet, Text, View, Pressable, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Screen, Button, Card, Empty } from "../components/ui";
import { colors, radius, spacing } from "../theme";
import { useCart } from "../context/CartContext";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { priceOf } from "../utils/format";

export function CartScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { items, updateQuantity, removeItem, total } = useCart();

  return (
    <Screen>
      <Text style={styles.title}>Panier</Text>
      {items.length === 0 ? (
        <Empty title="Panier vide" subtitle="Ajoutez des produits depuis le catalogue." />
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(i) => i.product.id}
            contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.lg }}
            renderItem={({ item }) => (
              <Card>
                <View style={styles.row}>
                  <View style={styles.info}>
                    <Text numberOfLines={1} style={styles.name}>
                      {item.product.name}
                    </Text>
<Text style={styles.price}>
  {(priceOf(item.product) * item.quantity).toFixed(2)} €
  <Text style={styles.unit}> · {priceOf(item.product).toFixed(2)} €/unité</Text>
</Text>
                  </View>
                  <View style={styles.qty}>
                    <Pressable style={styles.qtyBtn} onPress={() => updateQuantity(item.product.id, item.quantity - 1)}>
                      <Ionicons name="remove" size={16} color={colors.primary} />
                    </Pressable>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <Pressable style={styles.qtyBtn} onPress={() => updateQuantity(item.product.id, item.quantity + 1)}>
                      <Ionicons name="add" size={16} color={colors.primary} />
                    </Pressable>
                    <Pressable style={styles.remove} onPress={() => removeItem(item.product.id)}>
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </Pressable>
                  </View>
                </View>
              </Card>
            )}
            ListFooterComponent={
              <View style={styles.footer}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total produits</Text>
                  <Text style={styles.totalValue}>{total.toFixed(2)} €</Text>
                </View>
                <Text style={styles.note}>Le transport sera estimé à l'étape suivante (devis).</Text>
                <Button label="Calculer le transport" onPress={() => navigation.navigate("Quote")} />
              </View>
            }
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: spacing.lg },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: "700", color: colors.text },
  price: { fontSize: 15, fontWeight: "800", color: colors.primary, marginTop: 4 },
  unit: { fontSize: 12, fontWeight: "500", color: colors.textMuted },
  qty: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  qtyBtn: { width: 28, height: 28, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.primary, alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: 15, fontWeight: "700", color: colors.text, minWidth: 24, textAlign: "center" },
  remove: { padding: 4 },
  footer: { marginTop: spacing.lg, gap: spacing.md },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 16, fontWeight: "700", color: colors.text },
  totalValue: { fontSize: 20, fontWeight: "800", color: colors.primary },
  note: { fontSize: 12, color: colors.textMuted },
});