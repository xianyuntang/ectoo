'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { RefreshCw, Server, Activity, Square as StopIcon } from 'lucide-react'
import { AWSService } from '@/lib/aws-service'
import useStore, { getDecryptedCredentials } from '@/store/useStore'
import { cn } from '@/lib/utils'
import InstanceCard from './instance-card'

export default function InstancesGrid() {
  const { credentials, selectedRegion } = useStore()
  const [awsService, setAwsService] = useState<AWSService | null>(null)
  
  const { data: instances, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['instances', selectedRegion],
    queryFn: async () => {
      if (!credentials) throw new Error('No credentials')
      
      const decryptedCreds = await getDecryptedCredentials(credentials)
      if (!decryptedCreds) throw new Error('Failed to decrypt credentials')
      
      const service = new AWSService(decryptedCreds, selectedRegion)
      setAwsService(service)
      return service.getInstances()
    },
    enabled: !!credentials,
    refetchInterval: 30000,
  })
  
  const startInstanceMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      if (!awsService) throw new Error('AWS service not initialized')
      await awsService.startInstance(instanceId)
    },
    onSuccess: () => {
      toast.success('Instance start command sent')
      setTimeout(() => refetch(), 2000)
    },
    onError: (error) => {
      toast.error(`Failed to start instance: ${error.message}`)
    },
  })
  
  const stopInstanceMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      if (!awsService) throw new Error('AWS service not initialized')
      await awsService.stopInstance(instanceId)
    },
    onSuccess: () => {
      toast.success('Instance stop command sent')
      setTimeout(() => refetch(), 2000)
    },
    onError: (error) => {
      toast.error(`Failed to stop instance: ${error.message}`)
    },
  })
  
  // Stats
  const stats = {
    total: instances?.length || 0,
    running: instances?.filter(i => i.state === 'running').length || 0,
    stopped: instances?.filter(i => i.state === 'stopped').length || 0,
  }
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Instances</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Server className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Running</p>
                <p className="text-2xl font-bold text-green-600">{stats.running}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stopped</p>
                <p className="text-2xl font-bold text-gray-600">{stats.stopped}</p>
              </div>
              <StopIcon className="h-8 w-8 text-gray-600/50" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">EC2 Instances</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
          {isRefetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      
      {/* Instances Grid */}
      {instances?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No instances found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              There are no EC2 instances in the {selectedRegion} region
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instances?.map((instance) => (
            <InstanceCard
              key={instance.instanceId}
              instance={instance}
              onStart={startInstanceMutation.mutate}
              onStop={stopInstanceMutation.mutate}
              isStarting={startInstanceMutation.isPending}
              isStopping={stopInstanceMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}