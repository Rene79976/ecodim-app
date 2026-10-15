import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import BottomNavMoniteur from '../../components/BottomNavMoniteur'

export default function Enfants() {
  const { profile } = useAuth()
  const [enfants, setEnfants] = useState([])

  useEffect(() => {
    if (!profile) return
    async function charger() {
      const { data: classesData } = await supabase
        .from('classe_moniteurs')
        .select('classe_id')
        .eq('moniteur_id', profile.id)
      const classeIds = (classesData || []).map((c) => c.classe_id)
      if (classeIds.length === 0) { setEnfants([]); return }
      const { data } = await supabase
        .from('enfants')
        .select('id, nom, prenoms, age, sexe')
        .in('classe_id', classeIds)
        .order('nom')
      setEnfants(data || [])
    }
    charger()
  }, [profile])

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 20 }}>Enfants</h1>
        <a href="/enfants/ajouter" className="btn-primary" style={{ width: 'auto', padding: '10px 14px', fontSize: 13 }}>+ Ajouter</a>
      </div>

      {enfants.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>Aucun enfant enregistré pour le moment.</div>}

      {enfants.map((e) => (
        <div key={e.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: e.sexe === 'F' ? 'var(--accent-soft)' : 'var(--clay-soft)', color: e.sexe === 'F' ? 'var(--accent)' : 'var(--clay)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
            {(e.prenoms?.[0] || '') + (e.nom?.[0] || '')}
          </div>
          <div style={{ fontSize: 14 }}>{e.prenoms} {e.nom} · {e.age} ans</div>
        </div>
      ))}

      <BottomNavMoniteur />
    </div>
  )
}
