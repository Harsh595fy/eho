// Single shared Supabase client for the whole EHO site.
// Every page (public site, /verify, /admin) must import from here instead of
// calling createClient() itself — multiple clients cause the
// "Multiple GoTrueClient instances detected" warning and unpredictable logins.
import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

function detectConfigProblem() {
  if (!rawUrl && !rawKey) return 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set.';
  if (!rawUrl) return 'VITE_SUPABASE_URL is not set.';
  if (!rawKey) return 'VITE_SUPABASE_ANON_KEY is not set.';
  if (/YOUR_|your-project|xxxx/i.test(rawUrl + rawKey)) return 'The .env.local file still contains the placeholder values from .env.example.';
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(u.hostname)) return 'VITE_SUPABASE_URL must start with https://';
  } catch {
    return 'VITE_SUPABASE_URL is not a valid URL (expected https://YOUR_PROJECT_ID.supabase.co).';
  }
  return null;
}

export const supabaseConfigError = detectConfigProblem();

/** Public host of the connected project (not a secret) — shown in diagnostics so you can confirm the right project is connected. */
export const supabaseProjectHost = (() => { try { return new URL(rawUrl).host; } catch { return ''; } })();

function createSharedClient() {
  if (supabaseConfigError) return null;
  // Re-use the instance across Vite hot reloads so editing a component does not create a second auth client.
  const g = globalThis;
  if (g.__ehoSupabaseClient) return g.__ehoSupabaseClient;
  try {
    const client = createClient(rawUrl, rawKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    g.__ehoSupabaseClient = client;
    return client;
  } catch (err) {
    console.error('[EHO] Supabase client could not be created:', err);
    return null;
  }
}

export const supabase = createSharedClient();
