import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths } from 'date-fns'

export default function Calendar() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addType, setAddType] = useState('task');
  const [newEventName, setNewEventName] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('Travel');

  const { data: tasks } = useQuery({ 
    queryKey: ['tasks'],
    queryFn: () => fetch('http://127.0.0.1:8000/api/tasks').then(res => res.json())
  });
  const { data: events } = useQuery({ queryKey: ['events'], queryFn: () => fetch('http://127.0.0.1:8000/api/events').then(res => res.json()) });

  const createTask = useMutation({
    mutationFn: (data) => fetch('http://127.0.0.1:8000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      setNewTaskTitle('');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const createEvent = useMutation({
    mutationFn: (data) => fetch('http://127.0.0.1:8000/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      setNewEventName('');
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startOffset = getDay(monthStart);

  const eventIcons = {
    'Travel': '✈️',
    'Exam': '📝',
    'Eid (عيد)': '🌙',
    'Family': '👨‍👩‍👧‍👦',
    'Football': '⚽'
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 h-full flex flex-col">
      <div className="flex justify-between items-end border-b border-slate-800 pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-black text-white">Calendar</h1>
          <div className="flex items-center gap-4 mt-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded">←</button>
            <p className="text-slate-200 font-bold w-32 text-center">{format(currentMonth, 'MMMM yyyy')}</p>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded">→</button>
            <button onClick={() => setCurrentMonth(new Date())} className="text-xs text-slate-500 hover:text-white ml-2">Today</button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col">
        {/* Days Header */}
        <div className="grid grid-cols-7 gap-px mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center font-bold text-slate-500 py-2">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-px bg-slate-700 flex-1 rounded-xl overflow-hidden border border-slate-700">
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-slate-800" />
          ))}
          
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayTasks = tasks?.filter(t => t.assigned_date === dateStr) || [];
            const dayEvents = events?.filter(e => e.date === dateStr) || [];
            
            return (
              <div 
                key={dateStr}
                onClick={() => setSelectedDate(day)}
                className={`bg-slate-800 p-2 cursor-pointer transition-colors hover:bg-slate-700/50 flex flex-col ${isSameDay(day, today) ? 'ring-2 ring-inset ring-blue-500' : ''} ${dayEvents.length > 0 ? 'border border-amber-500/50 shadow-[inset_0_0_10px_rgba(245,158,11,0.1)]' : ''}`}
              >
                <div className="text-right mb-1">
                  <span className={`text-sm font-medium w-6 h-6 inline-flex items-center justify-center rounded-full ${isSameDay(day, today) ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="flex-1 space-y-1 overflow-y-auto pr-1">
                  {dayEvents.map(ev => (
                    <div key={`ev-${ev.id}`} className="text-[10px] truncate px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1">
                      <span>{eventIcons[ev.category]}</span>
                      {ev.name}
                    </div>
                  ))}
                  {dayTasks.slice(0, 3).map(task => (
                    <div key={task.id} className="text-[10px] truncate px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-[10px] text-slate-500 font-medium pl-1">+{dayTasks.length - 3} tasks</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Details Side Panel / Modal */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
            className="fixed top-0 right-0 bottom-0 w-[400px] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 p-6 flex flex-col"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
              <h2 className="text-2xl font-bold text-white">{format(selectedDate, 'MMMM do, yyyy')}</h2>
              <button onClick={() => setSelectedDate(null)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {(() => {
                const dayTasks = tasks?.filter(t => t.assigned_date === format(selectedDate, 'yyyy-MM-dd')) || [];
                const dayEvents = events?.filter(e => e.date === format(selectedDate, 'yyyy-MM-dd')) || [];
                
                if (dayTasks.length === 0 && dayEvents.length === 0) {
                  return <p className="text-slate-500 text-center py-10">Nothing planned for this day.</p>;
                }

                return (
                  <>
                    {dayEvents.map(ev => (
                      <div key={`ev-${ev.id}`} className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30 flex items-center gap-3">
                        <span className="text-2xl">{eventIcons[ev.category]}</span>
                        <div>
                          <div className="font-bold text-amber-400">{ev.name}</div>
                          <div className="text-xs text-amber-500/70 uppercase tracking-wider">{ev.category}</div>
                        </div>
                      </div>
                    ))}
                    {dayTasks.map(task => (
                      <div key={task.id} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                        <div className="font-medium text-slate-200">{task.title}</div>
                        <div className="text-xs text-slate-500 mt-1">{task.status}</div>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>

            <div className="pt-6 border-t border-slate-800 mt-auto">
              <div className="flex gap-2 mb-4 bg-slate-800 p-1 rounded-lg">
                <button 
                  onClick={() => setAddType('task')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded ${addType === 'task' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Add Task
                </button>
                <button 
                  onClick={() => setAddType('event')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded ${addType === 'event' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Add Event
                </button>
              </div>

              {addType === 'task' ? (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (newTaskTitle.trim()) {
                    createTask.mutate({ title: newTaskTitle, assigned_date: format(selectedDate, 'yyyy-MM-dd') });
                  }
                }}>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="Task title..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    type="submit"
                    disabled={!newTaskTitle.trim() || createTask.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
                  >
                    Create Task
                  </button>
                </form>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (newEventName.trim() && newEventCategory) {
                    createEvent.mutate({ name: newEventName, category: newEventCategory, date: format(selectedDate, 'yyyy-MM-dd') });
                  }
                }}>
                  <input
                    type="text"
                    value={newEventName}
                    onChange={e => setNewEventName(e.target.value)}
                    placeholder="Event name..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white mb-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <select
                    value={newEventCategory}
                    onChange={e => setNewEventCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white mb-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Travel">✈️ Travel</option>
                    <option value="Exam">📝 Exam</option>
                    <option value="Eid (عيد)">🌙 Eid (عيد)</option>
                    <option value="Family">👨‍👩‍👧‍👦 Family</option>
                    <option value="Football">⚽ Football</option>
                  </select>
                  <button 
                    type="submit"
                    disabled={!newEventName.trim() || createEvent.isPending}
                    className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
                  >
                    Create Event
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
