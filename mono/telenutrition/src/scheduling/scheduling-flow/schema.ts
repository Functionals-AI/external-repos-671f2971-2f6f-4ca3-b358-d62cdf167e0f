
import { z } from 'zod'

export const EmployerPaymentSchema = z.object({
  method: z.literal('employer'),
  employer_id: z.preprocess((arg) => parseInt(arg as string), z.number()),
  insurance_id: z.preprocess((arg) => parseInt(arg as string), z.number()).optional(),
  member_id: z.string().optional(),
  group_id: z.string().optional(),
});

export const InsurancePaymentSchema = z.object({
  method: z.literal('plan'),
  insurance_id: z.preprocess((arg) => parseInt(arg as string), z.number()),
  member_id: z.string(),
  group_id: z.string().optional(),
});

export const SelfPayPaymentSchema =  z.object({
  method: z.literal('self-pay'),
})

export const PaymentSchema = z.discriminatedUnion('method', [
  EmployerPaymentSchema,
  InsurancePaymentSchema,
  SelfPayPaymentSchema
])

export const PaymentSchemaOptional = z.object({
  method: z.union([z.literal('employer'), z.literal('plan'),  z.literal('self-pay')]).optional(),
  employer_id: z.preprocess((arg) => parseInt(arg as string), z.number()).optional(),
  insurance_id: z.preprocess((arg) => parseInt(arg as string), z.number()).optional(),
  member_id: z.string().optional(),
  group_id: z.string().optional(),
})

export const QuestionnaireSchema = z.object({
  state: z.string().length(2),
  timezone: z.string().optional(),
  appointment_type_id: z.preprocess((arg) => parseInt(arg as string), z.number()),
  providers: z.string().optional(),
  curriculum: z.string().optional(),
})

export const AppointmentsSchema = z.object({
  appointment_ids: z.array(z.number()),
})

export const IdentityFlowSchema = z.object({
  first_name: z.string().trim().min(1).max(20),
  last_name: z.string().trim().min(1).max(20),
  dob: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/), // check month
  sex: z.string().regex(/^[MF]$/),
})

export const VerificationSchema = z.object({
  verification_id: z.number(),
  code: z.number(),
})

export const ConfirmationSchema = z.object({
  promo: z.string().optional(),
})

export const ContactSchema = z.object({
  email: z.string().email().optional(),
  phone_mobile: z.string().optional(),
  phone_home: z.string().optional(),
  address: z.string().min(1).max(100).optional(),
  address2: z.string().min(1).max(100).optional(),
  city: z.string().min(1).max(30).optional(),
  state: z.string().length(2),
  zipcode: z.string().regex(/^(?:\d{5}|\d{5}-\d{4})$/),
})


export const FlowStateSchema = z.union([
  z.object({
    questionnaire: QuestionnaireSchema,
    appointments: AppointmentsSchema,
    identity: IdentityFlowSchema,
    verification: VerificationSchema,
    confirmation: ConfirmationSchema,
  }),
  z.object({
    questionnaire: QuestionnaireSchema,
    appointments: AppointmentsSchema,
    identity: IdentityFlowSchema,
    contact: ContactSchema,
    payment: PaymentSchema,
    confirmation: ConfirmationSchema
  })
])

export const AddressSchema = z.object({
  address: z.string().min(1).max(100).optional(),
  address2: z.string().min(1).max(100).optional(),
  address_city: z.string().min(1).max(30).optional(),
  address_state: z.string().length(2).optional(),
  address_zipcode: z.string().regex(/^(?:\d{5}|\d{5}-\d{4})$/).optional(),
})

export const FlowStateReferralSchema = z.object({
  email: z.string(),
  phone_mobile: z.string().optional(),
  timezone: z.string().optional(),
  icd10_codes: z.array(z.string()).optional(),
  referral_type: z.string().optional(),
})
.merge(IdentityFlowSchema)
.merge(AddressSchema.required({ address_state: true, address_zipcode: true }))
.merge(PaymentSchemaOptional)

export const FlowStateV2Schema = z.object({
  patient_id: z.number(),
  is_follow_up: z.boolean(),
  providers: z.string().optional(),
  appointment_ids: z.array(z.number()),
  promo: z.string().optional(),
  referral_id: z.number().optional(),
  icd10_codes: z.array(z.string()).optional(),
  // user consented to tos
  consent: z.literal('acknowledged').optional(),
  audio_only: z.coerce.boolean().optional(),
  payment_method_id: z.coerce.number()
})
.and(AddressSchema)

// HACK, better to do FlowStateV2Schema.partial(), but doesn't work because of PaymentSchema union
export const FlowStateV2UpdateSchema = z.object({
  patient_id: z.number(),
  appointment_type_id: z.preprocess((arg) => parseInt(arg as string), z.number()),
  providers: z.string().optional(),
  appointment_ids: z.array(z.number()),
  promo: z.string().optional(),
  payment_method_id: z.coerce.number()
})
.merge(AddressSchema)

export const CancelReasonSchema = z.union([
  z.literal('LAST_MINUTE_CANCELLATION'),
  z.literal('PATIENT_CANCELLED'),
  z.literal("PATIENT_NO_SHOW"),
  z.literal("PATIENT_NOT_COVERED_BY_INSURANCE"),
  z.literal("PATIENT_RESCHEDULED"),
  z.literal("PROVIDER_UNAVAILABLE"),
  z.literal("SCHEDULING_ERROR"),
  z.literal("CANCEL_FUTURE_VISIT_OF_PATIENT_WHO_NO_SHOWED"),
])

export default {
  AppointmentsSchema,
  IdentityFlowSchema,
  PaymentSchema,
  QuestionnaireSchema,
  FlowStateSchema,
  FlowStateV2Schema,
  FlowStateReferralSchema,
  FlowStateV2UpdateSchema,
  CancelReasonSchema
}