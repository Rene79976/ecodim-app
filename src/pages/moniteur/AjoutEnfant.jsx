import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function AjoutEnfant() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [classes, setClasses] = useState(null) // null = chargement en cours
  const [classeId, setClasseId] = useState('')
  const [form, setForm] = useState({
    nom: '', prenoms: '', sexe: 'F', age: '',
    classe_scolaire: '', lieu_habitation: '',
    parent1_nom: '', parent1_tel: '', parent2_nom: '', parent2_tel: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profile) return
    async function charger() {
      const { data } = await supabase
        .from('classe_moniteurs')
        .select('created_at, classes(id, nom)')
        .eq('moniteur_id', profile.id)
        .order('created_at')
      const liste = (data || []).map((row) => row.classes).filter(Boolean)
      setClasses(liste)
      if (liste.length > 0) setClasseId(liste[0].id)
    }
    charger()
  }, [profile])

  async function enregistrer(e) {
    e.preventDefault()
    setError('')
    if (!classeId) { setError("Tu n'es affecté à aucune classe."); return }
    setLoading(true)
    const { error } = await supabase.from('enfants').insert({
      ecole_dimanche_id: profile.ecole_dimanche_id,
      classe_id: classeId,
      nom: form.nom,
      prenoms: form.prenoms,
      sexe: form.sexe,
      age: form.age ? parseInt(form.age, 10) : null,
      classe_scolaire: form.classe_scolaire || null,
      lieu_habitation: form.lieu_habitation || null,
      parent1_nom: form.parent1_nom || null,
      parent1_tel: form.parent1_tel || null,
      parent2_nom: form.parent2_nom || null,
      parent2_tel: form.parent2_tel || null,
      created_by: profile.id,
    })
    setLoading(false)
    if (error) { setError("Erreur lors de l'enregistrement."); return }
    navigate('/enfants')
  }

  const entete = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <a href="/enfants" style={{ fontSize: 20, color: 'var(--accent)' }}>←</a>
      <h1 style={{ fontSize: 18 }}>Ajouter un enfant</h1>
    </div>
  )

  if (classes === null) {
    return <div className="page"><div style={{ color: 'var(--muted)' }}>Chargement…</div></div>
  }

  if (classes.length === 0) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {entete}
        <div className="card" style={{ fontSize: 14, color: 'var(--muted)' }}>
          Tu n'es affecté à aucune classe pour le moment. Demande au directeur de t'affecter à une classe pour pouvoir ajouter des enfants.
        </div>
      </div>
    )
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {entete}

      <form onSubmit={enregistrer} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {classes.length === 1 ? (
          <div className="card" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-soft)', fontSize: 14 }}>
            L'enfant sera ajouté à ta classe : <strong>{classes[0].nom}</strong>
          </div>
        ) : (
          <div>
            <label>Classe</label>
            <select required value={classeId} onChange={(e) => setClasseId(e.target.value)}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>Informations personnelles</div>
          <div><label>Nom</label><input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
          <div><label>Prénoms</label><input required value={form.prenoms} onChange={(e) => setForm({ ...form, prenoms: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Sexe</label>
              <select value={form.sexe} onChange={(e) => setForm({ ...form, sexe: e.target.value })}>
                <option value="F">Fille</option>
                <option value="M">Garçon</option>
              </select>
            </div>
            <div style={{ flex: 1 }}><label>Âge</label><input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>Informations scolaires</div>
          <div><label>Classe scolaire</label><input value={form.classe_scolaire} onChange={(e) => setForm({ ...form, classe_scolaire: e.target.value })} /></div>
          <div><label>Lieu d'habitation</label><input value={form.lieu_habitation} onChange={(e) => setForm({ ...form, lieu_habitation: e.target.value })} /></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>Parents</div>
          <div><label>Nom du parent 1</label><input value={form.parent1_nom} onChange={(e) => setForm({ ...form, parent1_nom: e.target.value })} /></div>
          <div><label>Téléphone parent 1</label><input value={form.parent1_tel} onChange={(e) => setForm({ ...form, parent1_tel: e.target.value })} placeholder="+225..." /></div>
          <div><label>Nom du parent 2 (optionnel)</label><input value={form.parent2_nom} onChange={(e) => setForm({ ...form, parent2_nom: e.target.value })} /></div>
          <div><label>Téléphone parent 2 (optionnel)</label><input value={form.parent2_tel} onChange={(e) => setForm({ ...form, parent2_tel: e.target.value })} /></div>
        </div>

        {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
        <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Enregistrement…' : "Enregistrer l'enfant"}</button>
      </form>
    </div>
  )
}
