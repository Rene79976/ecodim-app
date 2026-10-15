import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import BottomNavMoniteur from '../../components/BottomNavMoniteur'

export default function DashboardMoniteur() {
  const { profile } = useAuth()
  const [classes, setClasses] = useState([])

  useEffect(() => {
    if (!profile) return
    async function charger() {
      const { data } = await supabase
        .from('classe_moniteurs')
        .select('classes(id, nom)')
        .eq('moniteur_id', profile.id)
      setClasses((data || []).map((row) => row.classes))
    }
    charger()
  }, [profile])

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ color: 'var(--accent)', fontSize: 18 }}>ECODIM</h1>
        <a href="/profil" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--clay-soft)', color: 'var(--clay)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
          {(profile?.prenoms?.[0] || '') + (profile?.nom?.[0] || '')}
        </a>
      </div>
      <h2 style={{ fontSize: 22 }}>Bonjour, {profile?.prenoms}</h2>

      {classes.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>Aucune classe affectée pour le moment.</div>}

      {classes.map((c) => (
        <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Classe : {c.nom}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <a href="/enfants" className="btn-outline" style={{ flex: 1, textAlign: 'center' }}>Voir les enfants</a>
            <a href="/enfants/ajouter" className="btn-primary" style={{ flex: 1, textAlign: 'center' }}>+ Ajouter un enfant</a>
          </div>
          <a href="/rapport" className="btn-outline" style={{ textAlign: 'center', background: 'var(--clay-soft)', borderColor: 'var(--clay-soft)', color: 'var(--clay)' }}>Faire le rapport du dimanche</a>
          <a href="/absences" style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--danger)' }}>Voir les enfants absents →</a>
        </div>
      ))}

      <BottomNavMoniteur />
    </div>
  )
}
