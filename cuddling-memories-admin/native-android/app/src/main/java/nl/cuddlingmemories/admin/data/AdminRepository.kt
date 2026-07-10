package nl.cuddlingmemories.admin.data

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.query.Order
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.time.LocalDate
import java.time.ZoneId

class AdminRepository(private val supabase: SupabaseClient) {
    suspend fun signIn(email: String, password: String): AdminProfile {
        supabase.auth.signInWith(Email) {
            this.email = email
            this.password = password
        }
        return requireAdmin()
    }

    suspend fun signOut() {
        supabase.auth.signOut()
    }

    suspend fun currentAdminOrNull(): AdminProfile? {
        val user = supabase.auth.currentUserOrNull() ?: return null
        return supabase.from("admin_profiles")
            .select {
                filter {
                    eq("user_id", user.id.toString())
                }
            }
            .decodeSingleOrNull<AdminProfile>()
    }

    suspend fun requireAdmin(): AdminProfile {
        return currentAdminOrNull() ?: error("Dit account heeft geen admin-toegang.")
    }

    suspend fun dashboardStats(): DashboardStats {
        requireAdmin()
        val latest = listBookings(limit = 5)
        val today = LocalDate.now(ZoneId.of("Europe/Amsterdam")).toString()
        val thisMonth = today.substring(0, 7)

        return DashboardStats(
            newToday = latest.count { it.createdAt?.startsWith(today) == true },
            newThisWeek = latest.size,
            openRequests = latest.count { it.status in openStatuses },
            bookingsThisMonth = latest.count { it.bookingDate?.startsWith(thisMonth) == true },
            waitlist = countRows("waitlist_entries"),
            galleriesWaiting = countRows("client_galleries"),
            latestBookings = latest,
        )
    }

    suspend fun listBookings(search: String = "", limit: Int = 100): List<Booking> {
        requireAdmin()
        val query = supabase.from("bookings")
            .select(Columns.raw("*, packages(id,title)")) {
                filter {
                    if (search.isNotBlank()) {
                        or {
                            ilike("customer_name", "%$search%")
                            ilike("customer_email", "%$search%")
                        }
                    }
                }
                order("created_at", Order.DESCENDING)
                limit(limit.toLong())
            }

        return query.decodeList<Booking>()
    }

    suspend fun bookingDetail(id: String): Pair<Booking?, List<BookingNote>> {
        requireAdmin()
        val booking = supabase.from("bookings")
            .select(Columns.raw("*, packages(id,title)")) {
                filter { eq("id", id) }
            }
            .decodeSingleOrNull<Booking>()

        val notes = supabase.from("booking_notes")
            .select {
                filter { eq("booking_id", id) }
                order("created_at", Order.DESCENDING)
            }
            .decodeList<BookingNote>()

        return booking to notes
    }

    suspend fun updateBookingStatus(id: String, status: String) {
        requireAdmin()
        supabase.from("bookings").update(BookingStatusUpdate(status)) {
            filter { eq("id", id) }
        }
    }

    suspend fun updateBookingDiscount(id: String, discountType: String?, discountValue: Double?, discountNote: String?) {
        requireAdmin()
        supabase.from("bookings").update(BookingDiscountUpdate(discountType, discountValue, discountNote)) {
            filter { eq("id", id) }
        }
    }

    suspend fun addBookingNote(id: String, note: String, createdBy: String) {
        requireAdmin()
        supabase.from("booking_notes").insert(BookingNoteInsert(id, note, createdBy))
    }

    suspend fun sendTestPush() {
        requireAdmin()
        supabase.postgrest.rpc(
            "fn_notify_admins",
            buildJsonObject {
                put("p_type", "test")
                put("p_title", "Testmelding")
                put("p_body", "Dit is een testmelding vanuit de app. Als je dit ziet, werken pushmeldingen.")
            },
        )
    }

    suspend fun registerPushToken(token: String, platform: String = "android") {
        val admin = requireAdmin()
        // Vereist tabel push_tokens uit cuddling-memories-admin/supabase/admin_app_phase1.sql.
        supabase.from("push_tokens").upsert(
            mapOf(
                "admin_user_id" to admin.userId,
                "token" to token,
                "platform" to platform,
                "is_active" to true,
            ),
        )
    }

    suspend fun listNotifications(onlyUnread: Boolean = false, type: String? = null): List<AppNotification> {
        requireAdmin()
        return supabase.from("notifications")
            .select {
                filter {
                    if (onlyUnread) eq("is_read", false)
                    if (!type.isNullOrBlank()) eq("type", type)
                }
                order("created_at", Order.DESCENDING)
                limit(100)
            }
            .decodeList<AppNotification>()
    }

    suspend fun markNotificationRead(id: String) {
        requireAdmin()
        supabase.from("notifications").update(NotificationReadUpdate(true)) {
            filter { eq("id", id) }
        }
    }

    // year/month zijn 1-based (1=januari), zoals overal elders in dit project.
    suspend fun calendarBookingsForMonth(year: Int, month: Int): List<CalendarBooking> {
        requireAdmin()
        val monthStart = "%04d-%02d-01".format(year, month)
        val monthEnd = LocalDate.of(year, month, 1).plusMonths(1).minusDays(1).toString()
        return supabase.from("bookings")
            .select(Columns.raw("id,customer_name,shoot_type,status,booking_date,start_time")) {
                filter {
                    gte("booking_date", monthStart)
                    lte("booking_date", monthEnd)
                }
                order("booking_date", Order.ASCENDING)
            }
            .decodeList<CalendarBooking>()
    }

    suspend fun blockedPeriodsForMonth(year: Int, month: Int): List<BlockedPeriod> {
        requireAdmin()
        val monthStart = "%04d-%02d-01T00:00:00Z".format(year, month)
        val monthEnd = LocalDate.of(year, month, 1).plusMonths(1).atStartOfDay().toString() + "Z"
        return supabase.from("blocked_periods")
            .select(Columns.raw("id,title,start_datetime,end_datetime,all_day")) {
                filter {
                    lte("start_datetime", monthEnd)
                    gte("end_datetime", monthStart)
                }
                order("start_datetime", Order.ASCENDING)
            }
            .decodeList<BlockedPeriod>()
    }

    private suspend fun countRows(table: String): Int {
        return runCatching {
            supabase.from(table).select().decodeList<Map<String, String>>().size
        }.getOrDefault(0)
    }

    private val openStatuses = setOf("Nieuw", "Gelezen", "Contact opgenomen", "Wacht op reactie")
}
