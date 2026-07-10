package nl.cuddlingmemories.admin.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val Cream = Color(0xFFF7F1EA)
val Card = Color(0xFFFFF9F3)
val Linen = Color(0xFFEFE2D4)
val Cocoa = Color(0xFF8A6B55)
val Coffee = Color(0xFF4E3B2F)
val Clay = Color(0xFFB79D86)

private val LightColors = lightColorScheme(
    primary = Cocoa,
    onPrimary = Card,
    background = Cream,
    onBackground = Coffee,
    surface = Card,
    onSurface = Coffee,
    secondary = Clay,
    tertiary = Linen,
)

@Composable
fun CuddlingAdminTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColors,
        typography = MaterialTheme.typography,
        content = content,
    )
}
