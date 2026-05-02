import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQueries } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import DashboardLayout from './components/DashboardLayout'
import Today     from './pages/Today'
import DashboardOverview from './pages/DashboardOverview'
import Dashboard from './pages/Dashboard'
import Ideas     from './pages/Ideas'
import Calendar  from './pages/Calendar'
import History   from './pages/History'
import Habits    from './pages/Habits'
import ProjectDetails from './pages/ProjectDetails'
import { Toaster } from 'sonner'
import { API_BASE } from './lib/api'
import CommandPalette from './components/CommandPalette'

const defaultQueryFn = async ({ queryKey }) => {
  const res = await fetch(`${API_BASE}/${queryKey[0]}`);
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: true,
      queryFn: defaultQueryFn,
    },
  },
})

function AppRoutes() {
  const location = useLocation();

  // Fetch all core data in parallel at app load
  useQueries({
    queries: [
      { queryKey: ['tasks'], queryFn: () => fetch(`${API_BASE}/tasks`).then(res => res.json()) },
      { queryKey: ['projects'], queryFn: () => fetch(`${API_BASE}/projects`).then(res => res.json()) },
      { queryKey: ['habits'], queryFn: () => fetch(`${API_BASE}/habits`).then(res => res.json()) },
      { queryKey: ['ideas'], queryFn: () => fetch(`${API_BASE}/ideas`).then(res => res.json()) },
      { queryKey: ['idea-categories'], queryFn: () => fetch(`${API_BASE}/idea-categories`).then(res => res.json()) },
      { queryKey: ['events'], queryFn: () => fetch(`${API_BASE}/events`).then(res => res.json()) },
    ]
  });

  return (
    <>
      <CommandPalette />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Action Center - No Sidebar */}
          <Route path="/" element={<Today />} />

          {/* Dashboard Pages - With Sidebar */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard"    element={<DashboardOverview />} />
            <Route path="/control-room" element={<Dashboard />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/habits"       element={<Habits />} />
            <Route path="/ideas"        element={<Ideas />} />
            <Route path="/calendar"     element={<Calendar />} />
            <Route path="/history"      element={<History />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" theme="dark" />
      <BrowserRouter>
        <div className="bg-slate-900 text-slate-100 min-h-screen">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
