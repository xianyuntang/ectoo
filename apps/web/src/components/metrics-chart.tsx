'use client'

import { useMemo } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { MetricDataPoint } from '@/lib/aws-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatBytes, formatNumber } from '@/lib/utils'

interface MetricsChartProps {
  title: string
  description?: string
  data: MetricDataPoint[]
  color?: string
  formatter?: (value: number) => string
  unit?: string
}

export default function MetricsChart({ 
  title, 
  description, 
  data, 
  color = '#8884d8',
  formatter,
  unit
}: MetricsChartProps) {
  const chartData = useMemo(() => {
    return data.map(point => ({
      time: point.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: point.value,
      timestamp: point.timestamp
    }))
  }, [data])

  const formatValue = (value: number) => {
    if (formatter) return formatter(value)
    if (unit === 'Percent') return `${formatNumber(value)}%`
    if (unit === 'Bytes') return formatBytes(value)
    return formatNumber(value)
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium">{data.timestamp.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">
            {title}: <span className="font-medium text-foreground">{formatValue(data.value)}</span>
          </p>
        </div>
      )
    }
    return null
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="time" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickFormatter={formatValue}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}