import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Today     from './pages/Today'
import Dashboard from './pages/Dashboard'
import Ideas     from './pages/Ideas'
import Calendar  from './pages/Calendar'
import History   from './pages/History'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar />
        {/* Main content — offset for sidebar */}
        <main className="ml-56 flex-1 overflow-y-auto">
          <Routes>
            <Route path="/"          element={<Today />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ideas"     element={<Ideas />} />
            <Route path="/calendar"  element={<Calendar />} />
            <Route path="/history"   element={<History />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
