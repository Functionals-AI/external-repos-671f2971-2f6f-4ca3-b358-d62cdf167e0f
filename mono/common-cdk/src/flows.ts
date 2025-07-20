import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'
import * as sfntasks from 'aws-cdk-lib/aws-stepfunctions-tasks'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import * as codebuild from 'aws-cdk-lib/aws-codebuild'

import * as targets from 'aws-cdk-lib/aws-events-targets'

import { Rule, Schedule } from 'aws-cdk-lib/aws-events'

import { Construct } from 'constructs'
import { SucceedBuilder, FailBuilder, isFail, isNumericEquals, isChoice, StateBuilder, JitterType, TaskBuilder, WorkflowBuilder, ChoiceBuilder, isTask, isSucceed, isStringEquals, ParallelBuilder, isParallel, isWait, WaitBuilder, WorkflowFactory, StatemachineBuilder } from '@mono/common-flows/lib/builder'
import { ContainerDefinition, ICluster, TaskDefinition } from 'aws-cdk-lib/aws-ecs'
import { EventBus } from 'aws-cdk-lib/aws-events'
import { CfnParameter, Duration, Fn, RemovalPolicy } from 'aws-cdk-lib'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'

import Config, { ICdkConfig } from './config'
import { CreateFlowAlarmsResult, createFlowAlarms } from './ops/alarms'
import { createFlowsDashboard } from './ops/dashboards'
import { createVpc } from './vpc'
import { LinuxBuildImage, ComputeType } from 'aws-cdk-lib/aws-codebuild'
import { ISecurityGroup } from 'aws-cdk-lib/aws-ec2'

import Secrets from './secrets'
import * as _ from 'lodash'
import {IConfig} from '@mono/common/lib/config'

/**
 * Ensure all next states / branch / choice targets are defined. Note, should only be called ONCE per state.
 * 
 * @param context 
 * @param sfnStates 
 * @param builderStates 
 * @param stateId 
 * @returns 
 */
function chainState(context: WorkflowContext, sfnStates: Record<string, sfn.State>, builderStates: Record<string, StateBuilder>, stateId: string): sfn.State {
  const {stack} = context
  const stateBuilder = builderStates[stateId]
  const state = sfnStates[stateId]

  console.log(`chainState: `, stateId)
  if (isChoice(stateBuilder)) {
    const choice: sfn.Choice = state as sfn.Choice
    const choiceBuilder: ChoiceBuilder = stateBuilder

    for (let condition of choiceBuilder.choices) {
      if (!(condition.next in sfnStates)) {
        throw Error(`Error finding next state: ${condition.next}`)
      }

      if (isNumericEquals(condition)) {
        choice.when(sfn.Condition.numberEquals(condition.variable, condition.numericEquals), sfnStates[condition.next])
      } else if (isStringEquals(condition)) {
        choice.when(sfn.Condition.stringEquals(condition.variable, condition.stringEquals), sfnStates[condition.next])
      }
    }

    if (choiceBuilder.default) {
      if (!(choiceBuilder.default in sfnStates)) {
        throw Error(`Error finding choice state default: ${choiceBuilder.default}`)
      }

      choice.otherwise(sfnStates[choiceBuilder.default])
    }
    return choice
  } else if (isTask(stateBuilder)) {
    // @ts-ignore
    const task: sfntasks.EcsRunTask = state
    const taskBuilder: TaskBuilder = stateBuilder

    if (taskBuilder.next) {
      if (!(taskBuilder.next in sfnStates)) {
        throw Error(`Error finding next state: ${taskBuilder.next}`)
      }

      task.next(sfnStates[taskBuilder.next])
    }

    if (taskBuilder.catch) {
      //
      // Use a pass construct to simply go to the next state of the catch handler.
      //
      const pass: sfn.Pass = new sfn.Pass(stack, `${task.id}-catch`)
      
      pass.next(sfnStates[taskBuilder.catch.next])

      task.addCatch(pass)
    }

    return task
  } else if (isParallel(stateBuilder)) {
    // @ts-ignore
    const parallel: sfn.Parallel = state
    const parallelBuilder: ParallelBuilder = stateBuilder

    console.log(`chainState: Parallel found`)
    for (let [index, branch] of parallelBuilder.branches.entries()) {
      console.log(`chainState: Parallel branch`, JSON.stringify(branch))

      if (!(branch.startAt in sfnStates)) {
        throw Error(`Error finding parallel branch start: ${branch.startAt}`)
      }

      for (const stateId of Object.keys(branch.states)) {
        chainState(context, sfnStates, branch.states, stateId)
      }
    }

    parallel.next(sfnStates[parallelBuilder.next])

    return parallel
  } else if (isWait(stateBuilder)) {
    // @ts-ignore
    const wait: sfn.Wait = state
    const waitBuilder: WaitBuilder = stateBuilder

    if (waitBuilder.next) {
      if (!(waitBuilder.next in sfnStates)) {
        throw Error(`Error finding next state: ${waitBuilder.next}`)
      }

      wait.next(sfnStates[waitBuilder.next])
    }

    return wait
  }
}

