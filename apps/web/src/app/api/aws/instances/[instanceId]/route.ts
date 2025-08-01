import { NextRequest, NextResponse } from 'next/server';
import { AWSServiceBackend } from '@/lib/aws-service-backend';

export async function GET(
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
    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get('region') || 'us-east-1';
    
    const awsService = new AWSServiceBackend(region);
    const details = await awsService.getInstanceDetails(params.instanceId);
    
    return NextResponse.json(details);
  } catch (error) {
    console.error('Error fetching instance details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instance details' },
      { status: 500 }
    );
  }
}