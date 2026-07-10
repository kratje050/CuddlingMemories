package nl.cuddlingmemories.admin.bookings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.unit.dp
import nl.cuddlingmemories.admin.dashboard.BookingCard
import nl.cuddlingmemories.admin.ui.ErrorCard
import nl.cuddlingmemories.admin.ui.LoadState
import nl.cuddlingmemories.admin.ui.LoadingBox
import nl.cuddlingmemories.admin.ui.PageTitle
import nl.cuddlingmemories.admin.ui.ScreenScaffold

@Composable
fun BookingsScreen(viewModel: BookingsViewModel, onBookingClick: (String) -> Unit) {
    val state by viewModel.listState.collectAsState()
    var search by remember { mutableStateOf("") }
    LaunchedEffect(Unit) { viewModel.loadBookings() }

    ScreenScaffold {
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item {
                PageTitle("Boekingen", "Zoek, open en pas boekingen aan.")
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = search,
                    onValueChange = {
                        search = it
                        viewModel.loadBookings(it)
                    },
                    label = { Text("Zoek op naam of e-mail") },
                )
            }
            when (val current = state) {
                LoadState.Loading -> item { LoadingBox() }
                is LoadState.Error -> item { ErrorCard(current.message) { viewModel.loadBookings(search) } }
                is LoadState.Ready -> items(current.data) { booking ->
                    BookingCard(booking = booking, onClick = { onBookingClick(booking.id) })
                }
            }
        }
    }
}
