import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createIdea } from '../api/client'

export default function QuickCapture({ onCapture }) {
  const [value, setValue]   = useState('')
  const [toast,  setToast]  = useState(false)
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!value.trim()) return
    setSaving(true)
    try {
      await createIdea({ content: value.trim() })
      setValue('')
      setToast(true)
      setTimeout(() => setToast(false), 3000)
      onCapture?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-[var(--surface2)] border border-[var(--border)] rounded-2xl p-5 mb-5 relative">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[var(--purple)]">💡</span>
        <span className="font-semibold text-sm">Quick Capture</span>
        <span className="text-xs text-[var(--text-dim)]">— drops into Brain Dump, stay in the zone</span>
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Something just crossed your mind? Capture it..."
          className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5
                     text-sm text-[var(--text)] placeholder:text-[var(--text-dim)]
                     focus:outline-none focus:border-[var(--purple)] transition-colors"
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-[var(--purple-d)] hover:bg-[var(--purple)] text-white text-sm font-semibold
                     rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? '…' : 'Save'}
        </motion.button>
      </form>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute bottom-4 right-5 text-xs bg-green-500/20 text-green-400
                       border border-green-500/30 px-3 py-1.5 rounded-full"
          >
            ✓ Idea saved to Brain Dump
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
