package nl.cuddlingmemories.admin.notifications

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import nl.cuddlingmemories.admin.data.AppNotification
import nl.cuddlingmemories.admin.ui.theme.Coffee
import nl.cuddlingmemories.admin.ui.ErrorCard
import nl.cuddlingmemories.admin.ui.LoadState
import nl.cuddlingmemories.admin.ui.LoadingBox
import nl.cuddlingmemories.admin.ui.PageTitle
import nl.cuddlingmemories.admin.ui.ScreenScaffold
import nl.cuddlingmemories.admin.ui.SoftCard

@Composable
fun NotificationsScreen(viewModel: NotificationsViewModel, onOpenBooking: (String) -> Unit) {
    val state by viewModel.state.collectAsState()
    val filter by viewModel.filter.collectAsState()

    LaunchedEffect(Unit) { viewModel.load() }

    ScreenScaffold {
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item { PageTitle("Meldingen", "Nieuwe boekingen, galerijen en aanvragen.") }
            item {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(NotificationFilter.entries) { option ->
                        FilterChip(
                            selected = filter == option,
                            onClick = { viewModel.setFilter(option) },
                            label = { Text(option.label) },
                        )
                    }
                }
            }
            when (val current = state) {
                LoadState.Loading -> item { LoadingBox() }
                is LoadState.Error -> item { ErrorCard(current.message) { viewModel.load() } }
                is LoadState.Ready -> {
                    if (current.data.isEmpty()) {
                        item { SoftCard { Text("Nog geen meldingen.") } }
                    } else {
                        items(current.data, key = { it.id }) { notification ->
                            NotificationCard(
                                notification = notification,
                                onClick = {
                                    if (!notification.isRead) viewModel.markRead(notification.id)
                                    if (notification.relatedTable == "bookings" && notification.relatedId != null) {
                                        onOpenBooking(notification.relatedId)
                                    }
                                },
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun NotificationCard(notification: AppNotification, onClick: () -> Unit) {
    SoftCard(modifier = Modifier.clickable(onClick = onClick)) {
        Text(
            notification.title,
            color = Coffee,
            fontWeight = if (notification.isRead) FontWeight.Normal else FontWeight.Bold,
        )
        if (!notification.body.isNullOrBlank()) {
            Spacer(Modifier.height(4.dp))
            Text(notification.body, color = Coffee.copy(alpha = 0.7f))
        }
        Spacer(Modifier.height(6.dp))
        Text(notification.createdAt.orEmpty(), color = Coffee.copy(alpha = 0.5f))
    }
}
