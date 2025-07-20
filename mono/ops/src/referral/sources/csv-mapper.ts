import { DateTime } from 'luxon'
import { createHash } from 'node:crypto'
import { err, ok, Result } from "neverthrow"

import { NormalizedReferralInboundRecord, RecordTransformer, SourceReferralRecord } from "../service"
import phone from "phone"
import { languageToISO, toFirstOrLastName } from "@mono/common/lib/data/normalize"
import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import { ReferralStatus } from '@mono/common/lib/referral/store'

const MTAG = [ 'ops', 'referrals', 'sources', 'csv-mapper' ]

export enum ErrorType {
  MISSING = 'missing',
  INVALID_DATA = 'invalid-data',
  INVALID_PHONE_NUMBER = 'invalid-phone-number',
  INVALID_DATE = 'invalid-date',
  INVALID_EMAIL = 'invalid-email',
  INVALID_GENDER = 'invalid-gender'
}

export interface CSVMappingError {
  field: string,
  inputField: string,
  inputData?: string,
  errorType: ErrorType,
  message: string,
}

export type CSVColumnMappingConfig = {
  inputColumn: string,
  outputColumn: string,
  operation: 'copy' | 'name' | 'email' | 'language' | 'gender',
  optional?: boolean, // defaults to true if missing
} | {
  inputColumn: string,
  outputColumn: string,
  operation: 'phone',
  optional?: boolean, // defaults to true if missing
  validateMobile?: boolean, // defaults to false
} | {
  inputColumn: string,
  outputColumn: string,
  operation: 'date',
  dateFormat: string,
  optional?: boolean, // defaults to true if missing
}

export interface CSVMappingConfig {
  constants: {
    outputColumn: string,
    value: string,
  }[],
  dynamicColumns: CSVColumnMappingConfig[],
  includeSourceData: boolean,
  outputTransform?: (input: Object, output: Object) => CSVMappingError[],

  // You should avoid this if possible, but sometimes the input data is funky
  // and it makes the rest of the config simpler to transform it before
  // processing.
  inputTransform?: (input: Object) => CSVMappingError[],
}

function mapGender(input: string): Result<string, ErrorType> {
  input = input.trim().toLowerCase()

  if (input === 'm' || input === 'male') {
    return ok('M')
  } else if (input === 'f' || input === 'female') {
    return ok('F')
  }

  return err(ErrorType.INVALID_GENDER)
}

function createError(
  mapping: CSVColumnMappingConfig,
  inputRow: Object,
  errorType: ErrorType,
  message: string
): CSVMappingError {
  return {
    field: mapping.outputColumn,
    inputField: mapping.inputColumn,
    inputData: inputRow[mapping.inputColumn],
    errorType,
    message,
  }
}

interface CSVMappingResult {
  errors?: CSVMappingError[]
}

export type CSVTransformOutput = Object & CSVMappingResult

