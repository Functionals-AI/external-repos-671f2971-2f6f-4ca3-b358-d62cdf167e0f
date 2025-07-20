# CloudWatch Logs Data Protection for PHI/PII Masking

This document describes the implementation of CloudWatch Logs data protection policies to automatically mask sensitive PHI (Protected Health Information) and PII (Personally Identifiable Information) data in your logs.

## Overview

Based on the [AWS CloudWatch Logs data protection documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/mask-sensitive-log-data.html), this implementation provides:

- **Automatic masking** of sensitive data at ingestion time
- **Audit capabilities** to track when sensitive data is detected
- **Compliance support** for HIPAA and other privacy regulations
- **Monitoring and alerting** for data protection violations

## What Gets Masked

### Personal Identifiable Information (PII)
- **Email addresses**: `user@example.com` → `***REDACTED***`
- **Phone numbers**: `(555) 123-4567` → `***REDACTED***`
- **Social Security Numbers**: `123-45-6789` → `***REDACTED***`
- **Credit card numbers**: `1234-5678-9012-3456` → `***REDACTED***`
- **ZIP codes**: `12345` or `12345-6789` → `***REDACTED***`

### Protected Health Information (PHI)
- **Patient identifiers**: `patient_id: 12345` → `***REDACTED***`
- **Account identifiers**: `account_id: 67890` → `***REDACTED***`
- **Names**: `first_name: "John"` → `***REDACTED***`
- **Addresses**: `address: "123 Main St"` → `***REDACTED***`
- **Birth dates**: `birthday: "1990-01-01"` → `***REDACTED***`
- **Medical conditions**: `medical_conditions: "diabetes"` → `***REDACTED***`
- **Biometric data**: `weight: 150.5` → `***REDACTED***`
- **Insurance information**: `policy_number: "ABC123"` → `***REDACTED***`

## Implementation Details

### Files Created/Modified

1. **`security-cdk/src/security/cloudwatch-data-protection.ts`**
   - Main CDK construct for data protection policies
   - Defines sensitive data patterns and regex rules
   - Creates data identifiers and applies policies to log groups

2. **`security-cdk/src/security/stack.ts`**
   - Updated to include data protection functionality
   - Integrates with existing CloudWatch infrastructure

3. **`security-cdk/src/scripts/deploy-data-protection.ts`**
   - Deployment script for manual policy application
   - Monitoring and management utilities

### Log Groups Protected

The following log groups have data protection policies applied:

```
/foodsmart/telenutrition-api
/foodsmart/telenutrition-web
/foodsmart/marketing-web
/foodsmart/telenutrition-flows/tasks
/foodsmart/marketing-flows/tasks
/foodsmart/analytics-events/firehose-to-s3
/foodsmart/common/warehouse-sync
/foodsmart/common/warehouse-events
/foodsmart/marketing/qualtrics-events
/foodsmart/workflow-tasks
/foodsmart/ops-flows/tasks
```

## Deployment

### Automatic Deployment (CDK)

The data protection policies are automatically deployed when you deploy the security stack:

```bash
cd security-cdk
pnpm run deploy
```

### Manual Deployment

If you need to deploy policies manually or update existing ones:

```bash
cd security-cdk/src/scripts
npx ts-node deploy-data-protection.ts
```

## Monitoring and Alerting

### CloudWatch Metrics

The `LogEventsWithFindings` metric is automatically emitted when sensitive data is detected:

- **Namespace**: `AWS/Logs`
- **Metric Name**: `LogEventsWithFindings`
- **Dimensions**: Log Group Name

### CloudWatch Insights Queries

Use these queries to monitor data protection effectiveness:

#### Audit Sensitive Data Detection
```sql
fields @timestamp, @message
| filter @message like /email|phone|ssn|credit|patient|account|name|address|birthday|medical|biometric|insurance/
| sort @timestamp desc
| limit 100
```

#### Data Protection Violations
```sql
fields @timestamp, @message
| filter @message like /\*\*\*REDACTED\*\*\*/
| sort @timestamp desc
| limit 100
```

#### Monitor Specific Log Groups
```sql
fields @timestamp, @message
| filter @logGroupName = "/foodsmart/telenutrition-api"
| filter @message like /\*\*\*REDACTED\*\*\*/
| sort @timestamp desc
| limit 50
```

