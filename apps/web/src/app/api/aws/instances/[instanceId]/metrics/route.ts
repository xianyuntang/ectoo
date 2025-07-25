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
    const periodParam = searchParams.get('period');
    const period = periodParam ? parseInt(periodParam) : 3600;
    
    const awsService = new AWSServiceBackend(region);
    const metrics = await awsService.getInstanceMetrics(params.instanceId, period);
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching instance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instance metrics' },
      { status: 500 }
    );
  }
}