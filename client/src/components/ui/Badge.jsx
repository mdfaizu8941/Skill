export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    brand: 'bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    danger: 'bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    info: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400',
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
