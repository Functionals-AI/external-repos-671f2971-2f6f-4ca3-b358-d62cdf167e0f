# `foodcards-cdk`

Manage **foodcards-tasks** and **foodcards-flows** stacks.

## Deployment of Stacks

### foodcards Stack
```
pnpm cdk deploy -v --debug --parameters ScriptsTaskImageBuildTag=$IMAGE_TAG FoodcardsStack
```
### foodcards-flows Stack

```
pnpm cdk deploy -v --debug --parameters FlowsImageBuildTag=$IMAGE_TAG FoodcardsFlowsStack
```