package nl.cuddlingmemories.admin.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import nl.cuddlingmemories.admin.data.AdminProfile
import nl.cuddlingmemories.admin.data.AdminRepository
import nl.cuddlingmemories.admin.ui.readableMessage

data class AuthState(
    val loading: Boolean = true,
    val busy: Boolean = false,
    val admin: AdminProfile? = null,
    val error: String? = null,
)

class AuthViewModel(private val repository: AdminRepository) : ViewModel() {
    private val _state = MutableStateFlow(AuthState())
    val state: StateFlow<AuthState> = _state

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            _state.value = runCatching { repository.currentAdminOrNull() }
                .fold(
                    onSuccess = { AuthState(loading = false, admin = it) },
                    onFailure = { AuthState(loading = false, error = it.readableMessage()) },
                )
        }
    }

    fun signIn(email: String, password: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(busy = true, error = null)
            runCatching { repository.signIn(email.trim(), password) }
                .onSuccess { _state.value = AuthState(admin = it, loading = false) }
                .onFailure { _state.value = _state.value.copy(busy = false, error = it.readableMessage()) }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            repository.signOut()
            _state.value = AuthState(loading = false)
        }
    }
}
