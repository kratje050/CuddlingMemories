package nl.cuddlingmemories.admin.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import nl.cuddlingmemories.admin.data.AdminRepository
import nl.cuddlingmemories.admin.data.AppNotification
import nl.cuddlingmemories.admin.ui.LoadState
import nl.cuddlingmemories.admin.ui.readableMessage

enum class NotificationFilter(val label: String, val type: String?, val onlyUnread: Boolean) {
    ALL("Alles", null, false),
    UNREAD("Ongelezen", null, true),
    BOOKINGS("Boekingen", "booking", false),
    GALLERIES("Galerijen", "gallery", false),
    GIFTCARDS("Cadeaubonnen", "giftcard", false),
    MINI_SESSIONS("Mini-shoots", "mini_session", false),
}

class NotificationsViewModel(private val repository: AdminRepository) : ViewModel() {
    private val _state = MutableStateFlow<LoadState<List<AppNotification>>>(LoadState.Loading)
    val state: StateFlow<LoadState<List<AppNotification>>> = _state

    private val _filter = MutableStateFlow(NotificationFilter.ALL)
    val filter: StateFlow<NotificationFilter> = _filter

    fun setFilter(value: NotificationFilter) {
        _filter.value = value
        load()
    }

    fun load() {
        val current = _filter.value
        viewModelScope.launch {
            _state.value = LoadState.Loading
            _state.value = runCatching { repository.listNotifications(current.onlyUnread, current.type) }
                .fold(
                    onSuccess = { LoadState.Ready(it) },
                    onFailure = { LoadState.Error(it.readableMessage()) },
                )
        }
    }

    fun markRead(id: String) {
        viewModelScope.launch {
            runCatching { repository.markNotificationRead(id) }
            load()
        }
    }
}
