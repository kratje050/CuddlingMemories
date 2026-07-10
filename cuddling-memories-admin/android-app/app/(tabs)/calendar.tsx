import { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { blockedPeriodsForMonth, calendarBookingsForMonth, type BlockedPeriod, type CalendarBooking } from "@shared/index";
import { useAuth } from "../../src/providers/AuthProvider";
import { ScreenHeader } from "../../src/ui";
import { styles } from "../../src/styles";

const weekdayLabels = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const monthNames = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function CalendarScreen() {
  const { supabase } = useAuth();
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [blocked, setBlocked] = useState<BlockedPeriod[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, bl] = await Promise.all([
        calendarBookingsForMonth(supabase as any, year, month),
        blockedPeriodsForMonth(supabase as any, year, month),
      ]);
      setBookings(b);
      setBlocked(bl);
    } finally {
      setLoading(false);
    }
  }, [supabase, year, month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const blockedDates = useMemo(() => {
    const set = new Set<string>();
    blocked.forEach((period) => {
      const start = new Date(period.start_datetime.slice(0, 10));
      const end = new Date(period.end_datetime.slice(0, 10));
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        set.add(d.toISOString().slice(0, 10));
      }
    });
    return set;
  }, [blocked]);

  const bookingCountByDay = useMemo(() => {
    const map: Record<string, number> = {};
    bookings.forEach((booking) => {
      map[booking.booking_date] = (map[booking.booking_date] || 0) + 1;
    });
    return map;
  }, [bookings]);

  const cells = useMemo(() => {
    const firstOfMonth = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const leadingBlanks = (firstOfMonth.getDay() + 6) % 7; // ma=0 .. zo=6
    return Array.from({ length: leadingBlanks + daysInMonth }, (_, index) => {
      const day = index - leadingBlanks + 1;
      return day >= 1 && day <= daysInMonth ? day : null;
    });
  }, [year, month]);

  function goToMonth(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 12) { newMonth = 1; newYear += 1; }
    if (newMonth < 1) { newMonth = 12; newYear -= 1; }
    setMonth(newMonth);
    setYear(newYear);
    setSelectedDate(null);
  }

  const dayBookings = bookings.filter((booking) => booking.booking_date === selectedDate);

  return (
    <ScrollView style={styles.screen}>
      <ScreenHeader title="Kalender" subtitle="Boekingen en geblokkeerde dagen per maand." />
      <View style={styles.rowBetween}>
        <TouchableOpacity style={styles.chip} onPress={() => goToMonth(-1)}>
          <Text style={styles.chipText}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.cardTitle}>{monthNames[month - 1]} {year}</Text>
        <TouchableOpacity style={styles.chip} onPress={() => goToMonth(1)}>
          <Text style={styles.chipText}>{">"}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.weekRow, { marginTop: 14 }]}>
        {weekdayLabels.map((label) => (
          <Text key={label} style={styles.weekdayLabel}>{label}</Text>
        ))}
      </View>

      {Array.from({ length: Math.ceil(cells.length / 7) }, (_, row) => (
        <View key={row} style={styles.weekRow}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            if (day === null) return <View key={col} style={styles.dayCellWrap} />;
            const dateKey = toDateKey(year, month, day);
            const isBlocked = blockedDates.has(dateKey);
            const isSelected = dateKey === selectedDate;
            const count = bookingCountByDay[dateKey] || 0;
            return (
              <View key={col} style={styles.dayCellWrap}>
                <TouchableOpacity
                  style={[styles.dayCell, isBlocked && styles.dayCellBlocked, isSelected && styles.dayCellSelected]}
                  onPress={() => setSelectedDate(isSelected ? null : dateKey)}
                >
                  <Text style={[styles.dayCellText, isSelected && styles.dayCellTextSelected]}>{day}</Text>
                  {count > 0 ? <Text style={styles.dayCellDot}>{count}</Text> : null}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ))}

      {selectedDate ? (
        <>
          <Text style={styles.sectionTitle}>Boekingen op {selectedDate}</Text>
          {dayBookings.length === 0 ? (
            <View style={styles.card}><Text style={styles.body}>Geen boekingen op deze dag.</Text></View>
          ) : (
            dayBookings.map((booking) => (
              <Link key={booking.id} href={`/booking/${booking.id}`} asChild>
                <TouchableOpacity style={styles.card}>
                  <Text style={styles.cardTitle}>{booking.customer_name}</Text>
                  <Text style={styles.muted}>{booking.shoot_type} · {booking.start_time || "-"} · {booking.status}</Text>
                </TouchableOpacity>
              </Link>
            ))
          )}
        </>
      ) : null}
      {loading ? <Text style={styles.muted}>Laden...</Text> : null}
    </ScrollView>
  );
}
