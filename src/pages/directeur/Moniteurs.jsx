import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import BottomNavDirecteur from '../../components/BottomNavDirecteur'

const FORM_VIDE = {
  nom: '', prenoms: '', email: '', whatsapp: '', lieu_habitation: '',
  bapteme_eau: 'Oui', bapteme_saint_esprit: 'Oui',
}

function traduireErreur(msg = '') {
  const m = msg.toLowerCase()
  if (m.includes('not authorized')) return "Supabase n'envoie des emails qu'aux membres de ton équipe tant qu'aucun service d'email n'est configuré. (" + msg + ')'
  if (m.includes('rate limit')) return "Trop d'emails envoyés en peu de temps. Réessaie dans une heure. (" + msg + ')'
  if (m.includes('already') && m.includes('registered')) return 'Cette adresse email a déjà un compte. (' + msg + ')'
  return msg
}

async function lireErreur(error) {
  try {
    const corps = await error.context.json()
    return corps.error || ''
  } catch (_) {
    return error.message || ''
  }
}

export default function Moniteurs() {
  const { profile } = useAuth()
  const [liste, setListe] = useState([])
  const [mode, setMode] = useState(null) // null | 'ajout' | 'edition'
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(FORM_VIDE)
  const [envoi, setEnvoi] = useState(false)
  const [message, setMessage] = useState('')
  const [messageErreur, setMessageErreur] = useState(false)

  async function charger() {
    const { data } = await supabase
      .from('utilisateurs')
      .select('id, nom, prenoms, email, whatsapp, lieu_habitation, bapteme_eau, bapteme_saint_esprit, statut')
      .eq('ecole_dimanche_id', profile.ecole_dimanche_id)
      .eq('role', 'moniteur')
      .order('created_at', { ascending: false })
    setListe(data || [])
  }

  useEffect(() => {
    if (profile) charger()
  }, [profile])

  function afficher(texte, erreur = false) {
    setMessage(texte)
    setMessageErreur(erreur)
  }

  function champ(cle, valeur) {
    setForm({ ...form, [cle]: valeur })
  }

  function ouvrirAjout() {
    setForm(FORM_VIDE)
    setEditId(null)
    setMode('ajout')
    afficher('')
  }

  function ouvrirEdition(m) {
    setForm({
      nom: m.nom || '',
      prenoms: m.prenoms || '',
      email: m.email || '',
      whatsapp: m.whatsapp || '',
      lieu_habitation: m.lieu_habitation || '',
      bapteme_eau: m.bapteme_eau ? 'Oui' : 'Non',
      bapteme_saint_esprit: m.bapteme_saint_esprit ? 'Oui' : 'Non',
    })
    setEditId(m.id)
    setMode('edition')
    afficher('')
  }

  function fermer() {
    setMode(null)
    setEditId(null)
  }

  async function enregistrer(e) {
    e.preventDefault()
    setEnvoi(true)
    afficher('')
    if (mode === 'ajout') await inviter()
    else await modifier()
    setEnvoi(false)
  }

  async function inviter() {
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
    if (error) {
      const detail = await lireErreur(error)
      afficher("Erreur lors de l'envoi de l'invitation : " + (traduireErreur(detail) || 'cause inconnue'), true)
      return
    }
    afficher('Invitation envoyée !')
    fermer()
    charger()
  }

  async function modifier() {
    const { data, error } = await supabase
      .from('utilisateurs')
      .update({
        nom: form.nom,
        prenoms: form.prenoms,
        whatsapp: form.whatsapp || null,
        lieu_habitation: form.lieu_habitation || null,
        bapteme_eau: form.bapteme_eau === 'Oui',
        bapteme_saint_esprit: form.bapteme_saint_esprit === 'Oui',
      })
      .eq('id', editId)
      .select('id')
    if (error || !data || data.length === 0) {
      afficher("La modification n'a pas pu être enregistrée.", true)
      return
    }
    afficher('Informations enregistrées.')
    fermer()
    charger()
  }

  async function supprimer(m) {
    const ok = window.confirm(
      'Supprimer définitivement ' + m.prenoms + ' ' + m.nom + ' ?\n\n' +
      "Son accès sera retiré. Les enfants et les rapports qu'il a saisis sont conservés."
    )
    if (!ok) return
    afficher('')
    const { error } = await supabase.functions.invoke('delete-moniteur', { body: { moniteur_id: m.id } })
    if (error) {
      const detail = await lireErreur(error)
      afficher('Suppression impossible : ' + (detail || 'cause inconnue'), true)
      return
    }
    afficher(m.prenoms + ' ' + m.nom + ' a été supprimé.')
    if (editId === m.id) fermer()
    charger()
  }

  function renderForm() {
    const edition = mode === 'edition'
    return (
      <form onSubmit={enregistrer} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{edition ? 'Modifier le moniteur' : 'Ajouter un moniteur'}</div>
        <div><label>Nom</label><input required value={form.nom} onChange={(e) => champ('nom', e.target.value)} /></div>
        <div><label>Prénoms</label><input required value={form.prenoms} onChange={(e) => champ('prenoms', e.target.value)} /></div>
        <div>
          <label>Email</label>
          <input required type="email" value={form.email} disabled={edition} onChange={(e) => champ('email', e.target.value)} />
          {edition && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>L'email ne peut pas être modifié ici.</div>}
        </div>
        <div><label>Numéro WhatsApp</label><input value={form.whatsapp} onChange={(e) => champ('whatsapp', e.target.value)} placeholder="+225..." /></div>
        <div><label>Lieu d'habitation</label><input value={form.lieu_habitation} onChange={(e) => champ('lieu_habitation', e.target.value)} /></div>
        <div>
          <label>Baptême d'eau</label>
          <select value={form.bapteme_eau} onChange={(e) => champ('bapteme_eau', e.target.value)}>
            <option>Oui</option><option>Non</option>
          </select>
        </div>
        <div>
          <label>Baptême du Saint-Esprit</label>
          <select value={form.bapteme_saint_esprit} onChange={(e) => champ('bapteme_saint_esprit', e.target.value)}>
            <option>Oui</option><option>Non</option>
          </select>
        </div>
        <button className="btn-primary" type="submit" disabled={envoi}>
          {envoi ? 'Envoi…' : edition ? 'Enregistrer' : "Envoyer l'invitation"}
        </button>
        <button type="button" className="btn-outline" onClick={fermer}>Annuler</button>
      </form>
    )
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20 }}>Moniteurs</h1>

      {message && <div style={{ fontSize: 13, color: messageErreur ? 'var(--danger)' : 'var(--accent)' }}>{message}</div>}

      {liste.map((m) =>
        mode === 'edition' && editId === m.id ? (
          <div key={m.id}>{renderForm()}</div>
        ) : (
          <div key={m.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{m.prenoms} {m.nom}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {[m.lieu_habitation, m.whatsapp].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: m.statut === 'actif' ? 'var(--accent-soft)' : '#E8EDF5', color: m.statut === 'actif' ? 'var(--accent)' : '#8A93A6' }}>
                {m.statut === 'actif' ? 'Actif' : 'Inactif'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => ouvrirEdition(m)}>Modifier</button>
              <button className="btn-outline" style={{ flex: 1, borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => supprimer(m)}>Supprimer</button>
            </div>
          </div>
        )
      )}

      {liste.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>Aucun moniteur pour le moment.</div>}

      {mode !== 'ajout' && (
        <button className="btn-primary" onClick={ouvrirAjout}>+ Ajouter un moniteur</button>
      )}
      {mode === 'ajout' && renderForm()}

      <BottomNavDirecteur />
    </div>
  )
}
