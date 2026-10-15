import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import BottomNavDirecteur from '../../components/BottomNavDirecteur'
import ProgressRing from '../../components/ProgressRing'

function dernierDimanche() {
  const d = new Date()
  const jour = d.getDay()
  d.setDate(d.getDate() - jour)
  return d.toISOString().slice(0, 10)
}

export default function Statistiques() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ classes: 0, moniteurs: 0, enfants: 0, rapportsTransmis: 0, rapportsTotal: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    async function charger() {
      const ecoleId = profile.ecole_dimanche_id
      const dimanche = dernierDimanche()

      const [{ count: classes }, { count: moniteurs }, { count: enfants }, { count: rapportsTransmis }] = await Promise.all([
        supabase.from('classes').select('*', { count: 'exact', head: true }).eq('ecole_dimanche_id', ecoleId),
        supabase.from('utilisateurs').select('*', { count: 'exact', head: true }).eq('ecole_dimanche_id', ecoleId).eq('role', 'moniteur'),
        supabase.from('enfants').select('*', { count: 'exact', head: true }).eq('ecole_dimanche_id', ecoleId),
        supabase.from('rapports').select('*', { count: 'exact', head: true }).eq('ecole_dimanche_id', ecoleId).eq('dimanche_date', dimanche).eq('statut', 'transmis'),
      ])

      setStats({
        classes: classes || 0,
        moniteurs: moniteurs || 0,
        enfants: enfants || 0,
        rapportsTransmis: rapportsTransmis || 0,
        rapportsTotal: classes || 0,
      })
      setLoading(false)
    }
    charger()
  }, [profile])

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20 }}>Statistiques</h1>
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>Vue d'ensemble de l'école</div>

      {loading ? (
        <div style={{ color: 'var(--muted)' }}>Chargement…</div>
      ) : (
        <>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--accent)' }}>{stats.classes}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Classes actives</div>
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--accent)' }}>{stats.moniteurs}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Moniteurs</div>
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--accent)' }}>{stats.enfants}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Enfants inscrits</div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <ProgressRing
              value={stats.rapportsTotal > 0 ? Math.round((stats.rapportsTransmis / stats.rapportsTotal) * 100) : 0}
              color="var(--clay)"
            />
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              Rapports transmis ce dimanche<br />
              <strong style={{ color: 'var(--ink)' }}>{stats.rapportsTransmis}/{stats.rapportsTotal}</strong> classes
            </div>
          </div>
        </>
      )}

      <div style={{ border: '1px dashed #C7CDBF', borderRadius: 14, padding: 20, textAlign: 'center', color: '#8A93A6', fontSize: 12 }}>
        Graphiques à venir : évolution des enfants, présences par classe, répartition par sexe et âge
      </div>

      <a href="/synthese" className="btn-outline" style={{ textAlign: 'center' }}>Générer une synthèse à imprimer</a>

      <BottomNavDirecteur />
    </div>
  )
}
