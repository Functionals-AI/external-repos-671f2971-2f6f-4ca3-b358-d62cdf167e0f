import * as _ from 'lodash'

import { IConfig } from '@mono/common/lib/config'

export const enum AWSServiceNames {
  StepFunctions = "aws/states",
  EcsService = 'aws/ecs/service'
}

export function createECSSecurityGroupName(config: IConfig, domain: string, name: string): string {
  const params = [
    domain,
    name,
    'sg'
  ]

  return params.join('-')
}

export function createS3BucketName(config: IConfig, domain: string, name: string) {
  const params = [
    'foodsmart',
    config.env,
    _.kebabCase(domain),
    _.kebabCase(name),
    config.aws.region,
  ]

  return params.join('-')
}

export const enum AWSCWServiceMetrics {
  StepFunctions_ExecutionTime = 'execution-time',
  StepFunctions_ExecutionsFailed = 'executions-failed',
  StepFunctions_ExecutionsTimedOut = 'executions-timedout',
  ECSService_CPUUtilization = 'cpu-utilization',
  ECSService_Memorytilization = 'memory-utilization',
}

export function createCWAlarmName(config: IConfig, domain: string, awsServiceName: AWSServiceNames, serviceName: string, metric: AWSCWServiceMetrics): string {
  const params = [
    'ops',
    'alerts',
    awsServiceName,
    metric, 
    domain,
    _.kebabCase(serviceName)
  ]

  return params.join('-')
}

export function createCWDashboardName(config: IConfig, domain: string, serviceName: string): string {
  const params = [
    domain.toLowerCase(),
    _.kebabCase(serviceName),
  ]

  return params.join('-')
}

export function createLogGroupName(config: IConfig, domain: string, name: string) {
  const params = [
    'foodsmart',
    _.kebabCase(domain),
    _.kebabCase(name),
  ]

  return `/${params.join('/')}`
}

export function createDeliveryStreamName(config: IConfig, domain: string, name: string) {
  const params = [
    _.kebabCase(domain),
    _.kebabCase(name),
  ]

  return params.join('-')
}

export function createIAMManagedPolicyName(config: IConfig, domain: string, name: string) {
  const params = [
    'Foodsmart',
    _.startCase(_.camelCase(domain)).replace(/\s+/g, ''),
    _.startCase(_.camelCase(name)).replace(/\s+/g, ''),
    'Policy'
  ]

  return params.join('')
}

export function createIAMRoleName(config: IConfig, domain: string, name: string) {
  const params = [
    'Foodsmart',
    _.startCase(_.camelCase(domain)).replace(/\s+/g, ''),
    _.startCase(_.camelCase(name)).replace(/\s+/g, ''),
    'Role'
  ]

  return params.join('')
}

export function createLambdaFunctionName(config: IConfig, domain: string, name: string) {
  const params = [
    domain,
    _.kebabCase(name),
  ]

  return params.join('-')
}

export default {
  createECSSecurityGroupName,
  createS3BucketName,
  createCWAlarmName,
  createCWDashboardName,
  createLogGroupName,
  createDeliveryStreamName,
  createIAMManagedPolicyName,
  createIAMRoleName,
  createLambdaFunctionName,
}