'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Play,
  Square,
  Globe,
  Clock,
  Cpu,
  HardDrive,
  MoreVertical,
  Settings2,
  Copy,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { EC2Instance } from '@/lib/aws-service';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface InstanceCardProps {
  instance: EC2Instance;
  onStart: (instanceId: string) => void;
  onStop: (instanceId: string) => void;
  onModifyType?: (instance: EC2Instance) => void;
  onConnectTerminal?: (instance: EC2Instance) => void;
  onViewMetrics?: (instance: EC2Instance) => void;
  onViewDetails?: (instance: EC2Instance) => void;
  isStarting?: boolean;
  isStopping?: boolean;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'running':
      return {
        color: 'bg-green-500',
        bgColor: 'bg-green-50 dark:bg-green-950',
        textColor: 'text-green-700 dark:text-green-400',
        label: 'Running',
      };
    case 'stopped':
      return {
        color: 'bg-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-950',
        textColor: 'text-gray-700 dark:text-gray-400',
        label: 'Stopped',
      };
    case 'pending':
      return {
        color: 'bg-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950',
        textColor: 'text-yellow-700 dark:text-yellow-400',
        label: 'Starting',
      };
    case 'stopping':
      return {
        color: 'bg-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-950',
        textColor: 'text-orange-700 dark:text-orange-400',
        label: 'Stopping',
      };
    default:
      return {
        color: 'bg-gray-500',
        bgColor: 'bg-gray-50 dark:bg-gray-950',
        textColor: 'text-gray-700 dark:text-gray-400',
        label: status,
      };
  }
};

export default function InstanceCard({
  instance,
  onStart,
  onStop,
  onModifyType,
  onConnectTerminal,
  onViewMetrics,
  onViewDetails,
  isStarting,
  isStopping,
}: InstanceCardProps) {
  const statusConfig = getStatusConfig(instance.state);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg leading-none tracking-tight">
                  {instance.instanceName}
                </h3>
                <p className="text-sm text-muted-foreground font-mono">
                  {instance.instanceId}
                </p>
                <div
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium mt-2',
                    statusConfig.bgColor,
                    statusConfig.textColor,
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      statusConfig.color,
                    )}
                  />
                  {statusConfig.label}
                </div>
              </div>
              {onModifyType && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 -mr-2 -mt-1"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onViewDetails && onViewDetails(instance)}
                    >
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onViewMetrics && onViewMetrics(instance)}
                    >
                      Monitor Metrics
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        onConnectTerminal && onConnectTerminal(instance)
                      }
                      disabled={instance.state !== 'running'}
                    >
                      Connect Terminal
                      {instance.state !== 'running' &&
                        ' (Start instance first)'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onModifyType(instance)}
                      disabled={instance.state !== 'stopped'}
                    >
                      <Settings2 className="h-4 w-4 mr-2" />
                      Modify Instance Type
                      {instance.state !== 'stopped' && ' (Stop instance first)'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              Instance Type
            </p>
            <p className="font-medium">{instance.instanceType}</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Launch Time
            </p>
            <p className="font-medium">
              {new Date(instance.launchTime).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Public IP
            </p>
            {instance.publicIp ? (
              <button
                onClick={() => copyToClipboard(instance.publicIp)}
                className="flex items-center gap-1.5 font-medium font-mono text-xs hover:bg-muted px-1.5 py-0.5 -ml-1.5 rounded transition-colors group"
                title="Click to copy"
              >
                {instance.publicIp}
                <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ) : (
              <p className="font-medium font-mono text-xs">None</p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              Private IP
            </p>
            <p className="font-medium font-mono text-xs">
              {instance.privateIp || 'None'}
            </p>
          </div>
        </div>

        <div className="pt-2">
          {instance.state === 'stopped' && (
            <Button
              size="sm"
              className="w-full"
              onClick={() => onStart(instance.instanceId)}
              disabled={isStarting}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Instance
            </Button>
          )}
          {instance.state === 'running' && (
            <Button
              size="sm"
              variant="destructive"
              className="w-full"
              onClick={() => onStop(instance.instanceId)}
              disabled={isStopping}
            >
              <Square className="h-4 w-4 mr-2" />
              Stop Instance
            </Button>
          )}
          {(instance.state === 'pending' || instance.state === 'stopping') && (
            <Button size="sm" className="w-full" disabled>
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {instance.state === 'pending' ? 'Starting...' : 'Stopping...'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
