import { Construct } from 'constructs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { ICdkConfig } from '@mono/common-cdk/lib/config'

import * as codebuild from 'aws-cdk-lib/aws-codebuild'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import { ComputeType } from 'aws-cdk-lib/aws-codebuild'
import { Duration } from 'aws-cdk-lib'
import { ISecurityGroup } from 'aws-cdk-lib/aws-ec2'
import {getDependencies} from '@mono/common/lib/package'


export interface CreateBuildOptions {
  vpc: ec2.IVpc,
  subnets: ec2.SelectedSubnets,
  config: ICdkConfig,
  securityGroup: ISecurityGroup,
}
export interface CreateBuildResult {
  project: codebuild.Project,
  repository: ecr.Repository,
}

export function createFlowsBuild(stack: Construct, options: CreateBuildOptions): CreateBuildResult {
  const {vpc, subnets, config, securityGroup} = options

  const name = 'telenutrition-flows'
  
  const repository = new ecr.Repository(stack, `TelenutritionFlowsRepo`, { repositoryName: `mono/${name}` })
  repository.addLifecycleRule({maxImageAge: Duration.days(180)})

  const project = new codebuild.Project(stack, 'TelenutritionFlowsCodeBuildProject', {
    vpc: vpc,
    subnetSelection: subnets,
    projectName: name,
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
      // webhookFilters: [
      //   codebuild.FilterGroup
      //     .inEventOf(codebuild.EventAction.PUSH)
      //     // .andFilePathIs(`(${name}|${getDependencies(name).join('|')})/src`)
      //     .andFilePathIs(`(${name}|telenutrition|common)/src`)
      //     .andBranchIs('master')
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
            'SRC_HASH=`echo "$SRC_VERSION" | cut -c 1-8`',
            'echo "SRC_HASH - $SRC_HASH"',
            'if [ "${CODEBUILD_SOURCE_VERSION#release}" != "$CODEBUILD_SOURCE_VERSION" ]; then TAG_VERSION="${CODEBUILD_SOURCE_VERSION}-${SRC_HASH}"; else TAG_VERSION="${SRC_HASH}"; fi',
            'echo "TAG_VERSION - $TAG_VERSION"',
          ]
        },
        build: {
          commands: [
            'echo "$DOCKER_PASSWORD" | docker login --username foodsmart --password-stdin',
            `DOCKER_BUILDKIT=1 docker build -t mono/${name} -f ./${name}/Dockerfile .`,
            `docker tag mono/${name}:latest ${config.awsAccountId}.dkr.ecr.${config.awsRegion}.amazonaws.com/mono/${name}:$TAG_VERSION`,
            `docker push ${config.awsAccountId}.dkr.ecr.${config.awsRegion}.amazonaws.com/mono/${name}:$TAG_VERSION`,
          ],
        },
      },
    }),
  })

  repository.grantPullPush(project.grantPrincipal)

  return {repository, project}
}

export default {
  createFlowsBuild,
}