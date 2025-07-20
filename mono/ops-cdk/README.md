# ops-cdk

Manage Ops Cloudformation stacks:

  * Ops
  * OpsFlows
  * OpsStore
  * OpsTransfer

It is advised to run the **AWS CDK** using Node.js version **18.18.2** (or 18.x) which is in active LTS. IE: 

```bash
nvm install 18.18.2
nvm use 18.18.2
npm install -g pnpm@10.4.1
pnpm install --filter=@mono/ops-cdk...
```

Update pnpm to the latest version after an update is merged:

```bash
pnpm self-update
```

## Deployment of Stacks

### OpsFlows Stack
```
 pnpm cdk deploy --parameters FlowsImageBuildTag=$IMAGE_TAG OpsFlowsStack
```

### OpsStore Stack
```bash
pnpm cdk deploy -v --debug --parameters TaskImageBuildTag=$IMAGE_TAG OpsStoreStack
```
