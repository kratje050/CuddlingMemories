import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { listNotifications, markNotificationRead, type AppNotification } from "@shared/index";
import { useAuth } from "../../src/providers/AuthProvider";
import { ScreenHeader } from "../../src/ui";
import { styles } from "../../src/styles";

const filters = [
  { key: "all", label: "Alles" },
  { key: "unread", label: "Ongelezen" },
  { key: "booking", label: "Boekingen" },
  { key: "gallery", label: "Galerijen" },
  { key: "giftcard", label: "Cadeaubonnen" },
  { key: "mini_session", label: "Mini-shoots" },
];

export default function NotificationsScreen() {
  const { supabase } = useAuth();
  const [active, setActive] = useState("all");
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filterArg = active === "all" ? {} : active === "unread" ? { onlyUnread: true } : { type: active };
      setItems(await listNotifications(supabase as any, filterArg));
    } finally {
      setLoading(false);
    }
  }, [supabase, active]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handlePress(notification: AppNotification) {
    if (!notification.is_read) {
      await markNotificationRead(supabase as any, notification.id);
      load();
    }
    if (notification.related_table === "bookings" && notification.related_id) {
      router.push(`/booking/${notification.related_id}`);
    }
  }

  return (
    <ScrollView style={styles.screen} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <ScreenHeader title="Meldingen" subtitle="Nieuwe boekingen, galerijen en aanvragen." />
      <View style={styles.wrap}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.chip, active === filter.key && styles.chipActive]}
            onPress={() => setActive(filter.key)}
          >
            <Text style={active === filter.key ? styles.chipActiveText : styles.chipText}>{filter.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {items.length === 0 && !loading ? (
        <View style={styles.card}><Text style={styles.body}>Nog geen meldingen.</Text></View>
      ) : (
        items.map((notification) => (
          <TouchableOpacity key={notification.id} style={styles.card} onPress={() => handlePress(notification)}>
            <Text style={[styles.cardTitle, notification.is_read && { fontWeight: "400" }]}>{notification.title}</Text>
            {notification.body ? <Text style={styles.body}>{notification.body}</Text> : null}
            <Text style={styles.muted}>{new Date(notification.created_at).toLocaleString("nl-NL")}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}
