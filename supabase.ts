import { createClient } from '@supabase/supabase-js';

// UIO CIRCULAR uses the public Supabase project URL and publishable key in the browser.
// The publishable key is intentionally safe for frontend use when RLS is enabled.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://toqsynvfexzbiznlnsqm.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_H9rq-vHEfrYA71RPK0zerw_mnlJaBnQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
