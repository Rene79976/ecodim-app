import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import BottomNavDirecteur from '../../components/BottomNavDirecteur'
import ProgressRing from '../../components/ProgressRing'
import Icone from '../../components/Icone'

function dernierDimanche() {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay())
  return d.toISOString().slice(0, 10)
}

export default function DashboardDirecteur() {
  const { profile, ecole } = useAuth()
  const [stats, setStats] = useState({ classes: 0, moniteurs: 0, enfants: 0, rapports: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    async function charger() {
      const ecoleId = profile.ecole_dimanche_id
      const dimanche = dernierDimanche()
      const [{ count: classes }, { count: moniteurs }, { count: enfants }, { count: rapports }] = await Promise.all([
        supabase.from('classes').select('*', { count: 'exact', head: true }).eq('ecole_dimanche_id', ecoleId),
        supabase.from('utilisateurs').select('*', { count: 'exact', head: true }).eq('ecole_dimanche_id', ecoleId).eq('role', 'moniteur'),
        supabase.from('enfants').select('*', { count: 'exact', head: true }).eq('ecole_dimanche_id', ecoleId),
        supabase.from('rapports').select('*', { count: 'exact', head: true }).eq('ecole_dimanche_id', ecoleId).eq('dimanche_date', dimanche).eq('statut', 'transmis'),
      ])
      setStats({ classes: classes || 0, moniteurs: moniteurs || 0, enfants: enfants || 0, rapports: rapports || 0 })
      setLoading(false)
    }
    charger()
  }, [profile])

  const initiales = (profile?.prenoms?.[0] || '') + (profile?.nom?.[0] || '')
  const pct = stats.classes > 0 ? Math.min(100, Math.round((stats.rapports / stats.classes) * 100)) : 0
  const texte = stats.classes === 0
    ? 'Crée une classe pour commencer à suivre les rapports.'
    : `${stats.rapports} classe${stats.rapports > 1 ? 's' : ''} sur ${stats.classes} ${stats.rapports > 1 ? 'ont' : 'a'} transmis leur rapport.`

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="hero">
        <div className="hero-ligne">
          <div className="logo">Ictus<span>Kid</span></div>
          <Link to="/profil" className="avatar-or">{initiales}</Link>
        </div>
        <div>
          <h1>Bonjour, {profile?.prenoms || 'Directeur'}</h1>
          <div className="hero-sous">{ecole?.nom ? `${ecole.nom} · Directeur` : 'Directeur'}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--muted)' }}>Chargement…</div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="card stat-card">
              <div className="badge-icone"><Icone nom="grid" /></div>
              <div>
                <div className="stat-nombre">{stats.classes}</div>
                <div className="stat-label">Classes</div>
              </div>
            </div>
            <div className="card stat-card">
              <div className="badge-icone vert"><Icone nom="users" /></div>
              <div>
                <div className="stat-nombre">{stats.moniteurs}</div>
                <div className="stat-label">Moniteurs</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="badge-icone" style={{ width: 48, height: 48, borderRadius: 14 }}><Icone nom="child" taille={26} /></div>
            <div>
              <div className="stat-nombre">{stats.enfants}</div>
              <div className="stat-label">Enfants inscrits</div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <ProgressRing value={pct} color="var(--clay)" size={88} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Rapports du dimanche</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.45, marginTop: 4 }}>{texte}</div>
            </div>
          </div>

          <Link to="/absences" className="alerte">
            <Icone nom="alert" taille={26} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Absences à suivre</div>
              <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.85 }}>Enfants absents, classe par classe</div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Voir</span>
          </Link>
        </>
      )}

      <BottomNavDirecteur />
    </div>
  )
}
