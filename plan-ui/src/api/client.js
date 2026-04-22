import axios from 'axios'

const api = axios.create({
  baseURL: 'https://backendv2-fawn.vercel.app/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// ── Tasks ────────────────────────────────────────────────────
export const getTasks     = (params = {}) => api.get('/tasks', { params })
export const createTask   = (data)        => api.post('/tasks', data)
export const updateTask   = (id, data)    => api.put(`/tasks/${id}`, data)
export const cycleTask    = (id)          => api.patch(`/tasks/${id}/cycle`)
export const deleteTask   = (id)          => api.delete(`/tasks/${id}`)

// ── Projects ─────────────────────────────────────────────────
export const getProjects    = ()       => api.get('/projects')
export const createProject  = (data)   => api.post('/projects', data)
export const deleteProject  = (id)     => api.delete(`/projects/${id}`)

// ── Ideas ────────────────────────────────────────────────────
export const getIdeas    = ()              => api.get('/ideas')
export const createIdea  = (data)          => api.post('/ideas', data)
export const convertIdea = (id, data)      => api.post(`/ideas/${id}/convert`, data)
export const deleteIdea  = (id)            => api.delete(`/ideas/${id}`)

// ── Misc ─────────────────────────────────────────────────────
export const getWeek  = () => api.get('/week')
export const runSweep = () => api.post('/sweep')

export default api
