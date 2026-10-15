import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// role: "directeur" | "moniteur" | undefined (n'importe quel role connecté)
export default function ProtectedRoute({ children, role }) {
  const { session, profile, loading } = useAuth()

  if (loading) return <div style={{ padding: 24 }}>Chargement…</div>
  if (!session) return <Navigate to="/login" replace />
  if (role && profile?.role !== role) return <Navigate to="/" replace />

  return children
}
