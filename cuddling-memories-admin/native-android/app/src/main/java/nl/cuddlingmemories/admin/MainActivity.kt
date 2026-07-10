package nl.cuddlingmemories.admin

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import nl.cuddlingmemories.admin.ui.CuddlingAdminApp
import nl.cuddlingmemories.admin.ui.theme.CuddlingAdminTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            CuddlingAdminTheme {
                CuddlingAdminApp()
            }
        }
    }
}
