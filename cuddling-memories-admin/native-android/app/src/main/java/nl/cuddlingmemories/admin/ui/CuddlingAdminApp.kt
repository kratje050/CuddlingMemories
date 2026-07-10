package nl.cuddlingmemories.admin.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Dashboard
import androidx.compose.material.icons.outlined.EventNote
import androidx.compose.material.icons.outlined.MoreHoriz
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.FirebaseApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import nl.cuddlingmemories.admin.auth.AuthViewModel
import nl.cuddlingmemories.admin.auth.LoginScreen
import nl.cuddlingmemories.admin.bookings.BookingDetailScreen
import nl.cuddlingmemories.admin.bookings.BookingsScreen
import nl.cuddlingmemories.admin.bookings.BookingsViewModel
import nl.cuddlingmemories.admin.calendar.CalendarScreen
import nl.cuddlingmemories.admin.calendar.CalendarViewModel
import nl.cuddlingmemories.admin.dashboard.DashboardScreen
import nl.cuddlingmemories.admin.dashboard.DashboardViewModel
import nl.cuddlingmemories.admin.data.AdminProfile
import nl.cuddlingmemories.admin.data.AppContainer
import nl.cuddlingmemories.admin.more.MoreScreen
import nl.cuddlingmemories.admin.more.PlaceholderModuleScreen
import nl.cuddlingmemories.admin.more.SettingsScreen
import nl.cuddlingmemories.admin.more.SettingsViewModel
import nl.cuddlingmemories.admin.more.moreModules
import nl.cuddlingmemories.admin.notifications.NotificationsScreen
import nl.cuddlingmemories.admin.notifications.NotificationsViewModel

private sealed class Tab(val route: String, val label: String, val icon: androidx.compose.ui.graphics.vector.ImageVector) {
    data object Dashboard : Tab("dashboard", "Dashboard", Icons.Outlined.Dashboard)
    data object Calendar : Tab("calendar", "Kalender", Icons.Outlined.CalendarMonth)
    data object Bookings : Tab("bookings", "Boekingen", Icons.Outlined.EventNote)
    data object Notifications : Tab("notifications", "Meldingen", Icons.Outlined.Notifications)
    data object More : Tab("more", "Meer", Icons.Outlined.MoreHoriz)
}

@Composable
fun CuddlingAdminApp() {
    val container = remember { AppContainer() }
    val authViewModel = remember { AuthViewModel(container.adminRepository) }
    val authState by authViewModel.state.collectAsState()
    val context = LocalContext.current

    when {
        authState.loading -> LoadingBox()
        authState.admin == null -> LoginScreen(authViewModel)
        else -> AdminTabs(
            container = container,
            admin = authState.admin,
            onSignOut = authViewModel::signOut,
        )
    }

    LaunchedEffect(authState.admin) {
        if (authState.admin != null) {
            runCatching {
                FirebaseApp.initializeApp(context)
                FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
                    // De server-side pushfunctie gebruikt deze token om meldingen te sturen.
                    CoroutineScope(Dispatchers.IO).launch {
                        runCatching { container.adminRepository.registerPushToken(token) }
                    }
                }
            }
        }
    }
}

@Composable
private fun AdminTabs(container: AppContainer, admin: AdminProfile?, onSignOut: () -> Unit) {
    val adminEmail = admin?.email ?: "admin"
    val navController = rememberNavController()
    val dashboardViewModel = remember { DashboardViewModel(container.adminRepository) }
    val bookingsViewModel = remember { BookingsViewModel(container.adminRepository) }
    val calendarViewModel = remember { CalendarViewModel(container.adminRepository) }
    val notificationsViewModel = remember { NotificationsViewModel(container.adminRepository) }
    val settingsViewModel = remember { SettingsViewModel(container.adminRepository) }
    val tabs = listOf(Tab.Dashboard, Tab.Calendar, Tab.Bookings, Tab.Notifications, Tab.More)
    val backStack by navController.currentBackStackEntryAsState()
    val currentDestination = backStack?.destination
    val isDetail = currentDestination?.route?.let { it.startsWith("booking/") || it.startsWith("more/") } == true

    Scaffold(
        bottomBar = {
            if (!isDetail) {
                NavigationBar {
                    tabs.forEach { tab ->
                        NavigationBarItem(
                            selected = currentDestination?.hierarchy?.any { it.route == tab.route } == true,
                            onClick = {
                                navController.navigate(tab.route) {
                                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(tab.icon, contentDescription = tab.label) },
                            label = { Text(tab.label) },
                        )
                    }
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Tab.Dashboard.route,
            modifier = Modifier.padding(padding),
        ) {
            composable(Tab.Dashboard.route) {
                DashboardScreen(dashboardViewModel) { id -> navController.navigate("booking/$id") }
            }
            composable(Tab.Calendar.route) {
                CalendarScreen(calendarViewModel) { id -> navController.navigate("booking/$id") }
            }
            composable(Tab.Bookings.route) {
                BookingsScreen(bookingsViewModel) { id -> navController.navigate("booking/$id") }
            }
            composable(Tab.Notifications.route) {
                NotificationsScreen(notificationsViewModel) { id -> navController.navigate("booking/$id") }
            }
            composable(Tab.More.route) {
                MoreScreen(
                    onOpenModule = { key -> navController.navigate("more/module/$key") },
                    onOpenSettings = { navController.navigate("more/settings") },
                )
            }
            composable("more/settings") {
                SettingsScreen(
                    admin = admin,
                    viewModel = settingsViewModel,
                    onSignOut = onSignOut,
                    onBack = { navController.popBackStack() },
                )
            }
            composable("more/module/{key}") { entry ->
                val key = entry.arguments?.getString("key").orEmpty()
                val module = moreModules.firstOrNull { it.key == key }
                if (module != null) {
                    PlaceholderModuleScreen(module = module, onBack = { navController.popBackStack() })
                }
            }
            composable("booking/{id}") { entry ->
                BookingDetailScreen(
                    id = entry.arguments?.getString("id").orEmpty(),
                    adminEmail = adminEmail,
                    viewModel = bookingsViewModel,
                    onBack = { navController.popBackStack() },
                )
            }
        }
    }
}
