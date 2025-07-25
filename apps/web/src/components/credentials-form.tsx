'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff } from 'lucide-react';
import useStore from '@/store/useStore';

const credentialsSchema = z.object({
  accessKeyId: z
    .string()
    .min(16, 'Access Key ID must be at least 16 characters'),
  secretAccessKey: z
    .string()
    .min(32, 'Secret Access Key must be at least 32 characters'),
});

type CredentialsFormData = z.infer<typeof credentialsSchema>;

export default function CredentialsForm() {
  const [showSecret, setShowSecret] = useState(false);
  const { setCredentials, error } = useStore();
  const isBackendMode = process.env.NEXT_PUBLIC_USE_AWS_BACKEND === 'true';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CredentialsFormData>({
    resolver: zodResolver(credentialsSchema),
  });

  const onSubmit = async (data: CredentialsFormData) => {
    await setCredentials(data);
  };

  if (isBackendMode) {
    return (
      <Card className="w-full max-w-lg mx-auto shadow-lg">
        <CardHeader className="space-y-1 pb-8">
          <CardTitle className="text-2xl font-semibold">
            AWS Backend Mode
          </CardTitle>
          <CardDescription className="text-base">
            This application is running in backend mode. AWS credentials are configured on the server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              You don&apos;t need to provide AWS credentials. The server is configured with AWS access.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader className="space-y-1 pb-8">
        <CardTitle className="text-2xl font-semibold">
          AWS Credentials
        </CardTitle>
        <CardDescription className="text-base">
          Enter your AWS Access Key ID and Secret Access Key to connect to your
          EC2 instances
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessKeyId">Access Key ID</Label>
            <Input
              id="accessKeyId"
              type="text"
              placeholder="AKIAIOSFODNN7EXAMPLE"
              {...register('accessKeyId')}
            />
            {errors.accessKeyId && (
              <p className="text-sm text-destructive">
                {errors.accessKeyId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="secretAccessKey">Secret Access Key</Label>
            <div className="relative">
              <Input
                id="secretAccessKey"
                type={showSecret ? 'text' : 'password'}
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                {...register('secretAccessKey')}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.secretAccessKey && (
              <p className="text-sm text-destructive">
                {errors.secretAccessKey.message}
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="pt-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Credentials'}
            </Button>
          </div>

          <Alert>
            <AlertDescription>
              Your credentials will be encrypted and stored locally in your
              browser. We recommend using an IAM user with limited EC2
              permissions.
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>
    </Card>
  );
}
