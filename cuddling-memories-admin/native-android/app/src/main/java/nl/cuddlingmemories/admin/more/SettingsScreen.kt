package nl.cuddlingmemories.admin.more

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import nl.cuddlingmemories.admin.BuildConfig
import nl.cuddlingmemories.admin.data.AdminProfile
import nl.cuddlingmemories.admin.ui.PageTitle
import nl.cuddlingmemories.admin.ui.PrimaryButton
import nl.cuddlingmemories.admin.ui.ScreenScaffold
import nl.cuddlingmemories.admin.ui.SecondaryButton
import nl.cuddlingmemories.admin.ui.SoftCard

@Composable
fun SettingsScreen(admin: AdminProfile?, viewModel: SettingsViewModel, onSignOut: () -> Unit, onBack: () -> Unit = {}) {
    val testPushState by viewModel.testPushState.collectAsState()

    ScreenScaffold {
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item {
                PageTitle("Instellingen", "Profiel, versie en pushmeldingen.")
                TextButton(onClick = onBack) { Text("Terug") }
            }
            item {
                SoftCard {
                    Text("Profiel", fontWeight = FontWeight.Bold)
                    Text(admin?.name?.takeIf { it.isNotBlank() } ?: "Naam niet ingesteld")
                    Text(admin?.email ?: "-")
                }
            }
            item {
                SoftCard {
                    Text("Pushmeldingen testen", fontWeight = FontWeight.Bold)
                    PrimaryButton("Stuur testmelding", onClick = viewModel::sendTestPush)
                    if (testPushState != null) {
                        Text(testPushState.orEmpty())
                    }
                }
            }
            item {
                SoftCard {
                    Text("App", fontWeight = FontWeight.Bold)
                    Text("Versie ${BuildConfig.VERSION_NAME}")
                }
            }
            item { SecondaryButton("Uitloggen", onClick = onSignOut) }
        }
    }
}