class ParallelBranch extends sfn.StateMachineFragment {
  public readonly startState: sfn.State
  public readonly endStates: sfn.INextable[]

  constructor(parent: Construct, stateId: string, state: ParallelBuilder, branchId: number, branch: StatemachineBuilder, sfnStates: Record<string, sfn.State>) { 
    const id = `${stateId}: ${branchId}`

    super(parent, id)

    this.startState = sfnStates[branch.startAt]
    this.endStates = sfnStates[branch.startAt].endStates
  }
}

// Create the sfn states from the flow builder states
function createStates(context: WorkflowContext, flowId: string, builderStates: Record<string, StateBuilder>, sfnStates: Record<string, sfn.State>): Record<string, sfn.State> {
  const {stack} = context

  for (let [stateId, state] of Object.entries(builderStates)) {
    console.log(`createStates: ${stateId}`)
    // TASK
    if (isTask(state)) {
      console.log(`createStates: ${stateId}`)
      sfnStates[stateId] = createEcsTask(context, flowId, stateId, state)
    // CHOICE
    } else if (isChoice(state)) {
      const choice: ChoiceBuilder = state

      sfnStates[stateId] = new sfn.Choice(stack, `${flowId}${stateId}`, {
        ...(choice.inputPath && {inputPath: choice.inputPath}),
        ...(choice.outputPath && {outputPath: choice.outputPath}),
        ...(choice.comment && {comment: choice.comment}),
      })
    // SUCCEED
    } else if (isSucceed(state)) {
      const succeed: SucceedBuilder = state

      sfnStates[stateId] = new sfn.Succeed(stack, `${flowId}${stateId}`, {
        ...(succeed.inputPath && {inputPath: succeed.inputPath}),
        ...(succeed.outputPath && {outputPath: succeed.outputPath}),
        ...(succeed.comment && {comment: succeed.comment}),
      })
    } else if(isParallel(state)) {
      const parallel: ParallelBuilder = state

      const sfnParallel = new sfn.Parallel(stack, `${flowId}${stateId}`, {
        ...(parallel.comment && {comment: parallel.comment}),
        ...(parallel.inputPath && {inputPath: parallel.inputPath}),
        ...(parallel.outputPath && {outputPath: parallel.outputPath}),
        ...(parallel.resultPath && {resultPath: parallel.resultPath}),
        // ...(parallel.resultSelector && {resultSelector: parallel.resultSelector}),
      })
      sfnStates[stateId] = sfnParallel

      console.log(`createState parallel`)

      const parallelBranches: sfn.StateMachineFragment[] = []

      for (const [branchIdx, branch] of parallel.branches.entries()) {
        console.log(`createStates parallel`, JSON.stringify(branch))

        createStates(context, flowId, branch.states, sfnStates)
        
        const parallelBranch = new ParallelBranch(sfnParallel, stateId, parallel, branchIdx, branch, sfnStates)

        parallelBranches.push(parallelBranch)
      }

      sfnParallel.branch(...parallelBranches)
    } else if (isWait(state)) {
      const wait: WaitBuilder = state;
      let time: sfn.WaitTime = null;

      if ('seconds' in wait) {
        time = sfn.WaitTime.duration(Duration.seconds(wait.seconds))
      }
      else if ('secondsPath' in wait) {
        time = sfn.WaitTime.secondsPath(wait.secondsPath)
      }
      else if ('timestamp' in wait) {
        time = sfn.WaitTime.timestamp(wait.timestamp)
      }
      else if ('timestampPath' in wait) {
        time = sfn.WaitTime.timestampPath(wait.timestampPath)
      }

      if (time !== null) {
        sfnStates[stateId] = new sfn.Wait(stack, `${flowId}${stateId}`, {
          time: time,
          ...(wait.comment && {comment: wait.comment}),
        })
      }
    } else if (isFail(state)) {
      const fail: FailBuilder = state

      sfnStates[stateId] = new sfn.Fail(stack, `${flowId}${stateId}`, {
        ...(fail.inputPath && {inputPath: fail.inputPath}),
        ...(fail.outputPath && {outputPath: fail.outputPath}),
        ...(fail.comment && {comment: fail.comment}),
      })
    }
  }

  return sfnStates
}

