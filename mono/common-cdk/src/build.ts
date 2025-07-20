import { Construct } from 'constructs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as codebuild from 'aws-cdk-lib/aws-codebuild'

import { ICdkConfig } from './config'
import * as ecr from 'aws-cdk-lib/aws-ecr'

export interface CreateBuildOptions {
  vpc: ec2.IVpc,
  subnets: ec2.SelectedSubnets,
  config: ICdkConfig,
  projectName?: string,
  dockerFilePath?: string,
}

export interface CreateBuildResult {
  project: codebuild.Project,
  repository: ecr.Repository,
}

export function factory(stack: Construct, domain: string, options: CreateBuildOptions): CreateBuildResult {
  const lowerCaseDomain = domain.toLowerCase()
  const {vpc, subnets, config } = options

  const projectName = options.projectName ? options.projectName : `${lowerCaseDomain}-tasks`
  const camelCaseProjectName = projectName.split('-').map(p => `${p[0].toUpperCase()}${p.slice(1)}`).join('')
  const dockerFilePath = options.dockerFilePath ? options.dockerFilePath : `./${lowerCaseDomain}-tasks/Dockerfile`

  const repository = new ecr.Repository(stack, `${camelCaseProjectName}Repo`, { repositoryName: `mono/${projectName}` })
  repository.addLifecycleRule({ maxImageCount: 5 })
  
  const securityGroup = new ec2.SecurityGroup(stack, `${camelCaseProjectName}CodeBuildSecurityGroup`, {
    securityGroupName: `${projectName}-codebuild-sg`,
    vpc,
    allowAllOutbound: true,
  })
  
  const project = new codebuild.Project(stack, `${camelCaseProjectName}CodeBuildProject`, {
    vpc: vpc,
    subnetSelection: subnets,
    projectName: projectName,
    environment: {
      buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
      privileged: true,
      computeType: codebuild.ComputeType.LARGE,
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
            `DOCKER_BUILDKIT=1 docker build -t mono/${projectName} -f ${dockerFilePath} .`,
            `docker tag mono/${projectName}:latest ${config.awsAccountId}.dkr.ecr.${config.awsRegion}.amazonaws.com/mono/${projectName}:$TAG_VERSION`,
            `docker push ${config.awsAccountId}.dkr.ecr.${config.awsRegion}.amazonaws.com/mono/${projectName}:$TAG_VERSION`,
          ],
        },
      },
    }),
  })
  
  repository.grantPullPush(project.grantPrincipal)
  
  return {repository, project}
}
