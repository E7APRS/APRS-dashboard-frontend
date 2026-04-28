import {createBrowserClient} from '@supabase/ssr';

// NEXT_PUBLIC_* vars are inlined at build time by Next.js.
// If they're missing, the build was misconfigured — warn but don't crash the client.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
        '[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set at build time. Auth will not work.',
    );
}

export function createClient() {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
