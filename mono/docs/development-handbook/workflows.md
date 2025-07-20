[< Web Application Front Ends](./web-application-front-ends.md) | [^ TOC](./toc.md) | [> Tasks / Scripts (Deprecated)](./tasks-scripts.md)


# Workflows

  * [Overview](#overview)
  * [Workflow's and Mono Domains](#workflows-and-mono-dmains)
  * [Adding a New Workflow to a Domain](#adding-a-new-workflow-to-a-domain)
  * [Workflow Triggers](#workflow-triggers)
  * [Creating a Reusable Flow Task](#creating-a-reusable-flow-task)
  * [Workflow Task Retries](#workflow-task-retries)
  * [Running a Workflow Locally](#running-a-workflow-locally)
  * [Deploying a Workflow to AWS](#deploying-a-workflow-to-aws)
  * [Anatomy of a Workflow](#anatomy-of-a-workflow)

## Overview

**Workflows**, as the name implies facilitate the execution of distributed data processing pipelines. Foodsmart leverages AWS's [Step Functions](https://aws.amazon.com/step-functions/) for workflow orchestration. Foodsmart previously had deployments of:
  * [Apache Airflow](https://airflow.apache.org/), 
  * and [Prefect](https://www.prefect.io/).

AWS's [Step Functions](https://aws.amazon.com/step-functions/) were chosen in order to have an AWS cloud native system which requires minimal **DevOps** support.

## Workflow's and mono domains

Workflows live in a **domain's** ``-flows`` folder. For example, let's assume there is a **domain** named **demon**. The **domain's** ``-flows`` folder wouild have the following structure:
```
demo-flows/
  ./package.json
  ./tsconfig.json
  ./Dockerfile
  ./src/
    ./index.ts
    ./runner.ts
    ./flows/
      ./index.ts
      ./<demo-flow>.ts
    ./tasks/
      ./<demo-task>.ts
```

### ./package.json and ./Dockerfile

All workflows defined for a domain share the same image. The invokation of each distinct state within a workflow simply dispatches to the state's specific handler. Hence, all workflows within a domain share the same **package.json** and Dockerfile.

Of significance is the following **scripts** entry within a ```-flows``` folder's package.json file:
```
  "scripts: {
    "flow-task": "node --security-revert=CVE-2023-46809 ./lib/runner.js",
  }
 ```

This entry facilites running a flow locally. See [Running a Workflow Locally](#running-a-workflow-locally) for details.

### ./src/index.ts

Exports all defined flows and their dependencies. This is primarily to facilitate deployment of workflows to AWS. See [Deploying a Workflow to AWS](#deploying-a-workflow-to-aws).

### ./src/runner.ts

Leveraged by the framework to run a flow's states.

### ./src/flows

The ```./src/flows/``` folder contains a file for the definition of each workflow. The ```./src/flows/index.ts``` must export each workflow. For example, assuming there is a flow defined in ```./src/flows/demo-flow.ts```, the corresponding ```index.ts``` woulc contain the following:
```
import DemoFlow from './demo-flow'

export default {
  DemoFlow,
}
```

### ./src/tasks

Reusable task components can be created for common tasks that many workflows may need to perform. Examples include:
  * Fetching files from a remote SFTP server,
  * Running a redshift select query,
  * Getting and streaming an S3 object.

## Adding a New Workflow to a Domain

The following need to be performed:

  1. Define the workflow in a new file in ```./src/flows/```.
  2. Export the workflow in ```./src/flows/index.ts```.
  3. Once the new workflow is tested, coordinate with **Ops** such that the new workflow can be deployed to AWS. See [Deploying a Workflow to AWS](#deploying-a-workflow-to-aws).

## Workflow Triggers

## Creating a Reusable Flow Task

## Workflow Task Retries

## Running a Workflow Locally

## Deploying a Workflow to AWS

## Anatomy of a Workflow

[< Web Application Front Ends](./web-application-front-ends.md) | [^ TOC](./toc.md) | [> Tasks / Scripts (Deprecated)](./tasks-scripts.md)
