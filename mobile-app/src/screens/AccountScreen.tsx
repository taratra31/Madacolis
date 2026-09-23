import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../theme";
import { useAuth } from "../context/AuthContext";
import { Button, Field, Screen } from "../components/ui";
import { ApiError, getEffectiveBaseUrl, SERVER_URL_KEY, setServerBaseUrl } from "../api/client";
import { changePassword } from "../api/endpoints";

function ServerContent() {
  const queryClient = useQueryClient();
  const [serverUrl, setServerUrl] = useState(getEffectiveBaseUrl());
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setBusy(true);
    setSaved(false);
    await AsyncStorage.setItem(SERVER_URL_KEY, serverUrl).catch(() => {});
    setServerBaseUrl(serverUrl);
    queryClient.clear();
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.serverHeader}>
        <Pressable onPress={() => setEditing((e) => !e)} style={styles.serverToggle}>
          <Text style={styles.serverEdit}>{editing ? "Fermer" : "Modifier"}</Text>
        </Pressable>
      </View>

      {editing ? (
        <View style={{ gap: spacing.md }}>
          <Field
            label="URL du serveur"
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder="http://192.168.1.73:5000/api/v1"
            keyboardType="url"
          />
          <Text style={styles.serverHint}>
            Ex : adresse LAN du PC ("http://IP-DU-PC:5000/api/v1") à la maison, ou URL Cloudflare Tunnel
            ("https://xxx.trycloudflare.com") pour l'utiliser avec la 4G/Internet.
          </Text>
          <Button title={saved ? "Enregistré" : "Enregistrer et recharger"} icon={saved ? "checkmark-circle-outline" : "cloud-done-outline"} onPress={() => void save()} loading={busy} variant={saved ? "outline" : "primary"} />
        </View>
      ) : (
        <Text style={styles.serverValue} numberOfLines={2}>{getEffectiveBaseUrl()}</Text>
      )}
    </View>
  );
}

function Msg({ ok, text }: { ok: boolean; text: string }) {
  return (
    <View style={[styles.msg, ok ? styles.msgOk : styles.msgErr]}>
      <Ionicons name={ok ? "checkmark-circle" : "alert-circle"} size={16} color={ok ? colors.success : colors.danger} />
      <Text style={[styles.msgText, { color: ok ? colors.success : colors.danger }]}>{text}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string | null }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value?.trim() ? value : "—"}</Text>
      </View>
    </View>
  );
}

function Accordion({
  icon,
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.card, open && styles.cardOpen]}>
      <Pressable onPress={onToggle} style={styles.accHeader}>
        <View style={styles.accIcon}>
          <Ionicons name={icon} size={16} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.accSub}>{subtitle}</Text> : null}
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} />
      </Pressable>
      {open ? <View style={styles.accBody}>{children}</View> : null}
    </View>
  );
}

