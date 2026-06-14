import { AlertTriangle } from 'lucide-react'

export default function ErrorMessage({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <AlertTriangle className="w-8 h-8 text-red-400" />
      <p className="text-sm text-red-400">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 text-sm rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  )
}
