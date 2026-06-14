import { Loader2 } from 'lucide-react'

export default function Loader({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  )
}
