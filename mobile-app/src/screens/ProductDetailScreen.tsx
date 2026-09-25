import React, { useState } from "react";
import { Image, StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, Badge } from "../components/ui";
import { colors, radius, spacing } from "../theme";
import { useCart } from "../context/CartContext";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = {
  route: RouteProp<RootStackParamList, "ProductDetail">;
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export function ProductDetailScreen({ route, navigation }: Props) {
  const { product } = route.params;
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Screen>
      {product.image ? (
        <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.noImage]}>
          <Ionicons name="cube-outline" size={56} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.meta}>
        <Badge label={product.category} color="blue" />
        <Badge label={`${product.brand}`} color="slate" />
      </View>
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.price}>{product.priceEUR.toFixed(2)} €</Text>
      {product.description ? <Text style={styles.desc}>{product.description}</Text> : null}
      <View style={styles.infoRow}>
        <Ionicons name="scale-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.infoText}>Poids estimé : {product.weightKg} kg</Text>
      </View>
      <View style={styles.spacer} />
      <View style={styles.actions}>
        <Button label={added ? "Ajouté ✓" : "Ajouter au panier"} onPress={handleAdd} />
        <Button variant="outline" label="Estimer le transport" onPress={() => navigation.navigate("Quote")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  image: { width: "100%", height: 220, borderRadius: radius.lg, backgroundColor: colors.subtle },
  noImage: { alignItems: "center", justifyContent: "center" },
  meta: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  name: { fontSize: 20, fontWeight: "800", color: colors.text, marginTop: spacing.md },
  price: { fontSize: 24, fontWeight: "800", color: colors.primary, marginTop: 4 },
  desc: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.md, lineHeight: 19 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.lg },
  infoText: { fontSize: 13, color: colors.textSecondary },
  spacer: { flex: 1 },
  actions: { gap: spacing.md, marginTop: spacing.lg },
});