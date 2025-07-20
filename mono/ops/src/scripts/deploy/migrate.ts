import { Result, err, ok } from 'neverthrow'
import { DescribeStackResourcesCommand} from '@aws-sdk/client-cloudformation'
import { AssignPublicIp, DescribeTasksCommand, LaunchType, RunTaskCommand } from '@aws-sdk/client-ecs'
import { GetLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import { ECSContainer, waitForTask } from './aws'

const MTAG = [ 'ops', 'scripts', 'deploy', 'migrate' ]

const CLUSTER = 'OpsStore'
const STACK_NAME = 'OpsStore'
const TASK_LOGICAL_RESOURCE_ID = 'OpsStoreTaskDef'
const CONTAINER_NAME = 'ops-store-task'

export interface MigrateUpResult {
  logs: string,
}

/**
 * Migrate 'schema'.
 * 
 * @param context 
 * @param schema - Schema to migrate.
 * 
 * @returns 
 */
export async function migrateUp(context: IContext, schema: string): Promise<Result<MigrateUpResult, ErrCode>> {
  const { config, logger, aws: { cfClient, cwLogsClient, ecsClient, } } = context
  const TAG = [ ...MTAG, 'migrateUp' ]

  try {
    // Get current stack resources
    const { StackResources } = await cfClient.send(new DescribeStackResourcesCommand({ StackName: STACK_NAME }))
  
    // Get task definition and cluster from resources
    const taskDefinitionResource = StackResources !== undefined ? StackResources.find(r => r.ResourceType === 'AWS::ECS::TaskDefinition') : undefined

    if (!taskDefinitionResource || !taskDefinitionResource.PhysicalResourceId) {
      logger.error(context, TAG, 'Could not find ops store task in stack resources', {
        task_logical_id: TASK_LOGICAL_RESOURCE_ID,
        stack_resources: StackResources ?? null,
      });

      return err(ErrCode.SERVICE)
    }

    // Extract task definition name from ARN (format: arn:aws:ecs:region:account:task-definition/name:revision)
    const taskDefinition = taskDefinitionResource.PhysicalResourceId.split('/')[1].split(':')[0];

    logger.info(context, TAG, '🚀 Starting database migration task...', {
      schema,
    })

    const subnets = config.common_cdk.vpcs?.default?.subnets?.internal?.map(s => s.subnetId)
    const securityGroup = config.common_cdk.vpcs?.default?.securityGroups?.ops_store?.id

    if (subnets === undefined || subnets.length === 0 || securityGroup === undefined) {
      logger.error(context, TAG, 'Unable to determine subnets and / or security group fron config.')

      return err(ErrCode.INVALID_CONFIG)
    }

    // Run ECS task
    const params = {
      taskDefinition,
      cluster: CLUSTER,
      launchType: LaunchType.FARGATE,
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets,
          securityGroups: [ securityGroup ],
          assignPublicIp: AssignPublicIp.DISABLED
        }
      },
      overrides: {
        containerOverrides: [{
          name: 'ops-store-task',
          command: [ 
            '--migrations-dir', 
            `/app/common-store/migrations/${schema}/schema`, 
            '--migrations-table', 
            `dbmate.${schema}_migrations`, 
            'up'
          ]
        }]
      }
    };

    // Start the task
    const { tasks, failures } = await ecsClient.send(new RunTaskCommand(params))

    if (tasks === undefined || tasks.length === 0) {
      logger.error(context, TAG, 'No tasks started.', { failures, })

      return err(ErrCode.SERVICE)
    }
  
    if (failures !== undefined && failures?.length > 0) {
      const error = failures[0].reason;

      logger.error(context, TAG, 'Failed to start ECS task', {
        error,
      });

      return err(ErrCode.SERVICE)
    }

    const taskArn = tasks[0].taskArn;

    if (taskArn === undefined) {
      logger.error(context, TAG, 'Failed to retrieve task arn.', {
        tasks,
      })

      return err(ErrCode.SERVICE)
    }

    // Wait for task completion
    const waitForTaskResult = await waitForTask(context, taskArn, CONTAINER_NAME, CLUSTER);

    if (waitForTaskResult.isErr()) {
      logger.error(context, TAG, 'Failed waiting for task.', {
        error: waitForTaskResult.error
      })

      return err(waitForTaskResult.error)
    }

    const { exitCode } = waitForTaskResult.value 

    // Get task details and logs
    const { tasks: describedTasks } = await ecsClient.send(new DescribeTasksCommand({
      cluster: CLUSTER,
      tasks: [taskArn]
    }))

    if (describedTasks === undefined || describedTasks.length !== 1) {
      logger.error(context, TAG, 'Failed to describe task.', {
        describedTasks,
      })

      return err(ErrCode.SERVICE)
    }

    const describedTask = describedTasks[0]
    const container = describedTask.containers?.find(c => c.name === CONTAINER_NAME) as ECSContainer;
    const success = exitCode === 0;

    // Get CloudWatch logs
    let logs = '';
    // Get log stream name from container's log configuration
    const logStreamName = container.logConfiguration?.logDriver === 'awslogs' 
      ? container.logConfiguration.options?.['awslogs-stream-prefix']
      : undefined;
    
    if (logStreamName) {
      try {
        const logEvents = await cwLogsClient.send(new GetLogEventsCommand({
          logGroupName: `app-scripts`,
          logStreamName: `${logStreamName}/${container.name}/${taskArn.split('/')[1]}`,
          startFromHead: true
        }))
        
        logs = logEvents?.events?.map(event => event.message).join('\n') ?? ''

        logger.info(context, TAG, 'Migration logs.', {
          logs,
        })
      } catch (error) {
        logger.error(context, TAG, 'Failed to fetch CloudWatch logs', { reason:  error.message })
        logs = 'Could not fetch CloudWatch logs';
      }
    }
    else {
      logs = container.reason || 'No logs available';
    }

    if (success) {
      return ok({ logs, })
    }
    else {
      logger.error(context, TAG, `Migration task failed with exit code ${exitCode}`);

      return err(ErrCode.SERVICE)
    }
  } catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}
