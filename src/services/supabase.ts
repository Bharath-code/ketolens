/**
 * Supabase Client Configuration
 * Placeholder for Expo
 */

// TODO: Replace with your Supabase credentials
export const SUPABASE_URL = 'YOUR_SUPABASE_URL'
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = {
    auth: {
        signInWithPassword: async ({ email }: { email: string }) => {
            console.log('Mock login:', email)
            return { data: { user: { id: 'mock', email } }, error: null }
        },
        signOut: async () => ({ error: null }),
    },
    from: (table: string) => ({
        select: () => ({ data: [], error: null }),
        insert: (data: any) => ({ data, error: null }),
    }),
}
