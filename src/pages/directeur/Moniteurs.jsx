import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import BottomNavDirecteur from '../../components/BottomNavDirecteur'

function traduireErreur(msg = '') {
  const m = msg.toLowerCase()
  if (m.includes('not authorized')) return "Supabase n'envoie des emails qu'aux membres de ton équipe tant qu'aucun service d'email n'est configuré. (" + msg + ')'
  if (m.includes('rate limit')) return "Trop d'emails envoyés en peu de temps. Réessaie dans une heure. (" + msg + ')'
  if (m.includes('already') && m.includes('registered')) return 'Cette adresse email a déjà un compte. (' + msg + ')'
  return msg
}

export default function Moniteurs() {
  const { profile } = useAuth()
  const [liste, setListe] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nom: '', prenoms: '', email: '', whatsapp: '', lieu_habitation: '', bapteme_eau: 'Oui', bapteme_saint_esprit: 'Oui' })
  const [envoi, setEnvoi] = useState(false)
  const [message, setMessage] = useState('')
  const [messageErreur, setMessageErreur] = useState(false)

  async function charger() {
    const { data } = await supabase
      .from('utilisateurs')
      .select('id, nom, prenoms, statut')
      .eq('ecole_dimanche_id', profile.ecole_dimanche_id)
      .eq('role', 'moniteur')
      .order('created_at', { ascending: false })
    setListe(data || [])
  }

  useEffect(() => {
    if (profile) charger()
  }, [profile])

  async function envoyerInvitation(e) {
    e.preventDefault()
    setEnvoi(true)
    setMessage('')
    setMessageErreur(false)

    const { error } = await supabase.functions.invoke('invite-moniteur', {
      body: {
        email: form.email,
        nom: form.nom,
        prenoms: form.prenoms,
        whatsapp: form.whatsapp,
        lieu_habitation: form.lieu_habitation,
        bapteme_eau: form.bapteme_eau === 'Oui',
        bapteme_saint_esprit: form.bapteme_saint_esprit === 'Oui',
      },
    })

    setEnvoi(false)
    if (error) {
      let detail = ''
      try {
        const corps = await error.context.json()
        detail = corps.error || ''
      } catch (_) {
        detail = error.message || ''
      }
      setMessageErreur(true)
      setMessage("Erreur lors de l'envoi de l'invitation : " + (traduireErreur(detail) || 'cause inconnue'))
      return
    }
    setMessage('Invitation envoyée !')
    setShowForm(false)
    setForm({ nom: '', prenoms: '', email: '', whatsapp: '', lieu_habitation: '', bapteme_eau: 'Oui', bapteme_saint_esprit: 'Oui' })
    charger()
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20 }}>Moniteurs</h1>

      {message && <div style={{ fontSize: 13, color: messageErreur ? 'var(--danger)' : 'var(--accent)' }}>{message}</div>}

      {liste.map((m) => (
        <div key={m.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{m.prenoms} {m.nom}</div>
          </div>
          <div style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: m.statut === 'actif' ? 'var(--accent-soft)' : '#E8EDF5', color: m.statut === 'actif' ? 'var(--accent)' : '#8A93A6' }}>
            {m.statut === 'actif' ? 'Actif' : 'Inactif'}
          </div>
        </div>
      ))}

      {!showForm && (
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Ajouter un moniteur</button>
      )}

      {showForm && (
        <form onSubmit={envoyerInvitation} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label>Nom</label><input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
          <div><label>Prénoms</label><input required value={form.prenoms} onChange={(e) => setForm({ ...form, prenoms: e.target.value })} /></div>
          <div><label>Email</label><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label>Numéro WhatsApp</label><input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+225..." /></div>
          <div><label>Lieu d'habitation</label><input value={form.lieu_habitation} onChange={(e) => setForm({ ...form, lieu_habitation: e.target.value })} /></div>
          <div>
            <label>Baptême d'eau</label>
            <select value={form.bapteme_eau} onChange={(e) => setForm({ ...form, bapteme_eau: e.target.value })}>
              <option>Oui</option><option>Non</option>
            </select>
          </div>
          <div>
            <label>Baptême du Saint-Esprit</label>
            <select value={form.bapteme_saint_esprit} onChange={(e) => setForm({ ...form, bapteme_saint_esprit: e.target.value })}>
              <option>Oui</option><option>Non</option>
            </select>
          </div>
          <button className="btn-primary" type="submit" disabled={envoi}>{envoi ? 'Envoi…' : "Envoyer l'invitation"}</button>
          <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
        </form>
      )}

      <BottomNavDirecteur />
    </div>
  )
}
