package nl.cuddlingmemories.admin.calendar

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import nl.cuddlingmemories.admin.data.CalendarBooking
import nl.cuddlingmemories.admin.ui.ErrorCard
import nl.cuddlingmemories.admin.ui.LoadState
import nl.cuddlingmemories.admin.ui.LoadingBox
import nl.cuddlingmemories.admin.ui.PageTitle
import nl.cuddlingmemories.admin.ui.ScreenScaffold
import nl.cuddlingmemories.admin.ui.SoftCard
import nl.cuddlingmemories.admin.ui.theme.Card
import nl.cuddlingmemories.admin.ui.theme.Clay
import nl.cuddlingmemories.admin.ui.theme.Cocoa
import nl.cuddlingmemories.admin.ui.theme.Coffee
import nl.cuddlingmemories.admin.ui.theme.Linen
import java.time.LocalDate
import java.time.format.TextStyle
import java.util.Locale

private val weekdayLabels = listOf("ma", "di", "wo", "do", "vr", "za", "zo")

@Composable
fun CalendarScreen(viewModel: CalendarViewModel, onOpenBooking: (String) -> Unit) {
    val year by viewModel.year.collectAsState()
    val month by viewModel.month.collectAsState()
    val selectedDate by viewModel.selectedDate.collectAsState()
    val state by viewModel.state.collectAsState()

    LaunchedEffect(Unit) { viewModel.load() }

    ScreenScaffold {
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item { PageTitle("Kalender", "Boekingen en geblokkeerde dagen per maand.") }
            item {
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    IconButton(onClick = viewModel::previousMonth) {
                        Icon(Icons.Filled.ChevronLeft, contentDescription = "Vorige maand", tint = Cocoa)
                    }
                    val monthName = LocalDate.of(year, month, 1).month.getDisplayName(TextStyle.FULL, Locale("nl"))
                    Text("$monthName $year", color = Coffee, fontWeight = FontWeight.Bold)
                    IconButton(onClick = viewModel::nextMonth) {
                        Icon(Icons.Filled.ChevronRight, contentDescription = "Volgende maand", tint = Cocoa)
                    }
                }
            }
            when (val current = state) {
                LoadState.Loading -> item { LoadingBox() }
                is LoadState.Error -> item { ErrorCard(current.message) { viewModel.load() } }
                is LoadState.Ready -> {
                    item {
                        MonthGrid(
                            year = year,
                            month = month,
                            bookings = current.data.bookings,
                            blockedDates = current.data.blockedPeriods.flatMap { period ->
                                runCatching {
                                    val start = LocalDate.parse(period.startDatetime.substring(0, 10))
                                    val end = LocalDate.parse(period.endDatetime.substring(0, 10))
                                    generateSequence(start) { it.plusDays(1) }.takeWhile { !it.isAfter(end) }.toList()
                                }.getOrDefault(emptyList())
                            }.toSet(),
                            selectedDate = selectedDate,
                            onSelectDate = viewModel::selectDate,
                        )
                    }
                    val dayBookings = current.data.bookings.filter { it.bookingDate == selectedDate?.toString() }
                    if (selectedDate != null) {
                        item {
                            Text(
                                "Boekingen op ${selectedDate.toString()}",
                                color = Coffee,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                        if (dayBookings.isEmpty()) {
                            item { SoftCard { Text("Geen boekingen op deze dag.") } }
                        } else {
                            items(dayBookings, key = { it.id }) { booking ->
                                DayBookingCard(booking, onClick = { onOpenBooking(booking.id) })
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MonthGrid(
    year: Int,
    month: Int,
    bookings: List<CalendarBooking>,
    blockedDates: Set<LocalDate>,
    selectedDate: LocalDate?,
    onSelectDate: (LocalDate) -> Unit,
) {
    val firstOfMonth = LocalDate.of(year, month, 1)
    val daysInMonth = firstOfMonth.lengthOfMonth()
    val leadingBlanks = firstOfMonth.dayOfWeek.value - 1
    val bookingCountByDay = bookings.groupingBy { it.bookingDate }.eachCount()

    Column {
        Row(Modifier.fillMaxWidth()) {
            weekdayLabels.forEach { label ->
                Box(Modifier.weight(1f), contentAlignment = Alignment.Center) {
                    Text(label, color = Coffee.copy(alpha = 0.55f), fontWeight = FontWeight.Bold)
                }
            }
        }
        Spacer(Modifier.height(6.dp))
        val totalCells = leadingBlanks + daysInMonth
        val rows = (totalCells + 6) / 7
        for (row in 0 until rows) {
            Row(Modifier.fillMaxWidth()) {
                for (col in 0 until 7) {
                    val cellIndex = row * 7 + col
                    val dayNumber = cellIndex - leadingBlanks + 1
                    Box(Modifier.weight(1f).aspectRatio(1f).padding(2.dp)) {
                        if (dayNumber in 1..daysInMonth) {
                            val date = LocalDate.of(year, month, dayNumber)
                            val isBlocked = date in blockedDates
                            val bookingCount = bookingCountByDay[date.toString()] ?: 0
                            val isSelected = date == selectedDate
                            DayCell(dayNumber, bookingCount, isBlocked, isSelected) { onSelectDate(date) }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DayCell(day: Int, bookingCount: Int, isBlocked: Boolean, isSelected: Boolean, onClick: () -> Unit) {
    val background = when {
        isSelected -> Cocoa
        isBlocked -> Linen
        else -> Card
    }
    val textColor = if (isSelected) Card else Coffee
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(1f)
            .background(background, RoundedCornerShape(10.dp))
            .clickable(onClick = onClick)
            .padding(4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(day.toString(), color = textColor, fontWeight = FontWeight.Bold)
        if (bookingCount > 0) {
            Box(
                Modifier
                    .padding(top = 2.dp)
                    .background(if (isSelected) Card else Clay, CircleShape)
                    .padding(horizontal = 5.dp, vertical = 1.dp),
            ) {
                Text(bookingCount.toString(), color = if (isSelected) Coffee else Card, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun DayBookingCard(booking: CalendarBooking, onClick: () -> Unit) {
    SoftCard(modifier = Modifier.clickable(onClick = onClick)) {
        Text(booking.customerName, color = Coffee, fontWeight = FontWeight.Bold)
        Text("${booking.shootType} · ${booking.startTime ?: "-"} · ${booking.status}", color = Coffee.copy(alpha = 0.7f))
    }
}
