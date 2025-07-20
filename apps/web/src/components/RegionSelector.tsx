'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AWSService } from '@/lib/aws-service'
import useStore, { getDecryptedCredentials } from '@/store/useStore'

// 預設的 AWS 區域列表（備用）
const DEFAULT_REGIONS = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
  'ap-northeast-1', 'ap-northeast-2', 'ap-southeast-1', 'ap-southeast-2',
  'ap-south-1', 'sa-east-1', 'ca-central-1'
]

export default function RegionSelector() {
  const { credentials, selectedRegion, setSelectedRegion } = useStore()
  
  const { data: regions, isLoading } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      if (!credentials) throw new Error('No credentials')
      
      const decryptedCreds = await getDecryptedCredentials(credentials)
      if (!decryptedCreds) throw new Error('Failed to decrypt credentials')
      
      const service = new AWSService(decryptedCreds, selectedRegion)
      return service.getRegions()
    },
    enabled: !!credentials,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
  
  if (isLoading) {
    return <Skeleton className="w-[200px] h-10" />
  }
  
  // 如果載入失敗，使用預設區域列表
  const regionList = regions && regions.length > 0 
    ? regions.map(r => r.regionName).sort() 
    : DEFAULT_REGIONS
  
  return (
    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a region" />
      </SelectTrigger>
      <SelectContent>
        {regionList.map((region) => (
          <SelectItem key={region} value={region}>
            {region}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}