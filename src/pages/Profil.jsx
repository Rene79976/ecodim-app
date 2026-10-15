import { useAuth } from '../context/AuthContext'

export default function Profil() {
  const { profile, session, signOut } = useAuth()

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 style={{ fontSize: 18 }}>Profil</h1>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>
          {(profile?.prenoms?.[0] || '') + (profile?.nom?.[0] || '')}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{profile?.prenoms} {profile?.nom}</div>
        <div style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          {profile?.role === 'directeur' ? 'Directeur' : 'Moniteur'}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Email</div>
          <div style={{ fontSize: 14 }}>{session?.user?.email}</div>
        </div>
      </div>

      <button className="btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={signOut}>
        Se déconnecter
      </button>
    </div>
  )
}
