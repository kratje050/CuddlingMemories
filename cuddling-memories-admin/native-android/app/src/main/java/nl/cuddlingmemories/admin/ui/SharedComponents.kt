package nl.cuddlingmemories.admin.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import nl.cuddlingmemories.admin.ui.theme.Card
import nl.cuddlingmemories.admin.ui.theme.Cocoa
import nl.cuddlingmemories.admin.ui.theme.Coffee
import nl.cuddlingmemories.admin.ui.theme.Cream
import nl.cuddlingmemories.admin.ui.theme.Linen

@Composable
fun ScreenScaffold(contentPadding: PaddingValues = PaddingValues(18.dp), content: @Composable () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Cream)
            .padding(contentPadding),
    ) {
        content()
    }
}

@Composable
fun PageTitle(title: String, subtitle: String? = null) {
    Column(Modifier.fillMaxWidth()) {
        Text("CUDDLING MEMORIES", color = Cocoa, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
        Text(title, color = Coffee, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        if (subtitle != null) {
            Spacer(Modifier.height(6.dp))
            Text(subtitle, color = Coffee.copy(alpha = 0.68f), style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
fun SoftCard(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Card),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column(Modifier.padding(16.dp), content = content)
    }
}

@Composable
fun PrimaryButton(text: String, modifier: Modifier = Modifier, enabled: Boolean = true, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        enabled = enabled,
        shape = RoundedCornerShape(999.dp),
        colors = ButtonDefaults.buttonColors(containerColor = Cocoa, contentColor = Card),
    ) {
        Text(text.uppercase(), fontWeight = FontWeight.Bold)
    }
}

@Composable
fun SecondaryButton(text: String, modifier: Modifier = Modifier, onClick: () -> Unit) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(999.dp),
    ) {
        Text(text.uppercase(), color = Coffee, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun LoadingBox() {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = Cocoa)
    }
}

@Composable
fun ErrorCard(message: String, onRetry: (() -> Unit)? = null) {
    SoftCard {
        Text("Niet gelukt", color = Coffee, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(6.dp))
        Text(message, color = Coffee.copy(alpha = 0.72f))
        if (onRetry != null) {
            Spacer(Modifier.height(12.dp))
            SecondaryButton("Opnieuw proberen", onClick = onRetry)
        }
    }
}

@Composable
fun StatTile(value: String, label: String, modifier: Modifier = Modifier) {
    SoftCard(modifier = modifier) {
        Text(value, color = Coffee, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text(label, color = Coffee.copy(alpha = 0.65f))
    }
}

@Composable
fun Badge(text: String) {
    Text(
        text = text,
        color = Coffee,
        fontWeight = FontWeight.Bold,
        style = MaterialTheme.typography.labelSmall,
        modifier = Modifier
            .background(Linen, RoundedCornerShape(999.dp))
            .padding(horizontal = 10.dp, vertical = 5.dp),
    )
}

@Composable
fun LabelValue(label: String, value: String?) {
    Column {
        Text(label.uppercase(), color = Cocoa, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
        Text(value?.takeIf { it.isNotBlank() } ?: "-", color = Coffee)
    }
}

@Composable
fun TwoColumn(content1: @Composable () -> Unit, content2: @Composable () -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Box(Modifier.weight(1f)) { content1() }
        Box(Modifier.weight(1f)) { content2() }
    }
}
