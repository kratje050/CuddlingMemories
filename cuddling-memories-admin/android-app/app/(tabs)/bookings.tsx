import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { listBookings, type Booking } from "@shared/index";
import { useAuth } from "../../src/providers/AuthProvider";
import { ScreenHeader } from "../../src/ui";
import { styles } from "../../src/styles";

export default function BookingsScreen() {
  const { supabase } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBookings(await listBookings(supabase as any, { search }));
    } finally {
      setLoading(false);
    }
  }, [supabase, search]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <ScrollView style={styles.screen} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <ScreenHeader title="Boekingen" subtitle="Zoeken, openen en status aanpassen" />
      <TextInput style={styles.input} placeholder="Zoek op naam of e-mail" value={search} onChangeText={setSearch} onSubmitEditing={load} />
      {bookings.map((booking) => (
        <Link key={booking.id} href={`/booking/${booking.id}`} asChild>
          <TouchableOpacity style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{booking.customer_name}</Text>
              <Text style={styles.badge}>{booking.status}</Text>
            </View>
            <Text style={styles.muted}>{booking.customer_email}</Text>
            <Text style={styles.muted}>{booking.shoot_type}</Text>
          </TouchableOpacity>
        </Link>
      ))}
    </ScrollView>
  );
}
