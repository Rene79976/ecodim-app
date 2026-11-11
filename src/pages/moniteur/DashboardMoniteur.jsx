import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import BottomNavMoniteur from '../../components/BottomNavMoniteur'
import Icone from '../../components/Icone'

export default function DashboardMoniteur() {
  const { profile, ecole } = useAuth()
  const [classes, setClasses] = useState(null) // null = chargement
  const [comptes, setComptes] = useState({}) // { classe_id: nombre d'enfants }

  useEffect(() => {
    if (!profile) return
    async function charger() {
      const { data } = await supabase
        .from('classe_moniteurs')
        .select('classes(id, nom)')
        .eq('moniteur_id', profile.id)
      const liste = (data || []).map((row) => row.classes).filter(Boolean)
      setClasses(liste)
      if (liste.length > 0) {
        const { data: enfants } = await supabase
          .from('enfants')
          .select('classe_id')
          .in('classe_id', liste.map((c) => c.id))
        const n = {}
        for (const e of enfants || []) n[e.classe_id] = (n[e.classe_id] || 0) + 1
        setComptes(n)
      }
    }
    charger()
  }, [profile])

  const initiales = (profile?.prenoms?.[0] || '') + (profile?.nom?.[0] || '')

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="hero">
        <div className="hero-ligne">
          <div className="logo">Ictus<span>Kid</span></div>
          <Link to="/profil" className="avatar-or">{initiales}</Link>
        </div>
        <div>
          <h1>Bonjour, {profile?.prenoms}</h1>
          <div className="hero-sous">{ecole?.nom ? `${ecole.nom} · Moniteur` : 'Moniteur'}</div>
        </div>
      </div>

      {classes === null && <div style={{ color: 'var(--muted)' }}>Chargement…</div>}

      {classes !== null && classes.length === 0 && (
        <div className="card" style={{ fontSize: 14, color: 'var(--muted)' }}>
          Aucune classe affectée pour le moment. Demande au directeur de t'affecter à une classe.
        </div>
      )}

      {(classes || []).map((c) => (
        <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="badge-icone"><Icone nom="grid" /></div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{c.nom}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
                {comptes[c.id] || 0} enfant{(comptes[c.id] || 0) > 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <Link to="/rapport" className="btn-primary">Faire l'appel et le rapport du dimanche</Link>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/enfants" className="btn-outline" style={{ flex: 1 }}>Voir les enfants</Link>
            <Link to="/enfants/ajouter" className="btn-outline" style={{ flex: 1 }}>+ Ajouter</Link>
          </div>
        </div>
      ))}

      {classes !== null && classes.length > 0 && (
        <Link to="/absences" className="alerte">
          <Icone nom="alert" taille={26} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Enfants absents</div>
            <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.85 }}>Voir ceux à relancer</div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Voir</span>
        </Link>
      )}

      <BottomNavMoniteur />
    </div>
  )
}
