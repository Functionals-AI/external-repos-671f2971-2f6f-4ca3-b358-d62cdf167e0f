import { z } from 'zod'
import { isBirthdayValidForRegistration } from './service'

export const EmailOrPhoneSchema = z.object({
  email: z.string().email()
}).or(z.object({
  phone: z.string()
}))

export const PasswordSchema = z.string().min(8).refine(
  (val) => /\d/.test(val) && /[a-z]/i.test(val),
  { message: 'Must contain at least 1 letter and 1 number' }
)

export const INVALID_AGE_MESSAGE = "You must be 18 or older the create an account. Please set up your account with a parent/guardian to schedule your first appointment."

export const UserIdentitySchema = z.object({
  firstName: z.string().min(1).max(20).trim(),
  lastName: z.string().min(1).max(20).trim(),
  zipCode: z.string().regex(/^(?:\d{5}|\d{5}-\d{4})$/),
  birthday: z.coerce.date().refine(isBirthdayValidForRegistration, {
    message: INVALID_AGE_MESSAGE
  }),
})

export const UserSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: PasswordSchema.optional()
}).merge(UserIdentitySchema)

export const EnrollmentSchema = z.object({
  enrollment: z.string(),
})

export const RegistrationSchema =
  EmailOrPhoneSchema.and(
    // Note: order in union matters! It will stop at first match
    z.union([
      // open enrollment (not eligible)
      UserIdentitySchema.merge(EnrollmentSchema.partial()),
      // open enrollment (eligible)
      EnrollmentSchema.merge(z.object({
        memberId: z.string(),
        birthday: z.coerce.date()
      })),
      // eligible enrollment
      EnrollmentSchema
    ])
  )

export default {
  UserSchema,
  PasswordSchema,
  UserIdentitySchema,
  EmailOrPhoneSchema,
  RegistrationSchema
}