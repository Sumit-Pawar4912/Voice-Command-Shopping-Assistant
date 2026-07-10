export default function Loader({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
      <span>{label}</span>
    </div>
  )
}
