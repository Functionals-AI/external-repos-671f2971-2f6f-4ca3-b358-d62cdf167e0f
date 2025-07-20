#!/usr/bin/env node

import { CloudWatchLogsClient, PutDataProtectionPolicyCommand, CreateDataIdentifierCommand, ListDataIdentifiersCommand } from '@aws-sdk/client-cloudwatch-logs';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

/**
 * Script to deploy and manage CloudWatch Logs data protection policies
 * This script helps with the initial setup and ongoing management of PHI/PII masking
 */

interface DataIdentifier {
  name: string;
  description: string;
  regex: string;
  maximumMatchDistance: number;
}

const sensitiveDataPatterns: DataIdentifier[] = [
  // Personal Identifiable Information (PII)
  {
    name: 'email-addresses',
    description: 'Mask email addresses',
    regex: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
    maximumMatchDistance: 1
  },
  {
    name: 'phone-numbers',
    description: 'Mask phone numbers (US format)',
    regex: '\\b(?:\\+?1[-.]?)?\\(?([0-9]{3})\\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\\b',
    maximumMatchDistance: 1
  },
  {
    name: 'ssn',
    description: 'Mask Social Security Numbers',
    regex: '\\b\\d{3}-\\d{2}-\\d{4}\\b|\\b\\d{9}\\b',
    maximumMatchDistance: 1
  },
  {
    name: 'credit-cards',
    description: 'Mask credit card numbers',
    regex: '\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b',
    maximumMatchDistance: 1
  },
  {
    name: 'zip-codes',
    description: 'Mask ZIP codes',
    regex: '\\b\\d{5}(?:-\\d{4})?\\b',
    maximumMatchDistance: 1
  },
  
  // Protected Health Information (PHI)
  {
    name: 'patient-ids',
    description: 'Mask patient identifiers',
    regex: '\\b(?:patient[_-]?id|patient_id|member[_-]?id|member_id|policy[_-]?id|policy_id|eligible[_-]?id|eligible_id|identity[_-]?id|identity_id)\\s*[:=]\\s*\\d+\\b',
    maximumMatchDistance: 1
  },
  {
    name: 'account-ids',
    description: 'Mask account identifiers',
    regex: '\\b(?:account[_-]?id|account_id|user[_-]?id|user_id)\\s*[:=]\\s*\\d+\\b',
    maximumMatchDistance: 1
  },
  {
    name: 'names',
    description: 'Mask full names and individual names',
    regex: '\\b(?:first[_-]?name|first_name|last[_-]?name|last_name|preferred[_-]?name|preferred_name|full[_-]?name|full_name)\\s*[:=]\\s*["\']?[A-Za-z]+(?:\\s+[A-Za-z]+)*["\']?\\b',
    maximumMatchDistance: 1
  },
  {
    name: 'addresses',
    description: 'Mask street addresses',
    regex: '\\b(?:address|address1|address2|street[_-]?address|street_address)\\s*[:=]\\s*["\']?[0-9]+\\s+[A-Za-z\\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl|Way|Circle|Cir|Terrace|Ter)[^"\']*["\']?\\b',
    maximumMatchDistance: 1
  },
  {
    name: 'cities',
    description: 'Mask city names',
    regex: '\\b(?:city)\\s*[:=]\\s*["\']?[A-Za-z\\s]+["\']?\\b',
    maximumMatchDistance: 1
  },
  {
    name: 'birthdays',
    description: 'Mask birth dates',
    regex: '\\b(?:birthday|birth[_-]?date|birth_date|dob|date[_-]?of[_-]?birth|date_of_birth)\\s*[:=]\\s*["\']?\\d{4}-\\d{2}-\\d{2}["\']?\\b',
    maximumMatchDistance: 1
  },
  {
    name: 'medical-conditions',
    description: 'Mask medical conditions and health information',
    regex: '\\b(?:medical[_-]?conditions|medical_conditions|health[_-]?info|health_info|diagnosis|condition|allergies|medications|medication[_-]?list|medication_list)\\s*[:=]\\s*["\']?[^"\']*["\']?\\b',
    maximumMatchDistance: 1
  },
  {
    name: 'biometrics',
    description: 'Mask biometric data',
    regex: '\\b(?:weight|height|bmi|blood[_-]?pressure|blood_pressure|systolic|diastolic|cholesterol|hdl|ldl|triglycerides|ha1c|a1c|glucose|blood[_-]?sugar|blood_sugar)\\s*[:=]\\s*["\']?[0-9.]+["\']?\\b',
    maximumMatchDistance: 1
  },
  {
    name: 'insurance-info',
    description: 'Mask insurance and policy information',
    regex: '\\b(?:insurance[_-]?id|insurance_id|policy[_-]?number|policy_number|group[_-]?number|group_number|member[_-]?number|member_number)\\s*[:=]\\s*["\']?[A-Za-z0-9-]+["\']?\\b',
    maximumMatchDistance: 1
  },
  {
    name: 'organization-ids',
    description: 'Mask organization identifiers',
    regex: '\\b(?:organization[_-]?id|organization_id|org[_-]?id|org_id|suborganization[_-]?id|suborganization_id|suborg[_-]?id|suborg_id)\\s*[:=]\\s*\\d+\\b',
    maximumMatchDistance: 1
  }
];

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
  '/foodsmart/workflow-tasks',
  '/foodsmart/ops-flows/tasks'
];

