import { NavLink } from 'react-router-dom'

export default function BottomNavMoniteur() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>Ma classe</NavLink>
      <NavLink to="/enfants" className={({ isActive }) => (isActive ? 'active' : '')}>Enfants</NavLink>
      <NavLink to="/profil" className={({ isActive }) => (isActive ? 'active' : '')}>Profil</NavLink>
    </nav>
  )
}
