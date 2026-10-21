import { useState } from 'react'
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { supabase } from './lib/supabase'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Profil from './pages/Profil'
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

function DefinirMotDePasse() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [mdp, setMdp] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)

  async function valider(e) {
    e.preventDefault()
    setErreur('')
    if (mdp.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (mdp !== confirmation) {
      setErreur('Les deux mots de passe ne sont pas identiques.')
      return
    }
    setChargement(true)
    const { error } = await supabase.auth.updateUser({ password: mdp })
    setChargement(false)
    if (error) {
      setErreur("Impossible d'enregistrer le mot de passe : " + error.message)
      return
    }
    navigate('/')
  }

  return (
    <div className="page" style={{ paddingTop: 60, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: 'var(--accent)', fontSize: 24 }}>EcodimPlus</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          {profile?.prenoms ? `Bienvenue ${profile.prenoms}, choisis ton mot de passe` : 'Choisis ton mot de passe'}
        </p>
      </div>

      <form onSubmit={valider} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label htmlFor="mdp">Nouveau mot de passe (8 caractères minimum)</label>
          <input id="mdp" type="password" autoComplete="new-password" required value={mdp} onChange={(e) => setMdp(e.target.value)} />
        </div>
        <div>
          <label htmlFor="confirmation">Confirme le mot de passe</label>
          <input id="confirmation" type="password" autoComplete="new-password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
        </div>
        {erreur && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{erreur}</div>}
        <button className="btn-primary" type="submit" disabled={chargement}>
          {chargement ? 'Enregistrement…' : 'Enregistrer mon mot de passe'}
        </button>
      </form>
    </div>
  )
}

function Inscription() {
  const navigate = useNavigate()
  const [f, setF] = useState({ ecole: '', nom: '', prenoms: '', email: '', mdp: '', confirmation: '' })
  const [erreur, setErreur] = useState('')
  const [info, setInfo] = useState('')
  const [chargement, setChargement] = useState(false)
  const maj = (cle, valeur) => setF({ ...f, [cle]: valeur })

  async function valider(e) {
    e.preventDefault()
    setErreur('')
    setInfo('')
    if (!f.ecole.trim()) { setErreur("Donne le nom de ton ECODIM."); return }
    if (f.mdp.length < 8) { setErreur('Le mot de passe doit contenir au moins 8 caractères.'); return }
    if (f.mdp !== f.confirmation) { setErreur('Les deux mots de passe ne sont pas identiques.'); return }
    setChargement(true)
    const { data, error } = await supabase.auth.signUp({
      email: f.email.trim(),
      password: f.mdp,
      options: { data: { nom_ecole: f.ecole.trim(), nom: f.nom.trim(), prenoms: f.prenoms.trim() } },
    })
    setChargement(false)
    if (error) { setErreur('Inscription impossible : ' + error.message); return }
    if (data.session) { navigate('/'); return }
    setInfo("Un email de confirmation t'a été envoyé. Clique sur le lien qu'il contient, puis connecte-toi.")
  }

  return (
    <div className="page" style={{ paddingTop: 40, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: 'var(--accent)', fontSize: 26 }}>EcodimPlus</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Crée ton ECODIM</p>
      </div>

      <form onSubmit={valider} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label htmlFor="ecole">Nom de ton ECODIM</label>
          <input id="ecole" required value={f.ecole} onChange={(e) => maj('ecole', e.target.value)} placeholder="Ex : ECODIM Lièvre Rouge" />
        </div>
        <div>
          <label htmlFor="nom">Ton nom</label>
          <input id="nom" required value={f.nom} onChange={(e) => maj('nom', e.target.value)} />
        </div>
        <div>
          <label htmlFor="prenoms">Tes prénoms</label>
          <input id="prenoms" required value={f.prenoms} onChange={(e) => maj('prenoms', e.target.value)} />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required autoComplete="email" value={f.email} onChange={(e) => maj('email', e.target.value)} />
        </div>
        <div>
          <label htmlFor="mdp">Mot de passe (8 caractères minimum)</label>
          <input id="mdp" type="password" autoComplete="new-password" required value={f.mdp} onChange={(e) => maj('mdp', e.target.value)} />
        </div>
        <div>
          <label htmlFor="confirmation">Confirme le mot de passe</label>
          <input id="confirmation" type="password" autoComplete="new-password" required value={f.confirmation} onChange={(e) => maj('confirmation', e.target.value)} />
        </div>
        {erreur && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{erreur}</div>}
        {info && <div style={{ color: 'var(--accent)', fontSize: 13 }}>{info}</div>}
        <button className="btn-primary" type="submit" disabled={chargement}>
          {chargement ? 'Création…' : 'Créer mon ECODIM'}
        </button>
      </form>

      <div style={{ textAlign: 'center', fontSize: 14 }}>
        Déjà un compte ? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 700 }}>Se connecter</Link>
      </div>
    </div>
  )
}

function PageConnexion() {
  return (
    <>
      <Login />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '14px 20px', textAlign: 'center', fontSize: 14 }}>
        Pas encore d'ECODIM ? <Link to="/inscription" style={{ color: 'var(--accent)', fontWeight: 700 }}>Créer mon ECODIM</Link>
      </div>
    </>
  )
}

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
      <Route path="/login" element={<PageConnexion />} />
      <Route path="/inscription" element={<Inscription />} />

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