export function transformCSVRow(
  inputRow: Object,
  config: CSVMappingConfig
): Result <CSVTransformOutput, ErrCode> {
  const outputRow: CSVTransformOutput = {}
  const errors: CSVMappingError[] = []

  for (const col of config.constants) {
    outputRow[col.outputColumn] = col.value
  }

  if (config.inputTransform) {
    const inputTransformErrors = config.inputTransform(inputRow)
    errors.push(...inputTransformErrors)
  }

  for (const col of config.dynamicColumns) {
    const inputValue = inputRow[col.inputColumn]?.trim()

    if (col.optional !== true && !inputValue) {
      errors.push(createError(col, inputRow, ErrorType.MISSING, `Missing required field '${col.inputColumn}'`))
    } else if (inputValue) {
      if (col.operation === 'copy') {
        outputRow[col.outputColumn] = inputValue
      } else if (col.operation === 'name') {
        outputRow[col.outputColumn] = toFirstOrLastName(inputValue)
      } else if (col.operation === 'date') {
        const date = DateTime.fromFormat(inputValue, col.dateFormat).toJSDate()
        if (date.toString() === 'Invalid Date') {
          errors.push(createError(col, inputRow, ErrorType.INVALID_DATE, `Invalid date, expected in format ${col.dateFormat}`))
        } else {
          outputRow[col.outputColumn] = date
        }
      } else if (col.operation === 'phone') {
        const validateMobilePrefix = col.validateMobile ?? false
        const validated = phone(inputValue, { validateMobilePrefix })

        if (!validated.isValid) {
          errors.push(createError(col, inputRow, ErrorType.INVALID_PHONE_NUMBER, `Invalid phone number`))
        } else {
          outputRow[col.outputColumn] = validated.phoneNumber
        }
      } else if (col.operation === 'email') {
        if (!inputValue.includes('@')) {
          errors.push(createError(col, inputRow, ErrorType.INVALID_EMAIL, `Invalid email address`))
        } else {
          outputRow[col.outputColumn] = inputValue
        }
      } else if (col.operation === 'language') {
        outputRow[col.outputColumn] = languageToISO(inputValue)
      } else if (col.operation === 'gender') {
        const genderResult = mapGender(inputValue)
        if (genderResult.isErr()) {
          errors.push(createError(col, inputRow, genderResult.error, 'Unexpected gender'))
        } else {
          outputRow[col.outputColumn] = genderResult.value
        }
      }
    }
  }

  if (config.includeSourceData) {
    outputRow['sourceData'] = inputRow
  }

  if (config.outputTransform) {
    const outputTransformErrors = config.outputTransform(inputRow, outputRow)
    errors.push(...outputTransformErrors)
  }

  outputRow.errors = errors

  return ok(outputRow)
}

type NormalizedReferralInboundRecordWithErrors = NormalizedReferralInboundRecord & CSVMappingResult

export function TransformCSVRowToNormalizedReferralInboundRecord(
  inputRow: Object,
  config: CSVMappingConfig
): Result<NormalizedReferralInboundRecordWithErrors, ErrCode> {
  const result = transformCSVRow(inputRow, config)

  if (result.isErr()) {
    return err(result.error)
  }

  return ok(result.value as NormalizedReferralInboundRecordWithErrors)
}

export interface LoadRecordOptions {
  mappingConfig: CSVMappingConfig,

  // Defaults to false if not provided.
  handleDupes?: boolean,
}

export function csvRecordTransformFactory(options: LoadRecordOptions): RecordTransformer {
  const handleDupes = options.handleDupes ?? false

  const hashed = new Set()
  function hashRecord(record: SourceReferralRecord): string {
    const hash = createHash('md5')

    hash.update(Object.entries(record).map(e => `${e[0]}:${e[1]}`).join('\n'))

    return hash.digest('hex')
  }

  function recordTransform(
    context: IContext,
    record: SourceReferralRecord)
  : Result<Partial<NormalizedReferralInboundRecord> | null, ErrCode> {
    const { logger } = context
    const TAG = [ ...MTAG, 'transformRecord' ]

    if (handleDupes) {
      const hash = hashRecord(record)
      if (hashed.has(hash)) {
        logger.info(context, TAG, 'Duplication record.', record)
        return ok(null)
      }

      hashed.add(hash)
    }

    const result = TransformCSVRowToNormalizedReferralInboundRecord(
      record,
      options.mappingConfig)

    if (result.isErr()) {
      logger.warn(context, TAG, 'Error mapping record.', {
        record,
        errors: result.error,
      })

      return err(ErrCode.INVALID_DATA)
    } else if ((result.value.errors?.length ?? 0) > 0) {
      logger.warn(context, TAG, 'Errors while mapping record, setting to declined.', {
        errors: result.value.errors,
      })

      result.value.referralStatus = ReferralStatus.DECLINED
    }

    return ok(result.value)
  }

  return recordTransform
}

export default {
  csvRecordTransformFactory,
  transformCSVRow,
  TransformCSVRowToNormalizedReferralInboundRecord,
}
