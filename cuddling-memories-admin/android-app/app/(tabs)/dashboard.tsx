import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { getDashboardStats, type DashboardStats } from "@shared/index";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../../src/providers/AuthProvider";
import { ScreenHeader, StatCard } from "../../src/ui";
import { styles } from "../../src/styles";

export default function DashboardScreen() {
  const { supabase } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await getDashboardStats(supabase as any));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <ScrollView style={styles.screen} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <ScreenHeader title="Dashboard" subtitle="Vandaag en deze week" />
      <View style={styles.grid}>
        <StatCard label="Vandaag nieuw" value={stats?.newToday ?? 0} />
        <StatCard label="Deze week" value={stats?.newThisWeek ?? 0} />
        <StatCard label="Openstaand" value={stats?.openRequests ?? 0} />
        <StatCard label="Deze maand" value={stats?.bookingsThisMonth ?? 0} />
      </View>
      <Text style={styles.sectionTitle}>Laatste boekingen</Text>
      {(stats?.latestBookings || []).map((booking) => (
        <View key={booking.id} style={styles.card}>
          <Text style={styles.cardTitle}>{booking.customer_name}</Text>
          <Text style={styles.muted}>{booking.shoot_type} · {booking.status}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
