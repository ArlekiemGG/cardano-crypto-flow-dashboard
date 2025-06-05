
import { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  description?: string
  gradient?: string
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon, 
  description,
  gradient = "gradient-primary"
}: MetricCardProps) {
  const changeColor = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-gray-400'
  }[changeType]

  const glowClass = {
    positive: 'glow-green',
    negative: 'glow-red',
    neutral: 'glow'
  }[changeType]

  return (
    <div className={`glass rounded-xl p-6 hover:scale-105 transition-all duration-300 ${glowClass} group`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${gradient} bg-opacity-20`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {change && (
          <span className={`text-sm font-medium ${changeColor}`}>
            {change}
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
        <p className="text-white text-2xl font-bold font-mono">{value}</p>
        {description && (
          <p className="text-gray-500 text-xs">{description}</p>
        )}
      </div>
      
      <div className="mt-4 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${gradient} rounded-full animate-pulse-glow`} style={{ width: '65%' }}></div>
      </div>
    </div>
  )
}
