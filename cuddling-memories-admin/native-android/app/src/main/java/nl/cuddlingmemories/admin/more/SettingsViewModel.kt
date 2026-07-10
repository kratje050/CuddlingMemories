package nl.cuddlingmemories.admin.more

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import nl.cuddlingmemories.admin.data.AdminRepository
import nl.cuddlingmemories.admin.ui.readableMessage

class SettingsViewModel(private val repository: AdminRepository) : ViewModel() {
    private val _testPushState = MutableStateFlow<String?>(null)
    val testPushState: StateFlow<String?> = _testPushState

    fun sendTestPush() {
        viewModelScope.launch {
            _testPushState.value = "Versturen..."
            _testPushState.value = runCatching { repository.sendTestPush() }
                .fold(
                    onSuccess = { "Testmelding verstuurd. Kijk in de Meldingen-tab of op je telefoon." },
                    onFailure = { "Niet gelukt: ${it.readableMessage()}" },
                )
        }
    }
}
