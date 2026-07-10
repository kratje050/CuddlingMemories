package nl.cuddlingmemories.admin.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import nl.cuddlingmemories.admin.data.AdminRepository
import nl.cuddlingmemories.admin.data.DashboardStats
import nl.cuddlingmemories.admin.ui.LoadState
import nl.cuddlingmemories.admin.ui.readableMessage

class DashboardViewModel(private val repository: AdminRepository) : ViewModel() {
    private val _state = MutableStateFlow<LoadState<DashboardStats>>(LoadState.Loading)
    val state: StateFlow<LoadState<DashboardStats>> = _state

    fun load() {
        viewModelScope.launch {
            _state.value = LoadState.Loading
            _state.value = runCatching { repository.dashboardStats() }
                .fold(
                    onSuccess = { LoadState.Ready(it) },
                    onFailure = { LoadState.Error(it.readableMessage()) },
                )
        }
    }
}
