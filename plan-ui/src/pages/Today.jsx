import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { API_BASE } from '../lib/api'

export default function Today() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [idea, setIdea] = useState('');

  // Extract from query cache
  const { data: tasks } = useQuery({ 
    queryKey: ['tasks'], 
    queryFn: () => fetch(`${API_BASE}/tasks`).then(res => res.json()) 
  });
  const { data: habits } = useQuery({ 
    queryKey: ['habits'], 
    queryFn: () => fetch(`${API_BASE}/habits`).then(res => res.json()) 
  });

  const todayDate = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = tasks?.filter(t => t.assigned_date === todayDate && t.status !== 'done') || [];

  const completeTask = useMutation({
    mutationFn: (id) => fetch(`${API_BASE}/tasks/${id}/cycle`, { method: 'PATCH' }).then(res => res.json()),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      // Optimistically update
      queryClient.setQueryData(['tasks'], (old) => 
        old?.map(t => t.id === id ? { ...t, status: 'done' } : t)
      );
      
      toast.success('Task finished! Keep moving.');
      return { previousTasks };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['tasks'], context.previousTasks);
      toast.error('Failed to update task.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const logHabit = useMutation({
    mutationFn: (id) => fetch(`${API_BASE}/habits/${id}/log`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: todayDate })
    }).then(res => res.json()),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['habits'] });
      const previousHabits = queryClient.getQueryData(['habits']);
      
      queryClient.setQueryData(['habits'], (old) => 
        old?.map(h => h.id === id ? { ...h, logs: [...h.logs, todayDate] } : h)
      );
      
      toast.success('Habit logged! Consistency is key.');
      return { previousHabits };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['habits'], context.previousHabits);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['habits'] })
  });

  const saveIdea = useMutation({
    mutationFn: (text) => fetch(`${API_BASE}/ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, category_id: null })
    }).then(res => res.json()),
    onSuccess: () => {
      setIdea('');
      toast.success('Idea saved to Brain Dump.');
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
    }
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-slate-900 flex flex-col items-center py-20 px-4"
    >
      <div className="w-full max-w-2xl space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black tracking-tight text-white">
            {format(new Date(), 'EEEE, MMMM do')}
          </h1>
          <p className="text-xl text-slate-400">Action Center</p>
        </div>

        {/* Daily Habits */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-200">Daily Habits</h2>
          {habits?.length === 0 ? (
            <div className="text-slate-500 italic text-sm">No habits created yet.</div>
          ) : (
            <div className="space-y-3">
              {habits?.map(habit => {
                const isDoneToday = habit.logs.includes(todayDate);
                const past7Days = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - 6 + i);
                  return format(d, 'yyyy-MM-dd');
                });

                return (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between p-4 bg-slate-800 rounded-xl border border-slate-700"
                  >
                    <div className="flex-1 font-bold text-slate-200">{habit.name}</div>
                    
                    <div className="flex items-center gap-1 mx-6">
                      {past7Days.map(date => {
                        const done = habit.logs.includes(date);
                        return (
                          <div 
                            key={date} 
                            className={`w-6 h-6 rounded-sm ${done ? 'bg-emerald-500' : 'bg-slate-700'} ${date === todayDate ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-800' : ''}`}
                            title={date}
                          />
                        );
                      })}
                    </div>

                    <button
                      onClick={() => logHabit.mutate(habit.id)}
                      disabled={isDoneToday || logHabit.isPending}
                      className={`px-6 py-2 rounded-lg font-bold transition-all text-sm w-32 ${
                        isDoneToday 
                          ? 'bg-emerald-600/20 text-emerald-500 cursor-default' 
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {isDoneToday ? '✓ Done' : 'Did it today?'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Today's Tasks */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-200">Current Focus</h2>
          {todayTasks.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-700 rounded-xl text-slate-500">
              No tasks for today. Take a break!
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.map(task => (
                <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-800 rounded-xl shadow-lg border border-slate-700 transition-colors gap-4">
                  <div>
                    <div className="text-lg text-slate-100">{task.title}</div>
                    <div className="text-xs text-slate-400 mt-1">{task.project_name || 'Standalone'}</div>
                  </div>
                  <div className="flex items-center shrink-0">
                    <button 
                      onClick={() => completeTask.mutate(task.id)}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Idea */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-200">Brain Dump</h2>
          <form 
            onSubmit={(e) => { e.preventDefault(); if (idea.trim()) saveIdea.mutate(idea); }}
            className="flex gap-3"
          >
            <input 
              type="text" 
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Got an idea?"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              type="submit"
              disabled={!idea.trim() || saveIdea.isPending}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
            >
              Save
            </button>
          </form>
        </div>

        {/* Navigation */}
        <div className="pt-12 text-center border-t border-slate-800">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-white flex items-center gap-2 mx-auto transition-colors"
          >
            Enter Dashboard
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
