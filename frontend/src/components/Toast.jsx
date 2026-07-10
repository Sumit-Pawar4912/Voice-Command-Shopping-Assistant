import { FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi'
import { useShopping } from '../context/ShoppingContext'

const STYLES = {
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-800',
  error: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-800',
  info: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-900/40 dark:text-sky-200 dark:border-sky-800',
}

const ICONS = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  info: FiInfo,
}

export default function ToastContainer() {
  const { toasts } = useShopping()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || FiInfo
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-2 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm animate-[fadeIn_0.2s_ease-out] ${STYLES[toast.type] || STYLES.info}`}
          >
            <Icon className="mt-0.5 shrink-0" size={18} />
            <p className="text-sm font-medium leading-snug">{toast.message}</p>
          </div>
        )
      })}
    </div>
  )
}
