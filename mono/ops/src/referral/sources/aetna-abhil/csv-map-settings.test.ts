import { ReferralService, ReferralStatus, Sources } from "@mono/common/lib/referral/store"
import { csvRecordTransformFactory, transformCSVRow } from "../csv-mapper"
import { CSV_MAPPING_CONFIG } from "./csv-map-settings"
import { AccountIds } from "@mono/common/lib/account/service"
import { IContext } from "@mono/common/lib/context"

describe("transformCSVRow", () => {
  const basicContext = {
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        fatal: jest.fn(),
        trace: jest.fn(),
        exception: jest.fn(),
        tag: jest.fn()
    }
  } as unknown as IContext

  test('happy path', () => {
    const inputRow = {
      member_id: '123456789',
      first_name: 'John',
      last_name: 'Doe',
      order_number: 'fake-order-number',
      member_date_of_birth: '19800131',
      member_phone_number: '1(555)-867-5309',
      member_email: 'test@example.com',
      street_line1: '123 Main St',
      street_line2: 'Apt 4',
      city: 'Anytown',
      state: 'CA',
      'zip/postal_code': '12345',
      language: 'English',
      gender: 'm',
    }

    const expected = {
      referralSource: Sources.AetnaABHIL,
      referralStatus: ReferralStatus.REQUESTED,
      accountId: AccountIds.AetnaABHIL.toString(),
      referralService: ReferralService.HEALTH_ASSESSMENT,

      referralExternalId: inputRow.order_number,
      referralExternalPatientId: inputRow.member_id,
      referralPolicyId: inputRow.member_id,
      referralFirstName: 'John',
      referralLastName: 'Doe',
      referralDob: new Date(1980, 0, 31),
      referralPhone: '+15558675309',
      referralEmail: inputRow.member_email,
      referralAddress1: '123 Main St',
      referralAddress2: 'Apt 4',
      referralCity: 'Anytown',
      referralState: 'CA',
      referralZipcode: '12345',
      referralLang: 'en',
      referralGender: 'M',
      sourceData: inputRow,

      referralDate: undefined,
      errors: []
    }

    const transformer = csvRecordTransformFactory({
      mappingConfig: CSV_MAPPING_CONFIG,
      handleDupes: true,
    })

    const result = transformer(basicContext, inputRow)

    if(result.isErr()) {
      fail(result.error)
    } else {
      const resultValue = result.value

      if (!resultValue) {
        fail('resultValue is null')
      }

      // Compare to make sure it is within the last 20 seconds
      const referralDateLimit = new Date(Date.now() - 20000)
      const referralDate = resultValue['referralDate'] as Date
      if (referralDateLimit >= referralDate) {
        fail('referralDate is not within the last 20 seconds')
      }

      delete resultValue['referralDate']

      expect(resultValue).toEqual(expected)
    }
  })

  test('missing required fields', () => {
    const inputRow = {}

    const expected = {
      referralSource: Sources.AetnaABHIL,
      referralStatus: ReferralStatus.DECLINED,
      accountId: AccountIds.AetnaABHIL.toString(),
      referralService: ReferralService.HEALTH_ASSESSMENT,

      errors: [
        {
          errorType: "missing",
          field: "referralExternalId",
          inputData: undefined,
          inputField: "order_number",
          message: "Missing required field 'order_number'",
        },
        {
          field: 'referralExternalPatientId',
          inputField: 'member_id',
          inputData: undefined,
          errorType: 'missing',
          message: "Missing required field 'member_id'"
        },
        {
          field: 'referralPolicyId',
          inputField: 'member_id',
          inputData: undefined,
          errorType: 'missing',
          message: "Missing required field 'member_id'"
        },
        {
          field: 'referralFirstName',
          inputField: 'first_name',
          inputData: undefined,
          errorType: 'missing',
          message: "Missing required field 'first_name'"
        },
        {
          field: 'referralLastName',
          inputField: 'last_name',
          inputData: undefined,
          errorType: 'missing',
          message: "Missing required field 'last_name'"
        },
        {
          field: 'referralDob',
          inputField: 'member_date_of_birth',
          inputData: undefined,
          errorType: 'missing',
          message: "Missing required field 'member_date_of_birth'"
        },
        {
          field: 'referralAddress1',
          inputField: 'street_line1',
          inputData: undefined,
          errorType: 'missing',
          message: "Missing required field 'street_line1'"
        },
        {
          field: 'referralCity',
          inputField: 'city',
          inputData: undefined,
          errorType: 'missing',
          message: "Missing required field 'city'"
        },
        {
          field: 'referralState',
          inputField: 'state',
          inputData: undefined,
          errorType: 'missing',
          message: "Missing required field 'state'"
        },
        {
          field: 'referralZipcode',
          inputField: 'zip/postal_code',
          inputData: undefined,
          errorType: 'missing',
          message: "Missing required field 'zip/postal_code'"
        },
      ],

      sourceData: {},
    }

    const transformer = csvRecordTransformFactory({
      mappingConfig: CSV_MAPPING_CONFIG,
      handleDupes: true,
    })

    const result = transformer(basicContext, inputRow)

    if(result.isErr()) {
      fail('Excpeted ok, but got err')
    }

    const resultValue = result.value
    if (resultValue) {
      delete resultValue['referralDate']
    }

    expect(resultValue).toStrictEqual(expected)
  })
})
