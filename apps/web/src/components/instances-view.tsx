'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
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
  Settings2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { EC2Instance } from '@/lib/aws-service';
import { AWSServiceWrapper } from '@/lib/aws-service-wrapper';
import useStore, { getDecryptedCredentials } from '@/store/useStore';
import { cn } from '@/lib/utils';
import ModifyInstanceTypeDialog from './modify-instance-type-dialog';
import InstanceDetailsDialog from './instance-details-dialog';
import ConfirmationDialog from './confirmation-dialog';

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'running':
      return {
        color: 'bg-green-500',
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-700 dark:text-green-400',
        label: 'Running',
      };
    case 'stopped':
      return {
        color: 'bg-red-500',
        bgColor: 'bg-red-500/10',
        textColor: 'text-red-700 dark:text-red-400',
        label: 'Stopped',
      };
    case 'pending':
      return {
        color: 'bg-yellow-500',
        bgColor: 'bg-yellow-500/10',
        textColor: 'text-yellow-700 dark:text-yellow-400',
        label: 'Starting',
      };
    case 'stopping':
      return {
        color: 'bg-orange-500',
        bgColor: 'bg-orange-500/10',
        textColor: 'text-orange-700 dark:text-orange-400',
        label: 'Stopping',
      };
    default:
      return {
        color: 'bg-gray-500',
        bgColor: 'bg-gray-500/10',
        textColor: 'text-gray-700 dark:text-gray-400',
        label: status,
      };
  }
};

