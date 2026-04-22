import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasks, cycleTask, deleteTask, createTask, updateTask, getProjects, runSweep } from '../api/client'
import StatsRow from '../components/StatsRow'
import TaskCard from '../components/TaskCard'
import QuickCapture from '../components/QuickCapture'
import Modal from '../components/Modal'

const today = new Date().toISOString().split('T')[0]

function fmt(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

export default function Today() {
  const queryClient = useQueryClient()
  const [swept,    setSwept]    = useState(null)
  const [addOpen,  setAddOpen]  = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [form,     setForm]     = useState({ title: '', project_id: '' })

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', { date: today }],
    queryFn: async () => (await getTasks({ date: today })).data
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await getProjects()).data
  })

  useEffect(() => {
    runSweep().then(r => { 
      if (r.data.swept > 0) {
        setSwept(r.data.swept)
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      }
    })
  }, [queryClient])

  const cycleMut = useMutation({
    mutationFn: cycleTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  })

  const deleteMut = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  })

  const addMut = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setAddOpen(false)
      setForm({ title: '', project_id: '' })
    }
  })

  const editMut = useMutation({
    mutationFn: (data) => updateTask(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setEditTask(null)
    }
  })

  const handleCycle = (id) => cycleMut.mutate(id)

  const handleDelete = (id) => {
    if (!confirm('Delete this task?')) return
    deleteMut.mutate(id)
  }

  const handleAdd = (e) => {
    e.preventDefault()
    addMut.mutate({ ...form, assigned_date: today })
  }

  const handleEdit = (e) => {
    e.preventDefault()
    editMut.mutate({ 
      id: editTask.id, 
      payload: { 
        title: editTask.title, 
        project_id: editTask.project_id || null, 
        assigned_date: editTask.assigned_date, 
        status: editTask.status 
      } 
    })
  }

  const total  = tasks.length
  const done   = tasks.filter(t => t.status === 'done').length
  const inProg = tasks.filter(t => t.status === 'in_progress').length
  const pct    = total > 0 ? Math.round((done / total) * 100) : 0

  // Group by project
  const grouped = tasks.reduce((acc, t) => {
    const key = t.project_name || 'Standalone'
    acc[key] = acc[key] ? [...acc[key], t] : [t]
    return acc
  }, {})

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Midnight Sweep notice */}
      <AnimatePresence>
        {swept && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex gap-2"
          >
            🌙 <strong>Midnight Sweep:</strong> {swept} task{swept > 1 ? 's' : ''} moved to backlog.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-6">
        <div className="text-xs text-[var(--purple)] font-semibold uppercase tracking-widest mb-1">⚡ Execution Zone</div>
        <h1 className="text-3xl font-bold text-[var(--text)]">Today</h1>
        <p className="text-[var(--text-dim)] text-sm mt-1">{fmt(today)} — Ship it.</p>
      </div>

      {/* Stats */}
      <StatsRow stats={[
        { label: 'Scheduled',   value: total,   color: 'var(--text)' },
        { label: 'In Progress', value: inProg,  color: 'var(--amber)' },
        { label: 'Done',        value: done,    color: 'var(--green)' },
        { label: 'Complete',    value: `${pct}%`, color: 'var(--purple)' },
      ]} />

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-1.5 bg-[var(--border)] rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-[var(--purple)] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Quick Capture */}
      <QuickCapture />

      {/* Task list */}
      <div className="bg-[var(--surface2)] border border-[var(--border)] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-sm">☑ Today's Tasks</span>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setAddOpen(true)}
            className="text-xs px-3 py-1.5 rounded-lg bg-[var(--purple-d)] hover:bg-[var(--purple)] text-white transition-colors"
          >+ Add Task</motion.button>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">🎯</div>
            <div className="font-semibold text-[var(--text-dim)]">Nothing scheduled for today</div>
            <div className="text-xs text-[var(--text-dim)] mt-1">Go to Control Room to assign tasks.</div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {Object.entries(grouped).map(([group, gtasks]) => (
              <div key={group} className="mb-4">
                <div className="text-xs text-[var(--text-dim)] uppercase tracking-widest font-semibold mb-2 flex items-center gap-1">
                  {group === 'Standalone' ? '📥' : '📁'} {group}
                  <span className="bg-[var(--border)] text-[var(--text-dim)] rounded-full px-1.5 py-0.5 text-xs">{gtasks.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {gtasks.map((t, i) => (
                    <TaskCard key={t.id} task={t} index={i} onCycle={handleCycle} onEdit={setEditTask} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Add Task Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="➕ New Task for Today">
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <input required placeholder="Task title…" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5
                       text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--purple)]" />
          <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)]">
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

      {/* Edit Task Modal */}
      <Modal open={!!editTask} onClose={() => setEditTask(null)} title="✎ Edit Task">
        {editTask && (
          <form onSubmit={handleEdit} className="flex flex-col gap-4">
            <input required value={editTask.title} onChange={e => setEditTask(t => ({ ...t, title: e.target.value }))}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5
                         text-sm text-[var(--text)] focus:outline-none focus:border-[var(--purple)]" />
            <select value={editTask.status} onChange={e => {
                const newStatus = e.target.value
                setEditTask(t => ({ 
                  ...t, 
                  status: newStatus,
                  assigned_date: newStatus === 'in_progress' ? today : t.assigned_date
                }))
              }}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)]">
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select value={editTask.project_id || ''} onChange={e => setEditTask(t => ({ ...t, project_id: e.target.value }))}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)]">
              <option value="">— Standalone —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setEditTask(null)} className="px-4 py-2 text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">Cancel</button>
              <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={editMut.isPending}
                className="px-5 py-2 bg-[var(--purple-d)] hover:bg-[var(--purple)] text-white text-sm font-semibold rounded-xl transition-colors">
                Save
              </motion.button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
