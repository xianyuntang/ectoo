'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Terminal, ExternalLink, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { EC2Instance } from '@/lib/aws-service'

interface TerminalDialogProps {
  instance: EC2Instance | null
  isOpen: boolean
  onClose: () => void
  onConnect: (instanceId: string) => Promise<{ url: string; sessionId: string }>
}

export default function TerminalDialog({ instance, isOpen, onClose, onConnect }: TerminalDialogProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionInfo, setSessionInfo] = useState<{ url: string; sessionId: string } | null>(null)

  const handleConnect = async () => {
    if (!instance) return

    setIsConnecting(true)
    setError(null)

    try {
      const session = await onConnect(instance.instanceId)
      setSessionInfo(session)
      
      // Open Session Manager in a new tab
      window.open(session.url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to instance')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleClose = () => {
    setError(null)
    setSessionInfo(null)
    onClose()
  }

  if (!instance) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Connect to Terminal
          </DialogTitle>
          <DialogDescription>
            Connect to {instance.instanceName} ({instance.instanceId}) using AWS Session Manager
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {sessionInfo && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Session started successfully! The terminal should open in a new tab.
                <br />
                Session ID: <code className="text-xs">{sessionInfo.sessionId}</code>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Requirements:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• EC2 instance must have SSM agent installed</li>
                <li>• Instance must have an IAM role with SSM permissions</li>
                <li>• Your IAM user needs Session Manager permissions</li>
              </ul>
            </div>

            {instance.state !== 'running' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Instance must be running to connect. Current state: {instance.state}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              disabled={isConnecting || instance.state !== 'running'}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Terminal
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}