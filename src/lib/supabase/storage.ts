import "server-only";

import { createClient } from "@supabase/supabase-js";

type SupabaseEnvironment = "SUPABASE_URL" | "SUPABASE_PUBLISHABLE_KEY" | "SUPABASE_SECRET_KEY" | "SUPABASE_STORAGE_BUCKET";

export function requiredSupabaseEnvironment(name: SupabaseEnvironment) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`A variável ${name} não está configurada.`);
  return value;
}

export const storageBucket = () => requiredSupabaseEnvironment("SUPABASE_STORAGE_BUCKET");
export const storagePublishableKey = () => requiredSupabaseEnvironment("SUPABASE_PUBLISHABLE_KEY");
export const storageProjectUrl = () => requiredSupabaseEnvironment("SUPABASE_URL");

export function supabaseStorage() {
  return createClient(
    storageProjectUrl(),
    requiredSupabaseEnvironment("SUPABASE_SECRET_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  ).storage;
}
