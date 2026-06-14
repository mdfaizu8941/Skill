import Card from './Card'

export default function StatCard({ title, value, icon: Icon, trend }) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
        </div>
        {Icon && (
          <div className="p-3 bg-brand-50 dark:bg-brand-500/10 rounded-xl">
            <Icon className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {trend.isPositive ? '+' : '-'}
            {trend.value}%
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-500">vs last month</span>
        </div>
      )}
    </Card>
  )
}
