import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE } from '../lib/api'

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tasks');
  const [editingTask, setEditingTask] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', priority: 'medium' });

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', assigned_date: '', project_id: '' });

  const [sortBy, setSortBy] = useState('assigned_date'); // 'assigned_date', 'overdue'
  const [projectFilter, setProjectFilter] = useState('all'); // 'all', 'standalone', or project_id
  const [showFloatingOnly, setShowFloatingOnly] = useState(false);

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
      setNewProject({ name: '', description: '', priority: 'medium' });
      toast.success('Project created successfully.');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const updateProject = useMutation({
    mutationFn: ({ id, data }) => fetch(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] });
      const previous = queryClient.getQueryData(['projects']);
      queryClient.setQueryData(['projects'], (old) =>
        old?.map(p => p.id === id ? { ...p, ...data } : p)
      );
      setEditingProject(null);
      toast.success('Project updated.');
      return { previous };
    },
    onError: (err, vars, context) => queryClient.setQueryData(['projects'], context.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['projects'] })
  });

  const activeTasks = tasks?.filter(t => t.status !== 'done') || [];
  
  // Apply Filters
  let filteredTasks = activeTasks;
  
  if (projectFilter === 'standalone') {
    filteredTasks = filteredTasks.filter(t => !t.project_id);
  } else if (projectFilter !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.project_id === parseInt(projectFilter));
  }

  if (showFloatingOnly) {
    filteredTasks = filteredTasks.filter(t => !t.assigned_date);
  }

  // Apply Sorting
  const sortedTasks = [...filteredTasks].sort((a, b) => {
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/50 p-6 rounded-2xl border border-slate-800">
              <div className="flex flex-wrap items-center gap-4">
                <button 
                  onClick={() => setIsAddingTask(true)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20"
                >
                  + Add Task
                </button>
                
                <div className="h-8 w-px bg-slate-700 hidden md:block" />

                {/* Project Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Project</span>
                  <select 
                    value={projectFilter}
                    onChange={e => setProjectFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="all">All Projects</option>
                    <option value="standalone">Standalone Only</option>
                    {projects?.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Floating Tasks Toggle */}
                <button
                  onClick={() => setShowFloatingOnly(!showFloatingOnly)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                    showFloatingOnly 
                    ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {showFloatingOnly ? '🎯 Showing Floating Only' : '☁️ Show Floating Only'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Sort</span>
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="assigned_date">Scheduled Time</option>
                  <option value="overdue">Overdue First</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3">
              {sortedTasks.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/30 border-2 border-dashed border-slate-800 rounded-3xl">
                  <p className="text-slate-500 font-medium">No tasks match your current filters.</p>
                </div>
              ) : (
                sortedTasks.map(task => (
                  <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-800 rounded-2xl shadow-sm border border-slate-700/50 hover:border-blue-500/50 transition-all gap-4 group">
                    <div className="flex items-start gap-4">
                      <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${task.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-500'}`} />
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-blue-100 transition-colors">{task.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs mt-1.5">
                          <span className="text-slate-500 font-bold bg-slate-900/50 px-2 py-0.5 rounded uppercase tracking-wider">
                            {task.project_name || 'Standalone'}
                          </span>
                          {task.assigned_date ? (
                            <span className={`font-bold ${task.assigned_date < format(new Date(), 'yyyy-MM-dd') ? 'text-red-400' : 'text-slate-500'}`}>
                              📅 {task.assigned_date}
                            </span>
                          ) : (
                            <span className="text-orange-500/70 font-bold">☁️ Floating</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
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
                          className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-black transition-all border border-blue-600/20"
                        >
                          TODAY
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
                        className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => completeTask.mutate(task.id)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition-all shadow-lg shadow-emerald-900/20"
                      >
                        DONE
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'projects' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <div className="flex justify-end">
              <button
                onClick={() => setIsAddingProject(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg"
              >
                + Add Project
              </button>
            </div>

            {/* Priority config */}
            {[{
              key: 'high',
              label: '🔥 Critical Focus',
              dot: '#ff2d6f',
              glow: 'rgba(255,45,111,0.25)',
              border: 'rgba(255,45,111,0.35)',
              badge: { bg: 'rgba(255,45,111,0.15)', text: '#ff2d6f', label: 'HIGH' }
            }, {
              key: 'medium',
              label: '⚡ Standard',
              dot: '#ffaa00',
              glow: 'rgba(255,170,0,0.25)',
              border: 'rgba(255,170,0,0.35)',
              badge: { bg: 'rgba(255,170,0,0.15)', text: '#ffaa00', label: 'MEDIUM' }
            }, {
              key: 'low',
              label: '🧊 Backlog',
              dot: '#00f2ff',
              glow: 'rgba(0,242,255,0.25)',
              border: 'rgba(0,242,255,0.35)',
              badge: { bg: 'rgba(0,242,255,0.15)', text: '#00f2ff', label: 'LOW' }
            }].map(({ key, label, dot, glow, border, badge }) => {
              const group = (projects || []).filter(p => (p.priority || 'medium') === key);
              return (
                <div key={key}>
                  {/* Section Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span style={{ background: dot, boxShadow: `0 0 8px ${dot}` }} className="inline-block w-2.5 h-2.5 rounded-full" />
                    <h2 className="text-base font-bold text-slate-200 tracking-wide uppercase">{label}</h2>
                    <span className="ml-1 text-xs font-semibold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{group.length}</span>
                    <div className="flex-1 h-px bg-slate-800 ml-2" />
                  </div>

                  {group.length === 0 ? (
                    <p className="text-slate-600 text-sm italic pl-1">No projects here yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {group.map(project => (
                        <div
                          key={project.id}
                          style={{ borderColor: border, background: 'rgba(15,23,42,0.8)' }}
                          className="rounded-xl p-5 border flex flex-col justify-between h-full transition-all hover:scale-[1.01]"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="text-lg font-bold text-white leading-snug">{project.name}</h3>
                              {/* Neon Priority Badge */}
                              <span
                                style={{ background: badge.bg, color: badge.text, boxShadow: `0 0 8px ${glow}` }}
                                className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full ml-2 shrink-0"
                              >
                                {badge.label}
                              </span>
                            </div>
                            {project.description && (
                              <p className="text-slate-500 text-xs mb-3 line-clamp-2">{project.description}</p>
                            )}
                            <div className="flex gap-4 text-xs text-slate-400 mb-4">
                              <div>Tasks: <span className="text-white font-semibold">{project.stats.total}</span></div>
                              <div>Done: <span className="text-emerald-400 font-semibold">{project.stats.done}</span></div>
                              <div>Progress: <span style={{ color: dot }} className="font-semibold">{project.stats.pct}%</span></div>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 mb-4 overflow-hidden">
                              <div
                                style={{ width: `${project.stats.pct}%`, background: dot, boxShadow: `0 0 6px ${dot}` }}
                                className="h-1.5 rounded-full transition-all duration-500"
                              />
                            </div>
                          </div>
                          <div className="mt-auto pt-3 border-t border-slate-800 flex justify-between items-center">
                            <span className="text-[11px] text-slate-600">
                              {project.last_activity ? format(new Date(project.last_activity), 'MMM do') : 'No activity'}
                            </span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setEditingProject({ id: project.id, name: project.name, description: project.description || '', priority: project.priority || 'medium' })}
                                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                              >
                                ✏️ Edit
                              </button>
                              <Link
                                to={`/projects/${project.id}`}
                                style={{ color: dot }}
                                className="text-sm font-semibold hover:opacity-75 transition-opacity"
                              >
                                Details →
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Edit Project Modal */}
      <AnimatePresence>
        {editingProject && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setEditingProject(null) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Edit Project</h2>
                <button onClick={() => setEditingProject(null)} className="text-slate-500 hover:text-white">✕</button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateProject.mutate({
                    id: editingProject.id,
                    data: {
                      name: editingProject.name,
                      description: editingProject.description || null,
                      priority: editingProject.priority
                    }
                  });
                }}
                className="p-6 space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={editingProject.name}
                    onChange={e => setEditingProject({ ...editingProject, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Description (Optional)</label>
                  <textarea
                    value={editingProject.description}
                    onChange={e => setEditingProject({ ...editingProject, description: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 h-24 resize-none"
                  />
                </div>
                {/* Priority Pill Toggle */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Priority</label>
                  <div className="flex gap-2">
                    {[{
                      value: 'high',
                      label: '🔥 High',
                      active: 'bg-[#ff2d6f]/20 border-[#ff2d6f] text-[#ff2d6f]',
                      inactive: 'border-slate-700 text-slate-500 hover:border-[#ff2d6f]/50'
                    }, {
                      value: 'medium',
                      label: '⚡ Medium',
                      active: 'bg-[#ffaa00]/20 border-[#ffaa00] text-[#ffaa00]',
                      inactive: 'border-slate-700 text-slate-500 hover:border-[#ffaa00]/50'
                    }, {
                      value: 'low',
                      label: '🧊 Low',
                      active: 'bg-[#00f2ff]/20 border-[#00f2ff] text-[#00f2ff]',
                      inactive: 'border-slate-700 text-slate-500 hover:border-[#00f2ff]/50'
                    }].map(pill => (
                      <button
                        key={pill.value}
                        type="button"
                        onClick={() => setEditingProject({ ...editingProject, priority: pill.value })}
                        className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-all ${
                          editingProject.priority === pill.value ? pill.active : pill.inactive
                        }`}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingProject(null)}
                    className="px-5 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateProject.isPending || !editingProject.name.trim()}
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
                    description: newProject.description || null,
                    priority: newProject.priority
                  });
                }}
                className="p-6 space-y-5"
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
                {/* Priority Pill Toggle */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Priority</label>
                  <div className="flex gap-2">
                    {[{
                      value: 'high',
                      label: '🔥 High',
                      active: 'bg-[#ff2d6f]/20 border-[#ff2d6f] text-[#ff2d6f]',
                      inactive: 'border-slate-700 text-slate-500 hover:border-[#ff2d6f]/50'
                    }, {
                      value: 'medium',
                      label: '⚡ Medium',
                      active: 'bg-[#ffaa00]/20 border-[#ffaa00] text-[#ffaa00]',
                      inactive: 'border-slate-700 text-slate-500 hover:border-[#ffaa00]/50'
                    }, {
                      value: 'low',
                      label: '🧊 Low',
                      active: 'bg-[#00f2ff]/20 border-[#00f2ff] text-[#00f2ff]',
                      inactive: 'border-slate-700 text-slate-500 hover:border-[#00f2ff]/50'
                    }].map(pill => (
                      <button
                        key={pill.value}
                        type="button"
                        onClick={() => setNewProject({ ...newProject, priority: pill.value })}
                        className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-all ${
                          newProject.priority === pill.value ? pill.active : pill.inactive
                        }`}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-2 flex justify-end gap-3">
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

