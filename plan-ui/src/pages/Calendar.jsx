import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getTasks } from '../api/client'

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function fmt(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function Calendar() {
  const now   = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [tasksByDate, setTasksByDate] = useState({})

  const todayStr = fmt(now.getFullYear(), now.getMonth(), now.getDate())
  const days     = getDaysInMonth(year, month)
  const firstDow = new Date(year, month, 1).getDay() // 0=Sun

  useEffect(() => {
    // Fetch all tasks for this month
    const start = fmt(year, month, 1)
    const end   = fmt(year, month, days)
    getTasks().then(r => {
      const byDate = {}
      r.data.forEach(t => {
        if (t.assigned_date >= start && t.assigned_date <= end) {
          byDate[t.assigned_date] = byDate[t.assigned_date] ? [...byDate[t.assigned_date], t] : [t]
        }
      })
      setTasksByDate(byDate)
    })
  }, [year, month, days])

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const prev = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  const next = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <div className="text-xs text-[var(--purple)] font-semibold uppercase tracking-widest mb-1">📅 Calendar</div>
        <h1 className="text-3xl font-bold">Full Calendar</h1>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prev} className="px-3 py-1.5 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-sm hover:border-[var(--purple-d)] transition-colors">‹ Prev</button>
        <span className="font-semibold">{monthLabel}</span>
        <button onClick={next} className="px-3 py-1.5 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-sm hover:border-[var(--purple-d)] transition-colors">Next ›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="text-center text-xs text-[var(--text-dim)] font-semibold py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDow }).map((_, i) => <div key={`empty-${i}`} />)}

        {/* Day cells */}
        {Array.from({ length: days }).map((_, i) => {
          const day    = i + 1
          const dateStr = fmt(year, month, day)
          const dayTasks = tasksByDate[dateStr] ?? []
          const isToday  = dateStr === todayStr

          return (
            <motion.div
              key={day}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.01 }}
              className={`rounded-xl border p-1.5 min-h-[70px] flex flex-col transition-all
                ${isToday
                  ? 'border-[var(--purple)] bg-[var(--purple-d)]/10'
                  : 'border-[var(--border)] bg-[var(--surface2)] hover:border-[var(--border)]'
                }`}
            >
              <div className={`text-xs font-bold mb-1 ${isToday ? 'text-[var(--purple)]' : 'text-[var(--text-dim)]'}`}>{day}</div>
              <div className="flex flex-col gap-0.5">
                {dayTasks.slice(0, 3).map(t => (
                  <div key={t.id}
                    className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate
                      ${t.status === 'done' ? 'bg-green-500/10 text-green-400'
                        : t.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-[var(--purple-d)]/10 text-[var(--purple)]'
                      }`}
                  >{t.title}</div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-[9px] text-[var(--text-dim)]">+{dayTasks.length - 3} more</div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
