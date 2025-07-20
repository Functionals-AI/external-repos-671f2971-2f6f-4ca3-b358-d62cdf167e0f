export default {
  name: 'Backend',
  env: 'development',
  backendVersion: '24e00b50',
  awsAccountId: '914374131125',
  awsRegion: 'us-west-2',
  vpcId: 'vpc-7971e21e',
  subnetsInternal: [
    {
      subnetId: 'subnet-a6c709ef', 
      availabilityZone: 'usw2-az2', 
      routeTableId: 'rtb-9b2d1cfc'
    },
    {
      subnetId: 'subnet-ef853188',
      availabilityZone: 'usw2-az1',
      routeTableId: 'rtb-9a2d1cfd'
    }
  ],
  subnetsRDS: [
    {
      subnetId: 'subnet-bec709f7',
      availabilityZone: 'usw2-az2',
      routeTableId: 'rtb-9b2d1cfc'
    },
    {
      subnetId: 'subnet-1d85317a',
      availabilityZone: 'usw2-az1',
      routeTableId: 'rtb-9a2d1cfd'
    }
  ],
  secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:914374131125:secret:mono/common-HZIXmP',
  dockerPassword: 'a771f278-b237-435f-98ad-bc25d66564d8',
}