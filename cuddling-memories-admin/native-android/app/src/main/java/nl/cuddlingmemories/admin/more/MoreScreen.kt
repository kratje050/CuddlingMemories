package nl.cuddlingmemories.admin.more

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import nl.cuddlingmemories.admin.ui.PageTitle
import nl.cuddlingmemories.admin.ui.ScreenScaffold
import nl.cuddlingmemories.admin.ui.SoftCard
import nl.cuddlingmemories.admin.ui.theme.Cocoa
import nl.cuddlingmemories.admin.ui.theme.Coffee

@Composable
fun MoreScreen(onOpenModule: (String) -> Unit, onOpenSettings: () -> Unit) {
    ScreenScaffold {
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item { PageTitle("Meer", "Modules voor het complete boekingsysteem.") }
            item {
                ModuleRow(
                    title = "Instellingen",
                    description = "Profiel, push test en appversie.",
                    icon = Icons.Filled.Settings,
                    onClick = onOpenSettings,
                )
            }
            items(moreModules, key = { it.key }) { module ->
                ModuleRow(
                    title = module.title,
                    description = module.description,
                    icon = Icons.Filled.ChevronRight,
                    onClick = { onOpenModule(module.key) },
                )
            }
        }
    }
}

@Composable
private fun ModuleRow(title: String, description: String, icon: androidx.compose.ui.graphics.vector.ImageVector, onClick: () -> Unit) {
    SoftCard(modifier = Modifier.clickable(onClick = onClick)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column {
                Text(title, fontWeight = FontWeight.Bold, color = Coffee)
                Text(description, color = Coffee.copy(alpha = 0.65f))
            }
            Icon(icon, contentDescription = null, tint = Cocoa)
        }
    }
}
