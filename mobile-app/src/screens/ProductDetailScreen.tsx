import React, { useState } from "react";
import { Image, StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button } from "../components/ui";
import { colors, radius, spacing } from "../theme";
import { useCart } from "../context/CartContext";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { formatAriary, formatCurrency, priceOf } from "../utils/format";

type Props = {
  route: RouteProp<RootStackParamList, "ProductDetail">;
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export function ProductDetailScreen({ route, navigation }: Props) {
  const { product } = route.params;
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const gallery = [product.image, ...(product.images ?? [])].filter(Boolean);

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Screen>
      {gallery.length > 0 ? (
        <View>
          <Image source={{ uri: gallery[activeImage] }} style={styles.image} resizeMode="cover" />
          {gallery.length > 1 ? (
            <View style={styles.thumbRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbScroller}>
                {gallery.map((uri, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setActiveImage(i)}
                    style={[styles.thumb, i === activeImage ? styles.thumbActive : null]}
                  >
                    <Image source={{ uri }} style={styles.thumbImg} resizeMode="cover" />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={[styles.image, styles.noImage]}>
          <Ionicons name="cube-outline" size={56} color={colors.textMuted} />
        </View>
      )}
      <Text style={styles.meta}>
        {product.brand && product.brand.trim() ? `${product.brand} · ` : ""}
        {product.category}
      </Text>
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.price}>{formatCurrency(priceOf(product))}</Text>
      {priceOf(product) > 0 ? <Text style={styles.ar}>≈ {formatAriary(priceOf(product))}</Text> : null}
      {product.description ? <Text style={styles.desc}>{product.description}</Text> : null}
      <View style={styles.infoRow}>
        <Ionicons name="scale-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.infoText}>Poids estimé : {product.weightKg ?? 0.5} kg</Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="copy-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.infoText}>
          Dimensions : {product.lengthCm ?? 20}×{product.widthCm ?? 15}×{product.heightCm ?? 10} cm
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="airplane-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.infoText}>Transport France → Madagascar inclus dans la livraison.</Text>
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
  thumbRow: { marginTop: spacing.sm },
  thumbScroller: { gap: spacing.sm, paddingVertical: 2 },
  thumb: { width: 48, height: 48, borderRadius: 10, overflow: "hidden", borderWidth: 2, borderColor: "transparent", backgroundColor: colors.subtle },
  thumbActive: { borderColor: colors.primary },
  thumbImg: { width: "100%", height: "100%" },
  meta: { fontSize: 11, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginTop: spacing.lg },
  name: { fontSize: 20, fontWeight: "800", color: colors.text, marginTop: spacing.md },
  price: { fontSize: 24, fontWeight: "800", color: colors.text, marginTop: 4 },
  ar: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  desc: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.md, lineHeight: 19 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.lg },
  infoText: { fontSize: 13, color: colors.textSecondary },
  spacer: { flex: 1 },
  actions: { gap: spacing.md, marginTop: spacing.lg },
});