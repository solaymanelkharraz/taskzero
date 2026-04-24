import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'

export default function History() {
  const { data: tasks } = useQuery({ 
    queryKey: ['tasks'],
    queryFn: () => fetch('http://127.0.0.1:8000/api/tasks').then(res => res.json())
  });
  
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc, name, project

  const doneTasks = tasks?.filter(t => t.status === 'done') || [];

  const filteredTasks = doneTasks.filter(t => {
    const term = search.toLowerCase();
    return t.title.toLowerCase().includes(term) || (t.project_name && t.project_name.toLowerCase().includes(term));
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    if (sortBy === 'project') return (a.project_name || '').localeCompare(b.project_name || '');
    
    // Sort by completed_at (which is the date finished if status changed)
    const aDate = a.completed_at || '1970-01-01';
    const bDate = b.completed_at || '1970-01-01';
    if (sortBy === 'date_asc') return aDate.localeCompare(bDate);
    return bDate.localeCompare(aDate);
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 space-y-8">
      <div className="flex justify-between items-end border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white">History</h1>
          <p className="text-slate-400 mt-2">The Graveyard</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input 
          type="text" 
          placeholder="Search tasks or projects..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select 
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date_desc">Recent First</option>
          <option value="date_asc">Oldest First</option>
          <option value="name">Task Name</option>
          <option value="project">Project Name</option>
        </select>
      </div>

      <div className="space-y-4">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-700 rounded-2xl">
            No finished tasks found.
          </div>
        ) : (
          sortedTasks.map(task => (
            <div key={task.id} className="flex justify-between items-center p-5 bg-slate-800 rounded-xl border border-slate-700">
              <div>
                <h3 className="text-lg font-bold text-white line-through opacity-70">{task.title}</h3>
                <div className="flex gap-4 text-sm mt-1">
                  <span className="text-slate-500">{task.project_name || 'Standalone'}</span>
                </div>
              </div>
              <div className="text-slate-500 text-sm bg-slate-900 px-3 py-1 rounded-lg">
                Finished: {new Date(task.completed_at || task.updated_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
