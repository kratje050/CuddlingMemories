import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { addBookingNote, bookingStatuses, getBookingDetail, updateBookingStatus, type Booking, type BookingNote } from "@shared/index";
import { useAuth } from "../../src/providers/AuthProvider";
import { ScreenHeader } from "../../src/ui";
import { styles } from "../../src/styles";

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { supabase, user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [notes, setNotes] = useState<BookingNote[]>([]);
  const [note, setNote] = useState("");

  async function load() {
    if (!id) return;
    const result = await getBookingDetail(supabase as any, id);
    setBooking(result.booking);
    setNotes(result.notes);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function changeStatus(status: string) {
    if (!booking) return;
    await updateBookingStatus(supabase as any, booking.id, status, user?.email);
    await load();
  }

  async function submitNote() {
    if (!booking || !note.trim()) return;
    await addBookingNote(supabase as any, booking.id, note.trim(), user?.email);
    setNote("");
    await load();
  }

  return (
    <ScrollView style={styles.screen}>
      <ScreenHeader title={booking?.customer_name || "Boeking"} subtitle={booking?.shoot_type || "Laden..."} />
      {booking && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{booking.status}</Text>
          <Text style={styles.muted}>{booking.customer_email}</Text>
          <Text style={styles.body}>{booking.message || "Geen bericht."}</Text>
        </View>
      )}
      <Text style={styles.sectionTitle}>Status</Text>
      <View style={styles.wrap}>
        {bookingStatuses.map((status) => (
          <TouchableOpacity key={status} style={[styles.chip, booking?.status === status && styles.chipActive]} onPress={() => changeStatus(status)}>
            <Text style={booking?.status === status ? styles.chipActiveText : styles.chipText}>{status}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.sectionTitle}>Interne notitie</Text>
      <TextInput style={[styles.input, styles.textArea]} value={note} onChangeText={setNote} multiline placeholder="Notitie toevoegen" />
      <TouchableOpacity style={styles.button} onPress={submitNote}>
        <Text style={styles.buttonText}>Notitie opslaan</Text>
      </TouchableOpacity>
      {notes.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.body}>{item.note}</Text>
          <Text style={styles.muted}>{item.created_by || "Admin"}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
