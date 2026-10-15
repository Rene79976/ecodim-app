import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import BottomNavDirecteur from '../../components/BottomNavDirecteur'

export default function DashboardDirecteur() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ classes: 0, moniteurs: 0, enfants: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    async function loadStats() {
      const ecoleId = profile.ecole_dimanche_id
      const [{ count: classes }, { count: moniteurs }, { count: enfants }] = await Promise.all([
        supabase.from('classes').select('*', { count: 'exact', head: true }).eq('ecole_dimanche_id', ecoleId),
        supabase.from('utilisateurs').select('*', { count: 'exact', head: true }).eq('ecole_dimanche_id', ecoleId).eq('role', 'moniteur'),
        supabase.from('enfants').select('*', { count: 'exact', head: true }).eq('ecole_dimanche_id', ecoleId),
      ])
      setStats({ classes: classes || 0, moniteurs: moniteurs || 0, enfants: enfants || 0 })
      setLoading(false)
    }
    loadStats()
  }, [profile])

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ color: 'var(--accent)', fontSize: 18 }}>ECODIM</h1>
        <a href="/profil" className="card" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, padding: 0 }}>
          {(profile?.prenoms?.[0] || '') + (profile?.nom?.[0] || '')}
        </a>
      </div>

      <div>
        <h2 style={{ fontSize: 22 }}>Bonjour, {profile?.prenoms || 'Directeur'}</h2>
      </div>

      {loading ? (
        <div>Chargement des statistiques…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          <div className="card">
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{stats.classes}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Classes</div>
          </div>
          <div className="card">
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{stats.moniteurs}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Moniteurs</div>
          </div>
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{stats.enfants}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Enfants</div>
          </div>
        </div>
      )}

      <a href="/absences" style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)' }}>Voir les absences →</a>

      <BottomNavDirecteur />
    </div>
  )
}
