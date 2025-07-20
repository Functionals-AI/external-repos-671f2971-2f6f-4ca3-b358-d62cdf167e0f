import { AccountIds } from "@mono/common/lib/account/service"
import { ReferralService, ReferralStatus, Sources } from "@mono/common/lib/referral/store"
import { CSVMappingConfig, CSVMappingError, ErrorType } from "../csv-mapper"

const MEMBER_ID_LENGTH = 9

export const CSV_MAPPING_CONFIG: CSVMappingConfig = {
  constants: [
    {
      outputColumn: 'referralSource',
      value: Sources.AetnaABHIL,
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
      value: AccountIds.AetnaABHIL.toString(),
    }
  ],

dynamicColumns: [
    {
      inputColumn: 'order_number',
      outputColumn: 'referralExternalId',
      operation: 'copy',
    },
    {
      inputColumn: 'member_id',
      outputColumn: 'referralExternalPatientId',
      operation: 'copy',
    },
    {
      inputColumn: 'member_id',
      outputColumn: 'referralPolicyId',
      operation: 'copy',
    },
    {
      inputColumn: 'first_name',
      outputColumn: 'referralFirstName',
      operation: 'name',
    },
    {
      inputColumn: 'last_name',
      outputColumn: 'referralLastName',
      operation: 'name',
    },
    {
      inputColumn: 'member_date_of_birth',
      outputColumn: 'referralDob',
      operation: 'date',
      dateFormat: 'yyyyMMdd',
    },

    {
      inputColumn: 'member_phone_number',
      outputColumn: 'referralPhone',
      operation: 'phone',
      optional: true,
    },
    {
      inputColumn: 'member_mobile_phone_number',
      outputColumn: 'referralPhoneMobile',
      operation: 'phone',
      validateMobile: true,
      optional: true,
    },
    {
      inputColumn: 'member_email',
      outputColumn: 'referralEmail',
      operation: 'email',
      optional: true,
    },

    {
      inputColumn: 'street_line1',
      outputColumn: 'referralAddress1',
      operation: 'copy',
    },
    {
      inputColumn: 'street_line2',
      outputColumn: 'referralAddress2',
      operation: 'copy',
      optional: true,
    },
    {
      inputColumn: 'city',
      outputColumn: 'referralCity',
      operation: 'copy',
    },
    {
      inputColumn: 'state',
      outputColumn: 'referralState',
      operation: 'copy',
    },
    {
      inputColumn: 'zip/postal_code',
      outputColumn: 'referralZipcode',
      operation: 'copy',
    },

    {
      inputColumn: 'language',
      outputColumn: 'referralLang',
      operation: 'language',
      optional: true,
    },
    {
      inputColumn: 'gender',
      outputColumn: 'referralGender',
      operation: 'gender',
      optional: true,
    }
  ],

  includeSourceData: true,

  outputTransform: function(_inputRow: Object, outputRow: Object): CSVMappingError[] {
    outputRow['referralDate'] = new Date()

    return []
  },

  inputTransform: function(record: Object): CSVMappingError[] {
    if (record['member_id']) {
      // ABHIL sometimes sends files with member_id not padded with zeros
      // but expects to receive the ID with zeros to 9 digits
      // when we send data back
      record['member_id'] = record['member_id'].padStart(MEMBER_ID_LENGTH, '0')
    }

    return []
  }
}

export default {
  CSV_MAPPING_CONFIG,
}
