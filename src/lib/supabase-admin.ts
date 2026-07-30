import { createClient } from "@supabase/supabase-js";

// Server-only admin client (service_role key bypasses RLS) - never import
// this from client components. Used for the avatar upload flow.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export const AVATAR_BUCKET = "avatars";
