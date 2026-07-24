import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Centralized error normalization so components can rely on a consistent shape.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.message ||
      'Something went wrong. Please try again.'
    return Promise.reject(new Error(message))
  }
)

export const processCommand = (text, language = 'en') =>
  api.post('/process-command', { text, language }).then((r) => r.data)

export const getItems = () => api.get('/items').then((r) => r.data)

export const addItem = (item) => api.post('/items', item).then((r) => r.data)

export const updateItem = (id, item) => api.put(`/items/${id}`, item).then((r) => r.data)

export const deleteItem = (id) => api.delete(`/items/${id}`).then((r) => r.data)

export const clearItems = () => api.delete('/items').then((r) => r.data)

export const getRecommendations = () => api.get('/recommendations').then((r) => r.data)

export const searchProducts = (params) => api.get('/search', { params }).then((r) => r.data)

export const getRecentCommands = () => api.get('/history').then((r) => r.data)

export default api
