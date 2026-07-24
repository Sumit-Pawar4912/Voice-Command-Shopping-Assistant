import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as api from '../services/api'

const ShoppingContext = createContext(null)

const LOCAL_STORAGE_KEY = 'voice-shopping-assistant:offline-items'
const DARK_MODE_KEY = 'voice-shopping-assistant:dark-mode'

export function ShoppingProvider({ children }) {
  const [items, setItems] = useState([])
  const [recommendations, setRecommendations] = useState({
    frequent: [], seasonal: [], substitutes: [],
  })
  const [toasts, setToasts] = useState([])
  const [loadingLabel, setLoadingLabel] = useState('')
  const [isOffline, setIsOffline] = useState(false)
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem(DARK_MODE_KEY) === 'true'
  )
  const [recentCommands, setRecentCommands] = useState([])
  const [lastCommand, setLastCommand] = useState(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem(DARK_MODE_KEY, String(darkMode))
  }, [darkMode])

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const persistOffline = useCallback((nextItems) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextItems))
    } catch {
      // Storage full or unavailable - fail silently, it's a non-critical fallback.
    }
  }, [])

  const refreshItems = useCallback(async () => {
    try {
      const data = await api.getItems()
      setItems(data)
      setIsOffline(false)
      persistOffline(data)
    } catch (err) {
      // Network failure -> fall back to whatever was cached locally.
      setIsOffline(true)
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (cached) setItems(JSON.parse(cached))
      showToast(`Offline mode: ${err.message}`, 'error')
    }
  }, [persistOffline, showToast])

  const refreshRecommendations = useCallback(async () => {
    try {
      const data = await api.getRecommendations()
      setRecommendations(data)
    } catch {
      // Non-critical - recommendations simply won't update this cycle.
    }
  }, [])

  const refreshRecentCommands = useCallback(async () => {
    try {
      const data = await api.getRecentCommands()
      setRecentCommands(data)
    } catch {
      // Non-critical.
    }
  }, [])

  useEffect(() => {
    refreshItems()
    refreshRecommendations()
    refreshRecentCommands()
  }, [refreshItems, refreshRecommendations, refreshRecentCommands])

  const runVoiceCommand = useCallback(
    async (text, language = 'en') => {
      setLoadingLabel('Understanding command...')
      try {
        const result = await api.processCommand(text, language)
        setLastCommand(result)
        showToast(result.message, result.success ? 'success' : 'error')

        if (['add', 'remove', 'update', 'clear'].includes(result.action)) {
          setLoadingLabel('Updating list...')
          await refreshItems()
          await refreshRecommendations()
          await refreshRecentCommands()
        }
        return result
      } catch (err) {
        showToast(err.message, 'error')
        throw err
      } finally {
        setLoadingLabel('')
      }
    },
    [refreshItems, refreshRecommendations, refreshRecentCommands, showToast]
  )

  const addItemManually = useCallback(
    async (item) => {
      try {
        await api.addItem(item)
        await refreshItems()
        await refreshRecommendations()
        showToast(`Added ${item.name} to your list.`, 'success')
      } catch (err) {
        showToast(err.message, 'error')
      }
    },
    [refreshItems, refreshRecommendations, showToast]
  )

  const removeItem = useCallback(
    async (id) => {
      try {
        await api.deleteItem(id)
        await refreshItems()
        showToast('Item removed.', 'success')
      } catch (err) {
        showToast(err.message, 'error')
      }
    },
    [refreshItems, showToast]
  )

  const editItem = useCallback(
    async (id, updates) => {
      try {
        await api.updateItem(id, updates)
        await refreshItems()
        showToast('Item updated.', 'success')
      } catch (err) {
        showToast(err.message, 'error')
      }
    },
    [refreshItems, showToast]
  )

  const clearAll = useCallback(async () => {
    try {
      await api.clearItems()
      await refreshItems()
      showToast('Shopping list cleared.', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }, [refreshItems, showToast])

  const exportList = useCallback(() => {
    const lines = items.map(
      (i) => `${i.quantity} x ${i.name} (${i.category})${i.brand ? ' - ' + i.brand : ''}`
    )
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'shopping-list.txt'
    link.click()
    URL.revokeObjectURL(url)
  }, [items])

  const value = {
    items, recommendations, toasts, loadingLabel, isOffline, darkMode, recentCommands,
    lastCommand, setDarkMode, showToast, runVoiceCommand, addItemManually, removeItem,
    editItem, clearAll, exportList, refreshItems,
  }

  return <ShoppingContext.Provider value={value}>{children}</ShoppingContext.Provider>
}

export function useShopping() {
  const ctx = useContext(ShoppingContext)
  if (!ctx) throw new Error('useShopping must be used within a ShoppingProvider')
  return ctx
}
