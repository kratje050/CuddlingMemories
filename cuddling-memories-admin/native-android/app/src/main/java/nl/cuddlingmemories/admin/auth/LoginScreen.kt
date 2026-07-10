package nl.cuddlingmemories.admin.auth

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import nl.cuddlingmemories.admin.ui.PageTitle
import nl.cuddlingmemories.admin.ui.PrimaryButton
import nl.cuddlingmemories.admin.ui.ScreenScaffold
import nl.cuddlingmemories.admin.ui.SoftCard

@Composable
fun LoginScreen(viewModel: AuthViewModel) {
    val state by viewModel.state.collectAsState()
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    ScreenScaffold {
        Column {
            PageTitle("Admin", "Log in met je Cuddling Memories admin-account.")
            Spacer(Modifier.height(24.dp))
            SoftCard {
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("E-mailadres") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    singleLine = true,
                )
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Wachtwoord") },
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true,
                )
                if (state.error != null) {
                    Spacer(Modifier.height(10.dp))
                    Text(state.error ?: "")
                }
                Spacer(Modifier.height(16.dp))
                PrimaryButton(
                    text = if (state.busy) "Inloggen..." else "Inloggen",
                    enabled = !state.busy && email.isNotBlank() && password.isNotBlank(),
                    onClick = { viewModel.signIn(email, password) },
                )
            }
        }
    }
}
