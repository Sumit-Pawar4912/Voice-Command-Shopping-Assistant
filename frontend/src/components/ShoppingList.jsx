import { FiDownload, FiShoppingCart, FiTrash } from 'react-icons/fi'
import { useShopping } from '../context/ShoppingContext'
import ShoppingItemCard from './ShoppingItemCard'

export default function ShoppingList() {
  const { items, clearAll, exportList, isOffline } = useShopping()

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/60 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
          <FiShoppingCart /> Shopping List
          {isOffline && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              Offline
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={exportList}
            disabled={items.length === 0}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <FiDownload size={14} /> Export
          </button>
          <button
            onClick={clearAll}
            disabled={items.length === 0}
            className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-40 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-900/30"
          >
            <FiTrash size={14} /> Clear
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
          Your list is empty. Try saying "Add milk" or "I need apples".
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <ShoppingItemCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  )
}
