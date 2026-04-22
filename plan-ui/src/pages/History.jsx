import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getTasks } from '../api/client'

export default function History() {
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    getTasks({ status: 'done' }).then(r => setTasks(r.data))
  }, [])

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="text-xs text-[var(--purple)] font-semibold uppercase tracking-widest mb-1">📜 History</div>
        <h1 className="text-3xl font-bold">Completed Tasks</h1>
        <p className="text-[var(--text-dim)] text-sm mt-1">{tasks.length} tasks shipped. Keep going.</p>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📜</div>
          <div className="text-[var(--text-dim)]">No completed tasks yet.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 px-4 py-3 bg-[var(--surface2)] border border-[var(--border)] rounded-xl opacity-70 hover:opacity-100 transition-opacity"
            >
              <span className="text-green-500 text-sm">✓</span>
              <span className="flex-1 text-sm text-[var(--text)] line-through">{t.title}</span>
              {t.assigned_date && (
                <span className="text-xs text-[var(--text-dim)] shrink-0">
                  {new Date(t.assigned_date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
              {t.project_name !== 'Standalone' && (
                <span className="text-xs text-[var(--purple)] bg-[var(--purple-d)]/10 px-2 py-0.5 rounded-full shrink-0">{t.project_name}</span>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
