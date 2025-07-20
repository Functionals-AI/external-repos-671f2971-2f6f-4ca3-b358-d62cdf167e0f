# Deployments

## Overview

The following entities are deployable:

  * The **telenutrition application** which includes the following:
    * [telenutrition-api](../../../../telenutrition-api/)
    * [telenutrition-web](../../../../telenutrition/web/)
    * [telenutrition-flows](../../../../telenutrition-flows/)

  * Any workflows found in ```<domain>-flows``` packages.

  * The legacy **enterprise application** is also deployed and  found in the [api-new repository](github.com/zipongo/api-new/).

On a regular basis the **telenutrition application** components are deployed. In additionan migrations are executed for the **common**, **telenutrition** schemas and other schemas as necessary.

## Release Branches 

Release branches have the following naming convention, and only branches  following this  naming convention should be deployed to staging / production environments.

   * Normal release: release-vN.NN, ie: release-v1.01
   * Hotfix releases: release-vN.NN-hotfix-N, ie: release-v.01-hotfix-1

## Migrations

### Postgres

Migrations are executed for Postgress via images built by the **ops-store** Codebuild project, and the **OpsStore** Cloudformation stack, which are implement via the [ops-store cdk stack](../../../../ops-cdk/src/ops-store/). For tooling see [ops-store.ts]().

### Redshift

**Documentation coming.**

## Tools

### [ops/src/scripts/deploy/ops-store.ts](./ops-store.ts)

#### Description

Builds the **OpsStore** stack's image.

#### Usage

```
pnpm exec ts-node ./src/scripts/deploy/ops-store.ts --help
USAGE: ts-node src/scripts/deploy/ops-store.ts [options] [<branch>]

Build ops store and migrate  schemas.
Specify -- between -s schemas and optional branch when specifying a branch.
OPTIONS:
-s | --schemas <schema1>  .. <schema N>  Schemas to migrate.
-m | --migrate-only                      Only run migrations, skip build / deploy
```

Note, can be used to:
  * Execute migrations only using the deployed image.
  * Build and deploy the **ops-store** image for the specified release.
  * Build and deploy the image, and also execute migrations for a specified set of schemas.

#### Examples

  * Build the ops-store image only:

    ```pnpm exec ts-node ./src/scripts/deploy/ops-store.ts release-v1.02```
  * Build the ops-store image and execute migrations

    ```pnpm exec ts-node ./src/scripts/deploy/ops-store.ts -s common telenutrition -- release-v1.02```

    Note, separate the list  of schemas  using ```--``` from the release version.

  * Execute migrations only

    ```pnpm exec ts-node ./src/scripts/deploy/ops-store.ts -s common telenutrition -m```

### [ops/src/scripts/deploy/telenutrition-app.tts](./telenutrition-app.ts)

#### Description

Builds and deploys the **telenutriton application** (telenutrition-api and telenutrition-web) along with **telenutrition-flows**.

#### Usage 

```
pnpm exec ts-node ./src/scripts/deploy/telenutrition-app.ts --help
USAGE: ts-node src/scripts/deploy/telenutrition-app.ts [<branch>]

Builds and deploys the telenutrition application.
```

#### Example

```pnpm exec ts-node ./src/scripts/deploy/telenturition-app.ts release-v1.01```

### [ops/src/scripts/deploy/ops-flows.ts](./ops-flows.ts)

#### Description

Builds and deployts **ops-flows**.

#### Usage 

```
pnpm exec ts-node ./src/scripts/deploy/ops-flows.ts --help
USAGE: ts-node src/scripts/deploy/ops-flows.ts [<branch>]

Builds and deploys **ops-flows**.
```

#### Example

```pnpm exec ts-node ./src/scripts/deploy/ops-flows.ts release-v1.01```


## Performing a Deployment 

A typical deployment includes:
   * Buidling and executing migrations:

     ```pnpm exec ts-node ./src/scripts/deploy/ops-store.ts -s common telenutrition -- release-v1.02```
   * Build and Deploy of the Telenutrition application (including TelenutritionFlows):

     ```pnpm exec ts-node ./src/scripts/deploy/telenutrition-app.ts release-v1.02```
   * Build and Deploy OpsFlows:

    ```pnpm exec ts-node ./src/scripts/deploy/ops-flows.ts release-v1.02```


## cdk deploy

A cdk deploy is necessary whenever resources associated with a stack change.

**Documentation / tips** coming soon.