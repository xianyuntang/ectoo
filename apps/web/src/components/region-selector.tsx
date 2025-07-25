'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AWSServiceWrapper } from '@/lib/aws-service-wrapper';
import useStore, { getDecryptedCredentials } from '@/store/useStore';

// Default AWS region list (backup)
const DEFAULT_REGIONS = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-south-1',
  'sa-east-1',
  'ca-central-1',
];

export default function RegionSelector() {
  const { credentials, selectedRegion, setSelectedRegion } = useStore();
  const isBackendMode = process.env.NEXT_PUBLIC_USE_AWS_BACKEND === 'true';

  const { data: regions, isLoading } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      if (!isBackendMode && !credentials) throw new Error('No credentials');

      let service: AWSServiceWrapper;
      if (isBackendMode) {
        service = new AWSServiceWrapper(undefined, selectedRegion);
      } else {
        const decryptedCreds = await getDecryptedCredentials(credentials);
        if (!decryptedCreds) throw new Error('Failed to decrypt credentials');
        service = new AWSServiceWrapper(decryptedCreds, selectedRegion);
      }
      
      return service.getRegions();
    },
    enabled: isBackendMode || !!credentials,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  if (isLoading) {
    return <Skeleton className="w-[200px] h-10" />;
  }

  // If loading fails, use default region list
  const regionList =
    regions && regions.length > 0
      ? regions.map((r) => r.regionName).sort()
      : DEFAULT_REGIONS;

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
  );
}
