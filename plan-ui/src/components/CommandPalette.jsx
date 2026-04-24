import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../lib/api';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: tasks } = useQuery({ 
    queryKey: ['tasks'],
    queryFn: () => fetch(`${API_BASE}/tasks`).then(res => res.json())
  });
  const { data: projects } = useQuery({ 
    queryKey: ['projects'],
    queryFn: () => fetch(`${API_BASE}/projects`).then(res => res.json())
  });
  const { data: ideas } = useQuery({ 
    queryKey: ['ideas'],
    queryFn: () => fetch(`${API_BASE}/ideas`).then(res => res.json())
  });

  const togglePalette = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', togglePalette);
    return () => window.removeEventListener('keydown', togglePalette);
  }, [togglePalette]);

  const results = (() => {
    if (!search.trim()) return [];
    const term = search.toLowerCase();
    
    const matchedTasks = (tasks || [])
      .filter(t => t.title.toLowerCase().includes(term))
      .map(t => ({ ...t, type: 'Task', icon: '📝', path: '/control-room' }));

    const matchedProjects = (projects || [])
      .filter(p => p.name.toLowerCase().includes(term))
      .map(p => ({ ...p, title: p.name, type: 'Project', icon: '📁', path: '/control-room' }));

    const matchedIdeas = (ideas || [])
      .filter(i => i.content.toLowerCase().includes(term))
      .map(i => ({ ...i, title: i.content, type: 'Idea', icon: '💡', path: '/ideas' }));

    return [...matchedTasks, ...matchedProjects, ...matchedIdeas].slice(0, 8);
  })();

  const handleSelect = (path) => {
    navigate(path);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-start justify-center pt-[15vh] px-4"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: -20 }}
            className="bg-slate-900 border border-slate-700/50 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center px-6 py-5 border-b border-slate-800 gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search anything... (Tasks, Projects, Ideas)"
                className="flex-1 bg-transparent border-none text-xl text-white outline-none placeholder:text-slate-600"
              />
              <div className="px-2 py-1 bg-slate-800 rounded text-[10px] font-black text-slate-400 border border-slate-700">ESC</div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
              {!search.trim() ? (
                <div className="py-12 text-center">
                  <p className="text-slate-500 text-sm">Start typing to search across TaskZero...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-slate-500 text-sm">No matches found for "{search}"</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {results.map((res, i) => (
                    <button
                      key={`${res.type}-${res.id}`}
                      onClick={() => handleSelect(res.path)}
                      className="w-full flex items-center justify-between p-4 bg-slate-800/40 hover:bg-slate-800 border border-transparent hover:border-slate-700 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-4 text-left">
                        <span className="text-2xl">{res.icon}</span>
                        <div>
                          <div className="text-white font-medium group-hover:text-blue-400 transition-colors">{res.title}</div>
                          <div className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">{res.type}</div>
                        </div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600 group-hover:text-blue-500 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-slate-950/50 px-6 py-3 border-t border-slate-800 flex justify-between items-center">
              <div className="flex gap-4">
                <span className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
                  <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-400">↑↓</kbd> to navigate
                </span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
                  <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-400">↵</kbd> to select
                </span>
              </div>
              <span className="text-[10px] text-slate-600 font-bold italic">TASKZERO AI ENGINE v2</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
