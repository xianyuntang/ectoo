import { NextRequest, NextResponse } from 'next/server';
import { AWSServiceBackend } from '@/lib/aws-service-backend';

export async function GET(request: NextRequest) {
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
    const instanceTypes = await awsService.getInstanceTypes();
    
    return NextResponse.json(instanceTypes);
  } catch (error) {
    console.error('Error fetching instance types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instance types' },
      { status: 500 }
    );
  }
}