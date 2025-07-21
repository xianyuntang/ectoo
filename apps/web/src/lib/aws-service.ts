import AWS from 'aws-sdk';

export interface EC2Instance {
  instanceId: string;
  instanceName: string;
  instanceType: string;
  state: string;
  publicIp?: string;
  privateIp?: string;
  launchTime: Date;
}

export interface EC2InstanceDetails extends EC2Instance {
  availabilityZone?: string;
  vpcId?: string;
  subnetId?: string;
  architecture?: string;
  hypervisor?: string;
  rootDeviceType?: string;
  rootDeviceName?: string;
  virtualizationType?: string;
  amiId?: string;
  platform?: string;
  publicDnsName?: string;
  privateDnsName?: string;
  keyName?: string;
  securityGroups?: Array<{
    groupId: string;
    groupName: string;
  }>;
  tags?: Array<{
    key: string;
    value: string;
  }>;
  blockDeviceMappings?: Array<{
    deviceName: string;
    volumeId?: string;
    status?: string;
    deleteOnTermination?: boolean;
    volumeSize?: number;
    volumeType?: string;
  }>;
  monitoring?: boolean;
  cpuOptions?: {
    coreCount?: number;
    threadsPerCore?: number;
  };
}

export interface AWSRegion {
  regionName: string;
  regionEndpoint: string;
}

export interface SessionManagerUrl {
  url: string;
  sessionId: string;
}

export interface MetricDataPoint {
  timestamp: Date;
  value: number;
  unit?: string;
}

export interface InstanceMetrics {
  cpuUtilization: MetricDataPoint[];
  networkIn: MetricDataPoint[];
  networkOut: MetricDataPoint[];
  diskReadBytes: MetricDataPoint[];
  diskWriteBytes: MetricDataPoint[];
}

export class AWSService {
  private ec2: AWS.EC2 | null = null;
  private ssm: AWS.SSM | null = null;
  private cloudwatch: AWS.CloudWatch | null = null;

  constructor(
    credentials: { accessKeyId: string; secretAccessKey: string },
    region: string
  ) {
    AWS.config.update({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region: region,
    });

    this.ec2 = new AWS.EC2();
    this.ssm = new AWS.SSM();
    this.cloudwatch = new AWS.CloudWatch();
  }

  async getRegions(): Promise<AWSRegion[]> {
    if (!this.ec2) throw new Error('EC2 client not initialized');

    try {
      // Get all regions, including disabled regions
      const response = await this.ec2
        .describeRegions({
          AllRegions: true,
          Filters: [
            {
              Name: 'opt-in-status',
              Values: ['opt-in-not-required', 'opted-in'],
            },
          ],
        })
        .promise();

      // Filter and sort regions
      const regions =
        response.Regions?.map((region) => ({
          regionName: region.RegionName || '',
          regionEndpoint: region.Endpoint || '',
        })).sort((a, b) => a.regionName.localeCompare(b.regionName)) || [];

      console.log(`Fetched ${regions.length} regions`);
      return regions;
    } catch (error) {
      console.error('Error fetching regions:', error);
      throw error;
    }
  }

  async getInstances(): Promise<EC2Instance[]> {
    if (!this.ec2) throw new Error('EC2 client not initialized');

    try {
      const response = await this.ec2.describeInstances({}).promise();
      const instances: EC2Instance[] = [];

      response.Reservations?.forEach((reservation) => {
        reservation.Instances?.forEach((instance) => {
          const nameTag = instance.Tags?.find((tag) => tag.Key === 'Name');

          // Log unusual instance IDs for debugging
          if (instance.InstanceId && !instance.InstanceId.startsWith('i-')) {
            console.warn('Unusual instance ID detected:', instance.InstanceId);
          }

          instances.push({
            instanceId: instance.InstanceId || '',
            instanceName: nameTag?.Value || 'Unnamed',
            instanceType: instance.InstanceType || '',
            state: instance.State?.Name || 'unknown',
            publicIp: instance.PublicIpAddress,
            privateIp: instance.PrivateIpAddress,
            launchTime: instance.LaunchTime || new Date(),
          });
        });
      });

      return instances;
    } catch (error) {
      console.error('Error fetching instances:', error);
      throw error;
    }
  }

  async startInstance(instanceId: string): Promise<void> {
    if (!this.ec2) throw new Error('EC2 client not initialized');

    try {
      await this.ec2
        .startInstances({
          InstanceIds: [instanceId],
        })
        .promise();
    } catch (error) {
      console.error('Error starting instance:', error);
      throw error;
    }
  }

