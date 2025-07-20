import FoodappStore from "@mono/foodapp/lib/store"
import Patient from "../patient"
import PaymentStore from "../payment/store"
import { DateTime } from 'luxon'
import { PaymentRecord, paymentIsEmployer, paymentIsInsurance } from "../scheduling-flow/types"
import { IContext } from "@mono/common/lib/context"
import { Result, err, ok } from "neverthrow"
import { ErrCode } from "@mono/common/lib/error"
import { Logger } from "@mono/common"
import { compareDate, normalizeMemberId } from "../payment/eligibility"
import { InsuranceId } from "../insurance/service"
import { PaymentMethodRecord, getPaymentMethodUsage } from "../payment/store"
import { EmployerId } from "../employer/service"
import { DRCCategory } from "../encounter/shared"
import { PaymentCoverage } from "./shared"
import { getDRCCategory } from "../encounter/service"

const MTAG = Logger.tag()

type BenefitsCheckParams = {
  patientId: number,
  payment: PaymentRecord,
  paymentMethodTypeId: number,
  birthday?: Date
}

export type BenefitsChallenge = {
  birthday?: string
}
type BenefitsCheckResult = {
  success: true,
  eligibleId?: number
} | {
  success: false,
  challenge: BenefitsChallenge
}

export async function performBenefitsCheck(context: IContext, params: BenefitsCheckParams): Promise<Result<BenefitsCheckResult, ErrCode>> {
  const {logger} = context
  const TAG = [...MTAG, 'performBenefitsCheck']

  let { patientId, payment, birthday, paymentMethodTypeId } = params

  const paymentMethodTypeResult = await PaymentStore.selectPaymentMethodTypeWithAccounts(context, paymentMethodTypeId)
  if (paymentMethodTypeResult.isErr()) {
    logger.error(context, TAG, "unable to fetch payment method type", { error: paymentMethodTypeResult.error })
    return err(paymentMethodTypeResult.error)
  }

  const paymentMethodType = paymentMethodTypeResult.value
  let accountIds: number[] = paymentMethodType.accounts.filter(account => account.efile).map(account => account.id)
  let memberId = 'member_id' in payment ? payment.member_id : undefined

  if (memberId) {
    memberId = normalizeMemberId(memberId, accountIds?.[0])
  }

  if (accountIds.length > 0) {
    if (memberId === undefined) {
      logger.debug(context, TAG, "member id required for eligible payment method")
      return err(ErrCode.FORBIDDEN)
    }

    const eligibleUsersResult = await FoodappStore.UsersEligible.fetchEligibleUsers(context, {
      person_id: memberId,
      account_ids: accountIds
    })
    if (eligibleUsersResult.isErr()) {
      logger.error(context, TAG, 'error fetching eligible users', { error: eligibleUsersResult.error })
      return err(eligibleUsersResult.error)
    }
    const eligibleUsers = eligibleUsersResult.value.filter(user => user.birthday != null)

    // If there are no matches, then the member id is invalid
    if (eligibleUsers.length == 0) {

      // Don't allow adding payment method if eligibility match is required
      if (accountIds.length > 0 && !paymentMethodType.eligibilityOptional) {
        logger.debug(context, TAG, "No matching eligibility record found")
        return err(ErrCode.NOT_FOUND)
      }
      return ok({success: true})
    }

    const patientResult = await Patient.Service.getPatientById(context, { patientId })
    if (patientResult.isErr()) {
      logger.error(context, TAG, 'error fetching patient', { error: patientResult.error })
      return err(patientResult.error)
    }

    const patient = patientResult.value

    if (birthday == undefined && patient.birthday !== undefined) {
      birthday = DateTime.fromISO(patient.birthday).toJSDate()
    }

    // If the birthday does not match, it is possible that the patient info is incorrect
    const eligibleUser = eligibleUsers.find(user => compareDate(user.birthday || undefined, birthday))

    if (eligibleUser == undefined) {
      return ok({
        success: false,
        challenge: { birthday: birthday?.toLocaleDateString("en-US") }
      })
    } else if (patient.identityId !== undefined && patient.eligibleId !== eligibleUser.id) {
      // Update patient identity to match the new eligible id
      const updateEligibilityResult = await Patient.Service.updatePatientEligibility(context, patient, eligibleUser)
      if (updateEligibilityResult.isErr()) {
        logger.error(context, TAG, 'error updating patient eligibility', { error: updateEligibilityResult.error })
        return err(updateEligibilityResult.error)
      }
    }
    return ok({
      success: true,
      eligibleId: eligibleUser.id
    })
  }
  return ok({success: true})
}

