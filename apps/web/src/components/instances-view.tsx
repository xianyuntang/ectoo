'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { 
  Play, 
  Square, 
  RefreshCw, 
  Server,
  Globe,
  Clock,
  MoreVertical,
  Activity,
  Cpu,
  HardDrive,
  Settings2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { AWSService, EC2Instance } from '@/lib/aws-service'
import useStore, { getDecryptedCredentials } from '@/store/useStore'
import { cn } from '@/lib/utils'
import ModifyInstanceTypeDialog from './modify-instance-type-dialog'

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'running':
      return { color: 'bg-green-500', bgColor: 'bg-green-500/10', textColor: 'text-green-700 dark:text-green-400', label: '運行中' }
    case 'stopped':
      return { color: 'bg-red-500', bgColor: 'bg-red-500/10', textColor: 'text-red-700 dark:text-red-400', label: '已停止' }
    case 'pending':
      return { color: 'bg-yellow-500', bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-700 dark:text-yellow-400', label: '啟動中' }
    case 'stopping':
      return { color: 'bg-orange-500', bgColor: 'bg-orange-500/10', textColor: 'text-orange-700 dark:text-orange-400', label: '停止中' }
    default:
      return { color: 'bg-gray-500', bgColor: 'bg-gray-500/10', textColor: 'text-gray-700 dark:text-gray-400', label: status }
  }
}

export default function InstancesView() {
  const { credentials, selectedRegion } = useStore()
  const [awsService, setAwsService] = useState<AWSService | null>(null)
  const [selectedInstance, setSelectedInstance] = useState<EC2Instance | null>(null)
  const [isModifyTypeDialogOpen, setIsModifyTypeDialogOpen] = useState(false)
  const queryClient = useQueryClient()
  
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
      toast.success('實例啟動指令已發送')
      setTimeout(() => refetch(), 2000)
    },
    onError: (error) => {
      toast.error(`啟動失敗: ${error.message}`)
    },
  })
  
  const stopInstanceMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      if (!awsService) throw new Error('AWS service not initialized')
      await awsService.stopInstance(instanceId)
    },
    onSuccess: () => {
      toast.success('實例停止指令已發送')
      setTimeout(() => refetch(), 2000)
    },
    onError: (error) => {
      toast.error(`停止失敗: ${error.message}`)
    },
  })
  
  const modifyInstanceTypeMutation = useMutation({
    mutationFn: async ({ instanceId, instanceType }: { instanceId: string; instanceType: string }) => {
      if (!awsService) throw new Error('AWS service not initialized')
      await awsService.modifyInstanceType(instanceId, instanceType)
    },
    onSuccess: () => {
      toast.success('實例類型修改成功')
      setIsModifyTypeDialogOpen(false)
      setSelectedInstance(null)
      // 立即刷新數據
      queryClient.invalidateQueries({ queryKey: ['instances', selectedRegion] })
    },
    onError: (error: Error & { code?: string }) => {
      // 處理特定錯誤
      if (error.code === 'IncorrectInstanceState') {
        toast.error('實例必須處於停止狀態才能修改類型')
      } else if (error.code === 'InvalidInstanceAttributeValue') {
        toast.error('無效的實例類型')
      } else {
        toast.error(`修改失敗: ${error.message}`)
      }
    },
  })
  
  const handleModifyInstanceType = (instanceId: string, newType: string) => {
    modifyInstanceTypeMutation.mutate({ instanceId, instanceType: newType })
  }
  
  // 統計數據
  const stats = {
    total: instances?.length || 0,
    running: instances?.filter(i => i.state === 'running').length || 0,
    stopped: instances?.filter(i => i.state === 'stopped').length || 0,
  }
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* 統計卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">總實例數</p>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Server className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">運行中</p>
                <p className="text-3xl font-bold mt-1 text-green-600">{stats.running}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已停止</p>
                <p className="text-3xl font-bold mt-1 text-red-600">{stats.stopped}</p>
              </div>
              <div className="p-3 rounded-full bg-red-500/10">
                <Square className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">當前區域</p>
                <p className="text-2xl font-bold mt-1">{selectedRegion}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 操作欄 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">實例列表</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
          {isRefetching ? '刷新中...' : '刷新'}
        </Button>
      </div>
      
      {/* 實例卡片網格 */}
      <div className="grid grid-cols-2 gap-6">
        {instances?.length === 0 ? (
          <Card className="col-span-2 border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                此區域沒有 EC2 實例
              </p>
            </CardContent>
          </Card>
        ) : (
          instances?.map((instance) => {
            const statusConfig = getStatusConfig(instance.state)
            return (
              <Card key={instance.instanceId} className="border-0 shadow-sm card-hover">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold">
                        {instance.instanceName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground font-mono">
                        {instance.instanceId}
                      </p>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>查看詳情</DropdownMenuItem>
                        <DropdownMenuItem>監控指標</DropdownMenuItem>
                        <DropdownMenuItem>連接終端</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => {
                            console.log('Modify instance type clicked', instance)
                            setSelectedInstance(instance)
                            setIsModifyTypeDialogOpen(true)
                          }}
                          disabled={instance.state !== 'stopped'}
                        >
                          <Settings2 className="h-4 w-4 mr-2" />
                          修改實例類型
                          {instance.state !== 'stopped' && ' (需要先停止實例)'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full", statusConfig.bgColor)}>
                    <div className={cn("h-2 w-2 rounded-full", statusConfig.color)} />
                    <span className={cn("text-sm font-medium", statusConfig.textColor)}>
                      {statusConfig.label}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">實例類型</p>
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{instance.instanceType}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">啟動時間</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(instance.launchTime).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">公有 IP</p>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium font-mono text-xs">
                          {instance.publicIp || '無'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">私有 IP</p>
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium font-mono text-xs">
                          {instance.privateIp || '無'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    {instance.state === 'stopped' && (
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => startInstanceMutation.mutate(instance.instanceId)}
                        disabled={startInstanceMutation.isPending}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        啟動實例
                      </Button>
                    )}
                    {instance.state === 'running' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => stopInstanceMutation.mutate(instance.instanceId)}
                        disabled={stopInstanceMutation.isPending}
                      >
                        <Square className="h-4 w-4 mr-2" />
                        停止實例
                      </Button>
                    )}
                    {(instance.state === 'pending' || instance.state === 'stopping') && (
                      <Button size="sm" className="flex-1" disabled>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        處理中...
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
      
      {/* 修改實例類型對話框 */}
      <ModifyInstanceTypeDialog
        open={isModifyTypeDialogOpen}
        onOpenChange={setIsModifyTypeDialogOpen}
        instance={selectedInstance}
        onConfirm={handleModifyInstanceType}
        isModifying={modifyInstanceTypeMutation.isPending}
      />
    </div>
  )
}