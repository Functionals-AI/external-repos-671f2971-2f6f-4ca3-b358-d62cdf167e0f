import { z } from 'zod'

import { PaymentSchema, QuestionnaireSchema, FlowStateSchema, IdentityFlowSchema, AppointmentsSchema, FlowStateV2Schema, FlowStateReferralSchema, SelfPayPaymentSchema, InsurancePaymentSchema, EmployerPaymentSchema } from "./schema"

type FlowValue = string | number | boolean | string[] | number[];

type FlatFlowState = Record<string, FlowValue>

export type FlowState = FlatFlowState | Record<string, Record<string, FlowValue>>
export type FlowInsurance = Record<string, Record<string, FlowValue>>

export type FlowType = "scheduling_v1" | "scheduling_v2"

export type FlowRecord = {
  [key: string]: any;
  flowId: number;
  flowType: FlowType;
  currentStep?: string;
  userId?: number;
  federationId?: string;
  appointmentId?: number;
  patientId?: number;
  scheduledAt?: Date;
  state: FlowState;
  insurance: FlowInsurance;
  timezone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type FlowUpdateRecord = Pick<FlowRecord, 'flowId'> & Partial<Pick<FlowRecord, 'state' | 'insurance' | 'appointmentId' | 'patientId' | 'scheduledAt' | 'timezone'>>
export type FlowCreateRecord = Omit<FlowRecord, 'flowId'>

export type PaymentRecord = z.infer<typeof PaymentSchema>
export type InsurancePaymentRecord = z.infer<typeof InsurancePaymentSchema>
export type EmployerPaymentRecord = z.infer<typeof EmployerPaymentSchema>
export type SelfPayPaymentRecord = z.infer<typeof SelfPayPaymentSchema>
export type QuestionnaireRecord = z.infer<typeof QuestionnaireSchema>
export type IdentityFlowRecord = z.infer<typeof IdentityFlowSchema>
export type AppointmentsRecord = z.infer<typeof AppointmentsSchema>
export type FlowStateV1Record = z.infer<typeof FlowStateSchema>
export type FlowStateV2Record = z.infer<typeof FlowStateV2Schema>
export type FlowStateRecord = FlowStateV1Record | FlowStateV2Record
export type FlowStateReferralRecord = z.infer<typeof FlowStateReferralSchema>

export function paymentIsEmployer(payment: PaymentRecord): payment is EmployerPaymentRecord {
  return payment.method === 'employer'
}

export function paymentIsInsurance(payment: PaymentRecord): payment is InsurancePaymentRecord {
  return payment.method === 'plan'
}
