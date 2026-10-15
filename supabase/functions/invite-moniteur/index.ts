// Supabase Edge Function : invite-moniteur
// Déploiement : supabase functions deploy invite-moniteur
// Utilise la clé "service_role" (jamais exposée au navigateur) pour
// envoyer une vraie invitation par email sans que le directeur ait à
// créer de mot de passe.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

Deno.serve(async (req) => {
  const {
    email, ecole_dimanche_id, role, nom, prenoms,
    whatsapp, lieu_habitation, bapteme_eau, bapteme_saint_esprit,
  } = await req.json()

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  )

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { ecole_dimanche_id, role, nom, prenoms, whatsapp, lieu_habitation, bapteme_eau, bapteme_saint_esprit },
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }

  return new Response(JSON.stringify({ user: data.user }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
