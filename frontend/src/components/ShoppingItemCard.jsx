import { useState } from 'react'
import { FiCheck, FiEdit2, FiTrash2, FiX } from 'react-icons/fi'
import { useShopping } from '../context/ShoppingContext'

const CATEGORY_COLORS = {
  Dairy: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Produce: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Bakery: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Grocery: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  Snacks: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  Beverage: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  'Personal Care': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Household: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  General: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

export default function ShoppingItemCard({ item }) {
  const { removeItem, editItem } = useShopping()
  const [isEditing, setIsEditing] = useState(false)
  const [quantity, setQuantity] = useState(item.quantity)

  const badgeClass = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.General

  const handleSave = async () => {
    await editItem(item.id, { quantity: Number(quantity) || 1 })
    setIsEditing(false)
  }

  return (
    <li className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{item.name}</p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
            {item.category}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {item.brand ? `${item.brand} · ` : ''}
          {item.price ? `₹${item.price} · ` : ''}
          Qty: {isEditing ? '' : item.quantity}
        </p>
      </div>

      {isEditing ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            autoFocus
          />
          <button onClick={handleSave} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
            <FiCheck size={16} />
          </button>
          <button onClick={() => setIsEditing(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <FiX size={16} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => setIsEditing(true)}
            aria-label={`Edit ${item.name}`}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <FiEdit2 size={16} />
          </button>
          <button
            onClick={() => removeItem(item.id)}
            aria-label={`Delete ${item.name}`}
            className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      )}
    </li>
  )
}
