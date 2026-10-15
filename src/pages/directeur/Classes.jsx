import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import BottomNavDirecteur from '../../components/BottomNavDirecteur'

export default function Classes() {
  const { profile } = useAuth()
  const [classes, setClasses] = useState([])
  const [moniteurs, setMoniteurs] = useState([])
  const [affectations, setAffectations] = useState([]) // [{classe_id, moniteur_id}]
  const [comptesEnfants, setComptesEnfants] = useState({}) // { classe_id: nombre }
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nom: '', description: '' })
  const [classeOuverte, setClasseOuverte] = useState(null) // id de la classe dont on gère les moniteurs

  async function charger() {
    const ecoleId = profile.ecole_dimanche_id
    const [{ data: classesData }, { data: moniteursData }, { data: affectationsData }, { data: enfantsData }] = await Promise.all([
      supabase.from('classes').select('*').eq('ecole_dimanche_id', ecoleId).order('created_at', { ascending: false }),
      supabase.from('utilisateurs').select('id, nom, prenoms').eq('ecole_dimanche_id', ecoleId).eq('role', 'moniteur'),
      supabase.from('classe_moniteurs').select('classe_id, moniteur_id'),
      supabase.from('enfants').select('classe_id').eq('ecole_dimanche_id', ecoleId),
    ])

    setClasses(classesData || [])
    setMoniteurs(moniteursData || [])
    setAffectations(affectationsData || [])

    const comptes = {}
    for (const e of enfantsData || []) {
      comptes[e.classe_id] = (comptes[e.classe_id] || 0) + 1
    }
    setComptesEnfants(comptes)
  }

  useEffect(() => {
    if (profile) charger()
  }, [profile])

  async function creerClasse(e) {
    e.preventDefault()
    const { error } = await supabase.from('classes').insert({
      ecole_dimanche_id: profile.ecole_dimanche_id,
      nom: form.nom,
      description: form.description || null,
    })
    if (!error) {
      setForm({ nom: '', description: '' })
      setShowForm(false)
      charger()
    }
  }

  function moniteursDeClasse(classeId) {
    const ids = affectations.filter((a) => a.classe_id === classeId).map((a) => a.moniteur_id)
    return moniteurs.filter((m) => ids.includes(m.id))
  }

  function estAffecte(classeId, moniteurId) {
    return affectations.some((a) => a.classe_id === classeId && a.moniteur_id === moniteurId)
  }

  async function toggleMoniteur(classeId, moniteurId) {
    if (estAffecte(classeId, moniteurId)) {
      await supabase.from('classe_moniteurs').delete().eq('classe_id', classeId).eq('moniteur_id', moniteurId)
    } else {
      await supabase.from('classe_moniteurs').insert({ classe_id: classeId, moniteur_id: moniteurId })
    }
    charger()
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20 }}>Classes</h1>

      {classes.map((c) => (
        <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{c.nom}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{comptesEnfants[c.id] || 0} enfant(s)</div>
            </div>
            <div style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: c.statut === 'actif' ? 'var(--accent-soft)' : '#E8EDF5', color: c.statut === 'actif' ? 'var(--accent)' : '#8A93A6' }}>
              {c.statut === 'actif' ? 'Active' : 'Inactive'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {moniteursDeClasse(c.id).map((m) => (
              <span key={m.id} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, background: 'var(--clay-soft)', color: 'var(--clay)' }}>
                {m.prenoms} {m.nom}
              </span>
            ))}
            {moniteursDeClasse(c.id).length === 0 && <span style={{ fontSize: 12, color: 'var(--muted)' }}>Aucun moniteur affecté</span>}
          </div>

          <button className="btn-outline" onClick={() => setClasseOuverte(classeOuverte === c.id ? null : c.id)}>
            {classeOuverte === c.id ? 'Fermer' : 'Affecter des moniteurs'}
          </button>

          {classeOuverte === c.id && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
              {moniteurs.length === 0 && <div style={{ fontSize: 12, color: 'var(--muted)' }}>Aucun moniteur enregistré encore.</div>}
              {moniteurs.map((m) => (
                <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    style={{ width: 18, height: 18 }}
                    checked={estAffecte(c.id, m.id)}
                    onChange={() => toggleMoniteur(c.id, m.id)}
                  />
                  {m.prenoms} {m.nom}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}

      {!showForm && <button className="btn-primary" onClick={() => setShowForm(true)}>+ Créer une classe</button>}

      {showForm && (
        <form onSubmit={creerClasse} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label>Nom de la classe</label><input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ex : 8–10 ans" /></div>
          <div><label>Description (optionnel)</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <button className="btn-primary" type="submit">Créer</button>
          <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
        </form>
      )}

      <BottomNavDirecteur />
    </div>
  )
}
