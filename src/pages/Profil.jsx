import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Profil() {
  const { profile, ecole, session, signOut } = useAuth()

  const [ouvert, setOuvert] = useState(false)
  const [ancien, setAncien] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [chargement, setChargement] = useState(false)

  function fermer() {
    setOuvert(false)
    setAncien('')
    setNouveau('')
    setConfirmation('')
    setErreur('')
  }

  async function changerMotDePasse(e) {
    e.preventDefault()
    setErreur('')
    setSucces('')
    if (nouveau.length < 8) {
      setErreur('Le nouveau mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (nouveau !== confirmation) {
      setErreur('Les deux nouveaux mots de passe ne sont pas identiques.')
      return
    }
    if (nouveau === ancien) {
      setErreur("Le nouveau mot de passe doit être différent de l'actuel.")
      return
    }
    setChargement(true)

    // On vérifie d'abord le mot de passe actuel (protège un téléphone resté déverrouillé).
    const { error: erreurVerif } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: ancien,
    })
    if (erreurVerif) {
      setChargement(false)
      setErreur('Mot de passe actuel incorrect.')
      return
    }

    const { error } = await supabase.auth.updateUser({ password: nouveau })
    setChargement(false)
    if (error) {
      setErreur('Impossible de changer le mot de passe : ' + error.message)
      return
    }
    fermer()
    setSucces('Ton mot de passe a bien été modifié.')
  }

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
        {ecole?.nom && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>ECODIM</div>
            <div style={{ fontSize: 14 }}>{ecole.nom}</div>
          </div>
        )}
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Email</div>
          <div style={{ fontSize: 14 }}>{session?.user?.email}</div>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Mot de passe</div>

        {succes && <div style={{ fontSize: 13, color: 'var(--clay)' }}>{succes}</div>}

        {!ouvert ? (
          <button className="btn-outline" onClick={() => { setSucces(''); setOuvert(true) }}>
            Changer mon mot de passe
          </button>
        ) : (
          <form onSubmit={changerMotDePasse} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label htmlFor="ancien">Mot de passe actuel</label>
              <input id="ancien" type="password" autoComplete="current-password" required value={ancien} onChange={(e) => setAncien(e.target.value)} />
            </div>
            <div>
              <label htmlFor="nouveau">Nouveau mot de passe (8 caractères minimum)</label>
              <input id="nouveau" type="password" autoComplete="new-password" required value={nouveau} onChange={(e) => setNouveau(e.target.value)} />
            </div>
            <div>
              <label htmlFor="confirmation">Confirme le nouveau mot de passe</label>
              <input id="confirmation" type="password" autoComplete="new-password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
            </div>
            {erreur && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{erreur}</div>}
            <button className="btn-primary" type="submit" disabled={chargement}>
              {chargement ? 'Enregistrement…' : 'Enregistrer le nouveau mot de passe'}
            </button>
            <button type="button" className="btn-outline" onClick={fermer}>Annuler</button>
          </form>
        )}
      </div>

      <button className="btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={signOut}>
        Se déconnecter
      </button>
    </div>
  )
}
