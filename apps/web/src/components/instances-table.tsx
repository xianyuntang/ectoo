'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Play, Square, RefreshCw } from 'lucide-react';
import { AWSService } from '@/lib/aws-service';
import useStore, { getDecryptedCredentials } from '@/store/useStore';
import { cn } from '@/lib/utils';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'running':
      return 'bg-green-500';
    case 'stopped':
      return 'bg-red-500';
    case 'pending':
    case 'stopping':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

export default function InstancesTable() {
  const { credentials, selectedRegion } = useStore();
  const [awsService, setAwsService] = useState<AWSService | null>(null);

  const {
    data: instances,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['instances', selectedRegion],
    queryFn: async () => {
      if (!credentials) throw new Error('No credentials');

      const decryptedCreds = await getDecryptedCredentials(credentials);
      if (!decryptedCreds) throw new Error('Failed to decrypt credentials');

      const service = new AWSService(decryptedCreds, selectedRegion);
      setAwsService(service);
      return service.getInstances();
    },
    enabled: !!credentials,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const startInstanceMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      if (!awsService) throw new Error('AWS service not initialized');
      await awsService.startInstance(instanceId);
    },
    onSuccess: () => {
      toast.success('Instance start command sent');
      setTimeout(() => refetch(), 2000);
    },
    onError: (error) => {
      toast.error(`Failed to start instance: ${error.message}`);
    },
  });

  const stopInstanceMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      if (!awsService) throw new Error('AWS service not initialized');
      await awsService.stopInstance(instanceId);
    },
    onSuccess: () => {
      toast.success('Instance stop command sent');
      setTimeout(() => refetch(), 2000);
    },
    onError: (error) => {
      toast.error(`Failed to stop instance: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">
          EC2 Instances - {selectedRegion}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw
            className={cn('h-4 w-4 mr-2', isRefetching && 'animate-spin')}
          />
          {isRefetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Instance ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Public IP</TableHead>
              <TableHead>Private IP</TableHead>
              <TableHead>Launch Time</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {instances?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground"
                >
                  No instances found in this region
                </TableCell>
              </TableRow>
            ) : (
              instances?.map((instance) => (
                <TableRow key={instance.instanceId}>
                  <TableCell className="font-medium">
                    {instance.instanceName}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {instance.instanceId}
                  </TableCell>
                  <TableCell>{instance.instanceType}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          getStatusColor(instance.state),
                        )}
                      />
                      <Badge variant="outline">{instance.state}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{instance.publicIp || '-'}</TableCell>
                  <TableCell>{instance.privateIp || '-'}</TableCell>
                  <TableCell>
                    {new Date(instance.launchTime).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {instance.state === 'stopped' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            startInstanceMutation.mutate(instance.instanceId)
                          }
                          disabled={startInstanceMutation.isPending}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {instance.state === 'running' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            stopInstanceMutation.mutate(instance.instanceId)
                          }
                          disabled={stopInstanceMutation.isPending}
                        >
                          <Square className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
