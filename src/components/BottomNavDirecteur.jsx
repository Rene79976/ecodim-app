import { NavLink } from 'react-router-dom'
import Icone from './Icone'

const items = [
  { to: '/', label: 'Accueil', icone: 'home' },
  { to: '/moniteurs', label: 'Moniteurs', icone: 'users' },
  { to: '/classes', label: 'Classes', icone: 'grid' },
  { to: '/rapports', label: 'Rapports', icone: 'file' },
  { to: '/statistiques', label: 'Stats', icone: 'chart' },
]

export default function BottomNavDirecteur() {
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
