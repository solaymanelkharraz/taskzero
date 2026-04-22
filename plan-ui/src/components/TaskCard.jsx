import { motion } from 'framer-motion'

const STATUS_META = {
  todo:        { label: 'To Do',       color: 'bg-zinc-700 text-zinc-300',         icon: '○' },
  in_progress: { label: 'In Progress', color: 'bg-amber-500/20 text-amber-400',    icon: '▶' },
  done:        { label: 'Done',         color: 'bg-green-500/20 text-green-400',   icon: '✓' },
}

export default function TaskCard({ task, onCycle, onEdit, onDelete, index = 0 }) {
  const meta = STATUS_META[task.status] ?? STATUS_META.todo

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 28 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors group
        ${task.status === 'done'
          ? 'bg-[var(--surface)] border-[var(--border)] opacity-60'
          : 'bg-[var(--surface2)] border-[var(--border)] hover:border-[var(--purple-d)]'
        }`}
    >
      {/* Cycle button */}
      {onCycle && (
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onCycle(task.id)}
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-all
            ${task.status === 'done'
              ? 'border-green-500 bg-green-500/20 text-green-400'
              : task.status === 'in_progress'
              ? 'border-amber-500 bg-amber-500/20 text-amber-400'
              : 'border-[var(--border)] hover:border-[var(--purple)] text-transparent hover:text-[var(--purple)]'
            }`}
          title="Cycle status"
        >
          {meta.icon}
        </motion.button>
      )}

      {/* Title */}
      <span className={`flex-1 text-sm font-medium truncate
        ${task.status === 'done' ? 'line-through text-[var(--text-dim)]' : 'text-[var(--text)]'}`}>
        {task.title}
      </span>

      {/* Project badge */}
      {task.project_name && task.project_name !== 'Standalone' && (
        <span className="text-xs text-[var(--purple)] bg-[var(--purple-d)]/10 px-2 py-0.5 rounded-full shrink-0 hidden sm:block">
          {task.project_name}
        </span>
      )}

      {/* Status badge */}
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${meta.color}`}>
        {meta.label}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
            title="Edit"
          >✎</button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-dim)] hover:text-red-400 transition-colors"
            title="Delete"
          >🗑</button>
        )}
      </div>
    </motion.div>
  )
}