function createFlowStates(context: WorkflowContext, flowId: string, flow: WorkflowBuilder): Record<string, sfn.State> {
  const sfnStates: Record<string, sfn.State> = {}

  createStates(context, flowId, flow.states, sfnStates)

  return sfnStates
}


function createDefinition(context: WorkflowContext, flowId: string, flow: WorkflowBuilder): sfn.IChainable {
  const states = createFlowStates(context, flowId, flow)

  for (const stateId of Object.keys(flow.states)) {
    chainState(context, states, flow.states, stateId)
  }

  console.log(`createDefition: State creation and chaining completed...`)

  return states[flow.startAt]
}

function createEcsTask(context: WorkflowContext, flowId: string, taskId: string, builder: TaskBuilder): sfntasks.EcsRunTask {
  const { stack, ecsTask: { cluster, containerDefinition, taskDefinition, subnets, securityGroups } } = context

  const environment = [{
    name: 'TASK_TOKEN',
    value: sfn.JsonPath.taskToken,
  }, {
    name: 'INPUT',
    value: sfn.JsonPath.jsonToString(sfn.JsonPath.objectAt('$')),
  },{
    name: 'RETRY_COUNT',
    value: sfn.JsonPath.format('{}', sfn.JsonPath.stateRetryCount),
  }]

  const props: sfntasks.EcsRunTaskProps = {
    integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
    cluster,
    subnets,
    securityGroups,
    taskDefinition,
    launchTarget: new sfntasks.EcsFargateLaunchTarget(),
    containerOverrides: [{
      containerDefinition,
      command: ['npm', 'run', 'flow-task', flowId, taskId],
      environment,
    }],
    ...(builder.inputPath && { inputPath: builder.inputPath }),
    ...(builder.outputPath && { outputPath: builder.outputPath }),
    ...(builder.resultPath && { resultPath: builder.resultPath }),
    ...(builder.resultSelector && { resultSelector: builder.resultSelector }),
  }

  const runTask = new sfntasks.EcsRunTask(stack, `${flowId}${taskId}`, props)

  if (builder.retry) {
    const retry = builder.retry 

    runTask.addRetry({
      ...retry,
      ...(retry.interval !== undefined && { interval: Duration.seconds(retry.interval) }),
      ...(retry.jitterStrategy !== undefined && { jitterStrategy: retry.jitterStrategy === JitterType.FULL ? sfn.JitterType.FULL : sfn.JitterType.NONE }),
      ...(retry.maxDelay !== undefined && { maxDelay: Duration.seconds(retry.maxDelay) }),
    })
  }

  return runTask
}

