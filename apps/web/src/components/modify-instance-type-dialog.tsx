'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'
import { EC2Instance, AWSService } from '@/lib/aws-service'
import useStore, { getDecryptedCredentials } from '@/store/useStore'
import { Skeleton } from '@/components/ui/skeleton'

interface ModifyInstanceTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instance: EC2Instance | null
  onConfirm: (instanceId: string, newType: string) => void
  isModifying?: boolean
}

// Manually add T4g series instance types (as backup)
const T4G_INSTANCE_TYPES = [
  { value: 't4g.nano', label: 't4g.nano (2 vCPU, 0.5 GB)', vcpu: 2, memory: 0.5 },
  { value: 't4g.micro', label: 't4g.micro (2 vCPU, 1 GB)', vcpu: 2, memory: 1 },
  { value: 't4g.small', label: 't4g.small (2 vCPU, 2 GB)', vcpu: 2, memory: 2 },
  { value: 't4g.medium', label: 't4g.medium (2 vCPU, 4 GB)', vcpu: 2, memory: 4 },
  { value: 't4g.large', label: 't4g.large (2 vCPU, 8 GB)', vcpu: 2, memory: 8 },
  { value: 't4g.xlarge', label: 't4g.xlarge (4 vCPU, 16 GB)', vcpu: 4, memory: 16 },
  { value: 't4g.2xlarge', label: 't4g.2xlarge (8 vCPU, 32 GB)', vcpu: 8, memory: 32 },
]

export default function ModifyInstanceTypeDialog({
  open,
  onOpenChange,
  instance,
  onConfirm,
  isModifying
}: ModifyInstanceTypeDialogProps) {
  const [selectedType, setSelectedType] = useState<string>('')
  const { credentials, selectedRegion } = useStore()
  
  // Get all available instance types
  const { data: instanceTypes, isLoading } = useQuery({
    queryKey: ['instanceTypes', selectedRegion],
    queryFn: async () => {
      if (!credentials) throw new Error('No credentials')
      
      const decryptedCreds = await getDecryptedCredentials(credentials)
      if (!decryptedCreds) throw new Error('Failed to decrypt credentials')
      
      const service = new AWSService(decryptedCreds, selectedRegion)
      const types = await service.getInstanceTypes()
      
      // Organize instance type data
      const typeGroups: Record<string, Array<{value: string, label: string, vcpu: number, memory: number}>> = {}
      
      types.forEach(type => {
        if (!type.InstanceType) return
        
        // Extract series name (e.g., t2, t3, t4g, c5, r5, etc.)
        const family = type.InstanceType.split('.')[0]
        
        if (!typeGroups[family]) {
          typeGroups[family] = []
        }
        
        const vcpu = type.VCpuInfo?.DefaultVCpus || 0
        const memory = type.MemoryInfo?.SizeInMiB ? (type.MemoryInfo.SizeInMiB / 1024) : 0
        
        typeGroups[family].push({
          value: type.InstanceType,
          label: `${type.InstanceType} (${vcpu} vCPU, ${memory.toFixed(1)} GB)`,
          vcpu,
          memory
        })
      })
      
      // Sort by vCPU and memory
      Object.keys(typeGroups).forEach(family => {
        typeGroups[family].sort((a, b) => {
          if (a.vcpu !== b.vcpu) return a.vcpu - b.vcpu
          return a.memory - b.memory
        })
      })
      
      // Ensure T4g series is included
      if (!typeGroups['t4g'] || typeGroups['t4g'].length === 0) {
        typeGroups['t4g'] = T4G_INSTANCE_TYPES
      }
      
      return typeGroups
    },
    enabled: open && !!credentials,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  })
  
  const handleConfirm = () => {
    console.log('Confirm clicked:', { instance, selectedType })
    if (instance && selectedType && selectedType !== instance.instanceType) {
      onConfirm(instance.instanceId, selectedType)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedType('')
    }
    onOpenChange(newOpen)
  }

  useEffect(() => {
    if (!open) {
      setSelectedType('')
    }
  }, [open])

  if (!instance) return null

  // Get instance type series classification name
  const getInstanceFamilyName = (family: string): string => {
    const familyNames: Record<string, string> = {
      't2': 'T2 - General Purpose (Intel)',
      't3': 'T3 - General Purpose (Intel)',
      't3a': 'T3a - General Purpose (AMD)',
      't4g': 'T4g - General Purpose (ARM)',
      'c5': 'C5 - Compute Optimized (Intel)',
      'c5n': 'C5n - Network Optimized (Intel)',
      'c6g': 'C6g - Compute Optimized (ARM)',
      'r5': 'R5 - Memory Optimized (Intel)',
      'r6g': 'R6g - Memory Optimized (ARM)',
      'm5': 'M5 - Balanced (Intel)',
      'm6g': 'M6g - Balanced (ARM)',
      'i3': 'I3 - Storage Optimized',
    }
    return familyNames[family] || family.toUpperCase()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modify Instance Type</DialogTitle>
          <DialogDescription>
            Change instance type for {instance.instanceName} ({instance.instanceId})
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Instance must be in stopped state to modify type. Instance needs to be restarted after modification.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label>Current Instance Type</Label>
            <div className="p-2 rounded-md bg-muted font-mono text-sm">
              {instance.instanceType}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>New Instance Type</Label>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new instance type" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {instanceTypes && Object.entries(instanceTypes)
                    .sort(([a], [b]) => {
                      // T4g series displayed first
                      if (a === 't4g') return -1
                      if (b === 't4g') return 1
                      return a.localeCompare(b)
                    })
                    .map(([family, types]) => (
                      <div key={family}>
                        <div className="text-xs font-medium text-muted-foreground px-2 py-1.5 sticky top-0 bg-background">
                          {getInstanceFamilyName(family)}
                        </div>
                        {types.map((type) => (
                          <SelectItem 
                            key={type.value} 
                            value={type.value}
                            disabled={type.value === instance.instanceType}
                          >
                            {type.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isModifying}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedType || selectedType === instance.instanceType || isModifying || isLoading}
          >
            {isModifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Modifying...
              </>
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}