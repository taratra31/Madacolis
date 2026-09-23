import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { HomeScreen } from "../screens/HomeScreen";
import { CatalogScreen } from "../screens/CatalogScreen";
import { QuoteScreen } from "../screens/QuoteScreen";
import { CartScreen } from "../screens/CartScreen";
import { TrackingScreen } from "../screens/TrackingScreen";
import { AccountScreen } from "../screens/AccountScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { ModernTabBar, TRANSITAIRE_SEGMENTS } from "../components/ModernTabBar";
import { ProductDetailScreen } from "../screens/ProductDetailScreen";
import { TransitaireColisScreen } from "../screens/TransitaireColisScreen";
import { TransitaireTarifsScreen } from "../screens/TransitaireTarifsScreen";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { MainTabParamList, RootStackParamList, TransitaireTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();
const TransitaireTab = createBottomTabNavigator<TransitaireTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background, primary: colors.primary, card: colors.card, text: colors.text, border: colors.border },
};

function CartBadge() {
  const { count } = useCart();
  if (count === 0) return null;
  return (
    <View style={{ backgroundColor: colors.danger, borderRadius: 999, minWidth: 17, height: 17, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}>
      <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800" }}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
      tabBar={(props: BottomTabBarProps) => <ModernTabBar {...props} />}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />, tabBarLabel: "Accueil" }}
      />
      <Tab.Screen
        name="Catalog"
        component={CatalogScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="storefront-outline" size={size} color={color} />, tabBarLabel: "Catalogue" }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="cart-outline" size={size} color={color} />
              <View style={{ position: "absolute", top: -6, right: -10 }}>
                <CartBadge />
              </View>
            </View>
          ),
          tabBarLabel: "Panier",
        }}
      />
      <Tab.Screen
        name="Tracking"
        component={TrackingScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="locate-outline" size={size} color={color} />, tabBarLabel: "Suivi" }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} />, tabBarLabel: "Compte" }}
      />
    </Tab.Navigator>
  );
}

function TransitaireTabs() {
  return (
    <TransitaireTab.Navigator
      screenOptions={{ headerShown: false, tabBarShowLabel: false }}
      tabBar={(props: BottomTabBarProps) => <ModernTabBar {...props} segments={TRANSITAIRE_SEGMENTS} cart={false} />}
    >
      <TransitaireTab.Screen name="Colis" component={TransitaireColisScreen} />
      <TransitaireTab.Screen name="Tarifs" component={TransitaireTarifsScreen} />
      <TransitaireTab.Screen name="Compte" component={AccountScreen} />
    </TransitaireTab.Navigator>
  );
}

export function RootNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.dark, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {user ? (
          user.role === "TRANSITAIRE" ? (
            <>
              <Stack.Screen name="Transitaire" component={TransitaireTabs} />
              <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
              <Stack.Screen name="Quote" component={QuoteScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
              <Stack.Screen name="Quote" component={QuoteScreen} />
            </>
          )
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}