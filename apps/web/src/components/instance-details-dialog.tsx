'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Server, 
  AlertCircle, 
  Globe, 
  Network, 
  HardDrive, 
  Key,
  Tag,
  Shield,
  Cpu,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { EC2Instance, EC2InstanceDetails } from '@/lib/aws-service'

interface InstanceDetailsDialogProps {
  instance: EC2Instance | null
  isOpen: boolean
  onClose: () => void
  onFetchDetails: (instanceId: string) => Promise<EC2InstanceDetails>
}

interface DetailRowProps {
  label: string
  value?: string | null
  icon?: React.ReactNode
}

function DetailRow({ label, value, icon }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium">
        {value || <span className="text-muted-foreground">-</span>}
      </span>
    </div>
  )
}

export default function InstanceDetailsDialog({ 
  instance, 
  isOpen, 
  onClose, 
  onFetchDetails 
}: InstanceDetailsDialogProps) {
  const { data: details, isLoading, error } = useQuery({
    queryKey: ['instanceDetails', instance?.instanceId],
    queryFn: () => onFetchDetails(instance!.instanceId),
    enabled: !!instance && isOpen,
  })

  if (!instance) return null

  const getStatusBadge = (state: string) => {
    const statusConfig = {
      running: { variant: 'default' as const, className: 'bg-green-500' },
      stopped: { variant: 'secondary' as const, className: '' },
      pending: { variant: 'default' as const, className: 'bg-yellow-500' },
      stopping: { variant: 'default' as const, className: 'bg-orange-500' },
    }
    const config = statusConfig[state as keyof typeof statusConfig] || { variant: 'secondary' as const, className: '' }
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {state}
      </Badge>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Instance Details
          </DialogTitle>
          <DialogDescription>
            Detailed information for {instance.instanceName} ({instance.instanceId})
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to fetch details: {error instanceof Error ? error.message : 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[200px]" />
          </div>
        ) : details ? (
          <Tabs defaultValue="general" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
              <TabsTrigger value="storage">Storage</TabsTrigger>
              <TabsTrigger value="tags">Tags & Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Instance Information
                </h3>
                <div className="space-y-1">
                  <DetailRow label="Instance ID" value={details.instanceId} />
                  <DetailRow label="Instance Name" value={details.instanceName} />
                  <DetailRow label="Instance Type" value={details.instanceType} icon={<Cpu className="h-4 w-4" />} />
                  <DetailRow label="State" value={
                    <div className="flex items-center gap-2">
                      {getStatusBadge(details.state)}
                    </div>
                  } />
                  <DetailRow label="Launch Time" value={new Date(details.launchTime).toLocaleString()} icon={<Clock className="h-4 w-4" />} />
                  <DetailRow label="Availability Zone" value={details.availabilityZone} />
                  <DetailRow label="AMI ID" value={details.amiId} />
                  <DetailRow label="Platform" value={details.platform} />
                  <DetailRow label="Architecture" value={details.architecture} />
                  <DetailRow label="Virtualization Type" value={details.virtualizationType} />
                  <DetailRow label="Key Pair" value={details.keyName} icon={<Key className="h-4 w-4" />} />
                  <DetailRow label="Monitoring" value={
                    details.monitoring ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="h-3 w-3 mr-1" />
                        Disabled
                      </Badge>
                    )
                  } />
                </div>
              </div>

              {details.cpuOptions && (details.cpuOptions.coreCount || details.cpuOptions.threadsPerCore) && (
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    CPU Options
                  </h3>
                  <div className="space-y-1">
                    <DetailRow label="Core Count" value={details.cpuOptions.coreCount?.toString()} />
                    <DetailRow label="Threads Per Core" value={details.cpuOptions.threadsPerCore?.toString()} />
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="network" className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Network Configuration
                </h3>
                <div className="space-y-1">
                  <DetailRow label="VPC ID" value={details.vpcId} />
                  <DetailRow label="Subnet ID" value={details.subnetId} />
                  <DetailRow label="Public IP" value={details.publicIp} icon={<Globe className="h-4 w-4" />} />
                  <DetailRow label="Private IP" value={details.privateIp} />
                  <DetailRow label="Public DNS" value={details.publicDnsName} />
                  <DetailRow label="Private DNS" value={details.privateDnsName} />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="storage" className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Storage Devices
                </h3>
                <div className="space-y-1">
                  <DetailRow label="Root Device Type" value={details.rootDeviceType} />
                  <DetailRow label="Root Device Name" value={details.rootDeviceName} />
                </div>
              </div>

              {details.blockDeviceMappings && details.blockDeviceMappings.length > 0 && (
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-4">Block Device Mappings</h3>
                  <div className="space-y-4">
                    {details.blockDeviceMappings.map((device, index) => (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="font-medium text-sm">{device.deviceName}</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <DetailRow label="Volume ID" value={device.volumeId} />
                          <DetailRow label="Volume Type" value={device.volumeType} />
                          <DetailRow label="Size" value={device.volumeSize ? `${device.volumeSize} GB` : undefined} />
                          <DetailRow label="Delete on Termination" value={
                            device.deleteOnTermination !== undefined ? (
                              device.deleteOnTermination ? 
                                <Badge variant="destructive">Yes</Badge> : 
                                <Badge variant="secondary">No</Badge>
                            ) : undefined
                          } />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="tags" className="space-y-4">
              {details.tags && details.tags.length > 0 && (
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </h3>
                  <div className="space-y-2">
                    {details.tags.map((tag, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm font-medium">{tag.key}</span>
                        <Badge variant="secondary">{tag.value}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {details.securityGroups && details.securityGroups.length > 0 && (
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Security Groups
                  </h3>
                  <div className="space-y-2">
                    {details.securityGroups.map((sg, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm">{sg.groupName}</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {sg.groupId}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}