import { FiMoon, FiSun } from 'react-icons/fi'
import { useShopping } from '../context/ShoppingContext'

export default function Header() {
  const { darkMode, setDarkMode } = useShopping()

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white/70 px-6 py-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white font-bold">V</div>
        <div>
          <h1 className="text-base font-bold text-slate-800 dark:text-slate-100">Voice Shopping Assistant</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">Speak. Shop. Simplify.</p>
        </div>
      </div>
      <button
        onClick={() => setDarkMode((prev) => !prev)}
        aria-label="Toggle dark mode"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {darkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
      </button>
    </header>
  )
}
