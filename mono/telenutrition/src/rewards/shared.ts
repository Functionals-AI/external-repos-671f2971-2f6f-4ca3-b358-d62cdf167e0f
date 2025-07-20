import * as db from 'zapatos/db';

export type VerificationMethod = 'email' | 'sms' | 'call'

export interface VerificationMethodRecord {
  method: VerificationMethod,
  label: string,
  target: string
}

export interface RewardUser {
  rewardId: number;
  reward: {
    correctable: boolean;
    description: string;
  }
  patient: {
    identityId: number;
    firstName?: string;
    lastName?: string;
  }
  meta: db.JSONValue;
  userActivity: {
    activityAt: string;
  };
}