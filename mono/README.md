# Mono, an Overview

This document contains an overview of the **mono** repository. More details can be found in the **mono's** [Development Handbook](./docs/development-handbook/toc.md).

**Mono** stands for a **mono repo**. This is a collection of Javascript / NodeJS packages. Packages come in several flavors in the context of a **_domain_**. As of this writing, domains include:

  * [common](common/README.md): Functionality required by all domains. For example, generating a **context** which includes configuration data, database connection pools, etc...
  * [foodapp](foodapp/README.md): Functionality relevant to the Foodsmart **food application**. For example, syncronization of the **food application** data base (AWS RDS Aurora MySQL) to the Redshift data warehouse is implemented here: [foodapp/src/warehouse/sync.ts](foodapp/src/warehouse/sync.ts).
  * [marketing](marketing/README.md): Marketing functionality. For example, Customer.io ETL which synchronizes (**food applicaiton**) users to Customer.io as Customer.io **people**.
  * [telenutrition](telenutrition/README.md): Telenutrition specific functionality.

**Domain specific** business logic is packaged and executed in the following forms:

  * **tasks**:
    * A **task** can be implemented as an ECS Fargate Task which executes a script invoking **domain specific** business logic.
    * A **task** can be implemented as a Lambda function (not yet supported, but possible in the future), which executes **domain specific** business logic.
  * **flows**: A flow is the coordinated execution of **tasks** where the coordination is performed by an AWS Lambda Step Function.

