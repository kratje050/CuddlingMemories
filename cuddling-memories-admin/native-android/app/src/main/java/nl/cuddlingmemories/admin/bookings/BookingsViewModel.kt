package nl.cuddlingmemories.admin.bookings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import nl.cuddlingmemories.admin.data.Booking
import nl.cuddlingmemories.admin.data.BookingNote
import nl.cuddlingmemories.admin.data.AdminRepository
import nl.cuddlingmemories.admin.ui.LoadState
import nl.cuddlingmemories.admin.ui.readableMessage

class BookingsViewModel(private val repository: AdminRepository) : ViewModel() {
    private val _listState = MutableStateFlow<LoadState<List<Booking>>>(LoadState.Loading)
    val listState: StateFlow<LoadState<List<Booking>>> = _listState

    private val _detailState = MutableStateFlow<LoadState<Pair<Booking?, List<BookingNote>>>>(LoadState.Loading)
    val detailState: StateFlow<LoadState<Pair<Booking?, List<BookingNote>>>> = _detailState

    fun loadBookings(search: String = "") {
        viewModelScope.launch {
            _listState.value = LoadState.Loading
            _listState.value = runCatching { repository.listBookings(search) }
                .fold(
                    onSuccess = { LoadState.Ready(it) },
                    onFailure = { LoadState.Error(it.readableMessage()) },
                )
        }
    }

    fun loadBooking(id: String) {
        viewModelScope.launch {
            _detailState.value = LoadState.Loading
            _detailState.value = runCatching { repository.bookingDetail(id) }
                .fold(
                    onSuccess = { LoadState.Ready(it) },
                    onFailure = { LoadState.Error(it.readableMessage()) },
                )
        }
    }

    fun updateStatus(id: String, status: String) {
        viewModelScope.launch {
            runCatching { repository.updateBookingStatus(id, status) }
            loadBooking(id)
        }
    }

    fun updateDiscount(id: String, discountType: String?, discountValue: Double?, discountNote: String?) {
        viewModelScope.launch {
            runCatching { repository.updateBookingDiscount(id, discountType, discountValue, discountNote) }
            loadBooking(id)
        }
    }

    fun addNote(id: String, note: String, createdBy: String) {
        viewModelScope.launch {
            runCatching { repository.addBookingNote(id, note, createdBy) }
            loadBooking(id)
        }
    }
}
