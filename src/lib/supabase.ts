// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Utilisation avec Vite
const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
