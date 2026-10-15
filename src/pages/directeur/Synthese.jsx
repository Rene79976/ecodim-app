import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { calculerAbsences } from '../../lib/absences'
import ProgressRing from '../../components/ProgressRing'

function toISO(d) { return d.toISOString().slice(0, 10) }

function periode(cle) {
  const now = new Date()
  let start, end
  if (cle === 'mois') {
    start = new Date(now.getFullYear(), now.getMonth(), 1)
    end = now
  } else if (cle === 'mois_dernier') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    end = new Date(now.getFullYear(), now.getMonth(), 0)
  } else if (cle === 'trimestre') {
    start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    end = now
  } else {
    start = new Date(now.getFullYear(), 0, 1)
    end = now
  }
  return { start: toISO(start), end: toISO(end) }
}

function nombreDimanches(startStr, endStr) {
  const start = new Date(startStr)
  const end = new Date(endStr)
  let n = 0
  const d = new Date(start)
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7)) // premier dimanche >= start
  while (d <= end) { n++; d.setDate(d.getDate() + 7) }
  return n
}

export default function Synthese() {
  const { profile } = useAuth()
  const [cle, setCle] = useState('mois')
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!profile) return
    async function charger() {
      const ecoleId = profile.ecole_dimanche_id
      const { start, end } = periode(cle)

      const [{ data: classes }, { count: moniteurs }, { count: enfantsTotal }, { count: nouveauxEnfants }, { data: rapports }] = await Promise.all([
        supabase.from('classes').select('id, nom').eq('ecole_dimanche_id', ecoleId),
        supabase.from('utilisateurs').select('*', { count: 'exact', head: true }).eq('ecole_dimanche_id', ecoleId).eq('role', 'moniteur'),
        supabase.from('enfants').select('*', { count: 'exact', head: true }).eq('ecole_dimanche_id', ecoleId),
        supabase.from('enfants').select('*', { count: 'exact', head: true }).eq('ecole_dimanche_id', ecoleId).gte('created_at', start),
        supabase.from('rapports').select('classe_id, dimanche_date, statut, offrande').eq('ecole_dimanche_id', ecoleId).gte('dimanche_date', start).lte('dimanche_date', end),
      ])

      const rapportsTransmis = (rapports || []).filter(r => r.statut === 'transmis')
      const dimanches = nombreDimanches(start, end)
      const rapportsAttendus = (classes || []).length * dimanches
      const offrandeTotal = rapportsTransmis.reduce((s, r) => s + (parseFloat(r.offrande) || 0), 0)

      // Requête dédiée pour les présences (il faut l'id du rapport, pas récupéré ci-dessus)
      let tauxPresence = null
      const { data: rapportsAvecId } = await supabase
        .from('rapports')
        .select('id')
        .eq('ecole_dimanche_id', ecoleId)
        .eq('statut', 'transmis')
        .gte('dimanche_date', start)
        .lte('dimanche_date', end)

      let present = 0, totalAppel = 0
      const rapportIds = (rapportsAvecId || []).map(r => r.id)
      if (rapportIds.length > 0) {
        const { data: presencesData } = await supabase.from('presences').select('present').in('rapport_id', rapportIds)
        totalAppel = (presencesData || []).length
        present = (presencesData || []).filter(p => p.present).length
      }
      tauxPresence = totalAppel > 0 ? Math.round((present / totalAppel) * 100) : null

      // Suivi pastoral : enfants absents 3 dimanches consécutifs ou + (toutes classes)
      let pastoral = 0
      for (const classe of classes || []) {
        const { data: enfantsClasse } = await supabase.from('enfants').select('id').eq('classe_id', classe.id)
        const { data: rapportsClasse } = await supabase.from('rapports').select('id, dimanche_date').eq('classe_id', classe.id).eq('statut', 'transmis').order('dimanche_date', { ascending: false }).limit(8)
        const ids = (rapportsClasse || []).map(r => r.id)
        let presencesClasse = []
        if (ids.length > 0) {
          const { data } = await supabase.from('presences').select('rapport_id, enfant_id, present').in('rapport_id', ids)
          presencesClasse = data || []
        }
        pastoral += calculerAbsences(rapportsClasse || [], presencesClasse, enfantsClasse || []).filter(a => a.streak >= 3).length
      }

      // Répartition par classe (snapshot actuel) : moniteurs affectés + enfants par sexe
      const [{ data: classeMoniteurs }, { data: enfantsParClasse }] = await Promise.all([
        supabase.from('classe_moniteurs').select('classe_id, moniteur_id'),
        supabase.from('enfants').select('classe_id, sexe').eq('ecole_dimanche_id', ecoleId),
      ])
      const perClasse = (classes || []).map(c => ({
        nom: c.nom,
        moniteurs: (classeMoniteurs || []).filter(cm => cm.classe_id === c.id).length,
        garcons: (enfantsParClasse || []).filter(e => e.classe_id === c.id && e.sexe === 'M').length,
        filles: (enfantsParClasse || []).filter(e => e.classe_id === c.id && e.sexe === 'F').length,
      }))

      // Démographie (snapshot global, pas limité à la période)
      const { data: enfantsDemo } = await supabase.from('enfants').select('sexe, age').eq('ecole_dimanche_id', ecoleId)
      const garcons = (enfantsDemo || []).filter(e => e.sexe === 'M').length
      const filles = (enfantsDemo || []).filter(e => e.sexe === 'F').length
      const tranches = { '0-5': 0, '6-8': 0, '9-11': 0, '12-14': 0, '15+': 0 }
      for (const e of enfantsDemo || []) {
        const a = e.age
        if (a == null) continue
        if (a <= 5) tranches['0-5']++
        else if (a <= 8) tranches['6-8']++
        else if (a <= 11) tranches['9-11']++
        else if (a <= 14) tranches['12-14']++
        else tranches['15+']++
      }

      setData({
        start, end, dimanches,
        classes: (classes || []).length, moniteurs: moniteurs || 0, enfantsTotal: enfantsTotal || 0, nouveauxEnfants: nouveauxEnfants || 0,
        rapportsTransmisCount: rapportsTransmis.length, rapportsAttendus,
        offrandeTotal, tauxPresence, pastoral,
        garcons, filles, tranches, perClasse,
      })
    }
    charger()
  }, [profile, cle])

  const labelPeriode = { mois: 'Ce mois-ci', mois_dernier: 'Le mois dernier', trimestre: 'Ce trimestre', annee: 'Cette année' }[cle]

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <a href="/statistiques" style={{ fontSize: 20, color: 'var(--accent)' }}>←</a>
        <h1 style={{ fontSize: 18 }}>Synthèse</h1>
      </div>

      <select className="no-print" value={cle} onChange={e => setCle(e.target.value)}>
        <option value="mois">Ce mois-ci</option>
        <option value="mois_dernier">Le mois dernier</option>
        <option value="trimestre">Ce trimestre</option>
        <option value="annee">Cette année</option>
      </select>

      {!data ? <div style={{ color: 'var(--muted)' }}>Calcul en cours…</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            {labelPeriode} · du {data.start} au {data.end} ({data.dimanches} dimanche{data.dimanches > 1 ? 's' : ''})
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>Vue d'ensemble</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
              <div className="card"><div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{data.classes}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>Classes</div></div>
              <div className="card"><div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{data.moniteurs}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>Moniteurs</div></div>
              <div className="card"><div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{data.enfantsTotal}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>Enfants inscrits</div></div>
              <div className="card"><div style={{ fontSize: 24, fontWeight: 700, color: 'var(--clay)' }}>{data.rapportsTransmisCount}/{data.rapportsAttendus}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>Rapports transmis</div></div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>Croissance</div>
            <div className="card">+{data.nouveauxEnfants} nouvel(s) enfant(s) inscrit(s) sur la période</div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>Fréquentation</div>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {data.tauxPresence == null ? (
                'Pas encore de données sur cette période.'
              ) : (
                <>
                  <ProgressRing value={data.tauxPresence} color="var(--accent)" size={76} />
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>Taux de présence moyen sur la période</div>
                </>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', marginBottom: 8 }}>Suivi pastoral</div>
            <div className="card" style={{ borderColor: data.pastoral > 0 ? '#F3C6C1' : 'var(--border)' }}>
              {data.pastoral} enfant{data.pastoral > 1 ? 's' : ''} absent{data.pastoral > 1 ? 's' : ''} depuis 3 dimanches ou plus (voir l'écran Absences pour les contacter)
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>Finances</div>
            <div className="card">Offrandes collectées sur la période : <strong>{data.offrandeTotal.toLocaleString('fr-FR')} FCFA</strong></div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>Répartition par classe</div>
            <div className="card" style={{ padding: 0 }}>
              {data.perClasse.map((c, i) => (
                <div key={c.nom} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: i < data.perClasse.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{c.nom}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>
                    {c.moniteurs} moniteur{c.moniteurs > 1 ? 's' : ''} · {c.garcons} garçons · {c.filles} filles
                  </div>
                </div>
              ))}
              {data.perClasse.length === 0 && <div style={{ padding: 16, fontSize: 13, color: 'var(--muted)' }}>Aucune classe pour le moment.</div>}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>Démographie</div>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div>{data.garcons} garçons · {data.filles} filles</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                {Object.entries(data.tranches).map(([k, v]) => `${k} ans: ${v}`).join(' · ')}
              </div>
            </div>
          </div>

          <button className="no-print btn-primary" onClick={() => window.print()}>Télécharger en PDF / Imprimer</button>
        </div>
      )}
    </div>
  )
}
