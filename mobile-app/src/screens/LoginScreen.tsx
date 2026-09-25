import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Screen, InputField, Button } from "../components/ui";
import { colors, spacing } from "../theme";
import { useAuth } from "../context/AuthContext";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    if (!identifier.trim() || !password) {
      setError("Renseignez votre identifiant et votre mot de passe.");
      return;
    }
    setLoading(true);
    try {
      await login(identifier.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.logo}>MadaColis</Text>
        <Text style={styles.title}>Bon retour !</Text>
        <Text style={styles.subtitle}>Connectez-vous pour suivre vos colis et estimer vos prix.</Text>
      </View>

      <InputField
        label="Email ou téléphone"
        placeholder="ex : jean@mail.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={identifier}
        onChangeText={setIdentifier}
      />
      <InputField
        label="Mot de passe"
        placeholder="••••••••"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={() => void handleLogin()}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label="Se connecter" onPress={() => void handleLogin()} loading={loading} />

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Pas encore de compte ?</Text>
        <Pressable onPress={() => navigation.navigate("Register")}>
          <Text style={styles.link}>Créer un compte</Text>
        </Pressable>
      </View>
      <Pressable onPress={() => navigation.navigate("Quote")} style={styles.guestRow}>
        <Ionicons name="calculator-outline" size={16} color={colors.primary} />
        <Text style={[styles.link, { marginLeft: 6 }]}>Estimer un prix sans compte</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate("Tracking")} style={styles.guestRow}>
        <Ionicons name="navigate-outline" size={16} color={colors.primary} />
        <Text style={[styles.link, { marginLeft: 6 }]}>Suivre un colis sans compte</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", marginTop: spacing.xl * 1.5, marginBottom: spacing.xxl },
  logo: { color: colors.primary, fontSize: 14, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.5 },
  title: { fontSize: 26, fontWeight: "800", color: colors.text, marginTop: spacing.sm },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm, textAlign: "center" },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.lg },
  footerRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: spacing.lg },
  footerText: { color: colors.textSecondary, fontSize: 13 },
  link: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  guestRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: spacing.lg },
});