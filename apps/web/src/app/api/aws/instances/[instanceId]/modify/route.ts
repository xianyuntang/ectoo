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
    const { region = 'us-east-1', instanceType } = body;
    
    if (!instanceType) {
      return NextResponse.json(
        { error: 'Instance type is required' },
        { status: 400 }
      );
    }
    
    const awsService = new AWSServiceBackend(region);
    await awsService.modifyInstanceType(params.instanceId, instanceType);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error modifying instance type:', error);
    return NextResponse.json(
      { error: 'Failed to modify instance type' },
      { status: 500 }
    );
  }
}