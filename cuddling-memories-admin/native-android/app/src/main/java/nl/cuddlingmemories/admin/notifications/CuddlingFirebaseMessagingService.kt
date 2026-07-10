package nl.cuddlingmemories.admin.notifications

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class CuddlingFirebaseMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d("CuddlingPush", "Nieuw FCM token ontvangen. Registreer opnieuw na login.")
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        Log.d("CuddlingPush", "Push ontvangen: ${message.notification?.title ?: message.data}")
        // TODO: Toon lokale notificatie wanneer de app actief is.
    }
}
