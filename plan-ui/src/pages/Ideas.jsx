import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getIdeas, createIdea, deleteIdea, convertIdea, getProjects } from '../api/client'
import Modal from '../components/Modal'

export default function Ideas() {
  const [ideas,    setIdeas]    = useState([])
  const [projects, setProjects] = useState([])
  const [content,  setContent]  = useState('')
  const [saving,   setSaving]   = useState(false)
  const [cvt,      setCvt]      = useState(null) // idea being converted
  const [cvtForm,  setCvtForm]  = useState({ title: '', assigned_date: '', project_id: '' })

  const inp = 'w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--purple)] transition-colors'

  const load = useCallback(async () => {
    const [ir, pr] = await Promise.all([getIdeas(), getProjects()])
    setIdeas(ir.data)
    setProjects(pr.data)
  }, [])

  useEffect(() => { load() }, [load])

  const handleCapture = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)
    try {
      await createIdea({ content: content.trim() })
      setContent('')
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this idea?')) return
    await deleteIdea(id)
    setIdeas(prev => prev.filter(i => i.id !== id))
  }

  const openConvert = (idea) => {
    setCvt(idea)
    setCvtForm({ title: idea.content.slice(0, 120), assigned_date: '', project_id: '' })
  }

  const handleConvert = async (e) => {
    e.preventDefault()
    await convertIdea(cvt.id, {
      title:         cvtForm.title,
      assigned_date: cvtForm.assigned_date || null,
      project_id:    cvtForm.project_id || null,
    })
    setCvt(null)
    load()
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="text-xs text-[var(--purple)] font-semibold uppercase tracking-widest mb-1">💡 Brain Dump</div>
          <h1 className="text-3xl font-bold">Ideas</h1>
          <p className="text-[var(--text-dim)] text-sm mt-1">Raw thoughts. No judgement. Convert the good ones.</p>
        </div>
        <div className="bg-[var(--surface2)] border border-[var(--border)] rounded-2xl px-5 py-3 text-center shrink-0">
          <div className="text-2xl font-bold text-[var(--purple)]">{ideas.length}</div>
          <div className="text-xs text-[var(--text-dim)] uppercase tracking-wider">Ideas</div>
        </div>
      </div>

      {/* Capture form */}
      <div className="bg-[var(--surface2)] border border-[var(--border)] rounded-2xl p-5 mb-6">
        <div className="font-semibold text-sm mb-3 flex items-center gap-2">
          <span className="text-[var(--purple)]">+</span> New Idea
        </div>
        <form onSubmit={handleCapture} className="flex gap-2">
          <input type="text" value={content} onChange={e => setContent(e.target.value)}
            placeholder="Type your idea here — don't overthink it"
            className={inp + ' flex-1'} />
          <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={saving}
            className="px-5 py-2.5 bg-[var(--purple-d)] hover:bg-[var(--purple)] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 shrink-0">
            {saving ? '…' : 'Save'}
          </motion.button>
        </form>
      </div>

      {/* Ideas grid */}
      {ideas.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">💡</div>
          <div className="font-semibold text-[var(--text-dim)]">Brain Dump is empty</div>
          <div className="text-xs text-[var(--text-dim)] mt-1">Use Quick Capture on Today page or the form above.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {ideas.map((idea, i) => (
              <motion.div
                key={idea.id}
                layout
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1,    y: 0 }}
                exit={{ opacity: 0, scale: 0.88, x: -20 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 280, damping: 25 }}
                className="bg-[var(--surface2)] border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-3 hover:border-[var(--purple-d)] transition-colors"
              >
                <p className="text-sm text-[var(--text)] leading-relaxed flex-1 whitespace-pre-wrap">
                  {idea.content}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-dim)]">
                    🕐 {new Date(idea.created_at).toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex gap-1">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => openConvert(idea)}
                      className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs transition-colors"
                      title="Convert to task">↗ Task</motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(idea.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-dim)] hover:text-red-400 text-xs transition-colors"
                      title="Delete">🗑</motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Convert Modal */}
      <Modal open={!!cvt} onClose={() => setCvt(null)} title="↗ Convert to Task">
        {cvt && (
          <form onSubmit={handleConvert} className="flex flex-col gap-4">
            {/* Idea preview */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3">
              <div className="text-xs text-[var(--text-dim)] uppercase tracking-wider mb-1">Original Idea</div>
              <p className="text-sm text-[var(--text-dim)] leading-relaxed">{cvt.content}</p>
            </div>
            <input required placeholder="Make it actionable…" value={cvtForm.title}
              onChange={e => setCvtForm(f => ({ ...f, title: e.target.value }))} className={inp} />
            <input type="date" value={cvtForm.assigned_date}
              onChange={e => setCvtForm(f => ({ ...f, assigned_date: e.target.value }))} className={inp} />
            <select value={cvtForm.project_id} onChange={e => setCvtForm(f => ({ ...f, project_id: e.target.value }))} className={inp}>
              <option value="">— Standalone —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              ⚠ This idea will be permanently removed when converted.
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setCvt(null)} className="px-4 py-2 text-sm text-[var(--text-dim)]">Cancel</button>
              <motion.button whileTap={{ scale: 0.95 }} type="submit"
                className="px-5 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-xl transition-colors">
                Convert
              </motion.button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
