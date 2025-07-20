# `common-infra`

Manages the following stacks:
  * **common-data**,
  * **common-flows**,
  * **common-network**,
  * **common-store**.

## Deployment of Stacks

### common-data Stack
```
pnpm cdk deploy -v --debug CommonDataStack
```

### common-store Stack
```
pnpm cdk deploy -v --debug --parameters ScriptsTaskImageBuildTag=$IMAGE_TAG CommonStoreStack
```