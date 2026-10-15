import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { calculerAbsences, lienWhatsapp, nomParent, telParent } from '../../lib/absences'
import BottomNavMoniteur from '../../components/BottomNavMoniteur'

export default function AbsencesMoniteur() {
  const { profile } = useAuth()
  const [classes, setClasses] = useState([])
  const [classeId, setClasseId] = useState('')
  const [absences, setAbsences] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    if (!profile) return
    async function chargerClasses() {
      const { data } = await supabase.from('classe_moniteurs').select('classes(id, nom)').eq('moniteur_id', profile.id)
      const liste = (data || []).map((row) => row.classes)
      setClasses(liste)
      if (liste.length > 0) setClasseId(liste[0].id)
    }
    chargerClasses()
  }, [profile])

  useEffect(() => {
    if (!classeId) return
    async function calculer() {
      setChargement(true)
      const [{ data: enfants }, { data: rapports }] = await Promise.all([
        supabase.from('enfants').select('id, nom, prenoms, parent1_nom, parent1_tel, parent2_nom, parent2_tel').eq('classe_id', classeId),
        supabase.from('rapports').select('id, dimanche_date').eq('classe_id', classeId).eq('statut', 'transmis').order('dimanche_date', { ascending: false }).limit(8),
      ])
      const rapportIds = (rapports || []).map((r) => r.id)
      let presences = []
      if (rapportIds.length > 0) {
        const { data } = await supabase.from('presences').select('rapport_id, enfant_id, present').in('rapport_id', rapportIds)
        presences = data || []
      }
      setAbsences(calculerAbsences(rapports || [], presences, enfants || []))
      setChargement(false)
    }
    calculer()
  }, [classeId])

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <a href="/" style={{ fontSize: 20, color: 'var(--accent)' }}>←</a>
        <h1 style={{ fontSize: 18 }}>Enfants absents</h1>
      </div>

      {classes.length > 1 && (
        <select value={classeId} onChange={(e) => setClasseId(e.target.value)}>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      )}

      <div style={{ fontSize: 12, color: 'var(--muted)' }} className="card">
        Les noms en <span style={{ color: 'var(--danger)', fontWeight: 700 }}>rouge</span> sont absents depuis 3 dimanches consécutifs ou plus.
      </div>

      {chargement && <div style={{ color: 'var(--muted)' }}>Calcul en cours…</div>}
      {!chargement && absences.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>Aucune absence à signaler.</div>}

      {absences.map(({ enfant, streak }) => {
        const critique = streak >= 3
        const tel = telParent(enfant)
        const lien = lienWhatsapp(tel, `Bonjour, ${enfant.prenoms} est absent(e) depuis ${streak} dimanche${streak > 1 ? 's' : ''} consécutif${streak > 1 ? 's' : ''}. Tout va bien ?`)
        return (
          <div key={enfant.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, borderColor: critique ? '#F3C6C1' : 'var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: critique ? 'var(--danger)' : 'var(--ink)' }}>{enfant.prenoms} {enfant.nom}</div>
              <div style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, background: critique ? 'var(--danger-soft)' : 'var(--clay-soft)', color: critique ? 'var(--danger)' : 'var(--clay)', whiteSpace: 'nowrap' }}>
                {streak} dimanche{streak > 1 ? 's' : ''}
              </div>
            </div>
            {lien ? (
              <a href={lien} target="_blank" rel="noreferrer" style={{ textAlign: 'center', padding: 10, borderRadius: 10, background: critique ? 'var(--danger)' : 'none', border: critique ? 'none' : '1px solid var(--accent)', color: critique ? '#fff' : 'var(--accent)', fontSize: 13, fontWeight: 700 }}>
                Message WhatsApp à {nomParent(enfant)}
              </a>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Aucun numéro de parent enregistré.</div>
            )}
          </div>
        )
      })}

      <BottomNavMoniteur />
    </div>
  )
}
