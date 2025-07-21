'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { RefreshCw, Server, Activity, Square as StopIcon } from 'lucide-react';
import { AWSService, EC2Instance } from '@/lib/aws-service';
import useStore, { getDecryptedCredentials } from '@/store/useStore';
import { cn } from '@/lib/utils';
import InstanceCard from './instance-card';
import ModifyInstanceTypeDialog from './modify-instance-type-dialog';
import TerminalDialog from './terminal-dialog';
import MetricsDialog from './metrics-dialog';
import InstanceDetailsDialog from './instance-details-dialog';
import ConfirmationDialog from './confirmation-dialog';

export default function InstancesGrid() {
  const { credentials, selectedRegion } = useStore();
  const [awsService, setAwsService] = useState<AWSService | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<EC2Instance | null>(
    null,
  );
  const [isModifyTypeDialogOpen, setIsModifyTypeDialogOpen] = useState(false);
  const [isTerminalDialogOpen, setIsTerminalDialogOpen] = useState(false);
  const [isMetricsDialogOpen, setIsMetricsDialogOpen] = useState(false);
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
      if (!credentials) throw new Error('No credentials');

      const decryptedCreds = await getDecryptedCredentials(credentials);
      if (!decryptedCreds) throw new Error('Failed to decrypt credentials');

      const service = new AWSService(decryptedCreds, selectedRegion);
      setAwsService(service);
      return service.getInstances();
    },
    enabled: !!credentials,
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
      refetch(); // Refetch immediately
    },
    onError: (error) => {
      toast.error(`Failed to stop instance: ${error.message}`);
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
      queryClient.invalidateQueries({
        queryKey: ['instances', selectedRegion],
      });
    },
    onError: (error: Error & { code?: string }) => {
      if (error.code === 'IncorrectInstanceState') {
        toast.error('Instance must be stopped to modify its type');
      } else if (error.code === 'InvalidInstanceAttributeValue') {
        toast.error('Invalid instance type');
      } else {
        toast.error(`Failed to modify instance type: ${error.message}`);
      }
    },
  });

  const handleModifyInstanceType = (instanceId: string, newType: string) => {
    modifyInstanceTypeMutation.mutate({ instanceId, instanceType: newType });
  };

  const handleOpenModifyDialog = (instance: EC2Instance) => {
    setSelectedInstance(instance);
    setIsModifyTypeDialogOpen(true);
  };

  const handleOpenTerminal = (instance: EC2Instance) => {
    setSelectedInstance(instance);
    setIsTerminalDialogOpen(true);
  };

  const handleConnectTerminal = async (instanceId: string) => {
    if (!awsService) throw new Error('AWS service not initialized');
    return awsService.startSessionManager(instanceId);
  };

  const handleOpenMetrics = (instance: EC2Instance) => {
    setSelectedInstance(instance);
    setIsMetricsDialogOpen(true);
  };

  const handleFetchMetrics = async (instanceId: string, period: number) => {
    if (!awsService) throw new Error('AWS service not initialized');
    return awsService.getInstanceMetrics(instanceId, period);
  };

  const handleOpenDetails = (instance: EC2Instance) => {
    setSelectedInstance(instance);
    setIsDetailsDialogOpen(true);
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

  // Stats
  const stats = {
    total: instances?.length || 0,
    running: instances?.filter((i) => i.state === 'running').length || 0,
    stopped: instances?.filter((i) => i.state === 'stopped').length || 0,
  };

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
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Instances
                </p>
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
                <p className="text-sm font-medium text-muted-foreground">
                  Running
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.running}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-600/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Stopped
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.stopped}
                </p>
              </div>
              <StopIcon className="h-8 w-8 text-red-600/50" />
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
          <RefreshCw
            className={cn('h-4 w-4 mr-2', isRefetching && 'animate-spin')}
          />
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
              onStart={handleStartClick}
              onStop={handleStopClick}
              onModifyType={handleOpenModifyDialog}
              onConnectTerminal={handleOpenTerminal}
              onViewMetrics={handleOpenMetrics}
              onViewDetails={handleOpenDetails}
              isStarting={startInstanceMutation.isPending}
              isStopping={stopInstanceMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Modify Instance Type Dialog */}
      <ModifyInstanceTypeDialog
        open={isModifyTypeDialogOpen}
        onOpenChange={setIsModifyTypeDialogOpen}
        instance={selectedInstance}
        onConfirm={handleModifyInstanceType}
        isModifying={modifyInstanceTypeMutation.isPending}
      />

      {/* Terminal Dialog */}
      <TerminalDialog
        instance={selectedInstance}
        isOpen={isTerminalDialogOpen}
        onClose={() => {
          setIsTerminalDialogOpen(false);
          setSelectedInstance(null);
        }}
        onConnect={handleConnectTerminal}
      />

      {/* Metrics Dialog */}
      <MetricsDialog
        instance={selectedInstance}
        isOpen={isMetricsDialogOpen}
        onClose={() => {
          setIsMetricsDialogOpen(false);
          setSelectedInstance(null);
        }}
        onFetchMetrics={handleFetchMetrics}
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
