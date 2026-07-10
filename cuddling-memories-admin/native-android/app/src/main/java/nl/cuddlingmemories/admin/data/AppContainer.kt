package nl.cuddlingmemories.admin.data

import nl.cuddlingmemories.admin.BuildConfig

class AppContainer {
    val supabase = SupabaseProvider.create(
        url = BuildConfig.SUPABASE_URL,
        anonKey = BuildConfig.SUPABASE_ANON_KEY,
    )

    val adminRepository = AdminRepository(supabase)
}
