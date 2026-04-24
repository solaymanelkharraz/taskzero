import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { API_BASE } from '../lib/api'

export default function Ideas() {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  const [editingIdea, setEditingIdea] = useState(null);
  const [convertingIdea, setConvertingIdea] = useState(null);

  const { data: ideas } = useQuery({ 
    queryKey: ['ideas'],
    queryFn: () => fetch(`${API_BASE}/ideas`).then(res => res.json())
  });
  const { data: categories } = useQuery({ 
    queryKey: ['idea-categories'],
    queryFn: () => fetch(`${API_BASE}/idea-categories`).then(res => res.json())
  });

  const createIdea = useMutation({
    mutationFn: (data) => fetch(`${API_BASE}/ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      setContent('');
      toast.success('Idea captured.');
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
    }
  });

  const updateIdea = useMutation({
    mutationFn: ({ id, data }) => fetch(`${API_BASE}/ideas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['ideas'] });
      const previous = queryClient.getQueryData(['ideas']);
      queryClient.setQueryData(['ideas'], (old) => 
        old?.map(i => i.id === id ? { ...i, ...data } : i)
      );
      setEditingIdea(null);
      toast.success('Idea updated.');
      return { previous };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['ideas'], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['ideas'] })
  });

  const deleteIdea = useMutation({
    mutationFn: (id) => fetch(`${API_BASE}/ideas/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['ideas'] });
      const previous = queryClient.getQueryData(['ideas']);
      queryClient.setQueryData(['ideas'], (old) => old?.filter(i => i.id !== id));
      toast.info('Idea deleted.');
      return { previous };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['ideas'], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['ideas'] })
  });

  const createCategory = useMutation({
    mutationFn: (name) => fetch(`${API_BASE}/idea-categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    }).then(res => res.json()),
    onSuccess: () => {
      setNewCategoryName('');
      toast.success('Category created.');
      queryClient.invalidateQueries({ queryKey: ['idea-categories'] });
    }
  });

  const convertIdea = useMutation({
    mutationFn: ({ id, data }) => fetch(`${API_BASE}/ideas/${id}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      setConvertingIdea(null);
      toast.success('Idea converted to task!', {
        description: 'You can find it in your backlog.',
      });
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const handleCapture = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    createIdea.mutate({ 
      content: content.trim(), 
      category_id: categoryId ? parseInt(categoryId) : null 
    });
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    createCategory.mutate(newCategoryName.trim());
  };

  const filteredIdeas = (ideas || []).filter(idea => {
    if (filterCategory === 'All') return true;
    if (filterCategory === 'Uncategorized') return !idea.category_id;
    return idea.category_id === filterCategory;
  });

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 space-y-8 relative">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white">Ideas</h1>
          <p className="text-slate-400 mt-2">Raw thoughts. Filter and convert.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
        {/* Sidebar Controls */}
        <div className="space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl">
            <h2 className="font-bold text-white mb-4">Add Idea</h2>
            <form onSubmit={handleCapture} className="flex flex-col gap-3">
              <textarea 
                value={content} 
                onChange={e => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 h-24 resize-none transition-all" 
              />
              <select 
                value={categoryId} 
                onChange={e => setCategoryId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
              >
                <option value="">Uncategorized</option>
                {categories?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button 
                type="submit" 
                disabled={!content.trim() || createIdea.isPending}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
              >
                Save Idea
              </button>
            </form>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl">
            <h2 className="font-bold text-white mb-4">Manage Categories</h2>
            <form onSubmit={handleCreateCategory} className="flex flex-col gap-3 mb-6">
              <input 
                type="text" 
                value={newCategoryName} 
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="New Category Name..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
              />
              <button 
                type="submit" 
                disabled={!newCategoryName.trim() || createCategory.isPending}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 text-sm"
              >
                + Add Category
              </button>
            </form>

            <h3 className="font-bold text-slate-400 text-xs uppercase mb-3 tracking-wider">Filters</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setFilterCategory('All')}
                className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterCategory === 'All' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
              >
                All Ideas
              </button>
              <button
                onClick={() => setFilterCategory('Uncategorized')}
                className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterCategory === 'Uncategorized' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
              >
                Uncategorized
              </button>
              {categories?.map(c => (
                <button
                  key={c.id}
                  onClick={() => setFilterCategory(c.id)}
                  className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterCategory === c.id ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ideas Grid */}
        <div className="space-y-4">
          {filteredIdeas.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-800/50">
              <div className="text-4xl mb-3">💡</div>
              <div className="font-semibold text-slate-400">No ideas found</div>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredIdeas.map((idea) => (
                <motion.div
                  key={idea.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col gap-3 hover:border-blue-500/50 transition-colors shadow-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold px-2 py-1 bg-slate-700 text-slate-300 rounded">
                      {idea.category_name || 'Uncategorized'}
                    </span>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setConvertingIdea(idea)}
                        className="text-slate-400 hover:text-emerald-400 transition-colors text-sm font-medium flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                        </svg>
                        Convert
                      </button>
                      <button 
                        onClick={() => setEditingIdea({ id: idea.id, content: idea.content, category_id: idea.category_id || '' })}
                        className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => { if(confirm('Delete idea?')) deleteIdea.mutate(idea.id); }}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {idea.content}
                  </p>
                  <div className="text-xs text-slate-500 mt-2">
                    {new Date(idea.created_at).toLocaleString()}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Convert Idea Modal */}
      <AnimatePresence>
        {convertingIdea && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Convert to Task</h2>
                <button onClick={() => setConvertingIdea(null)} className="text-slate-500 hover:text-white">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 text-sm text-slate-300 italic">
                  "{convertingIdea.content}"
                </div>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    convertIdea.mutate({ 
                      id: convertingIdea.id, 
                      data: { 
                        title: formData.get('title'),
                        assigned_date: formData.get('date') || null,
                        project_id: formData.get('project') ? parseInt(formData.get('project')) : null
                      } 
                    });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Task Title</label>
                    <input 
                      name="title"
                      required
                      defaultValue={convertingIdea.content}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Work Date</label>
                      <input name="date" type="date" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Project</label>
                      <select name="project" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500">
                        <option value="">None</option>
                        {queryClient.getQueryData(['projects'])?.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setConvertingIdea(null)} className="px-5 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
                    <button type="submit" disabled={convertIdea.isPending} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50">Create Task</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Idea Modal */}
      <AnimatePresence>
        {editingIdea && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Edit Idea</h2>
                <button onClick={() => setEditingIdea(null)} className="text-slate-500 hover:text-white">✕</button>
              </div>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  updateIdea.mutate({ 
                    id: editingIdea.id, 
                    data: {
                      content: editingIdea.content,
                      category_id: editingIdea.category_id ? parseInt(editingIdea.category_id) : null
                    }
                  });
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Content</label>
                  <textarea 
                    required
                    value={editingIdea.content}
                    onChange={e => setEditingIdea({ ...editingIdea, content: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 h-32 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Category</label>
                  <select 
                    value={editingIdea.category_id}
                    onChange={e => setEditingIdea({ ...editingIdea, category_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Uncategorized</option>
                    {categories?.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingIdea(null)} className="px-5 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" disabled={updateIdea.isPending || !editingIdea.content.trim()} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
