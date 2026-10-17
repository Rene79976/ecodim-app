import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [sessionChecked, setSessionChecked] = useState(false) // la session enregistrée a-t-elle été lue ?
  const [profile, setProfile] = useState(null) // ligne de la table "utilisateurs"
  const [profileUserId, setProfileUserId] = useState(null) // utilisateur dont le profil a fini de charger

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSessionChecked(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setSessionChecked(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setProfile(null)
      setProfileUserId(null)
      return
    }
    let annule = false
    supabase
      .from('utilisateurs')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (annule) return
        setProfile(data)
        setProfileUserId(session.user.id)
      })
    return () => { annule = true }
  }, [session])

  // Tant que la session n'a pas été lue, ou que le profil d'un utilisateur
  // connecté n'est pas chargé, on reste en "chargement" (pas de redirection).
  const loading = !sessionChecked || (session !== null && profileUserId !== session.user.id)

  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
