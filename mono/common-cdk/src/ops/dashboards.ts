import { Construct } from 'constructs'
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'


import { IConfig } from '@mono/common/lib/config'
import { createCWDashboardName } from '../naming'

const HEIGHT_UNITS_PER_ALARM = 3

export interface FlowsDashboardProps {
  domain: string,
  alarms: Record<'executionTimeAlarms' | 'executionsFailedAlarms' | 'executionsTimedOutAlarms', cloudwatch.Alarm[]>,
}

export type CreateFlowsDashboardResult = cloudwatch.Dashboard

/**
 * Create a dashboard with an alarms widget for each metric accross all flows in the doomain.
 * 
 * @param stack 
 * @param props 
 * @param config 
 * 
 * @returns 
 */
export function createFlowsDashboard(stack: Construct, props: FlowsDashboardProps, config: IConfig) : CreateFlowsDashboardResult {
  const { domain, alarms } = props

  const executionTimeWidget = new cloudwatch.AlarmStatusWidget( {
    alarms: alarms.executionTimeAlarms,
    height: alarms.executionTimeAlarms.length * HEIGHT_UNITS_PER_ALARM,
  })

  const executionsFailedAlarmsWidget = new cloudwatch.AlarmStatusWidget({
    alarms: alarms.executionsFailedAlarms,
    height: alarms.executionsFailedAlarms.length * HEIGHT_UNITS_PER_ALARM,
  })

  const executionsTimedOutAlarmsWidget = new cloudwatch.AlarmStatusWidget({
    alarms: alarms.executionsTimedOutAlarms,
    height: alarms.executionsTimedOutAlarms.length * HEIGHT_UNITS_PER_ALARM,
  })

  const dashboard = new cloudwatch.Dashboard(
    stack,
    `FlowsDashboard`,
    {
      dashboardName: createCWDashboardName(config, domain, 'flows'),
      widgets: [[
        executionTimeWidget,
        executionsFailedAlarmsWidget,
        executionsTimedOutAlarmsWidget
      ]],
    }
  )

  return dashboard
}

export interface ECSServiceDashboardProps {
  domain: string,
  alarms: Record<'cpuUtilizationAlarm' | 'memoryUtilizationAlarm', cloudwatch.Alarm>,
}

export type CreateEcsServiceDashboardResult = cloudwatch.Dashboard

/**
 * Create a dashboard with an alarms widget for each metric accross all ECS services in the doomain.
 * 
 * @param stack 
 * @param props 
 * @param config 
 * 
 * @returns 
 */
export function createECSServiceDashboard(stack: Construct, props: ECSServiceDashboardProps, config: IConfig) : CreateFlowsDashboardResult {
  const { domain, alarms } = props

  const cpuUtilizationWidget = new cloudwatch.AlarmStatusWidget( {
    alarms: [ alarms.cpuUtilizationAlarm ],
    height: HEIGHT_UNITS_PER_ALARM,
  })

  const memoryUtilizationWidget = new cloudwatch.AlarmStatusWidget({
    alarms: [ alarms.memoryUtilizationAlarm ],
    height: HEIGHT_UNITS_PER_ALARM,
  })

  const dashboard = new cloudwatch.Dashboard(
    stack,
    `ECSServiceDashboard`,
    {
      dashboardName: createCWDashboardName(config, domain, 'service'),
      widgets: [[
        cpuUtilizationWidget,
        memoryUtilizationWidget,
      ]],
    }
  )

  return dashboard
}