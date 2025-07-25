import {
  EC2Instance,
  EC2InstanceDetails,
  AWSRegion,
  SessionManagerUrl,
  InstanceMetrics,
  AWSService,
} from './aws-service';
import AWS from 'aws-sdk';

export class AWSServiceWrapper {
  private useBackend: boolean;
  private frontendService?: AWSService;
  private region: string;

  constructor(
    credentials?: { accessKeyId: string; secretAccessKey: string },
    region = 'us-east-1'
  ) {
    this.useBackend = process.env.NEXT_PUBLIC_USE_AWS_BACKEND === 'true';
    this.region = region;

    if (!this.useBackend) {
      if (!credentials) {
        throw new Error('Credentials are required for frontend mode');
      }
      this.frontendService = new AWSService(credentials, region);
    }
  }

  private async fetchFromBackend(endpoint: string, options?: RequestInit) {
    const response = await fetch(`/api/aws${endpoint}`, options);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Backend request failed');
    }
    return response.json();
  }

  async getRegions(): Promise<AWSRegion[]> {
    if (this.useBackend) {
      return this.fetchFromBackend(`/regions?region=${this.region}`);
    }
    if (!this.frontendService) {
      throw new Error('Frontend service not initialized');
    }
    return this.frontendService.getRegions();
  }

  async getInstances(): Promise<EC2Instance[]> {
    if (this.useBackend) {
      return this.fetchFromBackend(`/instances?region=${this.region}`);
    }
    if (!this.frontendService) {
      throw new Error('Frontend service not initialized');
    }
    return this.frontendService.getInstances();
  }

  async startInstance(instanceId: string): Promise<void> {
    if (this.useBackend) {
      await this.fetchFromBackend(`/instances/${instanceId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: this.region }),
      });
    } else {
      if (!this.frontendService) {
        throw new Error('Frontend service not initialized');
      }
      await this.frontendService.startInstance(instanceId);
    }
  }

  async stopInstance(instanceId: string): Promise<void> {
    if (this.useBackend) {
      await this.fetchFromBackend(`/instances/${instanceId}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: this.region }),
      });
    } else {
      if (!this.frontendService) {
        throw new Error('Frontend service not initialized');
      }
      await this.frontendService.stopInstance(instanceId);
    }
  }

  async modifyInstanceType(
    instanceId: string,
    instanceType: string
  ): Promise<void> {
    if (this.useBackend) {
      await this.fetchFromBackend(`/instances/${instanceId}/modify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: this.region, instanceType }),
      });
    } else {
      if (!this.frontendService) {
        throw new Error('Frontend service not initialized');
      }
      await this.frontendService.modifyInstanceType(instanceId, instanceType);
    }
  }

  async getInstanceTypes(): Promise<AWS.EC2.InstanceTypeInfo[]> {
    if (this.useBackend) {
      return this.fetchFromBackend(`/instance-types?region=${this.region}`);
    }
    if (!this.frontendService) {
      throw new Error('Frontend service not initialized');
    }
    return this.frontendService.getInstanceTypes();
  }

  changeRegion(region: string): void {
    this.region = region;
    if (!this.useBackend) {
      if (!this.frontendService) {
        throw new Error('Frontend service not initialized');
      }
      this.frontendService.changeRegion(region);
    }
  }

  async startSessionManager(instanceId: string): Promise<SessionManagerUrl> {
    if (this.useBackend) {
      return this.fetchFromBackend(`/instances/${instanceId}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: this.region }),
      });
    }
    if (!this.frontendService) {
      throw new Error('Frontend service not initialized');
    }
    return this.frontendService.startSessionManager(instanceId);
  }

  async terminateSession(sessionId: string): Promise<void> {
    if (!this.useBackend) {
      if (!this.frontendService) {
        throw new Error('Frontend service not initialized');
      }
      await this.frontendService.terminateSession(sessionId);
    }
    // Backend doesn't implement terminate session as it's handled by AWS console
  }

  async getInstanceMetrics(
    instanceId: string,
    period = 3600
  ): Promise<InstanceMetrics> {
    if (this.useBackend) {
      return this.fetchFromBackend(
        `/instances/${instanceId}/metrics?region=${this.region}&period=${period}`
      );
    }
    if (!this.frontendService) {
      throw new Error('Frontend service not initialized');
    }
    return this.frontendService.getInstanceMetrics(instanceId, period);
  }

  async getInstanceDetails(instanceId: string): Promise<EC2InstanceDetails> {
    if (this.useBackend) {
      return this.fetchFromBackend(
        `/instances/${instanceId}?region=${this.region}`
      );
    }
    if (!this.frontendService) {
      throw new Error('Frontend service not initialized');
    }
    return this.frontendService.getInstanceDetails(instanceId);
  }

  isUsingBackend(): boolean {
    return this.useBackend;
  }
}