### Setting Up Alerts

Create CloudWatch alarms for the `LogEventsWithFindings` metric:

1. Go to CloudWatch → Alarms
2. Create alarm for `LogEventsWithFindings` metric
3. Set threshold based on your expected volume
4. Configure SNS notifications for violations

## Accessing Unmasked Data

Users with the `logs:Unmask` IAM permission can view unmasked data when needed:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "logs:Unmask",
      "Resource": "*"
    }
  ]
}
```

## Testing the Implementation

### 1. Generate Test Logs

Create test log entries with sensitive data:

```javascript
console.log('User email: user@example.com');
console.log('Phone: (555) 123-4567');
console.log('Patient ID: 12345');
console.log('Medical condition: diabetes');
```

### 2. Verify Masking

Check the logs in CloudWatch to ensure sensitive data is masked:

**Before masking:**
```
User email: user@example.com
Phone: (555) 123-4567
Patient ID: 12345
```

**After masking:**
```
User email: ***REDACTED***
Phone: ***REDACTED***
Patient ID: ***REDACTED***
```

### 3. Monitor Metrics

Check the CloudWatch metrics to see detection activity:

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Logs \
  --metric-name LogEventsWithFindings \
  --dimensions Name=LogGroupName,Value=/foodsmart/telenutrition-api \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

## Customization

### Adding New Data Patterns

To add new sensitive data patterns, modify the `sensitiveDataPatterns` array in `cloudwatch-data-protection.ts`:

```typescript
{
  name: 'custom-pattern',
  description: 'Mask custom sensitive data',
  regex: '\\b(your-regex-pattern)\\b',
  maskWith: '***CUSTOM***'
}
```

### Adding New Log Groups

To protect additional log groups, add them to the `sensitiveLogGroups` array:

```typescript
const sensitiveLogGroups = [
  // ... existing log groups
  '/foodsmart/new-service/logs'
];
```

### Custom Masking Values

You can customize the masking value by modifying the `MaskValue` in the data protection policy:

```typescript
MaskConfig: {
  MaskType: 'REPLACE',
  MaskValue: '[REDACTED]' // Custom masking value
}
```

## Troubleshooting

### Common Issues

1. **Policies not applying**: Ensure log groups exist before applying policies
2. **False positives**: Adjust regex patterns to be more specific
3. **Performance impact**: Monitor log processing latency
4. **Permission errors**: Verify IAM permissions for data protection operations

### Debug Commands

```bash
# List data identifiers
aws logs list-data-identifiers

# Get data protection policy for a log group
aws logs get-data-protection-policy --log-group-identifier "/foodsmart/telenutrition-api"

# Test regex patterns
aws logs create-data-identifier --name "test-pattern" --regex "\\b\\d{3}-\\d{2}-\\d{4}\\b"
```

## Compliance Considerations

### HIPAA Compliance

This implementation helps with HIPAA compliance by:

- Automatically masking PHI in logs
- Providing audit trails for data access
- Supporting data minimization principles
- Enabling secure log analysis

### Other Regulations

- **GDPR**: Protects personal data in logs
- **CCPA**: Masks personal information
- **SOX**: Provides audit capabilities

## Cost Considerations

- **Data identifiers**: Free to create and maintain
- **Data protection policies**: No additional cost
- **LogEventsWithFindings metric**: Free vended metric
- **Storage**: No additional storage costs for masking

## Best Practices

1. **Regular monitoring**: Check metrics and alerts regularly
2. **Pattern updates**: Update patterns as new data types are identified
3. **Testing**: Test new patterns in development before production
4. **Documentation**: Keep patterns and policies documented
5. **Access control**: Limit `logs:Unmask` permissions to necessary users only

## Support

For issues or questions:

1. Check CloudWatch metrics and logs
2. Review AWS CloudWatch Logs documentation
3. Contact your security team for policy questions
4. Use the deployment script for troubleshooting

## References

- [AWS CloudWatch Logs Data Protection Documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/mask-sensitive-log-data.html)
- [AWS Managed Data Identifiers](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL-managed-data-identifiers.html)
- [CloudWatch Logs API Reference](https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/) 