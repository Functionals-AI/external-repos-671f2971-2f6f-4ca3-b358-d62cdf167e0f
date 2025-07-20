# `telenutrition-cdk`

Manage the telenutrition stacks:

  * telenutrition
  * telenutrition-athena
  * TelenutritionApp
  * TelenutritionFlows

(Note, for consistency, all stack names should be camelcased.

## Deployment of Stacks

### TelenutritionApp Stack
```
export IMAGE_TAG=<image tag>
pnpm cdk deploy --parameters ApiImageBuildTag=$IMAGE_TAG WebImageBuildTag=$IMAGE_TAG TelenutritionAppStack
```

### TelenutritionFlows Stack
```
export IMAGE_TAG=<image tag>
pnpm cdk deploy -v --debug --parameters TelenutritionFlowsImageBuildTag=$IMAGE_TAG TelenutritionFlowsStack
```
