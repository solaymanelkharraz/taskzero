import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { API_BASE } from '../lib/api'

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editingTask, setEditingTask] = useState(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', assigned_date: '' });
  const [completionData, setCompletionData] = useState({ completion_link: '', completion_summary: '' });

  const { data: project, isLoading } = useQuery({
    queryKey: ['projects', id],
    queryFn: () => fetch(`${API_BASE}/projects/${id}`).then(res => res.json()),
    initialData: () => queryClient.getQueryData(['projects'])?.find(p => p.id === parseInt(id))
  });

  const createTask = useMutation({
    mutationFn: (data) => fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, project_id: id })
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsAddingTask(false);
      setNewTask({ title: '', assigned_date: '' });
      toast.success('Task added to project.');
    }
  });

  const updateTask = useMutation({
    mutationFn: ({ taskId, data }) => fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditingTask(null);
      toast.success('Task updated.');
    }
  });

  const deleteTask = useMutation({
    mutationFn: (taskId) => fetch(`${API_BASE}/tasks/${taskId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.info('Task removed.');
    }
  });

  const deleteProject = useMutation({
    mutationFn: () => fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.info('Project deleted.');
      navigate('/dashboard');
    }
  });

  const completeProject = useMutation({
    mutationFn: (data) => fetch(`${API_BASE}/projects/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
      toast.success('Project marked as finished!');
      navigate('/dashboard');
    }
  });

  if (isLoading) return <div className="p-10 text-slate-500">Loading project...</div>;
  if (!project) return <div className="p-10 text-slate-500">Project not found.</div>;

  const priorityColors = {
    high: { dot: '#ff2d6f', bg: 'rgba(255,45,111,0.1)', text: '#ff2d6f' },
    medium: { dot: '#ffaa00', bg: 'rgba(255,170,0,0.1)', text: '#ffaa00' },
    low: { dot: '#00f2ff', bg: 'rgba(0,242,255,0.1)', text: '#00f2ff' }
  };

  const colors = priorityColors[project.priority] || priorityColors.medium;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-10 max-w-5xl mx-auto space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-slate-800 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="text-slate-500 hover:text-white transition-colors">← Back</button>
            <span style={{ background: colors.bg, color: colors.text }} className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
              {project.priority} Priority
            </span>
          </div>
          <h1 className="text-5xl font-black text-white">{project.name}</h1>
          <p className="text-slate-400 text-lg max-w-2xl">{project.description || 'No description provided.'}</p>
          <button 
            onClick={() => { if(confirm('Delete project? Tasks will become standalone.')) deleteProject.mutate(); }}
            className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest"
          >
            🗑️ Delete Project
          </button>
        </div>
        <div className="flex flex-col items-end gap-4 shrink-0">
          <div className="text-right">
            <div className="text-sm text-slate-500 mb-1">Progress</div>
            <div className="text-3xl font-black text-white">{project.stats.pct}%</div>
          </div>
          <button 
            onClick={() => setIsFinishing(true)}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105"
          >
            Finish Project
          </button>
        </div>
      </div>

      {/* Task Management Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-2 h-8 bg-blue-600 rounded-full" />
            Project Tasks
          </h2>
          <button 
            onClick={() => setIsAddingTask(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg"
          >
            + Add Task
          </button>
        </div>
        
        <div className="grid gap-4">
          {project.tasks?.length === 0 ? (
            <div className="p-10 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500">
              No tasks associated with this project.
            </div>
          ) : (
            project.tasks.map(task => (
              <div key={task.id} className="group flex items-center justify-between p-5 bg-slate-800/50 hover:bg-slate-800 rounded-2xl border border-slate-700/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${task.status === 'done' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                  <div>
                    <h3 className={`text-lg font-bold ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-white'}`}>
                      {task.title}
                    </h3>
                    <div className="text-xs text-slate-500 mt-1">
                      {task.assigned_date ? `Scheduled for ${task.assigned_date}` : 'Unscheduled'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingTask(task)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => { if(confirm('Delete task?')) deleteTask.mutate(task.id); }}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-sm font-bold rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {isAddingTask && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setIsAddingTask(false) }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Add Task to Project</h2>
                <button onClick={() => setIsAddingTask(false)} className="text-slate-500 hover:text-white">✕</button>
              </div>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  createTask.mutate(newTask);
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Task Name</label>
                  <input 
                    type="text" 
                    required autoFocus
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Assigned Date (Optional)</label>
                  <input 
                    type="date" 
                    value={newTask.assigned_date}
                    onChange={e => setNewTask({ ...newTask, assigned_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsAddingTask(false)} className="text-slate-400 hover:text-white">Cancel</button>
                  <button type="submit" disabled={!newTask.title.trim()} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50">Create Task</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Task Modal */}
      <AnimatePresence>
        {editingTask && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setEditingTask(null) }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Edit Task</h2>
                <button onClick={() => setEditingTask(null)} className="text-slate-500 hover:text-white">✕</button>
              </div>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  updateTask.mutate({ 
                    taskId: editingTask.id, 
                    data: {
                      title: editingTask.title,
                      assigned_date: editingTask.assigned_date || null
                    }
                  });
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Task Name</label>
                  <input 
                    type="text" 
                    required
                    value={editingTask.title}
                    onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Assigned Date</label>
                  <input 
                    type="date" 
                    value={editingTask.assigned_date || ''}
                    onChange={e => setEditingTask({ ...editingTask, assigned_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-white">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl">Save</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Modal */}
      <AnimatePresence>
        {isFinishing && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)]"
            >
              <div className="p-8 space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black text-white">Finish Project</h2>
                  <p className="text-slate-400">Seal the deal. Provide your proof of work.</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Completion Link</label>
                    <input 
                      type="url" 
                      placeholder="https://github.com/..."
                      value={completionData.completion_link}
                      onChange={e => setCompletionData({ ...completionData, completion_link: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Final Summary</label>
                    <textarea 
                      placeholder="What was achieved?"
                      value={completionData.completion_summary}
                      onChange={e => setCompletionData({ ...completionData, completion_summary: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500 h-32 resize-none transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button 
                    onClick={() => completeProject.mutate(completionData)}
                    disabled={completeProject.isPending}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg transition-all"
                  >
                    {completeProject.isPending ? 'Archiving...' : 'Complete & Archive'}
                  </button>
                  <button 
                    onClick={() => setIsFinishing(false)}
                    className="w-full py-3 text-slate-500 font-bold hover:text-white transition-colors"
                  >
                    Not yet
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

