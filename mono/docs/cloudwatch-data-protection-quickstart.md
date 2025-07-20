# CloudWatch Logs Data Protection - Quick Start Guide

This guide will help you quickly implement CloudWatch Logs data protection to mask PHI/PII data in your logs.

## Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js and pnpm installed
- Access to your AWS account with CloudWatch Logs permissions

## Step 1: Deploy the Data Protection Infrastructure

### Option A: Deploy via CDK (Recommended)

```bash
# Navigate to the security-cdk directory
cd security-cdk

# Deploy the security stack (includes data protection)
pnpm run deploy
```

### Option B: Deploy Data Protection Only

```bash
# Navigate to the security-cdk directory
cd security-cdk

# Deploy only the data protection policies
pnpm run deploy:data-protection
```

## Step 2: Verify Deployment

### Check Data Identifiers

```bash
aws logs list-data-identifiers
```

You should see identifiers like:
- `email-addresses`
- `phone-numbers`
- `patient-ids`
- `account-ids`
- `names`
- `addresses`
- `birthdays`
- `medical-conditions`
- `biometrics`
- `insurance-info`
- `organization-ids`

### Check Data Protection Policies

```bash
# Check a specific log group
aws logs get-data-protection-policy --log-group-identifier "/foodsmart/telenutrition-api"
```

## Step 3: Test the Implementation

### Generate Test Logs

Add some test logging to your application:

```javascript
// Test PII data
console.log('User email: test@example.com');
console.log('Phone number: (555) 123-4567');
console.log('SSN: 123-45-6789');

// Test PHI data
console.log('Patient ID: 12345');
console.log('Account ID: 67890');
console.log('First name: John');
console.log('Last name: Doe');
console.log('Birthday: 1990-01-01');
console.log('Medical condition: diabetes');
console.log('Weight: 150.5');
```

### Verify Masking

Check your CloudWatch logs to see the masking in action:

**Before masking:**
```
User email: test@example.com
Phone number: (555) 123-4567
Patient ID: 12345
```

**After masking:**
```
User email: ***REDACTED***
Phone number: ***REDACTED***
Patient ID: ***REDACTED***
```

## Step 4: Monitor and Alert

### Set Up CloudWatch Alarms

1. Go to AWS CloudWatch Console
2. Navigate to Alarms → Create Alarm
3. Select the `LogEventsWithFindings` metric
4. Set appropriate thresholds
5. Configure SNS notifications

### Monitor with CloudWatch Insights

Run these queries to monitor data protection:

```sql
-- Check for data protection violations
fields @timestamp, @message
| filter @message like /\*\*\*REDACTED\*\*\*/
| sort @timestamp desc
| limit 100

-- Monitor specific log group
fields @timestamp, @message
| filter @logGroupName = "/foodsmart/telenutrition-api"
| filter @message like /\*\*\*REDACTED\*\*\*/
| sort @timestamp desc
| limit 50
```

## Step 5: Grant Unmask Permissions (Optional)

If you need to view unmasked data for debugging:

```bash
# Create IAM policy for unmask permissions
aws iam create-policy \
  --policy-name CloudWatchLogsUnmaskPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": "logs:Unmask",
        "Resource": "*"
      }
    ]
  }'

# Attach to user/role as needed
aws iam attach-user-policy \
  --user-name YOUR_USERNAME \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT:policy/CloudWatchLogsUnmaskPolicy
```

## Troubleshooting

### Common Issues

1. **"Log group does not exist"**
   - Ensure log groups are created before applying policies
   - Check log group names for typos

2. **"Permission denied"**
   - Verify IAM permissions for CloudWatch Logs data protection
   - Check that your role has `logs:PutDataProtectionPolicy` permission

3. **"Data identifier already exists"**
   - This is normal if you've already deployed
   - The script will skip existing identifiers

### Debug Commands

```bash
# List all data protection policies
aws logs list-data-protection-policies

# Check specific log group policy
aws logs get-data-protection-policy --log-group-identifier "/foodsmart/telenutrition-api"

# Test regex pattern
aws logs create-data-identifier --name "test-pattern" --regex "\\b\\d{3}-\\d{2}-\\d{4}\\b"
```

## Next Steps

1. **Review the full documentation**: See `docs/cloudwatch-logs-data-protection.md`
2. **Customize patterns**: Add or modify data patterns as needed
3. **Set up monitoring**: Configure alerts and dashboards
4. **Train your team**: Ensure developers understand the masking behavior
5. **Regular audits**: Periodically review and update patterns

## Support

- Check CloudWatch metrics and logs for issues
- Review AWS documentation: https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/mask-sensitive-log-data.html
- Contact your security team for policy questions

## Quick Reference

| Command | Description |
|---------|-------------|
| `pnpm run deploy` | Deploy entire security stack |
| `pnpm run deploy:data-protection` | Deploy data protection only |
| `aws logs list-data-identifiers` | List all data identifiers |
| `aws logs list-data-protection-policies` | List all data protection policies |
| `aws logs get-data-protection-policy --log-group-identifier "/log/group/name"` | Get policy for specific log group | 