  async stopInstance(instanceId: string): Promise<void> {
    if (!this.ec2) throw new Error('EC2 client not initialized');

    try {
      await this.ec2
        .stopInstances({
          InstanceIds: [instanceId],
        })
        .promise();
    } catch (error) {
      console.error('Error stopping instance:', error);
      throw error;
    }
  }

  async modifyInstanceType(
    instanceId: string,
    instanceType: string
  ): Promise<void> {
    if (!this.ec2) throw new Error('EC2 client not initialized');

    try {
      await this.ec2
        .modifyInstanceAttribute({
          InstanceId: instanceId,
          InstanceType: {
            Value: instanceType,
          },
        })
        .promise();
    } catch (error) {
      console.error('Error modifying instance type:', error);
      throw error;
    }
  }

  async getInstanceTypes(): Promise<AWS.EC2.InstanceTypeInfo[]> {
    if (!this.ec2) throw new Error('EC2 client not initialized');

    try {
      const allTypes: AWS.EC2.InstanceTypeInfo[] = [];
      let nextToken: string | undefined;

      // Get all instance types with pagination
      do {
        const response = await this.ec2
          .describeInstanceTypes({
            NextToken: nextToken,
            MaxResults: 100,
          })
          .promise();

        if (response.InstanceTypes) {
          allTypes.push(...response.InstanceTypes);
        }

        nextToken = response.NextToken;
      } while (nextToken);

      return allTypes;
    } catch (error) {
      console.error('Error fetching instance types:', error);
      throw error;
    }
  }

  changeRegion(region: string): void {
    AWS.config.update({ region });
    this.ec2 = new AWS.EC2();
    this.ssm = new AWS.SSM();
    this.cloudwatch = new AWS.CloudWatch();
  }

  async startSessionManager(instanceId: string): Promise<SessionManagerUrl> {
    if (!this.ssm) throw new Error('SSM client not initialized');

    // Validate instance ID format
    if (!instanceId || !instanceId.startsWith('i-')) {
      throw new Error(
        `Invalid instance ID format for Session Manager: ${instanceId}. EC2 instance IDs should start with 'i-'`
      );
    }

    console.log('Starting Session Manager for instance:', instanceId);

    try {
      // First check if SSM agent is installed and running on the instance
      const instanceInfo = await this.ssm
        .describeInstanceInformation({
          Filters: [
            {
              Key: 'InstanceIds',
              Values: [instanceId],
            },
          ],
        })
        .promise();

      if (
        !instanceInfo.InstanceInformationList ||
        instanceInfo.InstanceInformationList.length === 0
      ) {
        console.warn('Instance not found in SSM:', instanceId);
        // Still generate the URL - the instance might be available even if not showing in the list
      }

      // Generate the Session Manager console URL directly with instance ID
      const region = AWS.config.region;
      const sessionUrl = `https://${region}.console.aws.amazon.com/systems-manager/session-manager/${instanceId}?region=${region}`;

      console.log('Generated Session Manager URL:', sessionUrl);

      return {
        url: sessionUrl,
        sessionId: instanceId, // Use instance ID instead of creating a session
      };
    } catch (error) {
      console.error('Error checking Session Manager availability:', error);
      // If it's just a check failure, still return the URL
      if (
        error instanceof Error &&
        error.message.includes('InstanceInformationList')
      ) {
        const region = AWS.config.region;
        const sessionUrl = `https://${region}.console.aws.amazon.com/systems-manager/session-manager/${instanceId}?region=${region}`;

        return {
          url: sessionUrl,
          sessionId: instanceId,
        };
      }
      throw error;
    }
  }

  async terminateSession(sessionId: string): Promise<void> {
    if (!this.ssm) throw new Error('SSM client not initialized');

    try {
      await this.ssm
        .terminateSession({
          SessionId: sessionId,
        })
        .promise();
    } catch (error) {
      console.error('Error terminating session:', error);
      throw error;
    }
  }

  async getInstanceMetrics(
    instanceId: string,
    period = 3600
  ): Promise<InstanceMetrics> {
    if (!this.cloudwatch) throw new Error('CloudWatch client not initialized');

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - period * 1000); // period in seconds

    const baseParams = {
      StartTime: startTime,
      EndTime: endTime,
      Period: period > 86400 ? 3600 : 300, // 1 hour for > 1 day, otherwise 5 minutes
      Statistics: ['Average'],
      Dimensions: [
        {
          Name: 'InstanceId',
          Value: instanceId,
        },
      ],
    };

