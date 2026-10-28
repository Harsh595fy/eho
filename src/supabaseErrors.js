// Turns Supabase / network errors into clear, non-sensitive messages.
// In development (npm run dev) the raw technical detail is also returned so problems are easy to diagnose.

export function isNetworkError(err) {
  const msg = String(err?.message || err || '');
  return err?.name === 'TypeError' || /failed to fetch|networkerror|network request failed|load failed|fetch failed/i.test(msg);
}

export function describeSupabaseError(err, context = 'request') {
  if (!err) return { message: '', detail: '' };
  const code = err.code || '';
  const raw = [code, err.message, err.details, err.hint].filter(Boolean).join(' — ');
  let message;
  if (isNetworkError(err)) {
    message = 'Could not reach Supabase. Check your internet connection and that VITE_SUPABASE_URL is correct, then try again.';
  } else if (code === 'PGRST202' || /could not find the function/i.test(err.message || '')) {
    message = `The database function for this ${context} was not found. Run supabase/schema.sql (and supabase/fix_admin_access.sql) in the Supabase SQL Editor of the SAME project your .env.local points to.`;
  } else if (code === 'PGRST205' || code === '42P01' || /relation .* does not exist|could not find the table/i.test(err.message || '')) {
    message = 'A required database table is missing. Run supabase/schema.sql in the Supabase SQL Editor.';
  } else if (code === '42501' || /permission denied/i.test(err.message || '')) {
    message = 'The database refused this action (permission denied). Your session may have expired — sign out and sign in again. If it continues, run supabase/fix_admin_access.sql.';
  } else if (code === 'PGRST301' || code === 'PGRST303' || /jwt|token.*expired/i.test(err.message || '')) {
    message = 'Your login session has expired. Please sign out and sign in again.';
  } else if (/administrator authorization required/i.test(err.message || '')) {
    message = 'This account is not an EHO administrator.';
  } else {
    message = `The ${context} failed. ${err.message || 'Unknown error.'}`;
  }
  return { message, detail: import.meta.env.DEV ? raw : '' };
}

export function describeLoginError(err) {
  if (isNetworkError(err)) return 'Could not reach Supabase. Check your internet connection and the VITE_SUPABASE_URL value.';
  const msg = err?.message || '';
  if (/invalid login credentials/i.test(msg)) return 'Incorrect email or password. Make sure this user exists in Supabase → Authentication → Users of the project in your .env.local.';
  if (/email not confirmed/i.test(msg)) return 'This email address has not been confirmed. In Supabase → Authentication → Users, confirm the user (or create it with "Auto Confirm User").';
  if (/rate limit|too many/i.test(msg)) return 'Too many sign-in attempts. Wait a minute and try again.';
  if (/invalid api key|no api key/i.test(msg)) return 'The Supabase anon key in .env.local is wrong. Copy it again from Supabase → Project Settings → API and restart npm run dev.';
  return msg || 'Sign-in failed. Please try again.';
}
