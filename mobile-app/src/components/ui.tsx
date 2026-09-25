import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../theme";

export function Screen({
  children,
  scroll = true,
  padded = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
}) {
  const content = <View style={[styles.body, padded && { padding: spacing.lg }]}>{children}</View>;
  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {scroll ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.flexGrow}>{content}</ScrollView> : content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  style?: object;
}) {
  const bg = variant === "primary" ? { backgroundColor: colors.primary } : variant === "outline" ? { backgroundColor: "transparent" } : { backgroundColor: "transparent" };
  const border = variant === "outline" ? { borderColor: colors.primary, borderWidth: 1.5 } : {};
  const color = variant === "primary" ? "#ffffff" : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        bg,
        border,
        { opacity: disabled || loading ? 0.6 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={color} size="small" /> : <Text style={[styles.buttonText, { color }]}>{label}</Text>}
    </Pressable>
  );
}

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function InputField({ label, error, style, ...props }: InputProps) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        {...props}
        style={[styles.input, error ? { borderColor: colors.danger } : {}, style]}
      />
      {error ? <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({ label, color = "green" }: { label: string; color?: "green" | "amber" | "blue" | "slate" | "red" }) {
  const map: Record<string, { bg: string; fg: string }> = {
    green: { bg: "#dcfce7", fg: "#15803d" },
    amber: { bg: "#fef3c7", fg: "#b45309" },
    blue: { bg: "#dbeafe", fg: "#1d4ed8" },
    red: { bg: "#fee2e2", fg: "#b91c1c" },
    slate: { bg: "#e2e8f0", fg: "#475569" },
  };
  const s = map[color] ?? map.slate;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }, { alignSelf: "flex-start" }]}>
      <Text style={{ color: s.fg, fontSize: 11, fontWeight: "700", textTransform: "capitalize" }}>{label}</Text>
    </View>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: spacing.xxl }}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? (
        <Text style={{ color: colors.textSecondary, marginTop: spacing.md, fontSize: 13 }}>{label}</Text>
      ) : null}
    </View>
  );
}

export function Empty({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: spacing.xxl * 1.5 }}>
      <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>{title}</Text>
      {subtitle ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: spacing.sm, textAlign: "center" }}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  flexGrow: { flexGrow: 1 },
  body: { flex: 1 },
  button: {
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  buttonText: { fontSize: 15, fontWeight: "700" },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: spacing.sm },
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    fontSize: 15,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
});