type BenefitsCoverageParams = {
  paymentMethod: PaymentMethodRecord,
  year: number,
  rescheduleAppointmentId?: number
}

export async function getPaymentCoverage(context: IContext, params: BenefitsCoverageParams): Promise<Result<PaymentCoverage, ErrCode>> {
  const {logger} = context
  const TAG = [...MTAG, 'getPaymentCoverage']

  const { paymentMethod, year, rescheduleAppointmentId } = params

  const categoryResult = await getDRCCategory(context, { paymentMethod })
  if (categoryResult.isErr()) {
    logger.error(context, TAG, "Error getting drc category", {
      paymentMethodId: paymentMethod.id,
      error: categoryResult.error
    })
    return err(categoryResult.error)
  }
  const limit: number | undefined = getCoverageLimitForYear({
    paymentMethod,
    year,
    drcCategory: categoryResult.value
  })
  let remaining: number | undefined
  if (limit !== undefined) {
    if (limit > 0) {
      const countsResult = await getPaymentMethodUsage(context, {
        paymentMethodId: paymentMethod.id,
        year,
        rescheduleAppointmentId
      })
      if (countsResult.isErr()) {
        logger.error(context, TAG, "Error getting appointment count for payment method", params)
        return err(countsResult.error)
      }
      remaining = Math.max(0, limit - countsResult.value)
    } else {
      remaining = 0
    }
  }
  return ok({
    year,
    limit,
    remaining
  })
}

function getCoverageLimitForYear(params: {
  paymentMethod: PaymentMethodRecord,
  year: number,
  drcCategory: DRCCategory | null
}): number | undefined {

  const { paymentMethod, year, drcCategory } = params
  if (paymentMethod.type.eligibilityCheckType === 'invalid') {
    return 0;
  }

  const payment = paymentMethod.payment
  if (paymentIsEmployer(payment)) {
    if (payment.employer_id === EmployerId.MaricopaCounty) {
      return 2
    } else if (payment.employer_id === EmployerId.AnthemPilot) {
      return (year === 2024 || year === 2025) ? 6 : 0
    } else if ([EmployerId.ElevanceFoodBenefit, EmployerId.ElevanceNutritionEducation].includes(payment.employer_id)) {
      return year === 2025 ? 6 : 0
    }
  } else if (paymentIsInsurance(payment)) {
    if (payment.insurance_id === InsuranceId.Elevance) {
      return 6
    } else if (payment.insurance_id === InsuranceId.Healthfirst) {
      return 3
    } else if (payment.insurance_id === InsuranceId.CalOptima) {
      return 7
    } else if (payment.insurance_id === InsuranceId.SantaClara) {
      return 4
    } else if (payment.insurance_id === InsuranceId.CountyCare) {
      return drcCategory !== 'excluded' ? 12 : undefined
    } else if (payment.insurance_id === InsuranceId.BRMC) {
      return 3
    }
    else if (payment.insurance_id === InsuranceId.ElevanceKS) {
      return 3
    }
    else if (payment.insurance_id === InsuranceId.MolinaIL) {
      return 12
    } 
    else if (payment.insurance_id === InsuranceId.Highmark) {
      return 4
    } 
  }
  return undefined
}