async function createDataIdentifiers(client: CloudWatchLogsClient): Promise<void> {
  console.log('Creating data identifiers...');
  
  for (const pattern of sensitiveDataPatterns) {
    try {
      const command = new CreateDataIdentifierCommand({
        name: pattern.name,
        description: pattern.description,
        regex: pattern.regex,
        maximumMatchDistance: pattern.maximumMatchDistance
      });
      
      await client.send(command);
      console.log(`✓ Created data identifier: ${pattern.name}`);
    } catch (error: any) {
      if (error.name === 'DataIdentifierAlreadyExistsException') {
        console.log(`- Data identifier already exists: ${pattern.name}`);
      } else {
        console.error(`✗ Failed to create data identifier ${pattern.name}:`, error.message);
      }
    }
  }
}

async function listDataIdentifiers(client: CloudWatchLogsClient): Promise<string[]> {
  try {
    const command = new ListDataIdentifiersCommand({});
    const response = await client.send(command);
    return response.dataIdentifiers?.map(id => id.name) || [];
  } catch (error: any) {
    console.error('Failed to list data identifiers:', error.message);
    return [];
  }
}

async function applyDataProtectionPolicy(client: CloudWatchLogsClient, logGroupName: string): Promise<void> {
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

  try {
    const command = new PutDataProtectionPolicyCommand({
      logGroupIdentifier: logGroupName,
      policyDocument: JSON.stringify(dataProtectionPolicy)
    });
    
    await client.send(command);
    console.log(`✓ Applied data protection policy to: ${logGroupName}`);
  } catch (error: any) {
    console.error(`✗ Failed to apply data protection policy to ${logGroupName}:`, error.message);
  }
}

async function main() {
  const region = process.env.AWS_REGION || 'us-west-2';
  const client = new CloudWatchLogsClient({ region });
  const stsClient = new STSClient({ region });

  try {
    // Get current AWS account info
    const identity = await stsClient.send(new GetCallerIdentityCommand({}));
    console.log(`Deploying CloudWatch Logs data protection for account: ${identity.Account}`);
    console.log(`Region: ${region}\n`);

    // Create data identifiers
    await createDataIdentifiers(client);
    
    // List existing data identifiers
    const existingIdentifiers = await listDataIdentifiers(client);
    console.log(`\nExisting data identifiers: ${existingIdentifiers.length}`);
    
    // Apply data protection policies to log groups
    console.log('\nApplying data protection policies to log groups...');
    for (const logGroupName of sensitiveLogGroups) {
      await applyDataProtectionPolicy(client, logGroupName);
    }

    console.log('\n✅ CloudWatch Logs data protection deployment completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Monitor the LogEventsWithFindings metric in CloudWatch');
    console.log('2. Review CloudWatch Insights queries for data protection violations');
    console.log('3. Test the masking by checking log outputs');
    console.log('4. Ensure users with logs:Unmask permission can view unmasked data when needed');

  } catch (error: any) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { main, createDataIdentifiers, applyDataProtectionPolicy }; 