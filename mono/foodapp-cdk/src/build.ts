import { Construct } from 'constructs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { ICdkConfig } from '@mono/common-cdk/lib/config'

import * as codebuild from 'aws-cdk-lib/aws-codebuild'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import { ComputeType } from 'aws-cdk-lib/aws-codebuild'

export interface CreateBuildOptions {
  vpc: ec2.IVpc,
  subnets: ec2.SelectedSubnets,
  config: ICdkConfig,
}
  
export interface CreateBuildResult {
  project: codebuild.Project,
  repository: ecr.Repository,
}
  
export function createBuild(stack: Construct, options: CreateBuildOptions): CreateBuildResult {
  const {vpc, subnets, config} = options
  const repository = new ecr.Repository(stack, `FoodappTasksRepo`, { repositoryName: 'mono/foodapp-tasks' })
  repository.addLifecycleRule({ maxImageCount: 5 })

  const securityGroup = new ec2.SecurityGroup(stack, 'FoodappCodeBuildSecurityGroup', {
    securityGroupName: `foodapp-codebuild-sg`,
    vpc,
    allowAllOutbound: true,
  })

  const project = new codebuild.Project(stack, 'FoodappTasksCodeBuildProject', {
    vpc: vpc,
    subnetSelection: subnets,
    projectName: 'foodapp-tasks',
    environment: {
      privileged: true,
      computeType: ComputeType.LARGE,
    },
    securityGroups: [securityGroup],
    environmentVariables: {
      AWS_ACCOUNT_ID: { value: config.awsAccountId },
      AWS_DEFAULT_REGION: { value: config.awsRegion },
      DOCKER_PASSWORD: { value: config.dockerPassword },
    },
    source: codebuild.Source.gitHub({
      owner: 'zipongo',
      repo: 'mono',
      webhook: false,
      // webhookFilters: [
      //  codebuild.FilterGroup
      //    .inEventOf(codebuild.EventAction.PUSH)
      //    .andFilePathIs('/(foodapp|foodapp-tasks|common)/')
      //    .andBranchIs('master')
      // ],
    }),
    buildSpec: codebuild.BuildSpec.fromObject({
      version: '0.2',
      phases: {
        pre_build: {
          commands: [
            'echo "Logging in to Amazon ECR..."',
            'DOCKER_LOGIN_PASSWORD=`aws ecr get-login-password --region "$AWS_DEFAULT_REGION"`',
            'docker login -u AWS -p "$DOCKER_LOGIN_PASSWORD" "https://$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com"',
            'SRC_VERSION=`git rev-parse --verify HEAD`',
            'echo "CODEBUILD_SOURCE_VERSION - $CODEBUILD_SOURCE_VERSION - $CODEBUILD_WEBHOOK_TRIGGER"',
            'echo "SRC_VERSION - $SRC_VERSION"',
            'TAG_VERSION=`echo "$SRC_VERSION" | cut -c 1-8`',
            'echo "TAG_VERSION - $TAG_VERSION"',
          ]
        },
        build: {
          commands: [
            'echo "$DOCKER_PASSWORD" | docker login --username foodsmart --password-stdin',
            'DOCKER_BUILDKIT=1 docker build -t mono/foodapp-tasks -f ./foodapp-tasks/Dockerfile .',
            `docker tag mono/foodapp-tasks:latest ${config.awsAccountId}.dkr.ecr.${config.awsRegion}.amazonaws.com/mono/foodapp-tasks:$TAG_VERSION`,
            `docker push ${config.awsAccountId}.dkr.ecr.${config.awsRegion}.amazonaws.com/mono/foodapp-tasks:$TAG_VERSION`,
          ],
        },
      },
    }),
  })

  repository.grantPullPush(project.grantPrincipal)

  return {repository, project}
}