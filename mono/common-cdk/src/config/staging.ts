export default {
    name: 'Backend',
    env: 'staging',
    backendVersion: '24e00b50',
    awsAccountId: '288831299874',
    awsRegion: 'us-west-2',
    vpcId: 'vpc-04393561',
    subnetsInternal: [
      {
        subnetId: 'subnet-cd5f6fba', 
        availabilityZone: 'usw2-az2', 
        routeTableId: 'rtb-296d854f'
      },
      {
        subnetId: 'subnet-afbaa6ca',
        availabilityZone: 'usw2-az1',
        routeTableId: 'rtb-366d8550'
      }
    ],
    subnetsRDS: [
      {
        subnetId: 'subnet-065f6f71',
        availabilityZone: 'usw2-az2',
        routeTableId: 'rtb-296d854f'
      },
      {
        subnetId: 'subnet-1abaa67f',
        availabilityZone: 'usw2-az1',
        routeTableId: 'rtb-366d8550'
      }
    ],
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:288831299874:secret:mono/common-6e0utY',
    dockerPassword: 'a771f278-b237-435f-98ad-bc25d66564d8',
  }