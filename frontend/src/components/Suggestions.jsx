import { FiRepeat, FiStar, FiSun } from 'react-icons/fi'
import { useShopping } from '../context/ShoppingContext'

function Pill({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
    >
      {children}
    </button>
  )
}

export default function Suggestions() {
  const { recommendations, addItemManually } = useShopping()
  const { frequent = [], seasonal = [], substitutes = [] } = recommendations

  const quickAdd = (name) => addItemManually({ name, quantity: 1, category: 'General' })

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/60 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="mb-4 text-lg font-bold text-slate-800 dark:text-slate-100">Smart Suggestions</h2>

      <div className="mb-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <FiStar size={12} /> Frequently bought
        </p>
        <div className="flex flex-wrap gap-2">
          {frequent.length ? (
            frequent.map((name) => <Pill key={name} onClick={() => quickAdd(name)}>{name}</Pill>)
          ) : (
            <p className="text-xs text-slate-400">Add a few items to see patterns here.</p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <FiSun size={12} /> Seasonal picks
        </p>
        <div className="flex flex-wrap gap-2">
          {seasonal.map((name) => (
            <Pill key={name} onClick={() => quickAdd(name)}>{name}</Pill>
          ))}
        </div>
      </div>

      {substitutes.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <FiRepeat size={12} /> Substitutes for your list
          </p>
          <div className="flex flex-col gap-2">
            {substitutes.map((s) => (
              <div key={s.item} className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{s.item}:</span>{' '}
                {s.substitutes.join(', ')}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
