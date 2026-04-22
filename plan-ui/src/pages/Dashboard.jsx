import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getTasks, createTask, updateTask, deleteTask, getProjects, createProject, deleteProject, getWeek } from '../api/client'
import TaskCard from '../components/TaskCard'
import Modal from '../components/Modal'

const today = new Date().toISOString().split('T')[0]

export default function Dashboard() {
  const [backlog,   setBacklog]   = useState([])
  const [projects,  setProjects]  = useState([])
  const [week,      setWeek]      = useState([])
  const [weekTasks, setWeekTasks] = useState({})
  const [selPid,    setSelPid]    = useState(null)
  const [projTasks, setProjTasks] = useState([])

  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [addProjOpen, setAddProjOpen] = useState(false)
  const [editTask,    setEditTask]    = useState(null)
  const [prefillDate, setPrefillDate] = useState('')

  const [taskForm, setTaskForm] = useState({ title: '', assigned_date: '', project_id: '' })
  const [projForm, setProjForm] = useState({ name: '', description: '' })

  const load = useCallback(async () => {
    const [bl, pr, wk] = await Promise.all([
      getTasks({ backlog: 1 }),
      getProjects(),
      getWeek(),
    ])
    setBacklog(bl.data)
    setProjects(pr.data)
    setWeek(wk.data)

    // Load each day's tasks
    const promises = wk.data.map(d => getTasks({ date: d.date }).then(r => [d.date, r.data]))
    const results  = await Promise.all(promises)
    setWeekTasks(Object.fromEntries(results))
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!selPid) { setProjTasks([]); return }
    getTasks({ project_id: selPid }).then(r => setProjTasks(r.data))
  }, [selPid])

  // ── Task CRUD ─────────────────────────────────────────────
  const handleAddTask = async (e) => {
    e.preventDefault()
    await createTask({
      title: taskForm.title,
      assigned_date: taskForm.assigned_date || null,
      project_id:    taskForm.project_id || null,
    })
    setAddTaskOpen(false)
    setTaskForm({ title: '', assigned_date: '', project_id: '' })
    load()
  }

  const handleEditTask = async (e) => {
    e.preventDefault()
    await updateTask(editTask.id, {
      title:         editTask.title,
      status:        editTask.status,
      assigned_date: editTask.assigned_date || null,
      project_id:    editTask.project_id || null,
    })
    setEditTask(null)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return
    await deleteTask(id)
    load()
  }

  // ── Project CRUD ──────────────────────────────────────────
  const handleAddProject = async (e) => {
    e.preventDefault()
    await createProject(projForm)
    setAddProjOpen(false)
    setProjForm({ name: '', description: '' })
    load()
  }

  const handleDeleteProject = async (id) => {
    if (!confirm('Delete project and unlink its tasks?')) return
    await deleteProject(id)
    if (selPid === id) setSelPid(null)
    load()
  }

  const openAddTask = (date = '') => {
    setPrefillDate(date)
    setTaskForm({ title: '', assigned_date: date, project_id: '' })
    setAddTaskOpen(true)
  }

  // ── Input helper ──────────────────────────────────────────
  const inp = 'w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--purple)] transition-colors'

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="text-xs text-[var(--purple)] font-semibold uppercase tracking-widest mb-1">🗂️ Dashboard</div>
          <h1 className="text-3xl font-bold">Control Room</h1>
          <p className="text-[var(--text-dim)] text-sm mt-1">Plan your week, manage projects, run the system.</p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => openAddTask()}
          className="px-5 py-2.5 bg-[var(--purple-d)] hover:bg-[var(--purple)] text-white text-sm font-semibold rounded-xl transition-colors shrink-0">
          + New Task
        </motion.button>
      </div>

      {/* ── Backlog ─────────────────────────────────────────── */}
      <div className="text-xs text-[var(--purple)] font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
        📥 Backlog <span className="bg-[var(--border)] text-[var(--text-dim)] rounded-full px-1.5">{backlog.length}</span>
      </div>
      <div className="bg-[var(--surface2)] border border-[var(--border)] rounded-2xl p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-sm">Unscheduled Tasks</span>
          <button onClick={() => openAddTask()}
            className="text-xs text-[var(--text-dim)] hover:text-[var(--purple)] transition-colors">+ Add to Backlog</button>
        </div>
        {backlog.length === 0
          ? <div className="text-center py-8 text-[var(--text-dim)] text-sm">🎯 Backlog is clear. Impressive.</div>
          : <div className="flex flex-col gap-2">
              <AnimatePresence mode="popLayout">
                {backlog.map((t, i) => (
                  <TaskCard key={t.id} task={t} index={i} onEdit={setEditTask} onDelete={handleDelete} />
                ))}
              </AnimatePresence>
            </div>
        }
      </div>

      {/* ── Calendar Strip ──────────────────────────────────── */}
      <div className="text-xs text-[var(--purple)] font-semibold uppercase tracking-widest mb-3">📅 Next 7 Days</div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 snap-x">
        {week.map((d, i) => (
          <motion.div
            key={d.date}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => openAddTask(d.date)}
            className={`shrink-0 snap-start flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border cursor-pointer transition-all
              ${d.date === today
                ? 'bg-[var(--purple-d)]/20 border-[var(--purple)] text-[var(--purple)]'
                : 'bg-[var(--surface2)] border-[var(--border)] hover:border-[var(--purple-d)] text-[var(--text-dim)]'
              }`}
          >
            <div className="text-xs font-bold uppercase">{d.dow}</div>
            <div className="text-2xl font-bold text-[var(--text)]">{d.day}</div>
            <div className="text-xs">{d.month}</div>
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: Math.min(d.count, 4) }).map((_, j) => (
                <div key={j} className="w-1.5 h-1.5 rounded-full bg-[var(--purple)]" />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Weekly task detail */}
      {week.map(d => {
        const wt = weekTasks[d.date] ?? []
        if (!wt.length) return null
        return (
          <div key={d.date} className="bg-[var(--surface2)] border border-[var(--border)] rounded-2xl p-5 mb-3">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm">
                📅 {d.date === today ? 'Today' : new Date(d.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
              <span className="text-xs text-[var(--text-dim)]">{wt.length} task{wt.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-col gap-2">
              {wt.map((t, i) => <TaskCard key={t.id} task={t} index={i} onEdit={setEditTask} onDelete={handleDelete} />)}
            </div>
          </div>
        )
      })}

      {/* ── Project Hub ─────────────────────────────────────── */}
      <div className="text-xs text-[var(--purple)] font-semibold uppercase tracking-widest mt-8 mb-3 flex items-center gap-2">
        📁 Project Hub <span className="bg-[var(--border)] text-[var(--text-dim)] rounded-full px-1.5">{projects.length}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {projects.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => setSelPid(selPid === p.id ? null : p.id)}
            className={`relative cursor-pointer rounded-2xl border p-5 transition-all
              ${selPid === p.id ? 'border-[var(--purple)] bg-[var(--purple-d)]/10' : 'border-[var(--border)] bg-[var(--surface2)] hover:border-[var(--purple-d)]'}`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="font-semibold text-sm">{p.name}</div>
              <button onClick={e => { e.stopPropagation(); handleDeleteProject(p.id) }}
                className="text-[var(--text-dim)] hover:text-red-400 text-xs transition-colors">🗑</button>
            </div>
            {p.description && <div className="text-xs text-[var(--text-dim)] mb-3">{p.description}</div>}
            <div className="flex items-center justify-between text-xs text-[var(--text-dim)] mb-1">
              <span>{p.stats.done}/{p.stats.total} done</span>
              <span className="text-[var(--purple)] font-bold">{p.stats.pct}%</span>
            </div>
            <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
              <motion.div className="h-full bg-[var(--purple)] rounded-full"
                initial={{ width: 0 }} animate={{ width: `${p.stats.pct}%` }} transition={{ duration: 0.6 }} />
            </div>
          </motion.div>
        ))}

        {/* Add project card */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setAddProjOpen(true)}
          className="cursor-pointer rounded-2xl border-2 border-dashed border-[var(--border)] p-5 flex flex-col items-center justify-center gap-2
                     text-[var(--text-dim)] hover:border-[var(--purple-d)] hover:text-[var(--purple)] transition-all min-h-[100px]">
          <span className="text-2xl">+</span>
          <span className="text-sm font-medium">New Project</span>
        </motion.div>
      </div>

      {/* Selected project tasks */}
      <AnimatePresence>
        {selPid && projTasks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-[var(--surface2)] border border-[var(--purple-d)] rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm text-[var(--purple)]">
                📁 {projects.find(p => p.id === selPid)?.name} — All Tasks
              </span>
              <button onClick={() => setSelPid(null)} className="text-[var(--text-dim)] hover:text-[var(--text)] text-sm transition-colors">✕</button>
            </div>
            <div className="flex flex-col gap-2">
              {projTasks.map((t, i) => <TaskCard key={t.id} task={t} index={i} onEdit={setEditTask} onDelete={handleDelete} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add Task Modal ─────────────────────────────────── */}
      <Modal open={addTaskOpen} onClose={() => setAddTaskOpen(false)} title="➕ New Task">
        <form onSubmit={handleAddTask} className="flex flex-col gap-4">
          <input required placeholder="Task title…" value={taskForm.title}
            onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} className={inp} />
          <input type="date" value={taskForm.assigned_date}
            onChange={e => setTaskForm(f => ({ ...f, assigned_date: e.target.value }))} className={inp} />
          <select value={taskForm.project_id} onChange={e => setTaskForm(f => ({ ...f, project_id: e.target.value }))} className={inp}>
            <option value="">— Standalone —</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAddTaskOpen(false)} className="px-4 py-2 text-sm text-[var(--text-dim)]">Cancel</button>
            <motion.button whileTap={{ scale: 0.95 }} type="submit"
              className="px-5 py-2 bg-[var(--purple-d)] hover:bg-[var(--purple)] text-white text-sm font-semibold rounded-xl transition-colors">
              Add Task
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Task Modal ────────────────────────────────── */}
      <Modal open={!!editTask} onClose={() => setEditTask(null)} title="✎ Edit Task">
        {editTask && (
          <form onSubmit={handleEditTask} className="flex flex-col gap-4">
            <input required value={editTask.title} onChange={e => setEditTask(t => ({ ...t, title: e.target.value }))} className={inp} />
            <select value={editTask.status} onChange={e => setEditTask(t => ({ ...t, status: e.target.value }))} className={inp}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <input type="date" value={editTask.assigned_date || ''} onChange={e => setEditTask(t => ({ ...t, assigned_date: e.target.value }))} className={inp} />
            <select value={editTask.project_id || ''} onChange={e => setEditTask(t => ({ ...t, project_id: e.target.value }))} className={inp}>
              <option value="">— Standalone —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setEditTask(null)} className="px-4 py-2 text-sm text-[var(--text-dim)]">Cancel</button>
              <motion.button whileTap={{ scale: 0.95 }} type="submit"
                className="px-5 py-2 bg-[var(--purple-d)] hover:bg-[var(--purple)] text-white text-sm font-semibold rounded-xl transition-colors">
                Save
              </motion.button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Add Project Modal ──────────────────────────────── */}
      <Modal open={addProjOpen} onClose={() => setAddProjOpen(false)} title="📁 New Project">
        <form onSubmit={handleAddProject} className="flex flex-col gap-4">
          <input required placeholder="Project name…" value={projForm.name}
            onChange={e => setProjForm(f => ({ ...f, name: e.target.value }))} className={inp} />
          <textarea placeholder="Description (optional)…" rows={3} value={projForm.description}
            onChange={e => setProjForm(f => ({ ...f, description: e.target.value }))}
            className={inp + ' resize-none'} />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAddProjOpen(false)} className="px-4 py-2 text-sm text-[var(--text-dim)]">Cancel</button>
            <motion.button whileTap={{ scale: 0.95 }} type="submit"
              className="px-5 py-2 bg-[var(--purple-d)] hover:bg-[var(--purple)] text-white text-sm font-semibold rounded-xl transition-colors">
              Create
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
