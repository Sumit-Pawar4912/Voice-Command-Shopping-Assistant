import { FiClock } from 'react-icons/fi'
import { useShopping } from '../context/ShoppingContext'

export default function RecentCommands() {
  const { recentCommands } = useShopping()

  if (!recentCommands.length) return null

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/60 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
        <FiClock /> Recent Commands
      </h2>
      <ul className="flex flex-col gap-1.5">
        {recentCommands.map((c) => (
          <li key={c.id} className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate">"{c.raw_text}"</span>
            <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {c.action}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
