import { AccountIds } from "@mono/common/lib/account/service"
import { ReferralService, ReferralStatus, Sources } from "@mono/common/lib/referral/store"
import { CSVMappingConfig, CSVMappingError, ErrorType } from "../csv-mapper"

export const CSV_MAPPING_CONFIG: CSVMappingConfig = {
  constants: [
    {
      outputColumn: 'referralSource',
      value: Sources.SantaClara,
    },
    {
      outputColumn: 'referralStatus',
      value: ReferralStatus.REQUESTED,
    },
    {
      outputColumn: 'referralService',
      value: ReferralService.HEALTH_ASSESSMENT,
    },
    {
      outputColumn: 'accountId',
      value: AccountIds.SantaClara.toString(),
    }
  ],
  dynamicColumns: [
    {
      inputColumn: 'HealthPlanMemberID',
      outputColumn: 'referralExternalPatientId',
      operation: 'copy',
    },
    {
      inputColumn: 'HealthPlanMemberID',
      outputColumn: 'referralPolicyId',
      operation: 'copy',
    },
    {
      inputColumn: 'MemberPhoneNumber',
      outputColumn: 'referralPhone',
      operation: 'phone',
    },
    {
      inputColumn: 'MemberMobilePhoneNumber',
      outputColumn: 'referralPhoneMobile',
      operation: 'phone',
      validateMobile: true,
      optional: true,
    },
    {
      inputColumn: 'MemberGenderCode',
      outputColumn: 'referralGender',
      operation: 'gender',
    },
    {
      inputColumn: 'MemberPreferredLanguageSpoken',
      outputColumn: 'referralLang',
      operation: 'language',
    },
    {
      inputColumn: 'MemberEmailAddress',
      outputColumn: 'referralEmail',
      operation: 'email',
      optional: true,
    },
    {
      inputColumn: 'MemberDateOfBirth',
      outputColumn: 'referralDob',
      operation: 'date',
      dateFormat: 'MM/dd/yyyy',
    },
    {
      inputColumn: 'MemberFirstName',
      outputColumn: 'referralFirstName',
      operation: 'name',
    },
    {
      inputColumn: 'MemberLastName',
      outputColumn: 'referralLastName',
      operation: 'name',
    },
    {
      inputColumn: 'ReferralReceiptDate',
      outputColumn: 'referralDate',
      operation: 'date',
      dateFormat: 'MM/dd/yyyy',
    },
    {
      inputColumn: 'AuthorizationID',
      outputColumn: 'referralExternalId',
      operation: 'copy',
    },
  ],
  includeSourceData: true,
  
  outputTransform: function(inputRow: Object, outputRow: Object): CSVMappingError[]
  {
    const errors: CSVMappingError[] = []

    // If mailing address is present, use that. Otherwise use physical address.
    if (
      inputRow['MemberPhysicalAddress1'] &&
      inputRow['MemberPhysicalCity'] &&
      inputRow['MemberPhysicalZip']
    ) {
      outputRow['referralAddress1'] = inputRow['MemberMailingAddress1']
      outputRow['referralAddress2'] = inputRow['MemberMailingAddress2']
      outputRow['referralCity'] = inputRow['MemberMailingCity']
      outputRow['referralZipcode'] = inputRow['MemberMailingZip']
    } else {
      outputRow['referralAddress1'] = inputRow['MemberPhysicalAddress1']
      outputRow['referralAddress2'] = inputRow['MemberPhysicalAddress2']
      outputRow['referralCity'] = inputRow['MemberPhysicalCity']
      outputRow['referralZipcode'] = inputRow['MemberPhysicalZip']
    }

    outputRow['referralState'] = 'CA'

    if (!outputRow['referralAddress1']) {
      errors.push({
        field: 'referralAddress1',
        inputField: 'MemberMailingAddress1',
        errorType: ErrorType.MISSING,
        message: 'Missing required address data.',
      })
    }

    if (!outputRow['referralCity']) {
      errors.push({
        field: 'referralCity',
        inputField: 'MemberMailingCity',
        errorType: ErrorType.MISSING,
        message: 'Missing required address data.',
      })
    }

    if (!outputRow['referralZipcode']) {
      errors.push({
        field: 'referralZipcode',
        inputField: 'MemberMailingZip',
        errorType: ErrorType.MISSING,
        message: 'Missing required address data.',
      })
    }

    return errors
  }
}

export default {
  CSV_MAPPING_CONFIG,
}
