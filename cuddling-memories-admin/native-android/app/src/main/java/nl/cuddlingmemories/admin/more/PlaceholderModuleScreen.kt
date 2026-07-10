package nl.cuddlingmemories.admin.more

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import nl.cuddlingmemories.admin.ui.PageTitle
import nl.cuddlingmemories.admin.ui.ScreenScaffold
import nl.cuddlingmemories.admin.ui.SoftCard

// Generiek placeholder-scherm voor de modules die nog niet ingevuld zijn.
// `tableHint` verwijst naar de exacte Supabase-tabel(len)/RPC's die deze
// module straks moet aanspreken — zelfde patroon volgen als Boekingen
// (AdminRepository-functies + een Screen/ViewModel-paar) om 'm in te vullen.
data class ModuleInfo(val key: String, val title: String, val description: String, val tableHint: String)

val moreModules = listOf(
    ModuleInfo("beschikbaarheid", "Beschikbaarheid", "Vrije dagen, gesloten dagen en regels beheren.", "availability_rules, shoot_type_settings, booking_settings"),
    ModuleInfo("maandplanning", "Maandplanning", "Beschikbaar, redelijk vol of vol instellen.", "monthly_availability_settings, calculate_month_status()"),
    ModuleInfo("tijdslots", "Tijdslots", "Handmatige slots toevoegen of sluiten.", "manual_slots"),
    ModuleInfo("pakketten", "Pakketten", "Prijzen, inhoud en publicatie beheren.", "packages"),
    ModuleInfo("portfolio", "Portfolio", "Albums en meerdere foto's uploaden.", "portfolio_albums, portfolio_photos, storage-bucket portfolio"),
    ModuleInfo("galerijen", "Galerijen", "Klantgalerijen, favorieten en downloads beheren.", "client_galleries, gallery_photos"),
    ModuleInfo("reviews", "Reviews", "Reviews tonen, sorteren en publiceren.", "testimonials"),
    ModuleInfo("faq", "FAQ", "Veelgestelde vragen aanpassen.", "faq"),
    ModuleInfo("model-gezocht", "Model gezocht", "Model-oproepen beheren.", "pages (slug 'model-gezocht'), page_sections"),
    ModuleInfo("cadeaubonnen", "Cadeaubonnen", "Aanvragen en inwisseling beheren.", "giftcards"),
    ModuleInfo("mini-shoots", "Mini-shoots", "Dagen, slots en boekingen beheren.", "mini_sessions, mini_session_slots, mini_session_bookings"),
    ModuleInfo("wachtlijst", "Wachtlijst", "Aanmeldingen volgen en omzetten.", "waitlist_entries"),
)

@Composable
fun PlaceholderModuleScreen(module: ModuleInfo, onBack: () -> Unit) {
    ScreenScaffold {
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item {
                PageTitle(module.title, module.description)
                TextButton(onClick = onBack) { Text("Terug") }
            }
            item {
                SoftCard {
                    Text("Binnenkort beschikbaar")
                }
            }
            item {
                SoftCard {
                    Text("Voor ontwikkelaars")
                    Text("Tabel(len): ${module.tableHint}")
                    Text("Volg hetzelfde patroon als Boekingen: een AdminRepository-functie, een ViewModel met LoadState, en een Compose-scherm.")
                }
            }
        }
    }
}
