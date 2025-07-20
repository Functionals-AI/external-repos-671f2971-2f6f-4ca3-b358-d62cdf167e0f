import { Construct } from 'constructs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as codebuild from 'aws-cdk-lib/aws-codebuild'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import { ComputeType } from 'aws-cdk-lib/aws-codebuild'
import { Duration } from 'aws-cdk-lib'
import {getDependencies} from '@mono/common/lib/package'
import { IConfig } from '@mono/common/lib/config'
import * as _ from 'lodash'
import {RemovalPolicy} from 'aws-cdk-lib'
import { IRole } from 'aws-cdk-lib/aws-iam'

export interface CreateBuildOptions {
  name: string,
  vpc: ec2.IVpc,
  subnets: ec2.SelectedSubnets,
  config: IConfig,
  buildContext: string,
  env?: Record<string, {value: string}>,
}

export interface CreateBuildResult {
  codeBuildRole: IRole,
  repository: ecr.Repository,
}


export function createBuildProject(stack: Construct, options: CreateBuildOptions): CreateBuildResult {
  const {vpc, subnets, config, name, buildContext, env} = options
  const { cdn } = config.telenutrition_web;

  const securityGroup = new ec2.SecurityGroup(stack, `${_.camelCase(name)}CodeBuildSecurityGroup`, {
    securityGroupName: `${name}-codebuild-sg`,
    vpc,
    allowAllOutbound: true,
  })

  const repository = new ecr.Repository(stack, `${_.camelCase(name)}Repo`, {
    repositoryName: `mono/${name}`,
    removalPolicy: RemovalPolicy.DESTROY,
  })
  const dependencies = getDependencies(name)

  const project = new codebuild.Project(stack, `${_.camelCase(name)}CodeBuildProject`, {
    vpc: vpc,
    subnetSelection: subnets,
    projectName: name,
    environment: {
      privileged: true,
      computeType: ComputeType.LARGE,
      buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
    },
    securityGroups: [securityGroup],
    environmentVariables: {
      AWS_ACCOUNT_ID: { value: config.aws.accountId },
      AWS_DEFAULT_REGION: { value: config.aws.region },
      DOCKER_PASSWORD: { value: config.common_cdk.dockerhub.password },
      ...env,
    },
    source: codebuild.Source.gitHub({
      owner: 'zipongo',
      repo: 'mono',
      // webhookFilters: [
      //   codebuild.FilterGroup
      //     .inEventOf(codebuild.EventAction.PUSH)
      //     .andFilePathIs(`(${[name, ...dependencies].join('|')})/src`)
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
            'NEXT_PUBLIC_VERSION=$TAG_VERSION',
          ]
        },
        build: {
          commands: [
            'echo "$DOCKER_PASSWORD" | docker login --username foodsmart --password-stdin',
            `DOCKER_BUILDKIT=1 docker build -t mono/${name} -f ./${name}/Dockerfile ${buildContext} ${Object.keys(env||{}).map(key => `--build-arg ${key}=\${${key}}`).join(' ')} --build-arg NEXT_PUBLIC_VERSION=$NEXT_PUBLIC_VERSION`,
            `docker tag mono/${name}:latest ${config.aws.accountId}.dkr.ecr.${config.aws.region}.amazonaws.com/mono/${name}:$TAG_VERSION`,
            `docker push ${config.aws.accountId}.dkr.ecr.${config.aws.region}.amazonaws.com/mono/${name}:$TAG_VERSION`,
          ],
        },
        post_build: {
          commands: [
            `if [ "${name}" = "telenutrition-web" ] && [ "\${CODEBUILD_SOURCE_VERSION#release}" != "$CODEBUILD_SOURCE_VERSION" ]; then
              echo "Uploading static assets to S3"
              echo "$DOCKER_PASSWORD" | docker login --username foodsmart --password-stdin
              docker create --name web-build ${config.aws.accountId}.dkr.ecr.${config.aws.region}.amazonaws.com/mono/${name}:$TAG_VERSION
              docker cp web-build:/app/${cdn.nextjsPublicPath} ./next-public
              aws s3 sync ./next-public s3://${cdn.bucketName}/${cdn.bucketSubPath}
              docker rm web-build
            fi`
          ],
        },
      },
    }),
  })

  repository.grantPullPush(project.grantPrincipal)

  return { repository, codeBuildRole: project.role }
}