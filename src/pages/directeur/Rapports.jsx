import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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

function formatMontant(v) {
  return v == null ? 'Non renseignée' : Number(v).toLocaleString('fr-FR') + ' FCFA'
}

function nomComplet(u) {
  return u ? `${u.prenoms} ${u.nom}` : '—'
}

const etiquette = { fontSize: 11.5, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }

function Mini({ n, label, couleur }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: couleur }}>{n}</div>
      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{label}</div>
    </div>
  )
}

function Info({ label, valeur }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{valeur || '—'}</div>
    </div>
  )
}

function ListeEnfants({ titre, lignes, couleur }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: couleur }}>{titre} ({lignes.length})</div>
      {lignes.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun enfant.</div>}
      {lignes.map((p) => (
        <div key={p.enfants.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
          <span>{p.enfants.prenoms} {p.enfants.nom}</span>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>{p.enfants.sexe === 'F' ? 'Fille' : 'Garçon'}</span>
        </div>
      ))}
    </div>
  )
}

function DetailRapport({ id, onRetour }) {
  const [etat, setEtat] = useState({ chargement: true })

  useEffect(() => {
    let annule = false
    async function charger() {
      const { data: rapport } = await supabase.from('rapports').select('*').eq('id', id).single()
      if (!rapport) {
        if (!annule) setEtat({ chargement: false, introuvable: true })
        return
      }
      const personnes = [rapport.moniteur_id, rapport.dirigeant_id, rapport.predicateur_id].filter(Boolean)
      const [{ data: classe }, { data: users }, { data: presences }] = await Promise.all([
        supabase.from('classes').select('nom').eq('id', rapport.classe_id).single(),
        personnes.length
          ? supabase.from('utilisateurs').select('id, nom, prenoms').in('id', personnes)
          : Promise.resolve({ data: [] }),
        supabase.from('presences').select('present, enfants(id, nom, prenoms, sexe)').eq('rapport_id', id),
      ])
      if (annule) return
      setEtat({ chargement: false, rapport, classe, users: users || [], presences: presences || [] })
    }
    charger()
    return () => { annule = true }
  }, [id])

  const boutonRetour = (
    <button className="no-print btn-outline" style={{ alignSelf: 'flex-start', padding: '8px 14px' }} onClick={onRetour}>
      ← Retour aux rapports
    </button>
  )

  if (etat.chargement) return <div style={{ color: 'var(--muted)' }}>Chargement du rapport…</div>
  if (etat.introuvable) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {boutonRetour}
        <div style={{ color: 'var(--muted)' }}>Rapport introuvable.</div>
      </div>
    )
  }

  const { rapport, classe, users, presences } = etat
  const trouver = (uid) => users.find((x) => x.id === uid)
  const lignes = presences.filter((p) => p.enfants)
  const compte = (sexe, present) => lignes.filter((p) => p.enfants.sexe === sexe && p.present === present).length
  const trier = (a, b) => (a.enfants.nom || '').localeCompare(b.enfants.nom || '')
  const absents = lignes.filter((p) => !p.present).sort(trier)
  const presents = lignes.filter((p) => p.present).sort(trier)

  const dateLongue = new Date(rapport.dimanche_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const dateEnvoi = rapport.transmis_at
    ? new Date(rapport.transmis_at).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {boutonRetour}

      <div>
        <h1 style={{ fontSize: 22 }}>{classe?.nom || 'Classe'}</h1>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Rapport du {dateLongue}</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
          Transmis par {nomComplet(trouver(rapport.moniteur_id))}{dateEnvoi ? ` le ${dateEnvoi}` : ''}
        </div>
      </div>

      <div style={etiquette}>Appel</div>
      {lignes.length === 0 ? (
        <div className="card" style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun appel enregistré pour ce rapport.</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <Mini n={compte('M', true)} label="Garçons présents" couleur="var(--clay)" />
            <Mini n={compte('M', false)} label="Garçons absents" couleur="var(--muted)" />
            <Mini n={compte('F', true)} label="Filles présentes" couleur="var(--clay)" />
            <Mini n={compte('F', false)} label="Filles absentes" couleur="var(--muted)" />
          </div>
          <ListeEnfants titre="Absents" lignes={absents} couleur="var(--danger)" />
          <ListeEnfants titre="Présents" lignes={presents} couleur="var(--clay)" />
        </>
      )}

      <div style={etiquette}>Offrande</div>
      <div className="card" style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{formatMontant(rapport.offrande)}</div>

      <div style={etiquette}>Culte</div>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Info label="Dirigeant" valeur={rapport.dirigeant_id ? nomComplet(trouver(rapport.dirigeant_id)) : null} />
        <Info label="Prédicateur" valeur={rapport.predicateur_id ? nomComplet(trouver(rapport.predicateur_id)) : null} />
        <Info label="Thème de la prédication" valeur={rapport.theme} />
        <Info label="Texte biblique" valeur={rapport.texte_biblique} />
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Leçon spirituelle</div>
          <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{rapport.lecon_spirituelle || '—'}</div>
        </div>
      </div>

      <button className="no-print btn-primary" onClick={() => window.print()}>Imprimer / PDF de ce rapport</button>
    </div>
  )
}

export default function Rapports() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const rapportId = params.get('rapport')

  const [dimanche, setDimanche] = useState(dernierDimanche())
  const [classes, setClasses] = useState([])
  const [rapports, setRapports] = useState([]) // rapports du dimanche sélectionné
  const [moniteurs, setMoniteurs] = useState([])
  const [affectations, setAffectations] = useState([])

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

  function retour() {
    if (window.history.state && window.history.state.idx > 0) navigate(-1)
    else setParams({}, { replace: true })
  }

  if (rapportId) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <DetailRapport id={rapportId} onRetour={retour} />
        <BottomNavDirecteur />
      </div>
    )
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
          const ouvrir = () => setParams({ rapport: rapport.id })
          return (
            <div
              key={c.id}
              className="card"
              role={transmis ? 'button' : undefined}
              tabIndex={transmis ? 0 : undefined}
              onClick={transmis ? ouvrir : undefined}
              onKeyDown={transmis ? (e) => { if (e.key === 'Enter') ouvrir() } : undefined}
              style={{ display: 'flex', flexDirection: 'column', gap: 10, cursor: transmis ? 'pointer' : 'default' }}
            >
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
                <>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {rapport.offrande != null && <div>Offrande : {formatMontant(rapport.offrande)}</div>}
                    {rapport.theme && <div>Thème : {rapport.theme}</div>}
                  </div>
                  <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                    <span>Voir le détail du rapport</span>
                    <span style={{ fontSize: 18 }}>›</span>
                  </div>
                </>
              )}
            </div>
          )
        })}
        {classes.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>Aucune classe pour le moment.</div>}
      </div>

      <button className="no-print btn-primary" onClick={() => window.print()}>Télécharger en PDF / Imprimer</button>

      <BottomNavDirecteur />
    </div>
  )
}
