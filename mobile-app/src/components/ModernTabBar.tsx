import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors } from "../theme";
import { useCart } from "../context/CartContext";

type Segment = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const SEGMENTS: Segment[] = [
  { key: "Home", icon: "home-outline", iconActive: "home" },
  { key: "Catalog", icon: "storefront-outline", iconActive: "storefront" },
  { key: "Cart", icon: "cart-outline", iconActive: "cart" },
  { key: "Tracking", icon: "cube-outline", iconActive: "cube" },
  { key: "Account", icon: "person-outline", iconActive: "person" },
];

export const TRANSITAIRE_SEGMENTS: Segment[] = [
  { key: "Colis", icon: "cube-outline", iconActive: "cube" },
  { key: "Tarifs", icon: "pricetag-outline", iconActive: "pricetag" },
  { key: "Compte", icon: "person-outline", iconActive: "person" },
];

export function ModernTabBar({
  state,
  navigation,
  segments = SEGMENTS,
  cart = true,
}: BottomTabBarProps & { segments?: Segment[]; cart?: boolean }) {
  const insets = useSafeAreaInsets();
  const { count } = useCart();

  const goTo = (seg: Segment) => {
    const target = state.routes[state.index];
    const event = navigation.emit({
      type: "tabPress",
      target: target ? target.key : seg.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(seg.key);
    }
  };

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        {segments.map((seg, i) => {
          const index = state.routes.findIndex((r) => r.name === seg.key);
          const isActive = index === state.index;
          const isCart = cart && seg.key === "Cart";

          return (
            <Pressable
              key={seg.key}
              onPress={() => goTo(seg)}
              accessibilityRole="button"
              accessibilityLabel={seg.key}
              accessibilityState={{ selected: isActive }}
              style={({ pressed }) => [styles.tab, pressed && { opacity: 0.75, transform: [{ scale: 0.94 }] }]}
              hitSlop={4}
            >
              {isCart ? (
                <LinearGradient
                  colors={["#60A5FA", "#2563EB", "#1E40AF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.cartPill, i === 2 && styles.cartPillCenter, isActive && styles.pillActive]}
                >
                  <Ionicons name={isActive ? "cart" : "cart-outline"} size={24} color="#FFFFFF" />
                  {count > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
                    </View>
                  ) : null}
                </LinearGradient>
              ) : isActive ? (
                <LinearGradient
                  colors={["#3B82F6", "#2563EB", "#1E40AF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.activePill}
                >
                  <Ionicons name={seg.iconActive} size={20} color="#FFFFFF" />
                </LinearGradient>
              ) : (
                <View style={styles.inactive}>
                  <Ionicons name={seg.icon} size={22} color={colors.muted} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: colors.background,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.95)",
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 52,
  },
  activePill: {
    width: 52,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  inactive: {
    width: 48,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  cartPill: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1D4ED8",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  cartPillCenter: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  pillActive: {
    borderWidth: 2,
    borderColor: "#DBEAFE",
    shadowOpacity: 0.65,
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -6,
    backgroundColor: colors.danger,
    borderRadius: 999,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
});