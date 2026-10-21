import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [profile, setProfile] = useState(null)
  const [ecole, setEcole] = useState(null)
  const [profileUserId, setProfileUserId] = useState(null)

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
      setEcole(null)
      setProfileUserId(null)
      return
    }
    let annule = false
    async function chargerProfil() {
      const lire = () => supabase.from('utilisateurs').select('*').eq('id', session.user.id).maybeSingle()
      let { data } = await lire()

      // Première connexion d'un directeur qui vient de s'inscrire : on crée son ECODIM.
      if (!data && session.user.user_metadata?.nom_ecole) {
        await supabase.rpc('finaliser_inscription')
        const res = await lire()
        data = res.data
      }

      let ecoleData = null
      if (data) {
        const res = await supabase.from('ecoles_dimanche').select('id, nom').eq('id', data.ecole_dimanche_id).maybeSingle()
        ecoleData = res.data
      }

      if (annule) return
      setProfile(data)
      setEcole(ecoleData)
      setProfileUserId(session.user.id)
    }
    chargerProfil()
    return () => { annule = true }
  }, [session])

  const loading = !sessionChecked || (session !== null && profileUserId !== session.user.id)

  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ session, profile, ecole, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
