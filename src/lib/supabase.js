import { createClient } from '@supabase/supabase-js'

// Valeurs publiques : la clé "anon" est conçue pour être visible dans le
// navigateur (la sécurité repose sur les règles RLS de la base).
// Si des variables Netlify existent, elles ont la priorité.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://zfobrjwbozevmhjdrnfe.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmb2Jyandib3pldm1oamRybmZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NTYyNjQsImV4cCI6MjEwNjAzMjI2NH0.bb6SBFIzbKJQvPhYtYtsO-S43ToIgGg41T99e1zXu9A'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
