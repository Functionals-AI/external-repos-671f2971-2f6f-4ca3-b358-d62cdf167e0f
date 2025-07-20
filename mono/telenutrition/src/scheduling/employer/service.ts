import { IContext } from "@mono/common/lib/context"
import { ErrCode } from "@mono/common/lib/error"
import { Result, ok, err } from "neverthrow"
import { PaymentRecord } from "../scheduling-flow/types"
import Store from './store'
import { EmployerInfo, EmployerRecord } from "./types"

export const enum EmployerId {
  AAH = 1,
  MaricopaCounty = 11,
  UmpquaEmployee = 8,
  AnthemPilot = 14,
  IMIAmericas = 15,
  ArcBest = 2,
  RegencyCenters = 9,
  ElevanceFoodBenefit = 16,
  ElevanceNutritionEducation = 17,
}

export async function getEmployer(context: IContext, employerId: number): Promise<Result<EmployerRecord, ErrCode>> {
  const result = await Store.selectEmployer(context, employerId)

  if (result.isErr()) {
    return err(result.error)
  }

  return ok(result.value)
}

export async function getEmployerInfo(context: IContext, payment: PaymentRecord): Promise<Result<EmployerInfo, ErrCode>> {
  const {logger} = context

  const info: EmployerInfo = {}

  if (payment.method === 'employer' && payment.employer_id !== undefined) {
    const employerResult = await getEmployer(context, payment.employer_id)

    if (employerResult.isErr()) {
      return err(employerResult.error)
    }

    const employer = employerResult.value

    info.employerId = employer.employerId
    info.label = employer.label
    
    if (employer.specialProgram !== undefined) {
      info.specialProgram = employer.specialProgram
    }

    if (employer.insurancePackageId !== undefined) {
      info.insurancePackageId = employer.insurancePackageId
    }
  }

  return ok(info)
}

export default {
  getEmployer,
  getEmployerInfo,
}