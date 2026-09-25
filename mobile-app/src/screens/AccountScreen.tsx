import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Pressable, RefreshControl, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { getMyPayments, getMyShipments, demoPay } from "../api/endpoints";
import { Screen, Card, Badge, Button, Spinner, Empty } from "../components/ui";
import { colors, spacing } from "../theme";
import { useAuth } from "../context/AuthContext";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const statusColor = (s: string): "green" | "amber" | "blue" | "red" | "slate" => {
  const upper = s.toUpperCase();
  if (["PAID", "DELIVERED", "COMPLETED"].includes(upper)) return "green";
  if (["PENDING", "IN_TRANSIT", "PROCESSING"].includes(upper)) return "amber";
  if (["FAILED", "CANCELLED"].includes(upper)) return "red";
  if (["APPROVED", "CONFIRMED"].includes(upper)) return "blue";
  return "slate";
};

export function AccountScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const payments = useQuery({ queryKey: ["payments"], queryFn: getMyPayments, enabled: !!user });
  const shipments = useQuery({ queryKey: ["shipments"], queryFn: getMyShipments, enabled: !!user });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([payments.refetch(), shipments.refetch()]);
    setRefreshing(false);
  };

  const handleDemoPay = async (paymentId: string) => {
    setPayingId(paymentId);
    try {
      await demoPay(paymentId);
      await payments.refetch();
    } catch (e) {
      console.warn(e);
    } finally {
      setPayingId(null);
    }
  };

  return (
    <Screen scroll={false}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Card style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() ?? "M"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profilePhone}>{user?.phone}</Text>
          </View>
          <Pressable onPress={() => void logout()}>
            <Ionicons name="log-out-outline" size={24} color={colors.danger} />
          </Pressable>
        </Card>

        <Text style={styles.sectionTitle}>Mes colis</Text>
        {shipments.isLoading && <Spinner />}
        {shipments.data && shipments.data.shipments.length === 0 && (
          <Empty title="Aucun colis" subtitle="Votre historique de colis apparaîtra ici." />
        )}
        {shipments.data?.shipments.slice(0, 4).map((s) => (
          <Card key={s.id} style={styles.listCard}>
            <View style={styles.listTop}>
              <Badge label={s.status.toLowerCase().replace(/_/g, " ")} color={statusColor(s.status)} />
              <Text style={styles.tracking}>{s.trackingNumber}</Text>
            </View>
            <Text style={styles.listRoute}>
              {s.originCity} → {s.destinationCity}
            </Text>
            <Text style={styles.listPrice}>
              {s.estimatedPrice} {s.currency}
            </Text>
          </Card>
        ))}

        <Text style={styles.sectionTitle}>Mes paiements</Text>
        {payments.isLoading && <Spinner />}
        {payments.data && payments.data.payments.length === 0 && (
          <Empty title="Aucun paiement" subtitle="Vos paiements apparaîtront ici." />
        )}
        {payments.data?.payments.map((p) => (
          <Card key={p.id} style={styles.listCard}>
            <View style={styles.listTop}>
              <Badge label={p.status.toLowerCase()} color={statusColor(p.status)} />
              <Text style={styles.paymentRef}>{p.paymentReference}</Text>
            </View>
            <View style={styles.listTop}>
              <Text style={styles.paymentMethod}>
                {p.shipment?.trackingNumber ?? "—"} · {p.method}
              </Text>
              <Text style={styles.listPrice}>
                {p.amount} {p.currency}
              </Text>
            </View>
            {p.status === "PENDING" ? (
              <View style={{ marginTop: spacing.md }}>
                <Button
                  label="Payer (démo)"
                  loading={payingId === p.id}
                  onPress={() => void handleDemoPay(p.id)}
                />
              </View>
            ) : null}
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: "row", alignItems: "center", gap: spacing.lg, marginBottom: spacing.xl },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "800" },
  profileName: { fontSize: 16, fontWeight: "800", color: colors.text },
  profilePhone: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: colors.text, marginBottom: spacing.md, marginTop: spacing.md },
  listCard: { marginBottom: spacing.md, gap: 4 },
  listTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  tracking: { fontSize: 12, fontWeight: "700", color: colors.textSecondary, fontVariant: ["tabular-nums"] },
  listRoute: { fontSize: 13, color: colors.text, fontWeight: "600", marginTop: spacing.sm },
  listPrice: { fontSize: 14, fontWeight: "800", color: colors.primary },
  paymentRef: { fontSize: 12, color: colors.textSecondary },
  paymentMethod: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
});