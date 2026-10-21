import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, role }) {
  const { session, profile, ecole, loading, signOut } = useAuth()

  if (loading) return <div style={{ padding: 24 }}>Chargement…</div>
  if (!session) return <Navigate to="/login" replace />

  if (!profile) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 60 }}>
        <h1 style={{ fontSize: 20 }}>Compte non configuré</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Ce compte n'est rattaché à aucun ECODIM (il a peut-être été supprimé). Déconnecte-toi, puis reconnecte-toi ou crée ton ECODIM.
        </p>
        <button className="btn-primary" onClick={signOut}>Se déconnecter</button>
      </div>
    )
  }

  if (role && profile.role !== role) return <Navigate to="/" replace />

  return (
    <>
      {ecole?.nom && <header className="ecole-header">{ecole.nom}</header>}
      {children}
    </>
  )
}
