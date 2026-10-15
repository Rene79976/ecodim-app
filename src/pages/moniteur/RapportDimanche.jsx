import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function dernierDimanche() {
  const d = new Date()
  const jour = d.getDay() // 0 = dimanche
  d.setDate(d.getDate() - jour)
  return d.toISOString().slice(0, 10)
}

export default function RapportDimanche() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [classes, setClasses] = useState([])
  const [classeId, setClasseId] = useState('')
  const [enfants, setEnfants] = useState([])
  const [presence, setPresence] = useState({}) // { enfant_id: boolean }
  const [moniteursClasse, setMoniteursClasse] = useState([])

  const [form, setForm] = useState({
    dimanche_date: dernierDimanche(),
    offrande: '',
    dirigeant_id: '',
    predicateur_id: '',
    theme: '',
    texte_biblique: '',
    lecon_spirituelle: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profile) return
    async function charger() {
      const { data: classesData } = await supabase.from('classe_moniteurs').select('classes(id, nom)').eq('moniteur_id', profile.id)
      const liste = (classesData || []).map((row) => row.classes)
      setClasses(liste)
      if (liste.length === 1) setClasseId(liste[0].id)
    }
    charger()
  }, [profile])

  useEffect(() => {
    if (!classeId) { setMoniteursClasse([]); return }
    async function chargerMoniteurs() {
      const { data } = await supabase
        .from('classe_moniteurs')
        .select('utilisateurs(id, nom, prenoms)')
        .eq('classe_id', classeId)
      setMoniteursClasse((data || []).map((row) => row.utilisateurs).filter(Boolean))
    }
    chargerMoniteurs()
  }, [classeId])

  useEffect(() => {
    if (!classeId) { setEnfants([]); return }
    async function chargerEnfants() {
      const { data } = await supabase.from('enfants').select('id, nom, prenoms, sexe').eq('classe_id', classeId).order('nom')
      setEnfants(data || [])
      // par défaut, tout le monde est marqué présent
      const initial = {}
      for (const e of data || []) initial[e.id] = true
      setPresence(initial)
    }
    chargerEnfants()
  }, [classeId])

  function toggle(id) {
    setPresence((p) => ({ ...p, [id]: !p[id] }))
  }

  const garconsPresents = enfants.filter((e) => e.sexe === 'M' && presence[e.id]).length
  const garconsAbsents = enfants.filter((e) => e.sexe === 'M' && !presence[e.id]).length
  const fillesPresentes = enfants.filter((e) => e.sexe === 'F' && presence[e.id]).length
  const fillesAbsentes = enfants.filter((e) => e.sexe === 'F' && !presence[e.id]).length

  async function transmettre(e) {
    e.preventDefault()
    setError('')
    if (!classeId) { setError('Choisis une classe.'); return }
    setLoading(true)

    const { data: rapport, error: rapportError } = await supabase
      .from('rapports')
      .upsert(
        {
          ecole_dimanche_id: profile.ecole_dimanche_id,
          classe_id: classeId,
          moniteur_id: profile.id,
          dimanche_date: form.dimanche_date,
          statut: 'transmis',
          offrande: form.offrande ? parseFloat(form.offrande) : null,
          dirigeant_id: form.dirigeant_id || null,
          predicateur_id: form.predicateur_id || null,
          theme: form.theme || null,
          texte_biblique: form.texte_biblique || null,
          lecon_spirituelle: form.lecon_spirituelle || null,
          transmis_at: new Date().toISOString(),
        },
        { onConflict: 'classe_id,dimanche_date' }
      )
      .select()
      .single()

    if (rapportError) {
      setLoading(false)
      setError("Erreur lors de l'enregistrement du rapport.")
      return
    }

    const lignesPresence = enfants.map((e) => ({
      rapport_id: rapport.id,
      enfant_id: e.id,
      present: !!presence[e.id],
    }))
    if (lignesPresence.length > 0) {
      const { error: presenceError } = await supabase
        .from('presences')
        .upsert(lignesPresence, { onConflict: 'rapport_id,enfant_id' })
      if (presenceError) {
        setLoading(false)
        setError("Rapport enregistré, mais erreur sur l'appel.")
        return
      }
    }

    setLoading(false)
    navigate('/')
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <a href="/" style={{ fontSize: 20, color: 'var(--accent)' }}>←</a>
        <div>
          <h1 style={{ fontSize: 18 }}>Rapport du dimanche</h1>
        </div>
      </div>

      <form onSubmit={transmettre} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {classes.length > 1 && (
            <div style={{ flex: 1 }}>
              <label>Classe</label>
              <select required value={classeId} onChange={(e) => setClasseId(e.target.value)}>
                <option value="">Choisir…</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <label>Dimanche</label>
            <input type="date" value={form.dimanche_date} onChange={(e) => setForm({ ...form, dimanche_date: e.target.value })} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>Appel</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
            <div className="card" style={{ textAlign: 'center', padding: '10px 6px' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{garconsPresents}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Garçons présents</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '10px 6px' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#8A93A6' }}>{garconsAbsents}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Garçons absents</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '10px 6px' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{fillesPresentes}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Filles présentes</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '10px 6px' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#8A93A6' }}>{fillesAbsentes}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Filles absentes</div>
            </div>
          </div>

          {enfants.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun enfant dans cette classe pour le moment.</div>}

          <div className="card" style={{ padding: 0 }}>
            {enfants.map((e, i) => (
              <label key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: i < enfants.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 13 }}>{e.prenoms} {e.nom}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                  Présent
                  <input type="checkbox" style={{ width: 18, height: 18 }} checked={!!presence[e.id]} onChange={() => toggle(e.id)} />
                </span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>Offrande</div>
          <div><label>Montant collecté (FCFA)</label><input type="number" value={form.offrande} onChange={(e) => setForm({ ...form, offrande: e.target.value })} /></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>Culte</div>
          <div>
            <label>Nom du dirigeant</label>
            <select value={form.dirigeant_id} onChange={(e) => setForm({ ...form, dirigeant_id: e.target.value })}>
              <option value="">Choisir…</option>
              {moniteursClasse.map((m) => <option key={m.id} value={m.id}>{m.prenoms} {m.nom}</option>)}
            </select>
          </div>
          <div>
            <label>Nom du prédicateur</label>
            <select value={form.predicateur_id} onChange={(e) => setForm({ ...form, predicateur_id: e.target.value })}>
              <option value="">Choisir…</option>
              {moniteursClasse.map((m) => <option key={m.id} value={m.id}>{m.prenoms} {m.nom}</option>)}
            </select>
          </div>
          {moniteursClasse.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              Aucun moniteur affecté à cette classe pour le moment.
            </div>
          )}
          <div><label>Thème de la prédication</label><input value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} /></div>
          <div><label>Texte biblique</label><input value={form.texte_biblique} onChange={(e) => setForm({ ...form, texte_biblique: e.target.value })} /></div>
          <div><label>Leçon spirituelle</label><textarea rows="4" style={{ resize: 'none' }} value={form.lecon_spirituelle} onChange={(e) => setForm({ ...form, lecon_spirituelle: e.target.value })} /></div>
        </div>

        {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
        <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Envoi…' : 'Transmettre au directeur'}</button>
      </form>
    </div>
  )
}
