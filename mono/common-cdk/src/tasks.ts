import { RemovalPolicy, Stack } from 'aws-cdk-lib'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'

export interface CreateWorkflowTaskDefinitionsOptions {
  stack: Stack,
  image: ecs.EcrImage,
  secret: secretsmanager.ISecret,
  nodeEnv: string,
}

function createWorkflowTaskDefinitions(options: CreateWorkflowTaskDefinitionsOptions): [ecs.TaskDefinition, ecs.ContainerDefinition] {
  const {stack, image, secret, nodeEnv} = options

  const workflowTaskDefinition = new ecs.TaskDefinition(stack, 'WorkflowTaskDefinition', {
    memoryMiB: '8192',
    cpu: '2048',
    compatibility: ecs.Compatibility.FARGATE,
  })


  workflowTaskDefinition.taskRole

  secret.grantRead(workflowTaskDefinition.taskRole)
  
  const logGroup = new LogGroup(stack, `$workflow-tasks-log-group`, {
    logGroupName: `/foodsmart/workflow-tasks`,
    retention: RetentionDays.ONE_MONTH,
    removalPolicy: RemovalPolicy.DESTROY,
  })
  
  const containerDefinition = workflowTaskDefinition.addContainer('WorkflowContainer', {
    image,
    memoryLimitMiB: 512,
    environment: {
      'NODE_ENV': nodeEnv,
    },
    logging: ecs.LogDrivers.awsLogs({
      streamPrefix: 'workflow-tasks',
      logGroup,
    }),
  })

  return [workflowTaskDefinition, containerDefinition]
}

export interface CreateWorkflowTaskOptions {
  stack: Stack,
  cluster: ecs.Cluster,
  securityGroup: ec2.SecurityGroup,
  subnets: ec2.SelectedSubnets,
  taskDefinition: ecs.TaskDefinition,
  containerDefinition: ecs.ContainerDefinition,
  commands: string[],
  input?: Record<string, string>,
}

function createWorkflowTask(options: CreateWorkflowTaskOptions) {
  const {stack, cluster, securityGroup, subnets, taskDefinition, containerDefinition, commands, input} = options

  const environment = [{
    name: "TASK_TOKEN",
    value: sfn.JsonPath.stringAt('$$.Task.Token')
  }]

  if (input) {
    environment.push(...Object.entries(input).map(([name, value]) => ({
      name: `IN|${name}`,
      value: sfn.JsonPath.stringAt(value),
    })))
  }

  const name = commands[1].replace(/[.\-]/g, ' ').split(' ').map(name => name.charAt(0).toUpperCase() + name.slice(1)).join('')
  const task = new tasks.EcsRunTask(stack, `${name}Task`, {
    integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
    cluster,
    taskDefinition,
    subnets,
    securityGroups: [securityGroup],
    containerOverrides: [{
      containerDefinition,
      command: ['npm', 'run', ...commands],
      environment,
    }],
    launchTarget: new tasks.EcsFargateLaunchTarget(),
  })

  return task
}


export default {
  createWorkflowTask,
  createWorkflowTaskDefinitions,
}