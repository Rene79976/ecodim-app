import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Profil from './pages/Profil'
import DefinirMotDePasse from './pages/DefinirMotDePasse'
import DashboardDirecteur from './pages/directeur/DashboardDirecteur'
import Moniteurs from './pages/directeur/Moniteurs'
import Classes from './pages/directeur/Classes'
import Rapports from './pages/directeur/Rapports'
import Statistiques from './pages/directeur/Statistiques'
import Synthese from './pages/directeur/Synthese'
import AbsencesDirecteur from './pages/directeur/AbsencesDirecteur'
import DashboardMoniteur from './pages/moniteur/DashboardMoniteur'
import Enfants from './pages/moniteur/Enfants'
import AjoutEnfant from './pages/moniteur/AjoutEnfant'
import RapportDimanche from './pages/moniteur/RapportDimanche'
import AbsencesMoniteur from './pages/moniteur/AbsencesMoniteur'

function Accueil() {
  const { profile } = useAuth()
  if (profile?.role === 'directeur') return <DashboardDirecteur />
  if (profile?.role === 'moniteur') return <DashboardMoniteur />
  return null
}

function Absences() {
  const { profile } = useAuth()
  if (profile?.role === 'directeur') return <AbsencesDirecteur />
  if (profile?.role === 'moniteur') return <AbsencesMoniteur />
  return null
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<ProtectedRoute><Accueil /></ProtectedRoute>} />
      <Route path="/absences" element={<ProtectedRoute><Absences /></ProtectedRoute>} />
      <Route path="/profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />
      <Route path="/definir-mot-de-passe" element={<ProtectedRoute><DefinirMotDePasse /></ProtectedRoute>} />

      <Route path="/moniteurs" element={<ProtectedRoute role="directeur"><Moniteurs /></ProtectedRoute>} />
      <Route path="/classes" element={<ProtectedRoute role="directeur"><Classes /></ProtectedRoute>} />
      <Route path="/rapports" element={<ProtectedRoute role="directeur"><Rapports /></ProtectedRoute>} />
      <Route path="/statistiques" element={<ProtectedRoute role="directeur"><Statistiques /></ProtectedRoute>} />
      <Route path="/synthese" element={<ProtectedRoute role="directeur"><Synthese /></ProtectedRoute>} />

      <Route path="/enfants" element={<ProtectedRoute role="moniteur"><Enfants /></ProtectedRoute>} />
      <Route path="/enfants/ajouter" element={<ProtectedRoute role="moniteur"><AjoutEnfant /></ProtectedRoute>} />
      <Route path="/rapport" element={<ProtectedRoute role="moniteur"><RapportDimanche /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
