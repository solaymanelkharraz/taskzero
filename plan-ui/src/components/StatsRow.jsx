import { motion } from 'framer-motion'

export default function StatsRow({ stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map(({ label, value, color }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-[var(--surface2)] border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-1"
        >
          <div className="text-2xl font-bold" style={{ color: color ?? 'var(--purple)' }}>
            {value}
          </div>
          <div className="text-xs text-[var(--text-dim)] font-medium uppercase tracking-wider">
            {label}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
