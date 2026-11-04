import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError('Email ou mot de passe incorrect.')
      return
    }
    navigate('/')
  }

  return (
    <div className="login">
      <div className="login-hero">
        <div className="logo">Ecodim<span>Plus</span></div>
        <p>Gérez votre École du Dimanche, simplement</p>
      </div>

      <form onSubmit={handleSubmit} className="card login-carte">
        <h2 style={{ fontSize: 22 }}>Connexion</h2>
        <div>
          <label htmlFor="email">Adresse email</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password">Mot de passe</label>
          <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
