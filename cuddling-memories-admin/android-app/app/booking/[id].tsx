import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import {
  addBookingNote,
  bookingStatuses,
  discountTypes,
  getBookingDetail,
  updateBookingDiscount,
  updateBookingStatus,
  type Booking,
  type BookingNote,
} from "@shared/index";
import { useAuth } from "../../src/providers/AuthProvider";
import { ScreenHeader } from "../../src/ui";
import { styles } from "../../src/styles";

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { supabase, user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [notes, setNotes] = useState<BookingNote[]>([]);
  const [note, setNote] = useState("");
  const [discountType, setDiscountType] = useState<string | null>(null);
  const [discountValue, setDiscountValue] = useState("");
  const [discountNote, setDiscountNote] = useState("");

  async function load() {
    if (!id) return;
    const result = await getBookingDetail(supabase as any, id);
    setBooking(result.booking);
    setNotes(result.notes);
    setDiscountType(result.booking?.discount_type ?? null);
    setDiscountValue(result.booking?.discount_value != null ? String(result.booking.discount_value) : "");
    setDiscountNote(result.booking?.discount_note ?? "");
  }

  useEffect(() => {
    load();
  }, [id]);

  async function saveDiscount() {
    if (!booking) return;
    const parsedValue = discountValue.trim() ? Number(discountValue.replace(",", ".")) : null;
    await updateBookingDiscount(supabase as any, booking.id, discountType, parsedValue, discountNote.trim() || null);
    await load();
  }

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
      <Text style={styles.sectionTitle}>Korting</Text>
      <View style={styles.wrap}>
        {discountTypes.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, discountType === option.value && styles.chipActive]}
            onPress={() => setDiscountType(discountType === option.value ? null : option.value)}
          >
            <Text style={discountType === option.value ? styles.chipActiveText : styles.chipText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {(discountType === "vast_bedrag" || discountType === "percentage") && (
        <TextInput
          style={styles.input}
          value={discountValue}
          onChangeText={setDiscountValue}
          keyboardType="decimal-pad"
          placeholder={discountType === "percentage" ? "Percentage" : "Bedrag in euro's"}
        />
      )}
      <TextInput
        style={[styles.input, styles.textArea]}
        value={discountNote}
        onChangeText={setDiscountNote}
        multiline
        placeholder="Toelichting (optioneel)"
      />
      <TouchableOpacity style={styles.button} onPress={saveDiscount}>
        <Text style={styles.buttonText}>Korting opslaan</Text>
      </TouchableOpacity>

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
