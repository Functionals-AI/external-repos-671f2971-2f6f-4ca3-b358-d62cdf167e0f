/**
 * Create Lambda Functions.
 */
import * as _ from 'lodash'
import { Result, err, ok } from 'neverthrow'
import { CfnParameter, Duration } from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'

import { IConfig } from '@mono/common/lib/config'
import { ErrCode } from '@mono/common/lib/error'
import { LambdaFactory } from '@mono/common-lambdas/lib/builder'
import * as build from './build'
import { default as CdkConfig } from './config'
import Secrets from './secrets'
import { lookupVpc } from './vpc'

interface LambdaConfig {
  name: string;
  memorySize?: number;
  timeout?: Duration;
  environment?: { [key: string]: string };
}

/**
 * @typedef {Object} CreateLambdasOptions - Lambda create options.
 * @property {string} [dockerFilePath] - Docker file path, relative to the  root of the repo. IE: ./<domain>-lambdas/Dockerfile.
 * @property {IMangedPolicy} [managedPolicies] - Managed policies to attach to the Lambda's execution role.
 */
export interface CreateLambdasOptions {
  dockerFilePath?: string, 
  managedPolicies?: iam.ManagedPolicy[]
}

/**
 * @tyoedef {Object} CreateLambdaResult - Return the lambda's created.
 * @property {IDockerImageFunction[]} [lambdas] - The created Lambda functions.
 */
export interface CreateLambdasResult {
  lambdas: lambda.DockerImageFunction[]
}

/**
 * Create Lambdas for a dommain's CDK Lambda stack.
 */
export function createLambdas(
  stack: Construct,
  config: IConfig,
  domain: string,
  lambdas: LambdaFactory[],
  options?: CreateLambdasOptions,
): Result<CreateLambdasResult,ErrCode> {
  try {
    const cdkConfig = CdkConfig.getConfig()
    const { vpc, subnets } = lookupVpc(stack, config.common_cdk.vpcs.default)
    const lowerCaseDomain = domain.toLowerCase()
    const camelCaseDomain = _.camelCase(domain)
    const dockerFilePath = options?.dockerFilePath ?? `${lowerCaseDomain}-lambdas/Dockerfile`

    const projectName = `${lowerCaseDomain}-lambdas`

    // Create CodeBuild project for building lambda container images
    const { repository, project } = build.factory(stack, domain, {
      vpc,
      subnets: subnets.internal,
      config: cdkConfig,
      projectName: `${lowerCaseDomain}-lambdas`,
      dockerFilePath,
    })

    const initialDeployContextValue = stack.node?.tryGetContext('InitialDeploy')

    const initialDeploy = [ 'true', '1' ].includes(initialDeployContextValue)

    const imageTagParameter = new CfnParameter(stack, `LambdasImageBuildTag`, {
      description: `${camelCaseDomain} Lambdas image tag`,
      type: "String",
      default: initialDeploy ? "" : undefined // default first time to not have to specify a placeholder.
    })

    if (initialDeploy === true) {
      // first time, just return.
      return ok({ lambdas: [], })
    }
    else {
      //
      // If first time creating the build project, do not create rest of stack.
      // Lambda creation will fail as there will be no image.
      // After initially creating the build project, build an image and proceed.
      //

      // Create shared security group for all lambda functions
      const lambdaSecurityGroup = new ec2.SecurityGroup(stack, 'LambdaSecurityGroup', {
        vpc,
        description: `Security group for ${lowerCaseDomain} lambda functions`,
        allowAllOutbound: true
      })

      const commonStoreSecurityGroup = ec2.SecurityGroup.fromLookupById(stack, 'CommonStoreSecurityGroup', config.common_cdk.vpcs.default.securityGroups.rds_common_store.id)
      commonStoreSecurityGroup.addIngressRule(lambdaSecurityGroup, ec2.Port.tcp(5432), `${camelCaseDomain} Lambda access to RDS common store cluster.`)

      // Create execution role for lambdas
      const lambdaRole = new iam.Role(stack, 'LambdaExecutionRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
        ]
      })

      // CloudWatch logs access is usually granted automatically, but you can be explicit:
      lambdaRole.addToPolicy(new iam.PolicyStatement({
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      }))

      if (options.managedPolicies) {
        for (const policy of options.managedPolicies) {
          lambdaRole.addManagedPolicy(policy)
        }
      }

      // Generate lambda configurations from exported functions
      const lambdaConfigs: LambdaConfig[] = lambdas.map(lambdaFactory => {
        const lambaBuilder = lambdaFactory(config)

        return {
          name: `${lambaBuilder.name}`,
          memorySize: lambaBuilder.memorySize || 512,
          timeout: lambaBuilder.timeout || Duration.seconds(60),
          environment: {
            NODE_ENV: config.env
          }
        }
      })

      const secrets = Secrets.getSecrets(stack)
      secrets.grantRead(lambdaRole)

      // Create lambda functions dynamically
      const functions = lambdaConfigs.map(lambdaConfig => {
        const functionName = `${lowerCaseDomain}-${_.kebabCase(lambdaConfig.name)}`
        const environment = lambdaConfig.environment || {}
        environment['FUNCTION_NAME'] = lambdaConfig.name

        const lambdaFunction = new lambda.DockerImageFunction(stack, lambdaConfig.name, {
          functionName,
          code: lambda.DockerImageCode.fromEcr(repository, {
            tagOrDigest: imageTagParameter.valueAsString,
          }),
          vpc,
          vpcSubnets: subnets.internal,
          securityGroups: [lambdaSecurityGroup],
          memorySize: lambdaConfig.memorySize,
          timeout: lambdaConfig.timeout,
          environment,
          role: lambdaRole,
          logRetention: RetentionDays.ONE_MONTH
        })

        return lambdaFunction
      })

      return ok({ lambdas: functions, })
    }
  }
  catch (e) {
    console.log('exception.', e)

    return err(ErrCode.EXCEPTION)
  }
}