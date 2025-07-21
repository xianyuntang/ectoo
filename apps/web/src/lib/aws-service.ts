import AWS from 'aws-sdk'

export interface EC2Instance {
  instanceId: string
  instanceName: string
  instanceType: string
  state: string
  publicIp?: string
  privateIp?: string
  launchTime: Date
}

export interface AWSRegion {
  regionName: string
  regionEndpoint: string
}

export class AWSService {
  private ec2: AWS.EC2 | null = null
  
  constructor(credentials: { accessKeyId: string; secretAccessKey: string }, region: string) {
    AWS.config.update({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region: region
    })
    
    this.ec2 = new AWS.EC2()
  }
  
  async getRegions(): Promise<AWSRegion[]> {
    if (!this.ec2) throw new Error('EC2 client not initialized')
    
    try {
      // Get all regions, including disabled regions
      const response = await this.ec2.describeRegions({
        AllRegions: true,
        Filters: [
          {
            Name: 'opt-in-status',
            Values: ['opt-in-not-required', 'opted-in']
          }
        ]
      }).promise()
      
      // Filter and sort regions
      const regions = response.Regions?.map(region => ({
        regionName: region.RegionName || '',
        regionEndpoint: region.Endpoint || ''
      })).sort((a, b) => a.regionName.localeCompare(b.regionName)) || []
      
      console.log(`Fetched ${regions.length} regions`)
      return regions
    } catch (error) {
      console.error('Error fetching regions:', error)
      throw error
    }
  }
  
  async getInstances(): Promise<EC2Instance[]> {
    if (!this.ec2) throw new Error('EC2 client not initialized')
    
    try {
      const response = await this.ec2.describeInstances({}).promise()
      const instances: EC2Instance[] = []
      
      response.Reservations?.forEach(reservation => {
        reservation.Instances?.forEach(instance => {
          const nameTag = instance.Tags?.find(tag => tag.Key === 'Name')
          
          instances.push({
            instanceId: instance.InstanceId || '',
            instanceName: nameTag?.Value || 'Unnamed',
            instanceType: instance.InstanceType || '',
            state: instance.State?.Name || 'unknown',
            publicIp: instance.PublicIpAddress,
            privateIp: instance.PrivateIpAddress,
            launchTime: instance.LaunchTime || new Date()
          })
        })
      })
      
      return instances
    } catch (error) {
      console.error('Error fetching instances:', error)
      throw error
    }
  }
  
  async startInstance(instanceId: string): Promise<void> {
    if (!this.ec2) throw new Error('EC2 client not initialized')
    
    try {
      await this.ec2.startInstances({
        InstanceIds: [instanceId]
      }).promise()
    } catch (error) {
      console.error('Error starting instance:', error)
      throw error
    }
  }
  
  async stopInstance(instanceId: string): Promise<void> {
    if (!this.ec2) throw new Error('EC2 client not initialized')
    
    try {
      await this.ec2.stopInstances({
        InstanceIds: [instanceId]
      }).promise()
    } catch (error) {
      console.error('Error stopping instance:', error)
      throw error
    }
  }
  
  async modifyInstanceType(instanceId: string, instanceType: string): Promise<void> {
    if (!this.ec2) throw new Error('EC2 client not initialized')
    
    try {
      await this.ec2.modifyInstanceAttribute({
        InstanceId: instanceId,
        InstanceType: {
          Value: instanceType
        }
      }).promise()
    } catch (error) {
      console.error('Error modifying instance type:', error)
      throw error
    }
  }
  
  async getInstanceTypes(): Promise<AWS.EC2.InstanceTypeInfo[]> {
    if (!this.ec2) throw new Error('EC2 client not initialized')
    
    try {
      const allTypes: AWS.EC2.InstanceTypeInfo[] = []
      let nextToken: string | undefined
      
      // Get all instance types with pagination
      do {
        const response = await this.ec2.describeInstanceTypes({
          NextToken: nextToken,
          MaxResults: 100
        }).promise()
        
        if (response.InstanceTypes) {
          allTypes.push(...response.InstanceTypes)
        }
        
        nextToken = response.NextToken
      } while (nextToken)
      
      return allTypes
    } catch (error) {
      console.error('Error fetching instance types:', error)
      throw error
    }
  }
  
  changeRegion(region: string): void {
    AWS.config.update({ region })
    this.ec2 = new AWS.EC2()
  }
}