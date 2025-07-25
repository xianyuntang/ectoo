import { NextRequest, NextResponse } from 'next/server';
import { AWSServiceBackend } from '@/lib/aws-service-backend';

export async function POST(
  request: NextRequest,
  { params }: { params: { instanceId: string } }
) {
  if (process.env.NEXT_PUBLIC_USE_AWS_BACKEND !== 'true') {
    return NextResponse.json(
      { error: 'Backend mode is not enabled' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const region = body.region || 'us-east-1';
    
    const awsService = new AWSServiceBackend(region);
    await awsService.startInstance(params.instanceId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error starting instance:', error);
    return NextResponse.json(
      { error: 'Failed to start instance' },
      { status: 500 }
    );
  }
}