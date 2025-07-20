import { Readable } from 'node:stream'
import { err, ok, Result } from "neverthrow";

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from "@mono/common/lib/error"

import { transform } from 'stream-transform'
import { HL7Transform } from './HL7Parser';
import { TransformFunction } from '../data/ingest';
import { normalizeHL7 } from './HL7toReferralJSON';

const MTAG = [ 'ops', 'data', 'transforms', 'HL7 to Referral CSV' ]

//headers for both referral and error .csv files
const referralKeys = [
  'referralSource',
  'referralService',
  'referralStatus',
  'isExistingReferral',
  'referralDate',
  'referralExternalId',
  'referralExternalPatientId',
  'referralFirstName',
  'referralLastName',
  'referralDob',
  'referralLang',
  'referralGender',
  'referralPhone',
  'referralPhoneMobile',
  'referralPhoneWork',
  'referralPhoneHome',
  'referralEmail',
  'referralAddress1',
  'referralAddress2',
  'referralCity',
  'referralState',
  'referralZipcode',
  'referralGroupId',
  'referralPolicyId',
  'referralRelationshipToMember',
  'referredBy',
  'accountId',
  'icd10Codes',
  'payerName',
  'sourceData'
]
const errorKeys = ['messageNumber', 'errorLocation', 'errorMessage', 'sourceData']
let headers = referralKeys.join(',') + '\n';
let errorHeaders = errorKeys.join(',') + '\n';

/**
 * Extracts referral and error information from a single HL7 message and formats for .csv insertion
 * This function is also used to "generate" the .csv headers
 * 
 * @param context 
 * @param line - each line = one HL7 message or the .csv headers
 * @param switcher - set to 0 for referrals, 1 for errors; pulled from functionBuilder
 * @returns array of two strings: one is a referral-ified HL7 message, while the other contains information about the messages' errors.
 */
function transformLine(context: IContext, line: string, switcher:number): Result<string, ErrCode> {
  const { logger } = context
  const TAG = [ ...MTAG, 'transformLine' ]
  try {
    //don't apply transform if we're writing the headers
    if (line === headers) {
      return ok(headers)
    }
    else if (line === errorHeaders) {
      return ok(errorHeaders)
    }
    //apply transform to subsequent data
    else {
      // turn HL7 message into HL7 object
      // const HL7Object = HL7Transform(line)
      // turn HL7 object into referral object
      const [referralJSON, errorLog] = normalizeHL7(HL7Transform(line))

      //exit if we're trying to write referral file and no messages passed
      if (Object.keys(referralJSON).length === 0 && !switcher) {
        return err(ErrCode.INVALID_DATA)
      }

      //create csv-like error string if switcher = 1
      if (switcher){
      const errorValues = [
        errorLog.map(key => [
          key.messageNumber,
          key.errorLocation,
          key.errorMessage,
          key.sourceData])
        ].map(x => x.join(",")).join("\n") + '\n';
      
      return ok(errorValues)
      }

      //create csv-like referral string otherwise
      const values = referralKeys.map(header => referralJSON[header]).join(',') + '\n';
      return ok(values)
    }

  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

/**
 * Creates transform functions for both HL7 message and error log
 * Similar steps, just differently formatted csv files
 * 
 * @param keys - headers for .csv output 
 * @param switcher - set to 0 for referrals, 1 for errors 
 * @returns function of type TransformFunction
 */
function functionBuilder(keys:string, switcher:number):TransformFunction {
  
  const genericTransform:TransformFunction = function(context: IContext, data: Readable): Result<Readable, ErrCode> {
    const { logger } = context
    let TAG = [...MTAG]
    if (switcher) {
      TAG = [ ...TAG, 'transformErrors' ]
    }
    else { TAG = [ ...TAG, 'transformHL7' ] }

    try {
      // initialize function to transform
      const transformer = transform(function(line: string) {
        const transformLineResult = transformLine(context, line, switcher)

        if (transformLineResult.isErr()) {
          logger.info(context, TAG, 'Skipping record.', {
            line,
            error: transformLineResult.error,
          })

          return null
        }
        return transformLineResult.value
      })

      //read all data from stream
      let chunks: string[] = []
      data.once('readable', () => {
        let chunk: Buffer | null = null
        while (null !== (chunk = data.read())) {
          chunks.push(chunk.toString())
        }
        // each line = one HL7 message
        // each message begins with MSH; use that as delimiter
        let lines = chunks.join('').split('MSH')
        lines.shift()     
        transformer.write(keys) //add headers to stream
        for (let x = 0; x < lines.length; x++) {
          //return MSH header back to messages and transform each line
          lines[x] = ['MSH',lines[x]].join("");

          logger.debug(context, TAG, `About to transform the following HL7 message: ${lines[x]}`)
          
          transformer.write(lines[x])
        }
        transformer.end()
      })

      data.on('end', () => {
        //throw error if we have too much leftover at end
        if (chunks.length > 1) {
          logger.error(context, TAG, 'Have more than one chunk on end.')

          return err(ErrCode.STATE_VIOLATION)
        }

        logger.info(context, TAG, 'Transform completed.')
      })

      return ok(transformer)
    }
    catch (e) {
      logger.exception(context, TAG, e)

      return err(ErrCode.EXCEPTION)
    }
  }
  return genericTransform
}

export const transformHL7 = functionBuilder(headers,0)
export const transformErrors = functionBuilder(errorHeaders,1)

export default {
  transformHL7, transformErrors
}