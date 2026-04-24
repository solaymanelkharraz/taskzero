import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format, addDays, isBefore, startOfDay, eachDayOfInterval, subDays, isSameDay } from 'date-fns'
import { API_BASE } from '../lib/api'

export default function DashboardOverview() {
  const { data: tasks } = useQuery({ 
    queryKey: ['tasks'],
    queryFn: () => fetch(`${API_BASE}/tasks`).then(res => res.json())
  });
  const { data: projects } = useQuery({ 
    queryKey: ['projects'],
    queryFn: () => fetch(`${API_BASE}/projects`).then(res => res.json())
  });

  const today = startOfDay(new Date());
  const upcomingDays = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  // Stats logic
  const doneTasks = tasks?.filter(t => t.status === 'done').length || 0;
  const activeProjects = projects?.filter(p => p.stats.pct < 100).length || 0;
  const totalTasks = tasks?.length || 0;
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Focus Score: % of tasks assigned to today that are done
  const todayDate = format(today, 'yyyy-MM-dd');
  const tasksAssignedToday = tasks?.filter(t => t.assigned_date === todayDate) || [];
  const doneToday = tasksAssignedToday.filter(t => t.status === 'done').length;
  const focusScore = tasksAssignedToday.length > 0 ? Math.round((doneToday / tasksAssignedToday.length) * 100) : 0;

  // Heatmap Data (Last 12 weeks)
  const heatmapDays = eachDayOfInterval({
    start: subDays(today, 83), // 12 weeks
    end: today
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 space-y-10 max-w-7xl mx-auto">
      <div className="flex justify-between items-end border-b border-slate-800 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white">System Status</h1>
          <p className="text-slate-400 mt-2">Core metrics and activity logs.</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Focus Score</div>
          <div className={`text-3xl font-black ${focusScore > 70 ? 'text-emerald-400' : focusScore > 30 ? 'text-amber-400' : 'text-rose-500'}`}>
            {focusScore}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/50 shadow-xl transition-all hover:border-slate-600">
          <div className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3">Total Velocity</div>
          <div className="text-5xl font-black text-white">{doneTasks}</div>
          <div className="text-xs text-slate-500 mt-2">Tasks completed to date</div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/50 shadow-xl transition-all hover:border-slate-600">
          <div className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3">Active Projects</div>
          <div className="text-5xl font-black text-blue-400">{activeProjects}</div>
          <div className="text-xs text-slate-500 mt-2">Ongoing initiatives</div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/50 shadow-xl transition-all hover:border-slate-600 col-span-1 md:col-span-2">
          <div className="flex justify-between items-end mb-3">
            <div className="text-slate-500 text-xs font-black uppercase tracking-widest">Global Completion</div>
            <div className="text-2xl font-black text-white">{completionPct}%</div>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden border border-slate-700/30">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full"
            />
          </div>
          <div className="text-[10px] text-slate-600 mt-3 font-bold uppercase tracking-tighter">System-wide task efficiency index</div>
        </div>
      </div>

      {/* Contribution Heatmap */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/50 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Activity Heatmap</h2>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-slate-900 border border-slate-800" />
              <div className="w-3 h-3 rounded-sm bg-emerald-900/40" />
              <div className="w-3 h-3 rounded-sm bg-emerald-700/60" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            </div>
            <span>More</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          {heatmapDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const count = tasks?.filter(t => t.status === 'done' && (t.completed_at?.startsWith(dateStr) || t.assigned_date === dateStr)).length || 0;
            
            let color = 'bg-slate-900 border-slate-800';
            if (count > 0) color = 'bg-emerald-900/40 border-emerald-800/30';
            if (count > 2) color = 'bg-emerald-700/60 border-emerald-600/30';
            if (count > 4) color = 'bg-emerald-500 border-emerald-400/50';

            return (
              <div 
                key={dateStr}
                title={`${count} tasks on ${format(day, 'MMM do')}`}
                className={`w-3 h-3 rounded-sm border transition-all hover:scale-125 hover:z-10 cursor-help ${color}`}
              />
            );
          })}
        </div>
        <div className="mt-4 flex justify-between text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          <span>{format(heatmapDays[0], 'MMMM yyyy')}</span>
          <span>{format(today, 'MMMM yyyy')}</span>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/50 shadow-xl mt-8">
        <h2 className="text-2xl font-bold text-white mb-8">Weekly Forecast</h2>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {upcomingDays.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayTasks = tasks?.filter(t => t.assigned_date === dateStr && t.status !== 'done') || [];
            
            return (
              <div key={dateStr} className={`bg-slate-900/50 rounded-2xl p-5 border transition-all ${i === 0 ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-slate-700/50 hover:border-slate-600'}`}>
                <div className="text-center mb-5 border-b border-slate-800/50 pb-3">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{format(day, 'EEE')}</div>
                  <div className={`text-xl font-black ${i === 0 ? 'text-blue-400' : 'text-white'}`}>{format(day, 'd')}</div>
                </div>
                <div className="space-y-2">
                  {dayTasks.length === 0 ? (
                    <div className="text-[10px] text-center text-slate-600 font-bold uppercase py-4">Clear</div>
                  ) : (
                    dayTasks.map(task => (
                      <div key={task.id} className="text-[10px] p-2 bg-slate-800/80 rounded-lg border border-slate-700/50 text-slate-300 truncate shadow-sm">
                        {task.title}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
