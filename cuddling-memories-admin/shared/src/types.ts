export type AdminProfile = {
  id: string;
  user_id: string;
  email?: string | null;
};

export type Booking = {
  id: string;
  customer_name: string;
  customer_email: string;
  shoot_type: string;
  status: string;
  booking_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  message?: string | null;
  admin_notes?: string | null;
  is_important?: boolean | null;
  created_at: string;
  updated_at?: string | null;
  packages?: { id: string; title: string } | null;
  deposit_type?: "none" | "fixed" | "percentage" | null;
  deposit_value?: number | null;
  deposit_amount?: number | null;
  deposit_due_mode?: "booking" | "before_shoot" | null;
  deposit_due_days_before_shoot?: number | null;
  deposit_due_date?: string | null;
  full_payment_due_mode?: "booking" | "before_shoot" | "after_shoot" | null;
  full_payment_due_days_before_shoot?: number | null;
  full_payment_due_date?: string | null;
  actual_shoot_date?: string | null;
  deposit_status?: "Niet gevraagd" | "Gevraagd" | "Betaald" | "Terugbetaald" | "Vervallen" | null;
  deposit_paid_at?: string | null;
  cancellation_terms?: string | null;
  terms_version?: string | null;
  terms_accepted_at?: string | null;
  terms_accepted_by?: string | null;
  questionnaire_answers?: Record<string, string> | null;
  discount_type?: string | null;
  discount_value?: number | null;
  discount_note?: string | null;
};

export type BookingTask = {
  id: string;
  booking_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  status: "open" | "done" | "skipped";
  completed_at?: string | null;
  sort_order: number;
};

// Waarden matchen exact de check-constraint op bookings.discount_type in
// supabase/schema.sql.
export const discountTypes: Array<{ value: string; label: string }> = [
  { value: "vast_bedrag", label: "Vast bedrag" },
  { value: "percentage", label: "Percentage" },
  { value: "giveaway", label: "Giveaway" },
  { value: "winactie", label: "Winactie" },
];

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  related_table?: string | null;
  related_id?: string | null;
  is_read: boolean;
  created_at: string;
};

export type CalendarBooking = {
  id: string;
  customer_name: string;
  shoot_type: string;
  status: string;
  booking_date: string;
  start_time?: string | null;
};

export type BlockedPeriod = {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  all_day: boolean;
};

export type BookingNote = {
  id: string;
  booking_id: string;
  note: string;
  created_by?: string | null;
  created_at: string;
};

export type DashboardStats = {
  newToday: number;
  newThisWeek: number;
  openRequests: number;
  bookingsThisMonth: number;
  waitlist: number;
  giftcards: number;
  miniSessionBookings: number;
  galleriesWaiting: number;
  latestBookings: Booking[];
};

export type SupabaseLike = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string; email?: string | null } | null }; error: unknown }>;
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ data: unknown; error: { message: string } | null }>;
    signOut: () => Promise<{ error: unknown }>;
  };
  from: (table: string) => any;
};
