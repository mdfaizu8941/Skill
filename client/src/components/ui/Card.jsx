export function CardHeader({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
    </div>
  )
}

export default function Card({ children, className = '', noPadding = false }) {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm ${noPadding ? '' : 'p-6'} ${className}`}>
      {children}
    </div>
  )
}