export interface WorkflowContext {
  stack: Construct,
  config: IConfig,
  domain: string,
  ecsTask: {
    cluster: ICluster,
    taskDefinition: TaskDefinition,
    subnets: ec2.SubnetSelection,
    securityGroups: ec2.SecurityGroup[],
    containerDefinition: ContainerDefinition,
  },
  logGroup?: LogGroup,
}

export interface CreateStatemachineResult {
  stateMachine: sfn.StateMachine,
  alarms: CreateFlowAlarmsResult,
}

export function createStatemachine(context: WorkflowContext, flowId: string, flow: WorkflowBuilder): CreateStatemachineResult {
  const { stack, domain, config } = context
  const definition = createDefinition(context, flowId, flow)
  const definitionBody = sfn.DefinitionBody.fromChainable(definition)
  //
  // Per: https://github.com/aws/aws-cdk/issues/19353
  //
  // Seems like there is a default policy document that starts to exceed the policy character size limit.
  // Unfortunately, creating individual policies won't help either as there is a limit of 10 per account / region.
  // The CDK suggests prefixing the log group name with '/aws/vendedlogs/states/' to avoid the limit.
  //
  const stateMachineLogGroup = context.logGroup ||
    new LogGroup(stack, `${flowId}Logs`, {
      logGroupName: `/aws/vendedlogs/states/foodsmart/${domain.toLowerCase()}-flows/state-machine/${_.kebabCase(flowId)}`,
  }) 

  const stateMachine = new sfn.StateMachine(stack, `${flowId}StateMachine`, {
    stateMachineName: `${domain}-${flowId}`,
    definitionBody,
    logs: {
      destination: stateMachineLogGroup,
      level: sfn.LogLevel.ALL,
    },
  })

  let rule: Rule

  if (flow.cron) {
    rule = new Rule(stack, `${flowId}FlowRule`, {
      ruleName: `${domain}${flowId}FlowCronRule`,
      schedule: Schedule.expression(`cron(${flow.cron})`),
    })
    rule.addTarget(new targets.SfnStateMachine(stateMachine))
  } else if (flow.rate) {
    rule = new Rule(stack, `${flowId}FlowRule`, {
      ruleName: `${domain}${flowId}FlowRateRule`,
      schedule: Schedule.expression(`rate(${flow.rate})`),
    })
    rule.addTarget(new targets.SfnStateMachine(stateMachine))
  } else if (flow.event) {
    const {event} = flow
    const eventBus = event.bus ? EventBus.fromEventBusName(stack, `${flowId}EventBus`, event.bus) : null
    
    console.log(`createStatemachine: creating event rule - ${JSON.stringify(event)}`)
    rule = new Rule(stack, `${flowId}FlowRule`, {
      ruleName: `${domain}${flowId}FlowEventRule`,
      ...(eventBus && {eventBus: eventBus}),
      eventPattern: {
        ...(event.source && {source: event.source}),
        ...(event.resources && {resources: event.resources}),
        ...(event.detailType && {detailType: event.detailType}),
        ...(event.detail && {detail: event.detail}),
      }
    })
    rule.addTarget(new targets.SfnStateMachine(stateMachine))
    console.log(`createStatemachine: Event rule created.`)
  }

  const alarms = createFlowAlarms(stack, { domain, flowId, stateMachine, }, config)

  return {
    stateMachine,
    alarms,
  }
}


export interface CreateWorkflowOptions {
  stack: Construct,
  config: IConfig,
  domain: string,
  flows: Record<string, WorkflowFactory>,
  dependencies: string[],
  dockerFileDir?: string  // Override. e.g. telenutrition-e2e isn't a domain, but has its own stack & flows, so we skip appending the '-flows' suffix
}