export default function InstancesView() {
  const { credentials, selectedRegion } = useStore();
  const [awsService, setAwsService] = useState<AWSServiceWrapper | null>(null);
  const isBackendMode = process.env.NEXT_PUBLIC_USE_AWS_BACKEND === 'true';
  const [selectedInstance, setSelectedInstance] = useState<EC2Instance | null>(
    null,
  );
  const [isModifyTypeDialogOpen, setIsModifyTypeDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'start' | 'stop' | null;
    instanceId: string | null;
  }>({ type: null, instanceId: null });
  const queryClient = useQueryClient();

  const {
    data: instances,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['instances', selectedRegion],
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
      
      setAwsService(service);
      return service.getInstances();
    },
    enabled: isBackendMode || !!credentials,
    refetchInterval: 30000,
  });

  const startInstanceMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      if (!awsService) throw new Error('AWS service not initialized');
      await awsService.startInstance(instanceId);
    },
    onSuccess: () => {
      toast.success('Instance start command sent');
      refetch(); // Refetch immediately
    },
    onError: (error) => {
      toast.error(`Start failed: ${error.message}`);
    },
  });

  const stopInstanceMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      if (!awsService) throw new Error('AWS service not initialized');
      await awsService.stopInstance(instanceId);
    },
    onSuccess: () => {
      toast.success('Instance stop command sent');
      refetch(); // Refetch immediately
    },
    onError: (error) => {
      toast.error(`Stop failed: ${error.message}`);
    },
  });

  const modifyInstanceTypeMutation = useMutation({
    mutationFn: async ({
      instanceId,
      instanceType,
    }: {
      instanceId: string;
      instanceType: string;
    }) => {
      if (!awsService) throw new Error('AWS service not initialized');
      await awsService.modifyInstanceType(instanceId, instanceType);
    },
    onSuccess: () => {
      toast.success('Instance type modified successfully');
      setIsModifyTypeDialogOpen(false);
      setSelectedInstance(null);
      // Refresh data immediately
      queryClient.invalidateQueries({
        queryKey: ['instances', selectedRegion],
      });
    },
    onError: (error: Error & { code?: string }) => {
      // Handle specific errors
      if (error.code === 'IncorrectInstanceState') {
        toast.error('Instance must be in stopped state to modify type');
      } else if (error.code === 'InvalidInstanceAttributeValue') {
        toast.error('Invalid instance type');
      } else {
        toast.error(`Modification failed: ${error.message}`);
      }
    },
  });

  const handleModifyInstanceType = (instanceId: string, newType: string) => {
    modifyInstanceTypeMutation.mutate({ instanceId, instanceType: newType });
  };

  const handleFetchDetails = async (instanceId: string) => {
    if (!awsService) throw new Error('AWS service not initialized');
    return awsService.getInstanceDetails(instanceId);
  };

  const handleStartClick = (instanceId: string) => {
    setConfirmAction({ type: 'start', instanceId });
  };

  const handleStopClick = (instanceId: string) => {
    setConfirmAction({ type: 'stop', instanceId });
  };

  const handleConfirmAction = () => {
    if (confirmAction.type && confirmAction.instanceId) {
      if (confirmAction.type === 'start') {
        startInstanceMutation.mutate(confirmAction.instanceId);
      } else if (confirmAction.type === 'stop') {
        stopInstanceMutation.mutate(confirmAction.instanceId);
      }
    }
    setConfirmAction({ type: null, instanceId: null });
  };

  // Statistics
  const stats = {
    total: instances?.length || 0,
    running: instances?.filter((i) => i.state === 'running').length || 0,
    stopped: instances?.filter((i) => i.state === 'stopped').length || 0,
  };

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
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Instances</p>
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
                <p className="text-sm text-muted-foreground">Running</p>
                <p className="text-3xl font-bold mt-1 text-green-600">
                  {stats.running}
                </p>
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
                <p className="text-sm text-muted-foreground">Stopped</p>
                <p className="text-3xl font-bold mt-1 text-red-600">
                  {stats.stopped}
                </p>
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
                <p className="text-sm text-muted-foreground">Current Region</p>
                <p className="text-2xl font-bold mt-1">{selectedRegion}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Instance List</h2>
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

      {/* Instance cards grid */}
      <div className="grid grid-cols-2 gap-6">
        {instances?.length === 0 ? (
          <Card className="col-span-2 border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                No EC2 instances in this region
              </p>
            </CardContent>
          </Card>
        ) : (
          instances?.map((instance) => {
            const statusConfig = getStatusConfig(instance.state);
            return (
              <Card
                key={instance.instanceId}
                className="border-0 shadow-sm card-hover"
              >
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
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedInstance(instance);
                            setIsDetailsDialogOpen(true);
                          }}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>Monitoring Metrics</DropdownMenuItem>
                        <DropdownMenuItem>Connect Terminal</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            console.log(
                              'Modify instance type clicked',
                              instance,
                            );
                            setSelectedInstance(instance);
                            setIsModifyTypeDialogOpen(true);
                          }}
                          disabled={instance.state !== 'stopped'}
                        >
                          <Settings2 className="h-4 w-4 mr-2" />
                          Modify Instance Type
                          {instance.state !== 'stopped' &&
                            ' (Stop instance first)'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div
                    className={cn(
                      'inline-flex items-center gap-2 px-3 py-1 rounded-full',
                      statusConfig.bgColor,
                    )}
                  >
                    <div
                      className={cn('h-2 w-2 rounded-full', statusConfig.color)}
                    />
                    <span
                      className={cn(
                        'text-sm font-medium',
                        statusConfig.textColor,
                      )}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">
                        Instance Type
                      </p>
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {instance.instanceType}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Launch Time</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(instance.launchTime).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Public IP</p>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium font-mono text-xs">
                          {instance.publicIp || 'None'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Private IP</p>
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium font-mono text-xs">
                          {instance.privateIp || 'None'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {instance.state === 'stopped' && (
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleStartClick(instance.instanceId)}
                        disabled={startInstanceMutation.isPending}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Instance
                      </Button>
                    )}
                    {instance.state === 'running' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleStopClick(instance.instanceId)}
                        disabled={stopInstanceMutation.isPending}
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Stop Instance
                      </Button>
                    )}
                    {(instance.state === 'pending' ||
                      instance.state === 'stopping') && (
                      <Button size="sm" className="flex-1" disabled>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modify instance type dialog */}
      <ModifyInstanceTypeDialog
        open={isModifyTypeDialogOpen}
        onOpenChange={setIsModifyTypeDialogOpen}
        instance={selectedInstance}
        onConfirm={handleModifyInstanceType}
        isModifying={modifyInstanceTypeMutation.isPending}
      />

      {/* Instance Details Dialog */}
      <InstanceDetailsDialog
        instance={selectedInstance}
        isOpen={isDetailsDialogOpen}
        onClose={() => {
          setIsDetailsDialogOpen(false);
          setSelectedInstance(null);
        }}
        onFetchDetails={handleFetchDetails}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmAction.type !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction({ type: null, instanceId: null });
          }
        }}
        title={
          confirmAction.type === 'start'
            ? 'Start Instance'
            : confirmAction.type === 'stop'
            ? 'Stop Instance'
            : ''
        }
        description={
          confirmAction.type === 'start'
            ? `Are you sure you want to start instance ${confirmAction.instanceId}? This will incur AWS charges.`
            : confirmAction.type === 'stop'
            ? `Are you sure you want to stop instance ${confirmAction.instanceId}? Any unsaved work will be lost.`
            : ''
        }
        confirmText={confirmAction.type === 'start' ? 'Start' : 'Stop'}
        variant={confirmAction.type === 'stop' ? 'destructive' : 'default'}
        onConfirm={handleConfirmAction}
        isLoading={
          confirmAction.type === 'start'
            ? startInstanceMutation.isPending
            : stopInstanceMutation.isPending
        }
      />
    </div>
  );
}
