import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { API_BASE } from '../lib/api'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', assigned_date: '', project_id: '' });

  const [sortBy, setSortBy] = useState('assigned_date'); // 'assigned_date', 'project', 'overdue'

  const queryClient = useQueryClient();
  const { data: tasks } = useQuery({ 
    queryKey: ['tasks'],
    queryFn: () => fetch(`${API_BASE}/tasks`).then(res => res.json())
  });
  const { data: projects } = useQuery({ 
    queryKey: ['projects'],
    queryFn: () => fetch(`${API_BASE}/projects`).then(res => res.json())
  });

  const completeTask = useMutation({
    mutationFn: (id) => fetch(`${API_BASE}/tasks/${id}/cycle`, { method: 'PATCH' }).then(res => res.json()),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueryData(['tasks']);
      queryClient.setQueryData(['tasks'], (old) => 
        old?.map(t => t.id === id ? { ...t, status: 'done' } : t)
      );
      toast.success('Task marked as done.');
      return { previous };
    },
    onError: (err, id, context) => queryClient.setQueryData(['tasks'], context.previous),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }) => fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueryData(['tasks']);
      queryClient.setQueryData(['tasks'], (old) => 
        old?.map(t => t.id === id ? { ...t, ...data } : t)
      );
      setEditingTask(null);
      toast.success('Task updated.');
      return { previous };
    },
    onError: (err, variables, context) => queryClient.setQueryData(['tasks'], context.previous),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const deleteTask = useMutation({
    mutationFn: (id) => fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueryData(['tasks']);
      queryClient.setQueryData(['tasks'], (old) => old?.filter(t => t.id !== id));
      toast.info('Task deleted.');
      return { previous };
    },
    onError: (err, id, context) => queryClient.setQueryData(['tasks'], context.previous),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const createTask = useMutation({
    mutationFn: (data) => fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      setIsAddingTask(false);
      setNewTask({ title: '', assigned_date: '', project_id: '' });
      toast.success('New task created.');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const createProject = useMutation({
    mutationFn: (data) => fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      setIsAddingProject(false);
      setNewProject({ name: '', description: '' });
      toast.success('Project created successfully.');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const activeTasks = tasks?.filter(t => t.status !== 'done') || [];
  
  const sortedTasks = [...activeTasks].sort((a, b) => {
    if (sortBy === 'project') return (a.project_name || '').localeCompare(b.project_name || '');
    if (sortBy === 'overdue') {
      const aDate = a.assigned_date || '9999-12-31';
      const bDate = b.assigned_date || '9999-12-31';
      return aDate.localeCompare(bDate);
    }
    // Default assigned_date
    const aDate = a.assigned_date || '9999-12-31';
    const bDate = b.assigned_date || '9999-12-31';
    return aDate.localeCompare(bDate);
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 space-y-8">
      <div className="flex justify-between items-end border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white">Control Room</h1>
          <p className="text-slate-400 mt-2">Master Overview</p>
        </div>
        <div className="flex space-x-2 bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'tasks' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'projects' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Projects
          </button>
        </div>
      </div>

      <div className="mt-8">
        {activeTab === 'tasks' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={() => setIsAddingTask(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg"
              >
                + Add Task
              </button>
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="assigned_date">Sort by Scheduled Time</option>
                <option value="overdue">Sort by Overdue</option>
                <option value="project">Sort by Project</option>
              </select>
            </div>
            {sortedTasks.map(task => (
              <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-800 rounded-xl shadow-lg border border-slate-700 hover:border-blue-500 transition-colors gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{task.title}</h3>
                  <div className="flex gap-4 text-sm mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {task.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-slate-400">{task.project_name || 'Standalone'}</span>
                    {task.assigned_date && (
                      <span className={`${task.assigned_date < format(new Date(), 'yyyy-MM-dd') ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                        {task.assigned_date}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {task.assigned_date !== format(new Date(), 'yyyy-MM-dd') && (
                    <button 
                      onClick={() => {
                        fetch(`${API_BASE}/tasks/${task.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ assigned_date: format(new Date(), 'yyyy-MM-dd') })
                        }).then(() => {
                          toast.success('Task moved to Today.');
                          queryClient.invalidateQueries({ queryKey: ['tasks'] });
                        });
                      }}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Work Today
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setEditingTask({
                        id: task.id,
                        title: task.title,
                        assigned_date: task.assigned_date || '',
                        project_id: task.project_id || ''
                      });
                    }}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => { if(confirm('Delete task?')) deleteTask.mutate(task.id); }}
                    className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                  <button 
                    onClick={() => completeTask.mutate(task.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'projects' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex justify-end">
              <button 
                onClick={() => setIsAddingProject(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg"
              >
                + Add Project
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects?.map(project => (
              <div key={project.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white">{project.name}</h3>
                  </div>
                  <div className="flex gap-4 text-sm text-slate-400 mb-6">
                    <div>Tasks: <span className="text-white">{project.stats.total}</span></div>
                    <div>Done: <span className="text-emerald-400">{project.stats.done}</span></div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 mb-6">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${project.stats.pct}%` }}></div>
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-700/50 flex justify-between items-center">
                  <span className="text-xs text-slate-500">
                    Activity: {project.last_activity ? format(new Date(project.last_activity), 'MMM do, p') : 'Never'}
                  </span>
                  <button 
                    onClick={() => setSelectedProject(project)}
                    className="text-sm font-medium text-blue-400 hover:text-blue-300"
                  >
                    Details →
                  </button>
                </div>
              </div>
            ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Project Details Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedProject(null) }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedProject.name}</h2>
                  <p className="text-slate-400 mt-2">{selectedProject.description || 'No description provided.'}</p>
                </div>
                <button onClick={() => setSelectedProject(null)} className="text-slate-500 hover:text-white">✕</button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">Tasks</h3>
                {selectedProject.tasks?.length === 0 ? (
                  <p className="text-slate-500">No tasks in this project.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedProject.tasks?.map(task => (
                      <div key={task.id} className="flex justify-between p-3 bg-slate-800 rounded-lg border border-slate-700/50">
                        <span className="text-slate-200">{task.title}</span>
                        <span className={`text-xs px-2 py-1 rounded ${task.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                    id: editingTask.id, 
                    data: {
                      title: editingTask.title,
                      assigned_date: editingTask.assigned_date || null,
                      project_id: editingTask.project_id || null
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
                    value={editingTask.assigned_date}
                    onChange={e => setEditingTask({ ...editingTask, assigned_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Project Association</label>
                  <select 
                    value={editingTask.project_id}
                    onChange={e => setEditingTask({ ...editingTask, project_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">None (Standalone)</option>
                    {projects?.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setEditingTask(null)}
                    className="px-5 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={updateTask.isPending || !editingTask.title.trim()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <h2 className="text-xl font-bold text-white">Add New Task</h2>
                <button onClick={() => setIsAddingTask(false)} className="text-slate-500 hover:text-white">✕</button>
              </div>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  createTask.mutate({
                    title: newTask.title,
                    assigned_date: newTask.assigned_date || null,
                    project_id: newTask.project_id || null
                  });
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Task Name</label>
                  <input 
                    type="text" 
                    required
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
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Project Association</label>
                  <select 
                    value={newTask.project_id}
                    onChange={e => setNewTask({ ...newTask, project_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">None (Standalone)</option>
                    {projects?.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingTask(false)}
                    className="px-5 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={createTask.isPending || !newTask.title.trim()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Project Modal */}
      <AnimatePresence>
        {isAddingProject && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setIsAddingProject(false) }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Add New Project</h2>
                <button onClick={() => setIsAddingProject(false)} className="text-slate-500 hover:text-white">✕</button>
              </div>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  createProject.mutate({
                    name: newProject.name,
                    description: newProject.description || null
                  });
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Project Name</label>
                  <input 
                    type="text" 
                    required
                    value={newProject.name}
                    onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Description (Optional)</label>
                  <textarea 
                    value={newProject.description}
                    onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 h-24 resize-none"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingProject(false)}
                    className="px-5 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={createProject.isPending || !newProject.name.trim()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
