import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const links = [
  { to: '/',          icon: '⚡', label: 'Today' },
  { to: '/dashboard', icon: '🗂️', label: 'Control Room' },
  { to: '/ideas',     icon: '💡', label: 'Brain Dump' },
  { to: '/calendar',  icon: '📅', label: 'Calendar' },
  { to: '/history',   icon: '📜', label: 'History' },
]

export default function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 h-screen w-56 flex flex-col gap-1 pt-6 px-3
                      bg-[var(--surface)] border-r border-[var(--border)] z-40">
      {/* Logo */}
      <div className="px-3 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <img src="/logo.png" alt="TaskZero Logo" className="w-30 h-20 object-contain" />
        </div>
        <div className="text-[var(--text-dim)] text-xs mt-0.5">Execution system</div>
      </div>

      {/* Nav links */}
      {links.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
            ${isActive
              ? 'bg-[var(--purple-d)] text-white'
              : 'text-[var(--text-dim)] hover:bg-[var(--surface2)] hover:text-[var(--text)]'
            }`
          }
        >
          {({ isActive }) => (
            <motion.span
              className="flex items-center gap-3 w-full"
              animate={{ x: isActive ? 2 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <span className="text-base leading-none">{icon}</span>
              {label}
            </motion.span>
          )}
        </NavLink>
      ))}
    </aside>
  )
}
