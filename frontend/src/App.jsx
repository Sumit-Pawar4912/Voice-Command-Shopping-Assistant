import { Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import ToastContainer from './components/Toast'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </div>
  )
}
