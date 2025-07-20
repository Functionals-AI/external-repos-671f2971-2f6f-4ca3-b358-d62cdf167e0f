import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import Config from '../src/config'
import { Construct } from 'constructs'

function getSecrets(stack: Construct): secretsmanager.ISecret {
  const config = Config.getConfig()

  return secretsmanager.Secret.fromSecretCompleteArn(stack, 'TelenutritionSecretsManager', config.secretsmanagerArn);
}

export default {
  getSecrets,
}