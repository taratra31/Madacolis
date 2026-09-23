import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, radius, shadows, spacing } from "../theme";

export function Screen({
  children,
  scroll = false,
  edges = ["top"],
  keyboardShouldPersistTaps,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: ("top" | "bottom")[];
  keyboardShouldPersistTaps?: "always" | "handled" | "never";
}) {
  return (
    <SafeAreaView edges={edges} style={styles.screen}>
      {scroll ? (
        <ScrollView keyboardShouldPersistTaps={keyboardShouldPersistTaps} contentContainerStyle={{ paddingBottom: 24 }}>
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  icon,
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "outline" | "ghost" | "danger" | "gradient";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | TextStyle;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const bg =
    variant === "primary" ? colors.primary :
    variant === "danger" ? colors.danger :
    variant === "outline" ? "transparent" : "transparent";
  const border = variant === "outline" || variant === "ghost" ? colors.border : "transparent";
  const fg =
    variant === "primary" ? "#FFFFFF" :
    variant === "danger" ? "#FFFFFF" :
    variant === "outline" ? colors.primary : colors.subtext;

  const inner = (
    <>
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={variant === "gradient" ? "#FFFFFF" : fg} style={{ marginRight: 8 }} /> : null}
          <Text style={{ color: variant === "gradient" ? "#FFFFFF" : fg, fontSize: 15, fontWeight: "700" }}>{title}</Text>
        </>
      )}
    </>
  );

  if (variant === "gradient") {
    return (
      <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [{ opacity: disabled ? 0.5 : pressed ? 0.88 : 1 }, styles.gradientShadow, style]} accessibilityRole="button">
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buttonGradient}>
          {inner}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.5 : 1 }, variant === "primary" && styles.buttonPrimaryShadow, style]}
      activeOpacity={0.85}
    >
      {inner}
    </TouchableOpacity>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionHeaderTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionHeaderSub}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <Pressable onPress={action.onPress} style={styles.sectionHeaderAction} accessibilityRole="button">
          <Text style={styles.sectionHeaderActionText}>{action.label}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function Panel({ children, style, padded = true }: { children: React.ReactNode; style?: ViewStyle; padded?: boolean }) {
  return <View style={[styles.panel, padded && { padding: spacing.lg }, style]}>{children}</View>;
}

export function Sublabel({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.sublabel}>
      <Ionicons name={icon} size={13} color={colors.subtext} />
      <Text style={styles.sublabelText}>{text}</Text>
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad" | "url";
  secureTextEntry?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInputStyled
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
        />
      </View>
    </View>
  );
}

function TextInputStyled(props: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad" | "url";
  secureTextEntry?: boolean;
}) {
  return <TextInput style={styles.input} placeholderTextColor={colors.muted} autoCapitalize={props.secureTextEntry ? "none" : "sentences"} {...props} />;
}

export function EmptyState({ icon = "cube-outline", title, subtitle, children }: { icon?: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={32} color={colors.muted} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={{ aspectRatio: 1, width: "100%", backgroundColor: colors.border, borderRadius: radius.md }} />
      <View style={{ padding: spacing.md, gap: 8 }}>
        <View style={{ height: 12, width: "90%", backgroundColor: colors.border, borderRadius: 6 }} />
        <View style={{ height: 12, width: "60%", backgroundColor: colors.border, borderRadius: 6 }} />
        <View style={{ height: 20, width: "40%", backgroundColor: colors.border, borderRadius: 6 }} />
      </View>
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : null]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
    >
      {active ? <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} /> : null}
      <Text style={[styles.chipText, active ? { color: "#FFFFFF" } : null]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  button: {
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  buttonPrimaryShadow: {
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  buttonGradient: {
    minHeight: 48,
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  gradientShadow: {
    borderRadius: radius.lg,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  label: { fontSize: 13, fontWeight: "600", color: colors.text },
  inputWrap: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  input: {
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.text,
  },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  emptySub: { fontSize: 13, color: colors.subtext, textAlign: "center", paddingHorizontal: spacing.xl },
  skeletonCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: "hidden",
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    maxWidth: 160,
    overflow: "hidden",
  },
  chipActive: {
    borderColor: colors.primary,
    ...shadows.sm,
  },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.subtext },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  sectionHeaderTitle: { fontSize: 18, fontWeight: "900", color: colors.text },
  sectionHeaderSub: { fontSize: 12, color: colors.subtext, marginTop: 2 },
  sectionHeaderAction: { flexDirection: "row", alignItems: "center", gap: 2 },
  sectionHeaderActionText: { fontSize: 13, fontWeight: "800", color: colors.primary },
  panel: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  sublabel: { flexDirection: "row", alignItems: "center", gap: 5 },
  sublabelText: { fontSize: 12, color: colors.subtext },
});