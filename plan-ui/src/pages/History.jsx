import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { API_BASE } from '../lib/api'
import { motion, AnimatePresence } from 'framer-motion'

export default function History() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  const { data: tasks } = useQuery({ 
    queryKey: ['tasks'],
    queryFn: () => fetch(`${API_BASE}/tasks`).then(res => res.json())
  });

  const { data: finishedProjects } = useQuery({
    queryKey: ['projects', 'history'],
    queryFn: () => fetch(`${API_BASE}/projects/history`).then(res => res.json())
  });

  const doneTasks = tasks?.filter(t => t.status === 'done') || [];

  const filteredTasks = doneTasks.filter(t => {
    const term = search.toLowerCase();
    return t.title.toLowerCase().includes(term) || (t.project_name && t.project_name.toLowerCase().includes(term));
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    if (sortBy === 'project') return (a.project_name || '').localeCompare(b.project_name || '');
    const aDate = a.completed_at || '1970-01-01';
    const bDate = b.completed_at || '1970-01-01';
    if (sortBy === 'date_asc') return aDate.localeCompare(bDate);
    return bDate.localeCompare(aDate);
  });

  const filteredProjects = (finishedProjects || []).filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 space-y-8">
      <div className="flex justify-between items-end border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white">The Archive</h1>
          <p className="text-slate-400 mt-2">Glory days and finished battles.</p>
        </div>
        <div className="flex space-x-2 bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'tasks' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'projects' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
          >
            Projects
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <input 
          type="text" 
          placeholder={`Search ${activeTab}...`} 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500"
        />
        {activeTab === 'tasks' && (
          <select 
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500"
          >
            <option value="date_desc">Recent First</option>
            <option value="date_asc">Oldest First</option>
            <option value="name">Task Name</option>
            <option value="project">Project Name</option>
          </select>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'tasks' ? (
          <motion.div key="tasks" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
            {sortedTasks.length === 0 ? (
              <div className="text-center py-20 text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl">No finished tasks found.</div>
            ) : (
              sortedTasks.map(task => (
                <div key={task.id} className="flex justify-between items-center p-5 bg-slate-800/50 rounded-xl border border-slate-700/30">
                  <div>
                    <h3 className="text-lg font-bold text-slate-400 line-through">{task.title}</h3>
                    <span className="text-xs text-slate-600 uppercase font-black tracking-widest">{task.project_name || 'Standalone'}</span>
                  </div>
                  <div className="text-slate-500 text-xs font-bold bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                    FINISHED {new Date(task.completed_at || task.updated_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div key="projects" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="grid gap-6">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-20 text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl">No finished projects found.</div>
            ) : (
              filteredProjects.map(project => (
                <div key={project.id} className="p-8 bg-slate-800/40 rounded-3xl border border-emerald-500/20 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-black text-white">{project.name}</h2>
                      <p className="text-slate-500 text-sm mt-1">Finished on {new Date(project.completed_at).toLocaleDateString()}</p>
                    </div>
                    {project.completion_link && (
                      <a 
                        href={project.completion_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white text-xs font-black rounded-xl border border-emerald-500/20 transition-all"
                      >
                        VIEW WORK ↗
                      </a>
                    )}
                  </div>
                  
                  {project.completion_summary && (
                    <div className="p-5 bg-slate-900/50 rounded-2xl border border-slate-700/30">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-3">Achievement Summary</h4>
                      <p className="text-slate-300 leading-relaxed italic">"{project.completion_summary}"</p>
                    </div>
                  )}

                  <div className="flex gap-6 text-xs font-bold text-slate-500">
                    <div>TASKS: <span className="text-white">{project.stats.total}</span></div>
                    <div>SUCCESS RATE: <span className="text-emerald-400">100%</span></div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

