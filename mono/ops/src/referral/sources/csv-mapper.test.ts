import { ok } from "neverthrow"

import { CSVMappingConfig, csvRecordTransformFactory, transformCSVRow } from "./csv-mapper";
import { IContext } from "@mono/common/lib/context";

describe("transformCSVRow", () => {
  const basicMappingConfig: CSVMappingConfig = {
    constants: [
      { outputColumn: 'ValueIs-csv', value: 'csv' },
      { outputColumn: 'statusIs-new', value: 'new' },
      { outputColumn: 'referralStatus', value: 'requested' }
    ],
    dynamicColumns: [
      {
        inputColumn: 'inFirstName',
        outputColumn: 'firstName',
        operation: 'name',
      },
      {
        inputColumn: 'inPhone',
        outputColumn: 'phone',
        operation: 'phone',
      },
      {
        inputColumn: 'inEmail',
        outputColumn: 'email',
        operation: 'email',
      },
      {
        inputColumn: 'inLanguage',
        outputColumn: 'language',
        operation: 'language',
      },
      {
        inputColumn: 'inGender',
        outputColumn: 'gender',
        operation: 'gender',
      },
      {
        inputColumn: 'inDate',
        outputColumn: 'date',
        operation: 'date',
        dateFormat: 'MM/dd/yyyy',
      },
      {
        inputColumn: 'inCopy',
        outputColumn: 'copy',
        operation: 'copy',
      }
    ],
    includeSourceData: false,
  }

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

  test('transformCSVRow happy case', () => {
    const inputRow = {
      inFirstName: ' john ',
      inPhone: ' 1(555)-867-5309 ',
      inEmail: ' test@example.com ',
      inLanguage: ' English ',
      inGender: ' Male ',
      inDate: ' 01/20/2001 ',
      inCopy: ' copy this ',
    }

    const expected = {
      'ValueIs-csv': 'csv',
      'statusIs-new': 'new',
      referralStatus: 'requested',

      firstName: 'John',
      phone: '+15558675309',
      email: 'test@example.com',
      language: 'en',
      gender: 'M',
      date: new Date(2001, 0, 20, 0, 0, 0 ,0),
      copy: 'copy this',

      errors: []
    }

    const result = transformCSVRow(inputRow, basicMappingConfig)
    expect(result).toStrictEqual(ok(expected))
  })

  test('transformCSVRow missing required fields', () => {
    const inputRow = {}
    const expected = {
      'ValueIs-csv': 'csv',
      'statusIs-new': 'new',
      referralStatus: 'requested',

      errors: [
        {
          errorType: 'missing',
          field: 'firstName',
          inputData: undefined,
          inputField: 'inFirstName',
          message: "Missing required field 'inFirstName'",
        }, {
          errorType: 'missing',
          field: 'phone',
          inputData: undefined,
          inputField: 'inPhone',
          message: "Missing required field 'inPhone'",
        }, {
          errorType: 'missing',
          field: 'email',
          inputData: undefined,
          inputField: 'inEmail',
          message: "Missing required field 'inEmail'",
        }, {
          errorType: 'missing',
          field: 'language',
          inputData: undefined,
          inputField: 'inLanguage',
          message: "Missing required field 'inLanguage'",
        }, {
          errorType: 'missing',
          field: 'gender',
          inputData: undefined,
          inputField: 'inGender',
          message: "Missing required field 'inGender'",
        }, {
          errorType: 'missing',
          field: 'date',
          inputData: undefined,
          inputField: 'inDate',
          message: "Missing required field 'inDate'",
        }, {
          errorType: 'missing',
          field: 'copy',
          inputData: undefined,
          inputField: 'inCopy',
          message: "Missing required field 'inCopy'",
        },
      ]
    }

    const config = JSON.parse(JSON.stringify(basicMappingConfig)) as CSVMappingConfig
    config.dynamicColumns.forEach((column) => { column.optional = false })

    const result = transformCSVRow(inputRow, config)
    expect(result).toStrictEqual(ok(expected))
  })

  test('invalid phone number', () => {
    const input = {
      inPhone: 'not a phone number',

      inFirstName: ' john ',
      inEmail: ' test@example.com ',
      inLanguage: ' English ',
      inGender: ' Male ',
      inDate: ' 01/20/2001 ',
      inCopy: ' copy this ',
    }
    const expected = {
      'ValueIs-csv': 'csv',
      'statusIs-new': 'new',
      referralStatus: 'requested',

      firstName: 'John',
      email: 'test@example.com',
      language: 'en',
      gender: 'M',
      date: new Date(2001, 0, 20, 0, 0, 0 ,0),
      copy: 'copy this',

      errors: [{
        errorType: 'invalid-phone-number',
        field: 'phone',
        inputData: 'not a phone number',
        inputField: 'inPhone',
        message: 'Invalid phone number',
      }]
    }

    const result = transformCSVRow(input, basicMappingConfig)
    expect(result).toStrictEqual(ok(expected))
  })

  test('invalid email address', () => {
    const input = {
      inEmail: 'not an email address',

      inFirstName: ' john ',
      inPhone: ' 1(555)-867-5309 ',
      inLanguage: ' English ',
      inGender: ' Male ',
      inDate: ' 01/20/2001 ',
      inCopy: ' copy this ',
    }
    const expected = {
      'ValueIs-csv': 'csv',
      'statusIs-new': 'new',
      referralStatus: 'requested',

      firstName: 'John',
      phone: '+15558675309',
      language: 'en',
      gender: 'M',
      date: new Date(2001, 0, 20, 0, 0, 0 ,0),
      copy: 'copy this',

      errors: [{
        errorType: 'invalid-email',
        field: 'email',
        inputData: 'not an email address',
        inputField: 'inEmail',
        message: 'Invalid email address',
      }]
    }

    const result = transformCSVRow(input, basicMappingConfig)
    expect(result).toStrictEqual(ok(expected))
  })

  test('unknown language', () => {
    const input = {
      inLanguage: 'fake language',

      inFirstName: ' john ',
      inPhone: ' 1(555)-867-5309 ',
      inEmail: ' test@example.com ',
      inGender: ' Male ',
      inDate: ' 01/20/2001 ',
      inCopy: ' copy this ',
    }
    const expected = {
      'ValueIs-csv': 'csv',
      'statusIs-new': 'new',
      referralStatus: 'requested',

      firstName: 'John',
      phone: '+15558675309',
      email: 'test@example.com',
      gender: 'M',
      date: new Date(2001, 0, 20, 0, 0, 0 ,0),
      copy: 'copy this',

      errors: [],

      language: '',
    }

    const result = transformCSVRow(input, basicMappingConfig)
    expect(result).toStrictEqual(ok(expected))
  })

  test('invalid gender', () => {
    const input = {
      inGender: 'W',

      inFirstName: ' john ',
      inPhone: ' 1(555)-867-5309 ',
      inEmail: ' test@example.com ',
      inLanguage: ' English ',
      inDate: ' 01/20/2001 ',
      inCopy: ' copy this ',
    }

    const expected = {
      'ValueIs-csv': 'csv',
      'statusIs-new': 'new',
      referralStatus: 'requested',

      firstName: 'John',
      phone: '+15558675309',
      email: 'test@example.com',
      language: 'en',
      date: new Date(2001, 0, 20, 0, 0, 0 ,0),
      copy: 'copy this',

      errors: [{
        errorType: "invalid-gender",
        field: "gender",
        inputData: "W",
        inputField: "inGender",
        message: "Unexpected gender",
      }]
    }

    const result = transformCSVRow(input, basicMappingConfig)
    expect(result).toStrictEqual(ok(expected))
  })

  test('invalid date', () => {
    const input = {
      inDate: '2025-01-20',

      inFirstName: ' john ',
      inPhone: ' 1(555)-867-5309 ',
      inEmail: ' test@example.com ',
      inLanguage: ' English ',
      inGender: ' Male ',
      inCopy: ' copy this ',
    }

    const expected = {
      'ValueIs-csv': 'csv',
      'statusIs-new': 'new',
      referralStatus: 'requested',

      firstName: 'John',
      phone: '+15558675309',
      email: 'test@example.com',
      language: 'en',
      gender: 'M',
      copy: 'copy this',

      errors: [{
        errorType: 'invalid-date',
        field: 'date',
        inputData: '2025-01-20',
        inputField: 'inDate',
        message: 'Invalid date, expected in format MM/dd/yyyy',
      }]
    }

    const result = transformCSVRow(input, basicMappingConfig)

    expect(result).toStrictEqual(ok(expected))
  })

  test('transformCSVRow duplicate input rows', () => {
    const inputRow = {
      inFirstName: ' john ',
      inPhone: ' 1(555)-867-5309 ',
      inEmail: ' test@example.com ',
      inLanguage: ' English ',
      inGender: ' Male ',
      inDate: ' 01/20/2001 ',
      inCopy: ' copy this ',
    }

    const expected = {
      'ValueIs-csv': 'csv',
      'statusIs-new': 'new',
      referralStatus: 'requested',

      firstName: 'John',
      phone: '+15558675309',
      email: 'test@example.com',
      language: 'en',
      gender: 'M',
      date: new Date(2001, 0, 20, 0, 0, 0 ,0),
      copy: 'copy this',

      errors: []
    }

    const transformer = csvRecordTransformFactory({
      mappingConfig: basicMappingConfig,
      handleDupes: true,
    })

    const result1 = transformer(basicContext, inputRow)
    const result2 = transformer(basicContext, inputRow)

    expect(result1).toStrictEqual(ok(expected))
    expect(result2).toStrictEqual(ok(null))
  })

  test('transformCSVRow errors marked as declined', () => {
    const inputRow = {
      inPhone: ' 1(555)-867-5309 ',
      inEmail: ' test@example.com ',
      inLanguage: ' English ',
      inGender: ' Male ',
      inDate: ' 01/20/2001 ',
      inCopy: ' copy this ',
    }

    const expected = {
      'ValueIs-csv': 'csv',
      'statusIs-new': 'new',
      referralStatus: 'declined',

      phone: '+15558675309',
      email: 'test@example.com',
      language: 'en',
      gender: 'M',
      date: new Date(2001, 0, 20, 0, 0, 0 ,0),
      copy: 'copy this',

      errors: [{
        "errorType": "missing",
        "field": "firstName",
        "inputData": undefined,
        "inputField": "inFirstName",
        "message": "Missing required field 'inFirstName'",
      }]
    }
    const transformer = csvRecordTransformFactory({
      mappingConfig: basicMappingConfig,
      handleDupes: true,
    })

    const result = transformer(basicContext, inputRow)

    expect(result).toStrictEqual(ok(expected))
  })
})
