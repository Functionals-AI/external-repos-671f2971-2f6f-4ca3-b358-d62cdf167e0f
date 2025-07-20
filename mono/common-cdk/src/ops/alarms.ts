import { Construct } from 'constructs'
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'
import * as cwActions from 'aws-cdk-lib/aws-cloudwatch-actions'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'
import * as ecs from 'aws-cdk-lib/aws-ecs'

import { IConfig } from '@mono/common/lib/config'
import { AWSServiceNames, AWSCWServiceMetrics, createCWAlarmName } from '../naming'

const FLOW_EXECUTION_TIME_THRESHOLD = 6 * 3600 * 1000

export interface CreateFlowAlarmsResult {
  executionTimeAlarm: cloudwatch.Alarm;
  executionsFailedAlarm: cloudwatch.Alarm;
  executionsTimedOutAlarm: cloudwatch.Alarm;
}

export interface FlowAlarmProps {
  domain: string, 
  flowId: string, 
  stateMachine: sfn.StateMachine,
}

/**
 * Create alarms for a flow, including the following:
 *  - ExecutionTime > <threshold>
 *  - ExecutionsFailed > 1
 *  - ExecutionsTimedOut > 1
 */
export function createFlowAlarms(stack: Construct, props: FlowAlarmProps, config: IConfig): CreateFlowAlarmsResult {
  const { domain, flowId, stateMachine } = props 

  const topic = sns.Topic.fromTopicArn(stack, `SNSFlowAlarmTopc${domain}${flowId}`, config.ops_cdk.sns.alertsFlowsArn)

  const executionTimeAlarm = new cloudwatch.Alarm(
    stack,
    `CWFlowAlarm${domain}${flowId}ExecutionTime`,
    {
      alarmName: createCWAlarmName(config, domain, AWSServiceNames.StepFunctions, flowId, AWSCWServiceMetrics.StepFunctions_ExecutionTime),
      alarmDescription: `${domain}/${flowId} flow alarm on maximum reasonable execution time.`,
      actionsEnabled: true,
      evaluationPeriods: 1,
      metric: stateMachine.metricTime(),
      threshold: FLOW_EXECUTION_TIME_THRESHOLD
    })

  executionTimeAlarm.addAlarmAction(new cwActions.SnsAction(topic))

  const executionsFailedAlarm = new cloudwatch.Alarm(
    stack,
    `CWFlowAlarm${domain}${flowId}ExecutionsFailed`,
    {
      alarmName: createCWAlarmName(config, domain, AWSServiceNames.StepFunctions, flowId, AWSCWServiceMetrics.StepFunctions_ExecutionsFailed),
      alarmDescription: `${domain}/${flowId} flow alarm on failed executions.`,
      actionsEnabled: true,
      evaluationPeriods: 1,
      metric: stateMachine.metricFailed(),
      threshold: 1,
    })

  executionsFailedAlarm.addAlarmAction(new cwActions.SnsAction(topic))

  const executionsTimedOutAlarm = new cloudwatch.Alarm(
    stack,
    `CWFlowAlarm${domain}${flowId}ExecutionsTimedOut`,
    {
      alarmName: createCWAlarmName(config, domain, AWSServiceNames.StepFunctions, flowId, AWSCWServiceMetrics.StepFunctions_ExecutionsTimedOut),
      alarmDescription: `${domain}/${flowId} flow alarm on timedout executions.`,
      actionsEnabled: true,
      evaluationPeriods: 1,
      metric: stateMachine.metricTimedOut(),
      threshold: 1,
    }
  )

  executionsTimedOutAlarm.addAlarmAction(new cwActions.SnsAction(topic))

  return {
    executionTimeAlarm,
    executionsFailedAlarm,
    executionsTimedOutAlarm,
  }

}

export interface CreateECSServiceAlarmsResult {
  cpuUtilizationAlarm: cloudwatch.Alarm,
  memoryUtilizationAlarm: cloudwatch.Alarm,
}

export interface ECSServiceAlarmProps {
  domain: string,
  serviceName: string,
  service: ecs.FargateService,
}

/**
 * Create alarms for an ECS Fargate Service.
 */
export function createECSServiceAlarms(stack: Construct, props: ECSServiceAlarmProps, config: IConfig): CreateECSServiceAlarmsResult {
  const { domain, serviceName, service } = props

  const cpuUtilizationAlarm = new cloudwatch.Alarm(
    stack,
    `CWECSServiceAlarm${domain}${serviceName}CpuUtilization`,
    {
      alarmName: createCWAlarmName(config, domain, AWSServiceNames.EcsService, serviceName, AWSCWServiceMetrics.ECSService_CPUUtilization),
      alarmDescription: `${domain}/${serviceName} ECS service alarm on CPU utilization.`,
      actionsEnabled: true,
      evaluationPeriods: 1,
      metric: service.metricCpuUtilization(),
      threshold: 90,
    }
  )

  const memoryUtilizationAlarm = new cloudwatch.Alarm(
    stack,
    `CWECSServiceAlarm${domain}${serviceName}MemoryUtilization`,
    {
      alarmName: createCWAlarmName(config, domain, AWSServiceNames.EcsService, serviceName, AWSCWServiceMetrics.ECSService_Memorytilization),
      alarmDescription: `${domain}/${serviceName} ECS service alarm on CPU utilization.`,
      actionsEnabled: true,
      evaluationPeriods: 1,
      metric: service.metricMemoryUtilization(),
      threshold: 75,
    }
  )

  return {
    cpuUtilizationAlarm,
    memoryUtilizationAlarm,
  }
}