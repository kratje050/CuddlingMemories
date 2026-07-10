package nl.cuddlingmemories.admin.calendar

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import nl.cuddlingmemories.admin.data.AdminRepository
import nl.cuddlingmemories.admin.data.BlockedPeriod
import nl.cuddlingmemories.admin.data.CalendarBooking
import nl.cuddlingmemories.admin.ui.LoadState
import nl.cuddlingmemories.admin.ui.readableMessage
import java.time.LocalDate

data class CalendarMonthData(
    val bookings: List<CalendarBooking>,
    val blockedPeriods: List<BlockedPeriod>,
)

class CalendarViewModel(private val repository: AdminRepository) : ViewModel() {
    private val today = LocalDate.now()

    private val _year = MutableStateFlow(today.year)
    val year: StateFlow<Int> = _year

    private val _month = MutableStateFlow(today.monthValue)
    val month: StateFlow<Int> = _month

    private val _selectedDate = MutableStateFlow<LocalDate?>(null)
    val selectedDate: StateFlow<LocalDate?> = _selectedDate

    private val _state = MutableStateFlow<LoadState<CalendarMonthData>>(LoadState.Loading)
    val state: StateFlow<LoadState<CalendarMonthData>> = _state

    fun load() {
        val loadYear = _year.value
        val loadMonth = _month.value
        viewModelScope.launch {
            _state.value = LoadState.Loading
            _state.value = runCatching {
                val bookings = repository.calendarBookingsForMonth(loadYear, loadMonth)
                val blocked = repository.blockedPeriodsForMonth(loadYear, loadMonth)
                CalendarMonthData(bookings, blocked)
            }.fold(
                onSuccess = { LoadState.Ready(it) },
                onFailure = { LoadState.Error(it.readableMessage()) },
            )
        }
    }

    fun nextMonth() {
        val newMonth = if (_month.value == 12) 1 else _month.value + 1
        if (_month.value == 12) _year.value += 1
        _month.value = newMonth
        _selectedDate.value = null
        load()
    }

    fun previousMonth() {
        val newMonth = if (_month.value == 1) 12 else _month.value - 1
        if (_month.value == 1) _year.value -= 1
        _month.value = newMonth
        _selectedDate.value = null
        load()
    }

    fun selectDate(date: LocalDate) {
        _selectedDate.value = if (_selectedDate.value == date) null else date
    }
}