export interface CreateWorkflowResult {
  taskDefinition: TaskDefinition,
}


/**
 * `createWorkflow` creates an ECS workflow using the AWS CDK.
 * @param {CreateWorkflowOptions} options
 * @returns `CreateWorkflowResult` object
 */
export function createWorkflow(options: CreateWorkflowOptions): CreateWorkflowResult {
  const cdkConfig = Config.getConfig()
  const {config, domain, flows, dependencies, stack, dockerFileDir} = options
  const domainLower = domain.toLowerCase()

  const flowsImageTagParameter = new CfnParameter(stack, `FlowsImageBuildTag`, {
    description: `${domain} Flows image tag`,
    type: "String"
  })

  const {vpc, subnets} = createVpc(stack, cdkConfig)
  const cluster = new ecs.Cluster(stack, `${domain}FlowsCluster`, {
    clusterName: `${domain}Flows`,
    containerInsights: true,
    vpc,
  })

  const ecsTaskSecurityGroup = new ec2.SecurityGroup(stack, `FlowsClusterSecurityGroup`, {
    securityGroupName: `${domainLower}-flows-cluster-sg`,
    vpc,
    allowAllOutbound: true,
  })
  
  const codebuildSecurityGroup = new ec2.SecurityGroup(stack, 'FlowsCodeBuildSecurityGroup', {
    securityGroupName: `${domainLower}-flows-codebuild-sg`,
    vpc,
    allowAllOutbound: true,
  })

   const {repository: flowsRepository} = createWorkflowBuild({
    vpc: vpc,
    subnets: subnets,
    config: cdkConfig,
    securityGroup: codebuildSecurityGroup,
    dependencies: dependencies,
    stack: stack,
    domain: domain,
    dockerFileDir: dockerFileDir
  })

   const flowsImage = ecs.ContainerImage.fromEcrRepository(flowsRepository, flowsImageTagParameter.valueAsString)
   const flowsTaskDefinition = new ecs.TaskDefinition(stack, 'FlowsTaskDefinition', {
     memoryMiB: '8192',
     cpu: '2048',
     compatibility: ecs.Compatibility.FARGATE,
   })

   const secrets = Secrets.getSecrets(stack)
   secrets.grantRead(flowsTaskDefinition.taskRole)
   
   const logGroup = new LogGroup(stack, `FlowsLogGroup`, {
     logGroupName: `/foodsmart/${domainLower}-flows/tasks`,
     retention: RetentionDays.ONE_MONTH,
     removalPolicy: RemovalPolicy.DESTROY,
   })
   
   const flowsContainerDefinition = flowsTaskDefinition.addContainer('FlowsContainer', {
     image: flowsImage,
     environment: {
       'NODE_ENV': cdkConfig.env,
     },
     logging: ecs.LogDrivers.awsLogs({
       streamPrefix: 'flows-tasks',
       logGroup,
     }),
   })

   const workflowContext: WorkflowContext = {
     stack: stack,
     config,
     domain,
     ecsTask: {
       cluster,
       subnets,
       securityGroups: [ecsTaskSecurityGroup],
       taskDefinition: flowsTaskDefinition,
       containerDefinition: flowsContainerDefinition,
     },
   }

   //
   // Keep track of alarms by type in order to create a dashboard.
   //

   const alarms: Record<'executionTimeAlarms' | 'executionsFailedAlarms' | 'executionsTimedOutAlarms', cloudwatch.Alarm[]> = {
    executionTimeAlarms: [],
    executionsFailedAlarms: [],
    executionsTimedOutAlarms: [],
   }

   for (let [id, factory] of Object.entries(flows)) {
    const builder = factory(config)

    if (builder === undefined) {
      continue
    }

    const { stateMachine, alarms: { executionTimeAlarm, executionsFailedAlarm, executionsTimedOutAlarm } } = createStatemachine(workflowContext, id, builder)

    alarms.executionTimeAlarms.push(executionTimeAlarm)
    alarms.executionsFailedAlarms.push(executionsFailedAlarm)
    alarms.executionsTimedOutAlarms.push(executionsTimedOutAlarm)

    stateMachine.grantTaskResponse(flowsTaskDefinition.taskRole)
   }

   const scratchBucketArn = Fn.importValue('CommonFlows-ScratchBucketArn')
   const scratchBucket = s3.Bucket.fromBucketArn(stack, 'CommonFlowsScratchBucket', scratchBucketArn)
   scratchBucket.grantReadWrite(flowsTaskDefinition.taskRole)

   const rdsSecurityGroup = ec2.SecurityGroup.fromLookupById(stack, 'RdsSecurityGroup', config.common_cdk.vpcs.default.securityGroups.rds.id)
   rdsSecurityGroup.addIngressRule(ecsTaskSecurityGroup, ec2.Port.tcp(3306), `${domain} flows access to RDS MySQL`)

   const commonStoreSecurityGroup = ec2.SecurityGroup.fromLookupById(stack, 'CommonStoreSecurityGroup', config.common_cdk.vpcs.default.securityGroups.rds_common_store.id)
   commonStoreSecurityGroup.addIngressRule(ecsTaskSecurityGroup, ec2.Port.tcp(5432), `${domain} flows access to RDS common store cluster`)

   const redshiftSecurityGroup = ec2.SecurityGroup.fromLookupById(stack, 'RedshiftSecurityGroup', config.common_cdk.vpcs.default.securityGroups.redshift.id)
   redshiftSecurityGroup.addIngressRule(ecsTaskSecurityGroup, ec2.Port.tcp(5439), `${domain} flows access to Redshift`)

   createFlowsDashboard(stack, { domain, alarms }, config)
     
   return {taskDefinition: flowsTaskDefinition}
}


