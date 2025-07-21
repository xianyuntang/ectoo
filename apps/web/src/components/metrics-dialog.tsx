'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Activity, AlertCircle } from 'lucide-react'
import { EC2Instance, InstanceMetrics } from '@/lib/aws-service'
import MetricsChart from './metrics-chart'

interface MetricsDialogProps {
  instance: EC2Instance | null
  isOpen: boolean
  onClose: () => void
  onFetchMetrics: (instanceId: string, period: number) => Promise<InstanceMetrics>
}

const TIME_RANGES = [
  { label: 'Last 1 Hour', value: 3600 },
  { label: 'Last 6 Hours', value: 21600 },
  { label: 'Last 24 Hours', value: 86400 },
  { label: 'Last 7 Days', value: 604800 },
  { label: 'Last 30 Days', value: 2592000 },
]

export default function MetricsDialog({ instance, isOpen, onClose, onFetchMetrics }: MetricsDialogProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(3600)

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['metrics', instance?.instanceId, selectedPeriod],
    queryFn: () => onFetchMetrics(instance!.instanceId, selectedPeriod),
    enabled: !!instance && isOpen,
    refetchInterval: 60000, // Refresh every minute
  })

  if (!instance) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Instance Metrics
          </DialogTitle>
          <DialogDescription>
            Performance metrics for {instance.instanceName} ({instance.instanceId})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-6">
          <div className="flex items-center justify-between">
            <Select
              value={selectedPeriod.toString()}
              onValueChange={(value) => setSelectedPeriod(parseInt(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value.toString()}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to fetch metrics: {error instanceof Error ? error.message : 'Unknown error'}
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-[350px]" />
              ))}
            </div>
          ) : metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricsChart
                title="CPU Utilization"
                description="Average CPU usage percentage"
                data={metrics.cpuUtilization}
                color="#3b82f6"
                unit="Percent"
              />
              
              <MetricsChart
                title="Network In"
                description="Incoming network traffic"
                data={metrics.networkIn}
                color="#10b981"
                unit="Bytes"
              />
              
              <MetricsChart
                title="Network Out"
                description="Outgoing network traffic"
                data={metrics.networkOut}
                color="#f59e0b"
                unit="Bytes"
              />
              
              <MetricsChart
                title="Disk Read"
                description="Disk read operations"
                data={metrics.diskReadBytes}
                color="#8b5cf6"
                unit="Bytes"
              />
              
              <MetricsChart
                title="Disk Write"
                description="Disk write operations"
                data={metrics.diskWriteBytes}
                color="#ec4899"
                unit="Bytes"
              />
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No metrics data available. Make sure the instance has CloudWatch monitoring enabled.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}