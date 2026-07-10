package nl.cuddlingmemories.admin.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class AdminProfile(
    val id: String,
    @SerialName("user_id") val userId: String,
    val email: String? = null,
    val name: String? = null,
)

@Serializable
data class PackageSummary(
    val id: String? = null,
    val title: String? = null,
)

@Serializable
data class Booking(
    val id: String,
    @SerialName("customer_name") val customerName: String,
    @SerialName("customer_email") val customerEmail: String,
    @SerialName("shoot_type") val shootType: String,
    val status: String,
    @SerialName("booking_date") val bookingDate: String? = null,
    @SerialName("start_time") val startTime: String? = null,
    @SerialName("end_time") val endTime: String? = null,
    val location: String? = null,
    val message: String? = null,
    @SerialName("admin_notes") val adminNotes: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    val packages: PackageSummary? = null,
    @SerialName("discount_type") val discountType: String? = null,
    @SerialName("discount_value") val discountValue: Double? = null,
    @SerialName("discount_note") val discountNote: String? = null,
)

// Waarden matchen exact de check-constraint op bookings.discount_type in
// supabase/schema.sql.
val discountTypes = listOf(
    "vast_bedrag" to "Vast bedrag",
    "percentage" to "Percentage",
    "giveaway" to "Giveaway",
    "winactie" to "Winactie",
)

@Serializable
data class BookingDiscountUpdate(
    @SerialName("discount_type") val discountType: String?,
    @SerialName("discount_value") val discountValue: Double?,
    @SerialName("discount_note") val discountNote: String?,
)

@Serializable
data class BookingNote(
    val id: String,
    @SerialName("booking_id") val bookingId: String,
    val note: String,
    @SerialName("created_by") val createdBy: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
)

@Serializable
data class BookingStatusUpdate(
    val status: String,
)

@Serializable
data class BookingNoteInsert(
    @SerialName("booking_id") val bookingId: String,
    val note: String,
    @SerialName("created_by") val createdBy: String,
)

data class DashboardStats(
    val newToday: Int = 0,
    val newThisWeek: Int = 0,
    val openRequests: Int = 0,
    val bookingsThisMonth: Int = 0,
    val waitlist: Int = 0,
    val galleriesWaiting: Int = 0,
    val latestBookings: List<Booking> = emptyList(),
)

@Serializable
data class AppNotification(
    val id: String,
    val type: String,
    val title: String,
    val body: String? = null,
    @SerialName("related_table") val relatedTable: String? = null,
    @SerialName("related_id") val relatedId: String? = null,
    @SerialName("is_read") val isRead: Boolean = false,
    @SerialName("created_at") val createdAt: String? = null,
)

@Serializable
data class NotificationReadUpdate(
    @SerialName("is_read") val isRead: Boolean,
)

// Lichte projectie van een boeking, alleen de velden die de kalendermaandgrid
// nodig heeft (voorkomt dat we de volledige Booking-select+join ophalen).
@Serializable
data class CalendarBooking(
    val id: String,
    @SerialName("customer_name") val customerName: String,
    @SerialName("shoot_type") val shootType: String,
    val status: String,
    @SerialName("booking_date") val bookingDate: String,
    @SerialName("start_time") val startTime: String? = null,
)

@Serializable
data class BlockedPeriod(
    val id: String,
    val title: String,
    @SerialName("start_datetime") val startDatetime: String,
    @SerialName("end_datetime") val endDatetime: String,
    @SerialName("all_day") val allDay: Boolean = true,
)

val bookingStatuses = listOf(
    "Nieuw",
    "Gelezen",
    "Contact opgenomen",
    "Wacht op reactie",
    "Datum ingepland",
    "Aanbetaling gevraagd",
    "Aanbetaling ontvangen",
    "Shoot geweest",
    "Galerij verstuurd",
    "Afgerond",
    "Geannuleerd",
    "Gearchiveerd",
)
