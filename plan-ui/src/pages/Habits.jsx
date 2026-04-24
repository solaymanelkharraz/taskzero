import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, isSameDay } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { API_BASE } from '../lib/api'

export default function Habits() {
  const queryClient = useQueryClient();
  const { data: habits } = useQuery({ 
    queryKey: ['habits'],
    queryFn: () => fetch(`${API_BASE}/habits`).then(res => res.json())
  });

  const logHabit = useMutation({
    mutationFn: (id) => fetch(`${API_BASE}/habits/${id}/log`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: format(new Date(), 'yyyy-MM-dd') })
    }).then(res => res.json()),
    onSuccess: () => {
      toast.success('Progress tracked!');
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    }
  });

  const [showAdd, setShowAdd] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', description: '' });

  const createHabit = useMutation({
    mutationFn: (data) => fetch(`${API_BASE}/habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      setShowAdd(false);
      setNewHabit({ name: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    }
  });

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="p-10 space-y-8"
    >
      <div className="flex justify-between items-end border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white">Habits Grid</h1>
          <p className="text-slate-400 mt-2">Grid of Truth</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold border border-slate-700 transition-colors"
        >
          {showAdd ? 'Cancel' : '+ Add Habit'}
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form 
              onSubmit={(e) => { e.preventDefault(); if (newHabit.name.trim()) createHabit.mutate(newHabit); }}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col md:flex-row gap-4 mb-8"
            >
              <input 
                type="text" 
                placeholder="Habit Name..." 
                value={newHabit.name}
                onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
              <input 
                type="text" 
                placeholder="Description (optional)..." 
                value={newHabit.description}
                onChange={e => setNewHabit({ ...newHabit, description: e.target.value })}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
              <button 
                type="submit" 
                disabled={!newHabit.name.trim() || createHabit.isPending}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl disabled:opacity-50 transition-colors"
              >
                Create
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-12">
        {habits?.map(habit => {
          const isDoneToday = habit.logs.includes(format(today, 'yyyy-MM-dd'));

          return (
            <div key={habit.id} className="bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-700">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white">{habit.name}</h2>
                  <p className="text-slate-400">{habit.description}</p>
                </div>
                <button
                  onClick={() => logHabit.mutate(habit.id)}
                  disabled={isDoneToday || logHabit.isPending}
                  className={`px-6 py-3 rounded-xl font-bold transition-all ${
                    isDoneToday 
                      ? 'bg-emerald-600 text-emerald-100 opacity-50 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50'
                  }`}
                >
                  {isDoneToday ? 'Did it today ✓' : 'Did it today'}
                </button>
              </div>

              <div className="bg-slate-900 rounded-xl p-4 border border-slate-700/50">
                <div className="grid grid-cols-7 gap-px mb-2 text-center text-xs font-bold text-slate-500">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: new Date(monthStart).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="w-full aspect-square" />
                  ))}
                  {daysInMonth.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isDone = habit.logs.includes(dateStr);
                    const isPast = isBefore(day, today) && !isSameDay(day, today);
                    
                    let bgColor = 'bg-slate-800';
                    let borderColor = 'border-slate-700';
                    let textColor = 'text-slate-500';
                    
                    if (isDone) {
                      bgColor = 'bg-emerald-500';
                      borderColor = 'border-emerald-400';
                      textColor = 'text-white font-bold';
                    } else if (isPast) {
                      bgColor = 'bg-red-500/80';
                      borderColor = 'border-red-400/50';
                      textColor = 'text-red-100 font-bold';
                    }

                    return (
                      <motion.div
                        key={dateStr}
                        title={format(day, 'MMM do')}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className={`w-full aspect-square rounded-md border ${bgColor} ${borderColor} flex items-center justify-center shadow-sm`}
                      >
                        <span className={`text-xs ${textColor}`}>{format(day, 'd')}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
