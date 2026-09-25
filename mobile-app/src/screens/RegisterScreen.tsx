import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Screen, InputField, Button } from "../components/ui";
import { colors, spacing } from "../theme";
import { useAuth } from "../context/AuthContext";

export function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setError("Tous les champs sont requis.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), phone: phone.trim(), password });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Inscription impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Créer votre compte</Text>
      <Text style={styles.subtitle}>Rejoignez MadaColis pour expédier vos colis à Madagascar.</Text>

      <InputField label="Nom complet" placeholder="Jean Rakoto" value={name} onChangeText={setName} />
      <InputField label="Email" placeholder="jean@mail.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <InputField label="Téléphone" placeholder="+261 34 00 000 00" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <InputField label="Mot de passe" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} />
      <InputField label="Confirmer le mot de passe" placeholder="••••••••" secureTextEntry value={confirm} onChangeText={setConfirm} />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label="Créer le compte" onPress={() => void handleRegister()} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xl },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.lg },
});