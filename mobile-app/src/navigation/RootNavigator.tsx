import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { colors } from "../theme";
import type { RootStackParamList, TabParamList } from "./types";
import { HomeScreen } from "../screens/HomeScreen";
import { CatalogScreen } from "../screens/CatalogScreen";
import { CartScreen } from "../screens/CartScreen";
import { AccountScreen } from "../screens/AccountScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { ProductDetailScreen } from "../screens/ProductDetailScreen";
import { QuoteScreen } from "../screens/QuoteScreen";
import { TrackingScreen } from "../screens/TrackingScreen";
import { ActivityIndicator, Text, View } from "react-native";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const tabIcon =
  (name: keyof typeof Ionicons.glyphMap) =>
  ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
    <Ionicons name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)} size={size} color={color} />
  );

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

function Tabs() {
  const { count } = useCart();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: tabIcon("home"), tabBarLabel: "Accueil" }} />
      <Tab.Screen name="Catalog" component={CatalogScreen} options={{ tabBarIcon: tabIcon("grid"), tabBarLabel: "Catalogue" }} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: tabIcon("cart"),
          tabBarLabel: "Panier",
          tabBarBadge: count > 0 ? count : undefined,
        }}
      />
      <Tab.Screen name="Account" component={AccountScreen} options={{ tabBarIcon: tabIcon("person"), tabBarLabel: "Compte" }} />
    </Tab.Navigator>
  );
}

function AuthStackGuard() {
  const { token } = useAuth();
  return (
    <Stack.Navigator>
      {token ? (
        <>
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: "Produit" }} />
          <Stack.Screen name="Quote" component={QuoteScreen} options={{ title: "Estimer un prix" }} />
          <Stack.Screen name="Tracking" component={TrackingScreen} options={{ title: "Suivre un colis" }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Créer un compte" }} />
          <Stack.Screen name="Quote" component={QuoteScreen} options={{ title: "Estimer un prix" }} />
          <Stack.Screen name="Tracking" component={TrackingScreen} options={{ title: "Suivre un colis" }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  const { ready } = useAuth();
  if (!ready) return <Loading />;
  return (
    <NavigationContainer>
      <AuthStackGuard />
    </NavigationContainer>
  );
}