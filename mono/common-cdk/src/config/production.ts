export default {
  name: 'Telenutrition',
  env: 'production',
  backendVersion: '24e00b50',
  awsAccountId: '495477141215',
  awsRegion: 'us-west-2',
  vpcId: 'vpc-48cdd92d',
  subnetsInternal: [{subnetId: 'subnet-6530d401', availabilityZone: 'usw2-az1', routeTableId: 'rtb-1210fc76'}, {subnetId: 'subnet-d495aca3', availabilityZone: 'usw2-az2', routeTableId: 'rtb-e110fc85'}],
  subnetsRDS: [{subnetId: 'subnet-989d86fd', availabilityZone: 'usw2-az1', routeTableId: 'rtb-00e00d64'}, {subnetId: 'subnet-a96758de', availabilityZone: 'usw2-az2', routeTableId: 'rtb-00e00d64'}],
  secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/common-Xe7iFU',
  dockerPassword: 'a771f278-b237-435f-98ad-bc25d66564d8',
}