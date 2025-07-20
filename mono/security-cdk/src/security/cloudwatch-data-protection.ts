import * as cdk from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { IConfig } from '@mono/common/lib/config';

/**
 * Creates CloudWatch Logs data protection policies to mask PHI/PII data
 * Based on AWS documentation: https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/mask-sensitive-log-data.html
 */
export function createCloudWatchDataProtection(stack: Construct, config: IConfig) {
  
  // Define sensitive data patterns for PHI/PII
  const sensitiveDataPatterns = [
    // Personal Identifiable Information (PII)
    {
      name: 'email-addresses',
      description: 'Mask email addresses',
      regex: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
      maskWith: '***EMAIL***'
    },
    {
      name: 'phone-numbers',
      description: 'Mask phone numbers (US format)',
      regex: '\\b(?:\\+?1[-.]?)?\\(?([0-9]{3})\\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\\b',
      maskWith: '***PHONE***'
    },
    {
      name: 'ssn',
      description: 'Mask Social Security Numbers',
      regex: '\\b\\d{3}-\\d{2}-\\d{4}\\b|\\b\\d{9}\\b',
      maskWith: '***SSN***'
    },
    {
      name: 'credit-cards',
      description: 'Mask credit card numbers',
      regex: '\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b',
      maskWith: '***CC***'
    },
    {
      name: 'zip-codes',
      description: 'Mask ZIP codes',
      regex: '\\b\\d{5}(?:-\\d{4})?\\b',
      maskWith: '***ZIP***'
    },
    
    // Protected Health Information (PHI)
    {
      name: 'patient-ids',
      description: 'Mask patient identifiers',
      regex: '\\b(?:patient[_-]?id|patient_id|member[_-]?id|member_id|policy[_-]?id|policy_id|eligible[_-]?id|eligible_id|identity[_-]?id|identity_id)\\s*[:=]\\s*\\d+\\b',
      maskWith: '***PATIENT_ID***'
    },
    {
      name: 'account-ids',
      description: 'Mask account identifiers',
      regex: '\\b(?:account[_-]?id|account_id|user[_-]?id|user_id)\\s*[:=]\\s*\\d+\\b',
      maskWith: '***ACCOUNT_ID***'
    },
    {
      name: 'names',
      description: 'Mask full names and individual names',
      regex: '\\b(?:first[_-]?name|first_name|last[_-]?name|last_name|preferred[_-]?name|preferred_name|full[_-]?name|full_name)\\s*[:=]\\s*["\']?[A-Za-z]+(?:\\s+[A-Za-z]+)*["\']?\\b',
      maskWith: '***NAME***'
    },
    {
      name: 'addresses',
      description: 'Mask street addresses',
      regex: '\\b(?:address|address1|address2|street[_-]?address|street_address)\\s*[:=]\\s*["\']?[0-9]+\\s+[A-Za-z\\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl|Way|Circle|Cir|Terrace|Ter)[^"\']*["\']?\\b',
      maskWith: '***ADDRESS***'
    },
    {
      name: 'cities',
      description: 'Mask city names',
      regex: '\\b(?:city)\\s*[:=]\\s*["\']?[A-Za-z\\s]+["\']?\\b',
      maskWith: '***CITY***'
    },
    {
      name: 'birthdays',
      description: 'Mask birth dates',
      regex: '\\b(?:birthday|birth[_-]?date|birth_date|dob|date[_-]?of[_-]?birth|date_of_birth)\\s*[:=]\\s*["\']?\\d{4}-\\d{2}-\\d{2}["\']?\\b',
      maskWith: '***BIRTHDAY***'
    },
    {
      name: 'medical-conditions',
      description: 'Mask medical conditions and health information',
      regex: '\\b(?:medical[_-]?conditions|medical_conditions|health[_-]?info|health_info|diagnosis|condition|allergies|medications|medication[_-]?list|medication_list)\\s*[:=]\\s*["\']?[^"\']*["\']?\\b',
      maskWith: '***MEDICAL_INFO***'
    },
    {
      name: 'biometrics',
      description: 'Mask biometric data',
      regex: '\\b(?:weight|height|bmi|blood[_-]?pressure|blood_pressure|systolic|diastolic|cholesterol|hdl|ldl|triglycerides|ha1c|a1c|glucose|blood[_-]?sugar|blood_sugar)\\s*[:=]\\s*["\']?[0-9.]+["\']?\\b',
      maskWith: '***BIOMETRIC***'
    },
    {
      name: 'insurance-info',
      description: 'Mask insurance and policy information',
      regex: '\\b(?:insurance[_-]?id|insurance_id|policy[_-]?number|policy_number|group[_-]?number|group_number|member[_-]?number|member_number)\\s*[:=]\\s*["\']?[A-Za-z0-9-]+["\']?\\b',
      maskWith: '***INSURANCE***'
    },
    {
      name: 'organization-ids',
      description: 'Mask organization identifiers',
      regex: '\\b(?:organization[_-]?id|organization_id|org[_-]?id|org_id|suborganization[_-]?id|suborganization_id|suborg[_-]?id|suborg_id)\\s*[:=]\\s*\\d+\\b',
      maskWith: '***ORG_ID***'
    }
  ];

  // Create data protection policy
  const dataProtectionPolicy = {
    Name: 'PHI-PII-Data-Protection-Policy',
    Description: 'Data protection policy to mask PHI and PII in CloudWatch logs',
    Version: '2021-06-01',
    Statement: [
      {
        Sid: 'Audit',
        DataIdentifier: sensitiveDataPatterns.map(pattern => pattern.name),
        Operation: {
          Audit: {}
        }
      },
      {
        Sid: 'Deidentify',
        DataIdentifier: sensitiveDataPatterns.map(pattern => pattern.name),
        Operation: {
          Deidentify: {
            MaskConfig: {
              MaskType: 'REPLACE',
              MaskValue: '***REDACTED***'
            }
          }
        }
      }
    ]
  };

  // Create data identifiers for each sensitive pattern
  const dataIdentifiers = sensitiveDataPatterns.map(pattern => {
    return new logs.CfnDataIdentifier(stack, `DataIdentifier-${pattern.name}`, {
      name: pattern.name,
      description: pattern.description,
      regex: pattern.regex,
      maximumMatchDistance: 1
    });
  });

  // Apply data protection policy to all log groups that contain sensitive data
  const sensitiveLogGroups = [
    '/foodsmart/telenutrition-api',
    '/foodsmart/telenutrition-web',
    '/foodsmart/marketing-web',
    '/foodsmart/telenutrition-flows/tasks',
    '/foodsmart/marketing-flows/tasks',
    '/foodsmart/analytics-events/firehose-to-s3',
    '/foodsmart/common/warehouse-sync',
    '/foodsmart/common/warehouse-events',
    '/foodsmart/marketing/qualtrics-events',
    '/aws/vendedlogs/states/foodsmart/telenutrition-flows/state-machine/*',
    '/aws/vendedlogs/states/foodsmart/marketing-flows/state-machine/*',
    '/aws/vendedlogs/states/foodsmart/analytics-flows/state-machine/*',
    '/aws/vendedlogs/states/foodsmart/common-flows/state-machine/*',
    '/aws/vendedlogs/states/foodsmart/ops-flows/state-machine/*',
    '/foodsmart/workflow-tasks',
    '/foodsmart/ops-flows/tasks'
  ];

  // Create data protection policy for each log group
  sensitiveLogGroups.forEach((logGroupName, index) => {
    const sanitizedName = logGroupName.replace(/[^a-zA-Z0-9-_]/g, '-');
    
    // Reference existing log group
    const existingLogGroup = logs.LogGroup.fromLogGroupName(
      stack, 
      `ProtectedLogGroup-${sanitizedName}`, 
      logGroupName
    );

    // Create data protection policy
    new logs.CfnLogGroup(stack, `DataProtection-${sanitizedName}`, {
      logGroupName: logGroupName,
      dataProtectionPolicy: JSON.stringify(dataProtectionPolicy)
    });
  });

  // Create IAM role for data protection operations
  const dataProtectionRole = new iam.Role(stack, 'CloudWatchDataProtectionRole', {
    assumedBy: new iam.ServicePrincipal('logs.amazonaws.com'),
    description: 'Role for CloudWatch Logs data protection operations',
    inlinePolicies: {
      DataProtectionPolicy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'logs:PutDataProtectionPolicy',
              'logs:GetDataProtectionPolicy',
              'logs:DeleteDataProtectionPolicy',
              'logs:ListDataProtectionPolicies',
              'logs:CreateDataIdentifier',
              'logs:GetDataIdentifier',
              'logs:DeleteDataIdentifier',
              'logs:ListDataIdentifiers'
            ],
            resources: ['*']
          })
        ]
      })
    }
  });

  // Create CloudWatch Insights queries for monitoring data protection
  const insightsQueries = {
    'audit-sensitive-data': `
      fields @timestamp, @message
      | filter @message like /email|phone|ssn|credit|patient|account|name|address|birthday|medical|biometric|insurance/
      | sort @timestamp desc
      | limit 100
    `,
    'data-protection-violations': `
      fields @timestamp, @message
      | filter @message like /\\*\\*\\*REDACTED\\*\\*\\*/
      | sort @timestamp desc
      | limit 100
    `
  };

  // Output the data protection configuration
  new cdk.CfnOutput(stack, 'DataProtectionPolicyArn', {
    value: dataProtectionRole.roleArn,
    description: 'ARN of the CloudWatch Data Protection role',
    exportName: `${stack.stackName}-DataProtectionRoleArn`
  });

  new cdk.CfnOutput(stack, 'ProtectedLogGroups', {
    value: sensitiveLogGroups.join(','),
    description: 'List of log groups with data protection enabled',
    exportName: `${stack.stackName}-ProtectedLogGroups`
  });

  return {
    dataProtectionRole,
    dataIdentifiers,
    protectedLogGroups: sensitiveLogGroups,
    insightsQueries
  };
} 