export interface CreateWorkflowBuildOptions {
  vpc: ec2.IVpc,
  subnets: ec2.SelectedSubnets,
  config: ICdkConfig,
  securityGroup: ISecurityGroup,
  dependencies: string[],
  stack: Construct,
  domain: string,
  dockerFileDir?: string  // Override. e.g. telenutrition-e2e isn't a domain, but has its own stack & flows, so we skip appending the '-flows' suffix
}

export interface CreateWorkflowBuildResult {
  project: codebuild.Project,
  repository: ecr.Repository,
}

/**
 * `createWorkflowBuild` creates a CodeBuild project and an ECR repository for a workflow build process.
 * @param {CreateWorkflowBuildOptions} options
 * @returns `CreateWorkflowBuildResult` object with two properties: `repository` and `project`. The
 * `repository` property represents an Amazon Elastic Container Registry (ECR) repository and the `project`
 * property represents the AWS CodeBuild project created here.
 */
function createWorkflowBuild(options: CreateWorkflowBuildOptions): CreateWorkflowBuildResult {
  const {stack, domain} = options
  const {vpc, subnets, config, securityGroup, dependencies, dockerFileDir} = options
  const domainLower = domain.toLowerCase()

  const name = `${domainLower}-flows`
  const dockerFileDirectory = dockerFileDir ?? name

  const repository = new ecr.Repository(stack, `FlowsRepo`, {
    repositoryName: `mono/${name}`,
    removalPolicy: RemovalPolicy.DESTROY,
  })
  
  repository.addLifecycleRule({maxImageAge: Duration.days(180)})

  const project = new codebuild.Project(stack, 'FlowsCodeBuildProject', {
    vpc: vpc,
    subnetSelection: subnets,
    projectName: name,
    environment: {
      buildImage: LinuxBuildImage.STANDARD_7_0,
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
      //    .andFilePathIs(`(${name}|${dependencies.join('|')})/src`)
      //    .andBranchIs('master')
      //],
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
            `DOCKER_BUILDKIT=1 docker build -t mono/${name} -f ./${dockerFileDirectory}/Dockerfile .`,
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
  createStatemachine,
}