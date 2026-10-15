import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Accueil' },
  { to: '/moniteurs', label: 'Moniteurs' },
  { to: '/classes', label: 'Classes' },
  { to: '/rapports', label: 'Rapports' },
  { to: '/statistiques', label: 'Stats' },
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
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
