import { useState } from 'react'
import { FiSearch } from 'react-icons/fi'
import { searchProducts } from '../services/api'
import { useShopping } from '../context/ShoppingContext'
import Loader from './Loader'

export default function SearchBar() {
  const { showToast, addItemManually } = useShopping()
  const [query, setQuery] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [organicOnly, setOrganicOnly] = useState(false)
  const [results, setResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setIsSearching(true)
    try {
      const data = await searchProducts({
        q: query.trim(),
        max_price: maxPrice ? Number(maxPrice) : undefined,
        organic: organicOnly ? true : undefined,
      })
      setResults(data)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/60 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
        <FiSearch /> Search Products
      </h2>

      <form onSubmit={handleSearch} className="mb-4 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. toothpaste, milk..."
          className="min-w-[140px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <input
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          type="number"
          placeholder="Max price"
          className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={organicOnly} onChange={(e) => setOrganicOnly(e.target.checked)} />
          Organic
        </label>
        <button
          type="submit"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          Search
        </button>
      </form>

      {isSearching && <Loader label="Searching..." />}

      {results && !isSearching && (
        results.length === 0 ? (
          <p className="text-sm text-slate-400">No products matched your search.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {results.map((p) => (
              <li
                key={p.name}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-800"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{p.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {p.brand} · {p.size} · {p.organic ? 'Organic' : 'Regular'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-brand-600 dark:text-brand-400">₹{p.price}</span>
                  <button
                    onClick={() => addItemManually({
                      name: p.name, quantity: 1, category: p.category, brand: p.brand, price: p.price,
                    })}
                    className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-300"
                  >
                    Add
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </section>
  )
}