    try {
      // Fetch all metrics in parallel
      const [
        cpuData,
        networkInData,
        networkOutData,
        diskReadData,
        diskWriteData,
      ] = await Promise.all([
        this.cloudwatch
          .getMetricStatistics({
            ...baseParams,
            Namespace: 'AWS/EC2',
            MetricName: 'CPUUtilization',
            Unit: 'Percent',
          })
          .promise(),

        this.cloudwatch
          .getMetricStatistics({
            ...baseParams,
            Namespace: 'AWS/EC2',
            MetricName: 'NetworkIn',
            Unit: 'Bytes',
          })
          .promise(),

        this.cloudwatch
          .getMetricStatistics({
            ...baseParams,
            Namespace: 'AWS/EC2',
            MetricName: 'NetworkOut',
            Unit: 'Bytes',
          })
          .promise(),

        this.cloudwatch
          .getMetricStatistics({
            ...baseParams,
            Namespace: 'AWS/EC2',
            MetricName: 'DiskReadBytes',
            Unit: 'Bytes',
          })
          .promise(),

        this.cloudwatch
          .getMetricStatistics({
            ...baseParams,
            Namespace: 'AWS/EC2',
            MetricName: 'DiskWriteBytes',
            Unit: 'Bytes',
          })
          .promise(),
      ]);

      // Transform the data
      const transformDatapoints = (
        data: AWS.CloudWatch.GetMetricStatisticsOutput
      ): MetricDataPoint[] => {
        return (data.Datapoints || [])
          .sort(
            (a, b) =>
              (a.Timestamp?.getTime() || 0) - (b.Timestamp?.getTime() || 0)
          )
          .map((point) => ({
            timestamp: point.Timestamp || new Date(),
            value: point.Average || 0,
            unit: data.Label,
          }));
      };

      return {
        cpuUtilization: transformDatapoints(cpuData),
        networkIn: transformDatapoints(networkInData),
        networkOut: transformDatapoints(networkOutData),
        diskReadBytes: transformDatapoints(diskReadData),
        diskWriteBytes: transformDatapoints(diskWriteData),
      };
    } catch (error) {
      console.error('Error fetching instance metrics:', error);
      throw error;
    }
  }

  async getInstanceDetails(instanceId: string): Promise<EC2InstanceDetails> {
    if (!this.ec2) throw new Error('EC2 client not initialized');

    // Validate instance ID format
    if (!instanceId.startsWith('i-')) {
      throw new Error(
        `Invalid instance ID format: ${instanceId}. EC2 instance IDs should start with 'i-'`
      );
    }

    try {
      const response = await this.ec2
        .describeInstances({
          InstanceIds: [instanceId],
        })
        .promise();

      if (!response.Reservations?.[0]?.Instances?.[0]) {
        throw new Error('Instance not found');
      }

      const instance = response.Reservations[0].Instances[0];
      const nameTag = instance.Tags?.find((tag) => tag.Key === 'Name');

      const details: EC2InstanceDetails = {
        instanceId: instance.InstanceId || '',
        instanceName: nameTag?.Value || 'Unnamed',
        instanceType: instance.InstanceType || '',
        state: instance.State?.Name || 'unknown',
        publicIp: instance.PublicIpAddress,
        privateIp: instance.PrivateIpAddress,
        launchTime: instance.LaunchTime || new Date(),
        availabilityZone: instance.Placement?.AvailabilityZone,
        vpcId: instance.VpcId,
        subnetId: instance.SubnetId,
        architecture: instance.Architecture,
        hypervisor: instance.Hypervisor,
        rootDeviceType: instance.RootDeviceType,
        rootDeviceName: instance.RootDeviceName,
        virtualizationType: instance.VirtualizationType,
        amiId: instance.ImageId,
        platform: instance.Platform || 'Linux/UNIX',
        publicDnsName: instance.PublicDnsName,
        privateDnsName: instance.PrivateDnsName,
        keyName: instance.KeyName,
        securityGroups: instance.SecurityGroups?.map((sg) => ({
          groupId: sg.GroupId || '',
          groupName: sg.GroupName || '',
        })),
        tags: instance.Tags?.map((tag) => ({
          key: tag.Key || '',
          value: tag.Value || '',
        })),
        blockDeviceMappings: instance.BlockDeviceMappings?.map((bdm) => ({
          deviceName: bdm.DeviceName || '',
          volumeId: bdm.Ebs?.VolumeId,
          status: bdm.Ebs?.Status,
          deleteOnTermination: bdm.Ebs?.DeleteOnTermination,
          volumeSize: undefined, // VolumeSize is not available in EbsInstanceBlockDevice
          volumeType: undefined, // VolumeType is not available in EbsInstanceBlockDevice
        })),
        monitoring: instance.Monitoring?.State === 'enabled',
        cpuOptions: {
          coreCount: instance.CpuOptions?.CoreCount,
          threadsPerCore: instance.CpuOptions?.ThreadsPerCore,
        },
      };

      return details;
    } catch (error) {
      console.error('Error fetching instance details:', error);
      throw error;
    }
  }
}
