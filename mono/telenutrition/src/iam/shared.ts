import { VerificationMethod } from '../rewards/shared'
import { InputWidget } from "../scheduling/flow-v2/types/widgets"

export type AuthRole = 'scheduler' | 'provider' | 'referrer' | 'delegate' | 'athena-patient' | 'retool';

export type ChallengeHint = {
  type: 'email' | 'phone'
  hint: {
    label: string,
    verificationId: number
  }
} | {
  type: 'eligibility' | 'enrollment'
  hint: InputWidget[]
} | {
  type: 'patient'
  hint: {
    verificationId: number,
    methods: VerificationMethod[]
  }
}