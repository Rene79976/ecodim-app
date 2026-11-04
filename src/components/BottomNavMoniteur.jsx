import { NavLink } from 'react-router-dom'
import Icone from './Icone'

const items = [
  { to: '/', label: 'Ma classe', icone: 'home' },
  { to: '/enfants', label: 'Enfants', icone: 'users' },
  { to: '/profil', label: 'Profil', icone: 'child' },
]

export default function BottomNavMoniteur() {
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          <Icone nom={item.icone} taille={22} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
