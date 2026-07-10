package nl.cuddlingmemories.admin.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.clickable
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import nl.cuddlingmemories.admin.data.Booking
import nl.cuddlingmemories.admin.data.DashboardStats
import nl.cuddlingmemories.admin.ui.Badge
import nl.cuddlingmemories.admin.ui.ErrorCard
import nl.cuddlingmemories.admin.ui.LabelValue
import nl.cuddlingmemories.admin.ui.LoadState
import nl.cuddlingmemories.admin.ui.LoadingBox
import nl.cuddlingmemories.admin.ui.PageTitle
import nl.cuddlingmemories.admin.ui.ScreenScaffold
import nl.cuddlingmemories.admin.ui.SoftCard
import nl.cuddlingmemories.admin.ui.StatTile
import nl.cuddlingmemories.admin.ui.TwoColumn

@Composable
fun DashboardScreen(viewModel: DashboardViewModel, onBookingClick: (String) -> Unit) {
    val state by viewModel.state.collectAsState()
    LaunchedEffect(Unit) { viewModel.load() }

    when (val current = state) {
        LoadState.Loading -> LoadingBox()
        is LoadState.Error -> ScreenScaffold { ErrorCard(current.message, viewModel::load) }
        is LoadState.Ready -> DashboardContent(current.data, onBookingClick, viewModel::load)
    }
}

@Composable
private fun DashboardContent(stats: DashboardStats, onBookingClick: (String) -> Unit, onRefresh: () -> Unit) {
    ScreenScaffold {
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item {
                PageTitle("Dashboard", "Snel overzicht van aanvragen, boekingen en galerijen.")
                Spacer(Modifier.height(8.dp))
            }
            item {
                TwoColumn(
                    { StatTile(stats.newToday.toString(), "Vandaag nieuw") },
                    { StatTile(stats.newThisWeek.toString(), "Deze week") },
                )
            }
            item {
                TwoColumn(
                    { StatTile(stats.openRequests.toString(), "Openstaand") },
                    { StatTile(stats.bookingsThisMonth.toString(), "Deze maand") },
                )
            }
            item {
                TwoColumn(
                    { StatTile(stats.waitlist.toString(), "Wachtlijst") },
                    { StatTile(stats.galleriesWaiting.toString(), "Galerijen") },
                )
            }
            item {
                Text("Laatste boekingen", fontWeight = FontWeight.Bold)
            }
            items(stats.latestBookings) { booking ->
                BookingCard(booking = booking, onClick = { onBookingClick(booking.id) })
            }
            item {
                androidx.compose.material3.OutlinedButton(onClick = onRefresh) {
                    Text("Verversen")
                }
            }
        }
    }
}

@Composable
fun BookingCard(booking: Booking, onClick: () -> Unit) {
    SoftCard(modifier = Modifier.clickable(onClick = onClick)) {
        Column {
            androidx.compose.foundation.layout.Row {
                Text(booking.customerName, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                Badge(booking.status)
            }
            Spacer(Modifier.height(8.dp))
            LabelValue("Shoot", booking.shootType)
            LabelValue("Datum", booking.bookingDate)
        }
    }
}
