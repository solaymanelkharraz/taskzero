import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasks, getProjects, createTask } from '../api/client'
import Modal from '../components/Modal'

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function fmt(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function Calendar() {
  const queryClient = useQueryClient()
  const now   = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ title: '', assigned_date: '', project_id: '' })

  const todayStr = fmt(now.getFullYear(), now.getMonth(), now.getDate())
  const days     = getDaysInMonth(year, month)
  const firstDow = new Date(year, month, 1).getDay() // 0=Sun

  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => (await getTasks()).data
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await getProjects()).data
  })

  const addMut = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['weekTasks'] })
      setAddOpen(false)
      setForm({ title: '', assigned_date: '', project_id: '' })
    }
  })

  const handleAdd = (e) => {
    e.preventDefault()
    addMut.mutate(form)
  }

  const openAddTask = (date) => {
    setForm({ title: '', assigned_date: date, project_id: '' })
    setAddOpen(true)
  }

  // Filter tasks for the current month view
  const start = fmt(year, month, 1)
  const end   = fmt(year, month, days)
  const tasksByDate = {}
  
  allTasks.forEach(t => {
    if (t.assigned_date >= start && t.assigned_date <= end) {
      tasksByDate[t.assigned_date] = tasksByDate[t.assigned_date] ? [...tasksByDate[t.assigned_date], t] : [t]
    }
  })

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const prev = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  const next = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }

  const inp = 'w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--purple)] transition-colors'

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
              onClick={() => openAddTask(dateStr)}
              className={`rounded-xl border p-1.5 min-h-[70px] flex flex-col transition-all cursor-pointer hover:border-[var(--purple)] hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]
                ${isToday
                  ? 'border-[var(--purple)] bg-[var(--purple-d)]/10'
                  : 'border-[var(--border)] bg-[var(--surface2)]'
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

      {/* Add Task Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="➕ New Task">
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <input required placeholder="Task title…" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} />
          <input type="date" value={form.assigned_date}
            onChange={e => setForm(f => ({ ...f, assigned_date: e.target.value }))} className={inp} />
          <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} className={inp}>
            <option value="">— Standalone —</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAddOpen(false)} className="px-4 py-2 text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">Cancel</button>
            <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={addMut.isPending}
              className="px-5 py-2 bg-[var(--purple-d)] hover:bg-[var(--purple)] text-white text-sm font-semibold rounded-xl transition-colors">
              Add Task
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
