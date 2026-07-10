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
