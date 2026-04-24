import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const links = [
  { to: '/',             icon: '⚡', label: 'Today (Home)' },
  { to: '/dashboard',    icon: '📊', label: 'Dashboard' },
  { to: '/control-room', icon: '🗂️', label: 'Control Room' },
  { to: '/ideas',        icon: '💡', label: 'Ideas' },
  { to: '/habits',       icon: '🔄', label: 'Habits' },
  { to: '/calendar',     icon: '📅', label: 'Calendar' },
  { to: '/history',      icon: '📜', label: 'History' },
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
      <div className="mt-auto px-3 py-6">
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Command Palette</div>
          <div className="flex items-center justify-center gap-1.5">
            <kbd className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 text-xs text-slate-400 font-sans shadow-sm">⌘</kbd>
            <span className="text-slate-600">+</span>
            <kbd className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 text-xs text-slate-400 font-sans shadow-sm">K</kbd>
          </div>
        </div>
      </div>
    </aside>
  )
}
