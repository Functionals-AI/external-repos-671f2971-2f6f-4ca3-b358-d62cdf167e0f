import { IContext } from "@mono/common/lib/context"
import { ErrCode } from "@mono/common/lib/error"
import { Result, ok, err } from "neverthrow"
import Logger from '@mono/common/lib/logger'
import Store from './store'
import EmployerService from "../employer/service"
import { PaymentRecord } from "../scheduling-flow/types"
import * as db from "zapatos/db";
import '@mono/common/lib/zapatos/schema'
import * as zs from 'zapatos/schema'
import _ = require("lodash")

const MTAG = Logger.tag()

export const enum InsuranceId {
  CalOptima = 42,
  Cigna = 3,
  CountyCare = 18,
  HSCSN = 20,
  Banner = 22,
  CCHP = 5,
  CCHP_BCP = 6,
  Elevance = 23,
  ElevanceKS = 50,
  MartinsPointGA = 9,
  UmpquaMedicaid = 12,
  UHC_DSNP = 21,
  Aetna = 16,
  CDPHP = 4,
  Healthfirst = 7,
  Samaritan = 44,
  CareOregon = 43,
  AetnaABHIL = 45,
  SantaClara = 48,
  Quartz = 17,
  MGB = 24,
  MolinaIL = 51,
  BRMC = 49,
  AdvancedHealth = 52,
  Highmark = 53,
}

export interface InsuranceRecord {
  [k: string]: any;
  insuranceId: number;
  label: string;
  packageId: number;
}

export interface InsuranceWithPayerRecord extends InsuranceRecord {
  payer?: {
    payerId: number,
    rosterCheck: boolean,
    enrollmentCheck: boolean,
  }
}

export interface InsuranceInfo {
  insuranceId?: number,
  label?: string,
  packageId?: number,
  groupId?: string,
  memberId?: string,
}

export async function getInsurance(context: IContext, insuranceId: number): Promise<Result<InsuranceRecord, ErrCode>> {
  const result = await Store.selectInsurance(context, insuranceId)

  if (result.isErr()) {
    return err(result.error)
  }

  return ok(result.value)
}

export async function getInsuranceInfo(context: IContext, payment: PaymentRecord): Promise<Result<InsuranceInfo, ErrCode>> {
  const {logger} = context
  const TAG = [ ...MTAG, 'getInsuranceInfo' ]

  const info: InsuranceInfo = {}

  if (payment.method === 'self-pay') {
    info.label = '*SELF-PAY*'
    info.insuranceId = 0
    info.packageId = 0
  } else {
    if (payment.method === 'employer') {
      if (payment.group_id !== undefined) {
        info.groupId = payment.group_id
      }

      if (payment.insurance_id === undefined) {
        const result = await EmployerService.getEmployerInfo(context, payment)
        if (result.isErr()) {
          logger.error(context, TAG, `Error getting employer info.`, {
            payment,
            error_code: result.error,
          })

          return err(result.error)
        }
        const employerInfo = result.value

        logger.info(context, TAG, `Retrieved employer info..`, {
          payment,
          employer_info: employerInfo,
        })

        if (employerInfo.insurancePackageId !== undefined) {
          info.packageId = employerInfo.insurancePackageId
        }
      }
    }

    if (payment.insurance_id !== undefined) {
      const result = await getInsurance(context, payment.insurance_id)

      if (result.isErr()) {
        logger.error(context, TAG, `Error getting insurance info from payment.`, {
          payment,
          error_code: result.error
        })

        return err(result.error)
      }
  
      const insurance = result.value
      info.insuranceId = insurance.insuranceId
      info.packageId = insurance.packageId
      info.label = insurance.label
    }

    if (payment.member_id !== undefined) {
      info.memberId = payment.member_id
    }
  }
  return ok(info)
}

interface GetInsuranceProviderIdsParams {
  insuranceId: number,
  providerIds?: number[]
}

export async function getInsuranceProviderIds(context: IContext, params: GetInsuranceProviderIdsParams): Promise<Result<number[] | null, ErrCode>> {
  const { logger, store: { reader } } = context;
  const TAG = [...MTAG, 'getInsuranceProviderIds']

  try {
    const { insuranceId } = params;
    const rPool = await reader();

    const inProviderIds = params.providerIds
    if (inProviderIds && inProviderIds.length === 0) {
      return ok([])
    }

    const insuranceResult = await Store.selectInsuranceWithPayer(context, insuranceId)
    if (insuranceResult.isErr()) {
      logger.error(context, TAG, 'could not find insurance from insuranceId', { insuranceId })
      return err(ErrCode.NOT_FOUND)
    }
    const insurance = insuranceResult.value

    if (!insurance.payer) {
      logger.debug(context, TAG, 'insurance is not tied to a payer', { insuranceId })
      return ok(null)
    }
    const payerId = insurance.payer.payerId

    if (insurance.payer.enrollmentCheck === false && insurance.payer.rosterCheck === false) {
      logger.debug(context, TAG, 'no checks are enabled for this payer', { insuranceId, payerId })
      return ok(null)
    }

    const eligiblePayerProviderPairs = await db
      .select('telenutrition.payer_provider_schedulability', {
        payer_id: payerId,
        ...(inProviderIds && { provider_id: db.conditions.isIn(inProviderIds) })
      })
      .run(rPool);

    const providerIds = eligiblePayerProviderPairs.map((r) => r.provider_id).filter((id): id is number => id !== null);
    logger.info(context, TAG, 'determined providers for insurance', { insuranceId, payerId, providerIdsCount: providerIds.length })

    return ok(providerIds)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

interface ValidateProviderForInsuranceParams {
  insuranceId: number,
  providerId: number,
}

export async function validateProviderForInsurance(context: IContext, params: ValidateProviderForInsuranceParams): Promise<Result<boolean, ErrCode>> {
  const { logger } = context;
  const TAG = [...MTAG, 'validateProviderForInsurance']

  try {
    const { insuranceId, providerId } = params;

    const insuranceProviderIdsResult = await getInsuranceProviderIds(context, { insuranceId, providerIds: [providerId] });
    if (insuranceProviderIdsResult.isErr()) {
      logger.error(context, TAG, 'error getting insurance provider ids during validate provider for insurance', { insuranceId, providerId })
      return err(ErrCode.SERVICE)
    }
    const insuranceProviderIds = insuranceProviderIdsResult.value

    const valid = insuranceProviderIds === null || insuranceProviderIds.includes(providerId)

    logger.info(context, TAG, 'determined if provider can schedule for insurance', { insuranceId, providerId, valid })
    return ok(valid)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  getInsurance,
  getInsuranceInfo,
  getInsuranceProviderIds,
  validateProviderForInsurance,
}