export function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const [openInfo, setOpenInfo] = useState(false);
  const [openPwd, setOpenPwd] = useState(false);
  const [openServer, setOpenServer] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const changePwd = async () => {
    if (newPw.length < 8) {
      setPwMsg({ ok: false, text: "Nouveau mot de passe : minimum 8 caractères." });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: "Les mots de passe ne correspondent pas." });
      return;
    }
    setPwBusy(true);
    setPwMsg(null);
    try {
      await changePassword({ currentPassword: currentPw, newPassword: newPw });
      setPwMsg({ ok: true, text: "Mot de passe modifié." });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (e) {
      setPwMsg({ ok: false, text: e instanceof ApiError ? e.message : "Erreur lors du changement de mot de passe." });
    } finally {
      setPwBusy(false);
    }
  };

  const initial = user?.name?.trim()?.charAt(0).toUpperCase() ?? "M";
  const roleLabel = user?.role === "ADMIN" ? "Administrateur" : user?.role === "AGENT" ? "Agent MadaColis" : user?.role === "TRANSITAIRE" ? "Transitaire" : "Client";

  return (
    <Screen scroll keyboardShouldPersistTaps="handled">
      <View style={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.lg, gap: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}>
        <LinearGradient
          colors={["#1E3A8A", "#2563EB", "#3B82F6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.orbTop} />
          <View style={styles.orbBottom} />
          <View style={styles.heroRow}>
            <LinearGradient colors={["#FFFFFF", "#DBEAFE"]} style={styles.avatarWrap}>
              <Text style={styles.avatarText}>{initial}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{user?.name}</Text>
              <View style={styles.roleRow}>
                <Ionicons name="shield-checkmark" size={13} color="#BFDBFE" />
                <Text style={styles.heroRole}>{roleLabel}</Text>
              </View>
              {user?.email ? <Text style={styles.heroMeta}>{user.email}</Text> : null}
              {user?.phone ? <Text style={styles.heroMeta}>{user.phone}</Text> : null}
            </View>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Ionicons name="location-outline" size={14} color="#BFDBFE" />
              <Text style={styles.heroStatText}>{user?.city ?? "Antananarivo"}</Text>
            </View>
            <View style={styles.heroDot} />
            <View style={styles.heroStat}>
              <Ionicons name="planet-outline" size={14} color="#BFDBFE" />
              <Text style={styles.heroStatText}>{user?.country ?? "Madagascar"}</Text>
            </View>
          </View>
        </LinearGradient>

        <Accordion
          icon="person-outline"
          title="Informations personnelles"
          subtitle="Vos données MadaColis"
          open={openInfo}
          onToggle={() => setOpenInfo((v) => !v)}
        >
          <InfoRow icon="person-circle-outline" label="Nom complet" value={user?.name} />
          <InfoRow icon="mail-outline" label="Email" value={user?.email ?? "—"} />
          <InfoRow icon="call-outline" label="Téléphone" value={user?.phone} />
          <InfoRow icon="location-outline" label="Ville" value={user?.city} />
          <InfoRow icon="planet-outline" label="Pays" value={user?.country} />
          <InfoRow icon="home-outline" label="Adresse" value={user?.address} />
        </Accordion>

        <Accordion
          icon="key-outline"
          title="Changer le mot de passe"
          subtitle="Sécurisez votre compte"
          open={openPwd}
          onToggle={() => setOpenPwd((v) => !v)}
        >
          <Field label="Mot de passe actuel" value={currentPw} onChangeText={setCurrentPw} secureTextEntry placeholder="Votre mot de passe actuel" />
          <Field label="Nouveau mot de passe" value={newPw} onChangeText={setNewPw} secureTextEntry placeholder="Minimum 8 caractères" />
          <Field label="Confirmer le nouveau mot de passe" value={confirmPw} onChangeText={setConfirmPw} secureTextEntry placeholder="Répétez le nouveau mot de passe" />
          {pwMsg ? <Msg ok={pwMsg.ok} text={pwMsg.text} /> : null}
          <Button title="Changer le mot de passe" icon="key-outline" variant="outline" loading={pwBusy} onPress={() => void changePwd()} />
        </Accordion>

        <Accordion
          icon="settings-outline"
          title="Réglages serveur"
          subtitle="Connexion au backend MadaColis"
          open={openServer}
          onToggle={() => setOpenServer((v) => !v)}
        >
          <ServerContent />
        </Accordion>

        <Button title="Se déconnecter" variant="danger" icon="log-out-outline" onPress={() => void logout()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.lg,
    overflow: "hidden",
    shadowColor: "#2563EB",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  orbTop: {
    position: "absolute",
    top: -70,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  orbBottom: {
    position: "absolute",
    bottom: -80,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(96,165,250,0.16)",
  },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  avatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 28, fontWeight: "900", color: colors.primaryDark },
  heroName: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" },
  roleRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  heroRole: { color: "#BFDBFE", fontSize: 12, fontWeight: "700" },
  heroMeta: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "600", marginTop: 2 },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  heroStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  heroStatText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  heroDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.4)" },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  cardOpen: { borderColor: colors.primaryLight },
  accHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  accIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: colors.text },
  accSub: { fontSize: 11, color: colors.subtext, marginTop: 2 },
  accBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.md },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: { fontSize: 11, fontWeight: "700", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  infoValue: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 2 },
  msg: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  msgOk: { backgroundColor: colors.successLight },
  msgErr: { backgroundColor: colors.dangerLight },
  msgText: { flex: 1, fontSize: 13, fontWeight: "700" },
  serverHeader: { flexDirection: "row", justifyContent: "flex-end" },
  serverToggle: { paddingHorizontal: spacing.sm, paddingVertical: 4 },
  serverEdit: { fontSize: 13, fontWeight: "700", color: colors.primary },
  serverValue: { fontSize: 13, fontWeight: "600", color: colors.primary, lineHeight: 18 },
  serverHint: { fontSize: 11, color: colors.subtext, lineHeight: 16 },
});