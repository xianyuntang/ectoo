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
    const instances = await awsService.getInstances();
    
    return NextResponse.json(instances);
  } catch (error) {
    console.error('Error fetching instances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instances' },
      { status: 500 }
    );
  }
}