The execution of **domain specific business logic** as **tasks** or **flows** requires AWS resources, such as IAM roles / polices, ECS Task Definitions, Lambda functions, etc.. The management of these resources is performed by the [AWS Cloud Development Kit (CDK)](https://docs.aws.amazon.com/cdk/index.html) in the context of a doamin.

In several aspects, the **mono repo** performs a role of **unification**. As opposed to writing code for frameworks such as **_Airflow_** or **_Prefect_**, **domain specific business logic** is implemented as generic packages. That **domain specific** code is then executed as ECS Fargate Tasks or Step Functions. ECS Fargate Tasks or Step Functions are execution environments which are currently widely leveraged. Furthermore, **infrastructure as code** is leveraged using the [AWS Cloud Development Kit (CDK)](https://docs.aws.amazon.com/cdk/index.html) where that code resides in this repository. For example, resources required by [foodapp tasks](foodapp-tasks/README.md) are found in the [foodapp CDK](foodapp-cdk/README.md) package. There is no longer a need for a separate repository such as [zipongo/cloudformation](https://github.com/zipongo/cloudformation/) which relies on a 3rd party library, [cloudtools/troposphere](https://github.com/cloudtools/troposphere) to manage AWS resources in a different language (Python).

In summary, domain specific **business logic**, packaging of **business logic** in an execution environment (**ECS Fargate Task** or **Step Function**), and the corresponding **infrastructure as code** are all found in this repository and all written in ONE programming language, **TypeScript** (a dialect of JavaScript which the organization is well versed in).

# Repo Structure

This repository is a collection of NodeJS **domain specific** packages. The basic structure is as follows:

```bash
├── <domain>        # Business logic specific to a domain. 
├── <domain>-tasks  # Packaging the domain logic into a Task to be executed on Lambda or ECS Fargate.
├── <domain>-flows  # Coordinated execution of Tasks to be performed by an AWS Lambda Step Function.
└── <domain>-cdk    # The infrastructure as code to manage the AWS resources required by that domain.
```

# Development Workflow

## Getting Going on a Newly Cloned Repo

Let's say one is tasked with adding something to this masterpiece of a repository, they would first need to follow the instructions below to get up and running.

1. Install prerequisites:
    * Homebrew
    * Git
    * AWS CLI
    * Docker Desktop
    * Node.js
    * pnpm (`npm install -g pnpm@10.4.1`)
    * An IDE such as VS Code
      * ESLint Extension - View ESLint issues in the editor
      * Prettier Extension- Format files consistently with `Shift` + `Option` + `F`
    * pgAdmin
  
2. Initial configuration for AWS SSO:
   ```bash
   aws configure sso --profile dev
   ```

   And fill out the prompts as follows:
   ```bash
   SSO session name (Recommended): dev
   SSO start URL [None]: https://d-9267617533.awsapps.com/start/#
   SSO region [None]: us-west-2
   SSO registration scopes [sso:account:access]: (just hit enter)
   (website will pop up here, asking you to verify a code + okta verify)

   There are 5 AWS accounts available to you.
   <Choose development from the list>
   ```

   Repeat for other environments.

3. Log in to AWS via SSO:
   Its recommended to save this as  
    ```bash
    aws sso login --profile dev
    eval "$(aws configure export-credentials --profile dev --format env)"
    aws --profile dev sts get-caller-identity       # To verify the credentials are working.
    ```

4. Add the following entries to your `/etc/hosts` file
    ```bash
    127.0.0.1 kubernetes.docker.internal
    127.0.0.1 api.zipongo-local.com
    127.0.0.1 apim.zipongo-local.com
    127.0.0.1 webnode.zipongo-local.com
    127.0.0.1 web.zipongo-local.com
    127.0.0.1 zipongo-local.com
    127.0.0.1 www.zipongo-local.com
    127.0.0.1 trial.zipongo-local.com
    127.0.0.1 foodsmart-devenv.com
    127.0.0.1 store
    ```

One can now edit any package level code.

## Developing Packages

### [🌎 pnpm catalogs](https://pnpm.io/next/catalogs)

*_As of version 10.4.1, pnpm catalogs do not support `pnpm update` and some other functionality.  To update a dependency, edit the package definition in `./pnpm-workspace.yaml` and run `pnpm install` which may or may not update the lock file.  All dependency versions are now managed in the `pnpm workspace._

You can run commands from the root:
```bash
pnpm install  # Install dependencies. Important: Do not use regular npm.
pnpm tsc      # Type-check and Transpile TypeScript files in /src to JavaScript files in /lib
pnpm test     # Run unit tests. 
```

Or within packages:
```bash
cd <package>
pnpm add <dep>      # Add a new dependency to this package.
pnpm remove <dep>   # Remove a dependency from this package.
pnpm tsc            # Run tsc in this package.
pnpm test           # Run test in this package.
```

> ***NOTE:*** When modifying dependencies, it's important to commit the auto-generated changes to the `pnpm-lock.yaml` file. This file 'locks in' the exact node_modules tree for the entire monorepo, and therefore, it shouldn't be recreated from scratch or be manually edited.

You can use the following commands to run the devenv docker containers:
```bash
cd devenv
./bin/telenutrition-app/build       # Build or rebuild services.
./bin/telenutrition-app/up          # Create and start containers.
./bin/telenutrition-app/down        # Stop and remove containers and networks.
docker volume rm common_store-data  # Wipe all data in the devenv store.
```

> These commands are also available as *Tasks* for [vscode](https://code.visualstudio.com/) users.  You can run them by opening the *Command Palette* `(Ctrl/Cmd + Shift + P)` and choosing `Tasks: Run Task`.

If your local instance of the app is provider data (e.g. no available appointments), you can use the following command to seed data into the devenv docker volume:

```bash
cd devenv
./bin/telenutrition-app/seed-providers
```

> ***NOTE:*** If you get any 'out of memory' errors doing any of the above steps, try limiting the CPU and Memory allocations in Docker Desktop to some fraction of the max available (such as 1/3 or 1/2) and then trying again.

In order to connect to the Postgres DB within the docker volume, you can set up a connection in pgAdmin4 with the following connection details:
```bash
Host name / address:  localhost
Port:                 5432
Username:             postgres
Password:             <same as username>
```

To run 'flows' locally, you can use the following command:
```bash
LOCAL=1 INPUT={} AWS_PROFILE=dev NODE_ENV=devenv pnpm flow-task <flow name> <task name>
```

## Deploying A Package's Resources

The [AWS Cloud Development Kit (CDK)](https://docs.aws.amazon.com/cdk/index.html) has a CLI which should be used to deploy resources. The [foodapp-cdk](foodapp-cdk/README.md) stack implements the resources for an ECS Fargate Task. The stack takes a single parameter **ScriptsTaskImageBuildTag** which is the ECR image tag of the image which should be used when the task is executed. To update the stack, along with the image tag to use, the following command should be used:

```bash
IMAGE_TAG=<ECR image tag>
pnpm cdk deploy --parameters ScriptsTaskImageBuildTag=$IMAGE_TAG
```

## Translations

* In root `pnpm i18n:extract` will extract all strings viable for translation across packages
* In common `pnpm i18n:upload` will upload all en.json files to lokalise. There is an automation setup on their site to use google-translate to translate these strings
* In common `pnpm i18n:download` will download new es.json files and overwrite existing files.

## Source Control (Git / GitHub)

### Branch naming
Branch naming is enforced and must have the Jira ticket number prefix e.g. `DEV-12345-super-cool-feature`.  Failure to follow this branch naming convention will result in a git error similar to:

```bash
remote: error: GH006: Protected branch update failed for refs/heads/supercoolfeature.
remote: error: You're not authorized to push to this branch. Visit https://docs.github.com/articles/about-protected-branches/ for more information.
```

For tickets/tasks that do not have the `DEV-` prefix, for example ClickUp tickets, create a matching Jira ticket and cross reference the two in the description/comments.

### Access

1. Generating an SSH key and adding it to Github

    Refer to [Generating a new SSH key and adding it to the ssh-agent - GitHub Docs](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent) to generate an SSH key and add it to your ssh-agent and GitHub.

    If you receive any error messages about permissions of your SSH key or the `~/.ssh` directory, you can try the following steps to fix it:
    ```bash
    ls -ld ~/.ssh
    ```
    Output:
    ```bash
    drwx------  11 yourusername  staff  352 Apr 17 11:27 /Users/yourusername/.ssh
    ```
    Confirm the permissions are `drwx------` and that you are the owner.  In the example above it is `yourusername`.  If you're not the owner, run:
    ```bash
    chown -R yourusername ~/.ssh
    ```
    Find `yourusername` by running:
    ```bash
    whoami
    ```

    If the permissions are not correct, you can change them by running:
    ```bash
    chmod -R u+rwX,go-rwx ~/.ssh
    ```

    You can alternately change the permissions on the individual SSH key file by running:
    ```bash
    chmod 600 ~/.ssh/id_rsa_github
    ```
    Where `id_rsa_github` is the name of your SSH key file.

    And on the `~/.ssh` directory:
    ```bash
    chmod 700 ~/.ssh
    ```

2. Authentication via GitHub CLI

    Download the [GitHub CLI](https://cli.github.com/) and run `gh auth login` to authenticate with Github.

#### Cloning the repository

It is a generally a good practice to store all repositories in their own directory in `~/` for example `~/repos`.
```bash
cd ~/
mkdir repos
cd repos
git clone git@github.com:zipongo/mono.git
```

#### Creating and pushing branches

```bash
git branch DEV-12345-super-cool-feature
git checkout DEV-12345-super-cool-feature
# Make changes to the code
git add .
git commit -m "Summary of changes"
git push origin DEV-12345-super-cool-feature
```

### Pull requests

Pull requests should have the Jira ticket number in the beginning of their title along with a summary of the ticket or changes.  For example: `DEV-12345: Super cool feature`.  

>NOTE: _When choosing a title, be mindful of not only those performing code review, but also other developers searching for closed PRs while seeking examples of how to change certain parts of the codebase._

The description should include a link to the Jira ticket and any relevant information about the change.  If the changes impact any other repositories or work performed by another developer, please tag the person as a code reviewer and / or in the description.  If only a small portion of the PR is relevant to that person, highlight that section with a comment tagging the developer, leaving a note about why they should be aware of this change.

>Note:  _Changes to certain parts of the codebase require the repository owner to sign off via a code review.  GitHub will let you know who this person is, but at the time of this edit, it is the Chief Architect._

### Ticket cleanup

Once a pull request is opened, add a comment to the Jira ticket with a link back to the pull request with a summary of the changes.  In most cases, you can copy / paste the PR description into the ticket comment.  This gives visibility to those without access to the repository.  Update the ticket status and tag anyone who needs to perform QA or coordinate a release.

>NOTE: _It's easy to rush through wrapping up a feature or bug fix.  A little extra work on your end can not only save a significant amount of your teammate's time, but likely yours as well when new colleagues join.  Pull requests can be a great source of documentation._

### Migrations

#### Generate the migration file
```sh
# Assumes to be running from the mono repo root directory
# `migration_name` should be something descriptive like
#   - "create_table_name"
#   - "alter_${table_name}_add_${feature}"
# `schema` will be the schema to add it under (will be a folder withing the common-store/migrations folder)
docker run --rm -it --network=host -v "$(pwd)/common-store/migrations/:db" amacneil/dbmate new ${migration_name} -d "/db/${schema}"
```

Modify the generated file as needed

#### Run the migration on the local db & updates the zapatos schema
```
pushd ./devenv
./bin/common-store/run-migrations
popd
```
