package nl.cuddlingmemories.admin.data

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.storage.Storage

object SupabaseProvider {
    fun create(url: String, anonKey: String): SupabaseClient {
        require(url.isNotBlank()) { "SUPABASE_URL ontbreekt in local.properties." }
        require(anonKey.isNotBlank()) { "SUPABASE_ANON_KEY ontbreekt in local.properties." }

        return createSupabaseClient(
            supabaseUrl = url,
            supabaseKey = anonKey,
        ) {
            install(Auth)
            install(Postgrest)
            install(Storage)
        }
    }
}
