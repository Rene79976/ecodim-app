import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { calculerAbsences, lienWhatsapp, nomParent, telParent } from '../../lib/absences'
import BottomNavDirecteur from '../../components/BottomNavDirecteur'

export default function AbsencesDirecteur() {
  const { profile } = useAuth()
  const [groupes, setGroupes] = useState([]) // [{ classeId, classeNom, moniteurNom, absences: [{enfant, streak}] }]
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    if (!profile) return
    async function calculer() {
      setChargement(true)
      const ecoleId = profile.ecole_dimanche_id
      const [{ data: classes }, { data: moniteurs }, { data: affectations }] = await Promise.all([
        supabase.from('classes').select('id, nom').eq('ecole_dimanche_id', ecoleId).order('nom'),
        supabase.from('utilisateurs').select('id, nom, prenoms').eq('ecole_dimanche_id', ecoleId).eq('role', 'moniteur'),
        supabase.from('classe_moniteurs').select('classe_id, moniteur_id'),
      ])

      const parClasse = []
      for (const classe of classes || []) {
        const [{ data: enfants }, { data: rapports }] = await Promise.all([
          supabase.from('enfants').select('id, nom, prenoms, parent1_nom, parent1_tel, parent2_nom, parent2_tel').eq('classe_id', classe.id),
          supabase.from('rapports').select('id, dimanche_date').eq('classe_id', classe.id).eq('statut', 'transmis').order('dimanche_date', { ascending: false }).limit(8),
        ])
        const rapportIds = (rapports || []).map((r) => r.id)
        let presences = []
        if (rapportIds.length > 0) {
          const { data } = await supabase.from('presences').select('rapport_id, enfant_id, present').in('rapport_id', rapportIds)
          presences = data || []
        }
        const aff = (affectations || []).find((a) => a.classe_id === classe.id)
        const moniteur = (moniteurs || []).find((m) => m.id === aff?.moniteur_id)
        const moniteurNom = moniteur ? `${moniteur.prenoms} ${moniteur.nom}` : '—'

        const absences = calculerAbsences(rapports || [], presences, enfants || []).sort((a, b) => b.streak - a.streak)
        parClasse.push({ classeId: classe.id, classeNom: classe.nom, moniteurNom, absences })
      }

      setGroupes(parClasse)
      setChargement(false)
    }
    calculer()
  }, [profile])

  function Carte({ item }) {
    const { enfant, streak } = item
    const critique = streak >= 3
    const tel = telParent(enfant)
    const lien = lienWhatsapp(tel, `Bonjour, ${enfant.prenoms} est absent(e) depuis ${streak} dimanche${streak > 1 ? 's' : ''} consécutif${streak > 1 ? 's' : ''}. Pouvons-nous en discuter ?`)
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, borderColor: critique ? '#F3C6C1' : 'var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: critique ? 'var(--danger)' : 'var(--ink)' }}>{enfant.prenoms} {enfant.nom}</div>
          </div>
          <div style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, background: critique ? 'var(--danger-soft)' : 'var(--clay-soft)', color: critique ? 'var(--danger)' : 'var(--clay)', whiteSpace: 'nowrap' }}>
            {streak} dim.
          </div>
        </div>
        {lien && (
          <a href={lien} target="_blank" rel="noreferrer" style={{ textAlign: 'center', padding: 10, borderRadius: 10, background: critique ? 'var(--danger)' : 'none', border: critique ? 'none' : '1px solid var(--accent)', color: critique ? '#fff' : 'var(--accent)', fontSize: 13, fontWeight: 700 }}>
            Message WhatsApp à {nomParent(enfant)}
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h1 style={{ fontSize: 20 }}>Absences</h1>

      {chargement && <div style={{ color: 'var(--muted)' }}>Calcul en cours…</div>}

      {!chargement && groupes.map((g) => (
        <div key={g.classeId} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{g.classeNom}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Moniteur {g.moniteurNom}</div>
          </div>
          {g.absences.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucune absence à signaler.</div>
          ) : (
            g.absences.map((item) => <Carte key={item.enfant.id} item={item} />)
          )}
        </div>
      ))}

      {!chargement && groupes.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>Aucune classe pour le moment.</div>}

      <BottomNavDirecteur />
    </div>
  )
}
