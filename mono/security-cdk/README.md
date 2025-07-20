# ops-cdk

Manage Security Cloudformation stacks:

  * Security

It is advised to run the **AWS CDK** using Node.js version **18.18.2** (or 18.x) which is in active LTS. IE: 

```bash
nvm install 18.20.4
nvm use 18.20.4
RUN npm install -g pnpm@10.4.1
pnpm install --filter=@mono/ops-cdk...
```

Update pnpm to the latest version after an update is merged:

```bash
pnpm self-update
```

## Deployment of Stacks

### Security Stack
```bash
 pnpm cdk deploy SecurityStack
```

