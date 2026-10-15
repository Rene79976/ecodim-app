import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import BottomNavDirecteur from '../../components/BottomNavDirecteur'

function dernierDimanche() {
  const d = new Date()
  const jour = d.getDay()
  d.setDate(d.getDate() - jour)
  return d.toISOString().slice(0, 10)
}

function decaler(dateStr, jours) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + jours)
  return d.toISOString().slice(0, 10)
}

export default function Rapports() {
  const { profile } = useAuth()
  const [dimanche, setDimanche] = useState(dernierDimanche())
  const [classes, setClasses] = useState([])
  const [rapports, setRapports] = useState([]) // rapports du dimanche sélectionné
  const [moniteurs, setMoniteurs] = useState([])
  const [affectations, setAffectations] = useState([])
  const [detailOuvert, setDetailOuvert] = useState(null)
  const [detail, setDetail] = useState(null)

  async function charger() {
    const ecoleId = profile.ecole_dimanche_id
    const [{ data: classesData }, { data: rapportsData }, { data: moniteursData }, { data: affectationsData }] = await Promise.all([
      supabase.from('classes').select('id, nom').eq('ecole_dimanche_id', ecoleId).order('nom'),
      supabase.from('rapports').select('*').eq('ecole_dimanche_id', ecoleId).eq('dimanche_date', dimanche),
      supabase.from('utilisateurs').select('id, nom, prenoms').eq('ecole_dimanche_id', ecoleId).eq('role', 'moniteur'),
      supabase.from('classe_moniteurs').select('classe_id, moniteur_id'),
    ])
    setClasses(classesData || [])
    setRapports(rapportsData || [])
    setMoniteurs(moniteursData || [])
    setAffectations(affectationsData || [])
  }

  useEffect(() => {
    if (profile) charger()
  }, [profile, dimanche])

  function rapportDe(classeId) {
    return rapports.find((r) => r.classe_id === classeId)
  }

  function moniteurNom(classeId) {
    const aff = affectations.find((a) => a.classe_id === classeId)
    if (!aff) return '—'
    const m = moniteurs.find((mm) => mm.id === aff.moniteur_id)
    return m ? `${m.prenoms} ${m.nom}` : '—'
  }

  async function ouvrirDetail(classeId) {
    if (detailOuvert === classeId) { setDetailOuvert(null); return }
    const rapport = rapportDe(classeId)
    if (!rapport) return
    const { data: presencesData } = await supabase
      .from('presences')
      .select('present, enfants(sexe)')
      .eq('rapport_id', rapport.id)
    const gp = (presencesData || []).filter((p) => p.enfants?.sexe === 'M' && p.present).length
    const ga = (presencesData || []).filter((p) => p.enfants?.sexe === 'M' && !p.present).length
    const fp = (presencesData || []).filter((p) => p.enfants?.sexe === 'F' && p.present).length
    const fa = (presencesData || []).filter((p) => p.enfants?.sexe === 'F' && !p.present).length
    setDetail({ ...rapport, gp, ga, fp, fa })
    setDetailOuvert(classeId)
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h1 style={{ fontSize: 20 }}>Rapports</h1>

      <div className="no-print card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => setDimanche(decaler(dimanche, -7))} style={{ fontSize: 16, color: 'var(--accent)', background: 'none', border: 'none' }}>‹</button>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{new Date(dimanche).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <button onClick={() => setDimanche(decaler(dimanche, 7))} style={{ fontSize: 16, color: 'var(--accent)', background: 'none', border: 'none' }}>›</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {classes.map((c) => {
          const rapport = rapportDe(c.id)
          const transmis = rapport?.statut === 'transmis'
          return (
            <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{c.nom}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Moniteur {moniteurNom(c.id)}</div>
                </div>
                <div style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: transmis ? 'var(--accent-soft)' : '#E8EDF5', color: transmis ? 'var(--accent)' : '#8A93A6', whiteSpace: 'nowrap' }}>
                  {transmis ? 'Transmis' : 'Non transmis'}
                </div>
              </div>

              {transmis && (
                <button className="no-print btn-outline" onClick={() => ouvrirDetail(c.id)}>
                  {detailOuvert === c.id ? 'Fermer' : 'Voir le rapport'}
                </button>
              )}

              {detailOuvert === c.id && detail && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, paddingTop: 4 }}>
                  <div>Appel : {detail.gp} garçons présents, {detail.ga} absents · {detail.fp} filles présentes, {detail.fa} absentes</div>
                  {detail.offrande != null && <div>Offrande : {detail.offrande} FCFA</div>}
                  {detail.theme && <div>Thème : {detail.theme}</div>}
                  {detail.texte_biblique && <div>Texte biblique : {detail.texte_biblique}</div>}
                  {detail.lecon_spirituelle && <div>Leçon : {detail.lecon_spirituelle}</div>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button className="no-print btn-primary" onClick={() => window.print()}>Télécharger en PDF / Imprimer</button>

      <BottomNavDirecteur />
    </div>
  )
}
