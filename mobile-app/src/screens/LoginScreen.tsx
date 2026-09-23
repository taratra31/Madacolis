import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../theme";
import { useAuth } from "../context/AuthContext";

type Mode = "login" | "register";

type FocusField = "name" | "identifier" | "phone" | "email" | "password" | null;

function Orb({
  style,
  distance = 26,
  duration = 7000,
  delay = 0,
  pulse = false,
}: {
  style?: StyleProp<ViewStyle>;
  distance?: number;
  duration?: number;
  delay?: number;
  pulse?: boolean;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, { toValue: 1, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(progress, { toValue: 0, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [progress, delay, duration]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] });
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, distance * 0.55] });
  const scale = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: pulse ? [1, 1.08, 1] : [1, 1.03, 1] });
  const opacity = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: pulse ? [1, 0.75, 1] : [1, 0.92, 1] });

  return <Animated.View pointerEvents="none" style={[style, { opacity, transform: [{ translateX }, { translateY }, { scale }] }]} />;
}

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, register, initializing } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [focused, setFocused] = useState<FocusField>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setError(null);
  }, [mode]);

  const isRegister = mode === "register";

  const submit = async () => {
    setError(null);
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (!isRegister && !identifier.trim()) {
      setError("Indiquez votre e-mail ou téléphone.");
      return;
    }
    if (isRegister && !name.trim()) {
      setError("Indiquez votre nom complet.");
      return;
    }
    if (isRegister && !phone.trim()) {
      setError("Indiquez votre numéro de téléphone.");
      return;
    }
    setBusy(true);
    try {
      if (isRegister) {
        await register({ name: name.trim(), email: email.trim() || undefined, phone: phone.trim(), password });
      } else {
        await login(identifier.trim(), password, remember);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#020617", "#0F172A", "#1E3A8A", "#2563EB"]} start={{ x: 0, y: 0 }} end={{ x: 1.1, y: 1.2 }} style={StyleSheet.absoluteFill} />
      <Orb style={styles.orbTop} distance={28} duration={7200} />
      <Orb style={styles.orbMid} distance={44} duration={9400} delay={1500} />
      <Orb style={styles.orbBottom} distance={30} duration={8200} delay={600} pulse />
      <Orb style={styles.glow} distance={14} duration={6200} pulse />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <View style={styles.logoShell}>
              <LinearGradient colors={["#60A5FA", "#2563EB", "#1D4ED8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logo}>
                <Ionicons name="cube" size={30} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.brandName}>MadaColis</Text>
            <Text style={styles.brandTagline}>
              {isRegister
                ? "Rejoignez-nous et profitez de la livraison France → Madagascar."
                : "Commandez en France, recevez à Madagascar."}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.segment}>
              <Pressable
                style={[styles.segmentHalf, mode === "login" && styles.segmentHalfActive]}
                onPress={() => setMode("login")}
              >
                {mode === "login" ? (
                  <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.segmentGradient} />
                ) : null}
                <Text style={[styles.segmentText, mode === "login" && styles.segmentTextActive]}>Connexion</Text>
              </Pressable>
              <Pressable
                style={[styles.segmentHalf, mode === "register" && styles.segmentHalfActive]}
                onPress={() => setMode("register")}
              >
                {mode === "register" ? (
                  <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.segmentGradient} />
                ) : null}
                <Text style={[styles.segmentText, mode === "register" && styles.segmentTextActive]}>Inscription</Text>
              </Pressable>
            </View>

            <View style={styles.form}>
              {isRegister ? (
                <InputBlock
                  label="Nom complet"
                  icon="person-outline"
                  value={name}
                  onChangeText={setName}
                  placeholder="Rakoto Jean"
                  focused={focused === "name"}
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                />
              ) : null}

              {isRegister ? (
                <InputBlock
                  label="Téléphone"
                  icon="call-outline"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+261 34 00 000 00"
                  keyboardType="phone-pad"
                  focused={focused === "phone"}
                  onFocus={() => setFocused("phone")}
                  onBlur={() => setFocused(null)}
                />
              ) : null}

              {isRegister ? (
                <InputBlock
                  label="E-mail (optionnel)"
                  icon="mail-outline"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="exemple@mail.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  focused={focused === "email"}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                />
              ) : (
                <InputBlock
                  label="E-mail ou téléphone"
                  icon="mail-outline"
                  value={identifier}
                  onChangeText={setIdentifier}
                  placeholder="exemple@mail.com ou +261…"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  focused={focused === "identifier"}
                  onFocus={() => setFocused("identifier")}
                  onBlur={() => setFocused(null)}
                />
              )}

              <View style={styles.field}>
                <Text style={styles.label}>Mot de passe</Text>
                <View
                  style={[
                    styles.inputWrap,
                    focused === "password" && { borderColor: colors.primary, backgroundColor: "#FFFFFF", shadowColor: colors.primary, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
                  ]}
                >
                  <Ionicons name="lock-closed-outline" size={18} color={focused === "password" ? colors.primary : colors.muted} />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={isRegister ? "6 caractères minimum" : "••••••••"}
                    placeholderTextColor={colors.muted}
                    secureTextEntry={!showPwd}
                    autoCapitalize="none"
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                  />
                  <Pressable onPress={() => setShowPwd((s) => !s)} hitSlop={8}>
                    <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={18} color={colors.muted} />
                  </Pressable>
                </View>
              </View>

              {!isRegister ? (
                <Pressable style={styles.rememberRow} onPress={() => setRemember((r) => !r)}>
                  <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                    {remember ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                  </View>
                  <Text style={styles.rememberText}>Se souvenir de moi</Text>
                </Pressable>
              ) : null}

              {error ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                style={({ pressed }) => [styles.submitShadow, pressed && { opacity: 0.88 }]}
                onPress={() => void submit()}
                disabled={busy || initializing}
              >
                <LinearGradient colors={["#3B82F6", "#2563EB", "#1D4ED8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submit}>
                  {busy ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name={isRegister ? "person-add-outline" : "log-in-outline"} size={18} color="#FFFFFF" />
                      <Text style={styles.submitText}>{isRegister ? "Créer mon compte" : "Se connecter"}</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function InputBlock({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  focused,
  onFocus,
  onBlur,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad" | "url";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputWrap,
          focused && { borderColor: colors.primary, backgroundColor: "#FFFFFF", shadowColor: colors.primary, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
        ]}
      >
        <Ionicons name={icon} size={18} color={focused ? colors.primary : colors.muted} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete="off"
          autoCorrect={false}
          importantForAutofill="no"
          textContentType="none"
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#020617", overflow: "hidden" },
  orbTop: {
    position: "absolute",
    top: -90,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(96,165,250,0.22)",
  },
  orbMid: {
    position: "absolute",
    top: "30%",
    left: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(124,58,237,0.16)",
  },
  orbBottom: {
    position: "absolute",
    bottom: -110,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(37,99,235,0.25)",
  },
  glow: {
    position: "absolute",
    top: "18%",
    alignSelf: "center",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl, gap: spacing.xl, justifyContent: "center" },
  brand: { alignItems: "center", gap: spacing.sm },
  logoShell: {
    borderRadius: 26,
    padding: 3,
    backgroundColor: "rgba(255,255,255,0.18)",
    shadowColor: "#3B82F6",
    shadowOpacity: 0.6,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { color: "#FFFFFF", fontSize: 32, fontWeight: "900", letterSpacing: 0.4, marginTop: spacing.sm },
  brandTagline: { color: "#BFDBFE", fontSize: 14, textAlign: "center", lineHeight: 20, paddingHorizontal: spacing.lg },
  card: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.lg,
    shadowColor: "#000000",
    shadowOpacity: 0.45,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 18 },
    elevation: 20,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    borderRadius: radius.md,
    padding: 4,
  },
  segmentHalf: { flex: 1, paddingVertical: 12, borderRadius: radius.sm, alignItems: "center", overflow: "hidden" },
  segmentHalfActive: { backgroundColor: "transparent" },
  segmentGradient: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  segmentText: { fontSize: 14, fontWeight: "800", color: colors.subtext },
  segmentTextActive: { color: "#FFFFFF" },
  form: { gap: spacing.lg },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "700", color: colors.text },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: colors.text },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.primary },
  rememberText: { fontSize: 13, fontWeight: "600", color: colors.subtext },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: "600", color: colors.danger },
  submitShadow: { borderRadius: radius.md, shadowColor: colors.primary, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  submit: {
    minHeight: 52,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900", letterSpacing: 0.2 },
});