package nl.cuddlingmemories.admin.bookings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AssistChip
import androidx.compose.material3.FilterChip
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import nl.cuddlingmemories.admin.data.Booking
import nl.cuddlingmemories.admin.data.BookingNote
import nl.cuddlingmemories.admin.data.bookingStatuses
import nl.cuddlingmemories.admin.data.discountTypes
import nl.cuddlingmemories.admin.ui.ErrorCard
import nl.cuddlingmemories.admin.ui.LabelValue
import nl.cuddlingmemories.admin.ui.LoadState
import nl.cuddlingmemories.admin.ui.LoadingBox
import nl.cuddlingmemories.admin.ui.PageTitle
import nl.cuddlingmemories.admin.ui.PrimaryButton
import nl.cuddlingmemories.admin.ui.ScreenScaffold
import nl.cuddlingmemories.admin.ui.SoftCard

@Composable
fun BookingDetailScreen(
    id: String,
    adminEmail: String,
    viewModel: BookingsViewModel,
    onBack: () -> Unit,
) {
    val state by viewModel.detailState.collectAsState()
    LaunchedEffect(id) { viewModel.loadBooking(id) }

    when (val current = state) {
        LoadState.Loading -> LoadingBox()
        is LoadState.Error -> ScreenScaffold { ErrorCard(current.message) { viewModel.loadBooking(id) } }
        is LoadState.Ready -> BookingDetailContent(
            id = id,
            booking = current.data.first,
            notes = current.data.second,
            adminEmail = adminEmail,
            onBack = onBack,
            onStatus = { viewModel.updateStatus(id, it) },
            onNote = { viewModel.addNote(id, it, adminEmail) },
            onDiscount = { type, value, note -> viewModel.updateDiscount(id, type, value, note) },
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun BookingDetailContent(
    id: String,
    booking: Booking?,
    notes: List<BookingNote>,
    adminEmail: String,
    onBack: () -> Unit,
    onStatus: (String) -> Unit,
    onNote: (String) -> Unit,
    onDiscount: (String?, Double?, String?) -> Unit,
) {
    var note by remember { mutableStateOf("") }
    var discountType by remember(booking?.id) { mutableStateOf(booking?.discountType) }
    var discountValueText by remember(booking?.id) { mutableStateOf(booking?.discountValue?.toString() ?: "") }
    var discountNote by remember(booking?.id) { mutableStateOf(booking?.discountNote ?: "") }
    ScreenScaffold {
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item {
                PageTitle(booking?.customerName ?: "Boeking", booking?.shootType ?: id)
                androidx.compose.material3.TextButton(onClick = onBack) { Text("Terug") }
            }
            if (booking != null) {
                item {
                    SoftCard {
                        LabelValue("E-mailadres", booking.customerEmail)
                        LabelValue("Status", booking.status)
                        LabelValue("Pakket", booking.packages?.title)
                        LabelValue("Datum", booking.bookingDate)
                        LabelValue("Tijd", listOfNotNull(booking.startTime, booking.endTime).joinToString(" - "))
                        LabelValue("Locatie", booking.location)
                        LabelValue("Bericht", booking.message)
                        LabelValue("Interne notities", booking.adminNotes)
                        LabelValue(
                            "Korting",
                            booking.discountType?.let { type ->
                                val label = discountTypes.firstOrNull { it.first == type }?.second ?: type
                                if (booking.discountValue != null) "$label: ${booking.discountValue}" else label
                            },
                        )
                    }
                }
                item {
                    SoftCard {
                        Text("Status aanpassen", fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(10.dp))
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            bookingStatuses.forEach { status ->
                                AssistChip(onClick = { onStatus(status) }, label = { Text(status) })
                            }
                        }
                    }
                }
                item {
                    SoftCard {
                        Text("Korting", fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(10.dp))
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            discountTypes.forEach { (value, label) ->
                                FilterChip(
                                    selected = discountType == value,
                                    onClick = { discountType = if (discountType == value) null else value },
                                    label = { Text(label) },
                                )
                            }
                        }
                        if (discountType == "vast_bedrag" || discountType == "percentage") {
                            Spacer(Modifier.height(10.dp))
                            OutlinedTextField(
                                value = discountValueText,
                                onValueChange = { discountValueText = it },
                                label = { Text(if (discountType == "percentage") "Percentage" else "Bedrag in euro's") },
                                singleLine = true,
                            )
                        }
                        Spacer(Modifier.height(10.dp))
                        OutlinedTextField(
                            value = discountNote,
                            onValueChange = { discountNote = it },
                            label = { Text("Toelichting (optioneel)") },
                            minLines = 2,
                        )
                        Spacer(Modifier.height(10.dp))
                        PrimaryButton("Korting opslaan") {
                            onDiscount(discountType, discountValueText.toDoubleOrNull(), discountNote.ifBlank { null })
                        }
                    }
                }
                item {
                    SoftCard {
                        Text("Interne notitie", fontWeight = FontWeight.Bold)
                        OutlinedTextField(value = note, onValueChange = { note = it }, minLines = 3)
                        Spacer(Modifier.height(10.dp))
                        PrimaryButton("Notitie opslaan", enabled = note.isNotBlank()) {
                            onNote(note)
                            note = ""
                        }
                    }
                }
                items(notes) { item ->
                    SoftCard {
                        Text(item.note)
                        Text(item.createdBy ?: adminEmail)
                    }
                }
            }
        }
    }
}
