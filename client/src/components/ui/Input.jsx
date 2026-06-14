import { forwardRef } from 'react'

const Input = forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
          error
            ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
            : 'border-slate-300 dark:border-slate-800 focus:border-brand-500 focus:ring-brand-500/20'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
