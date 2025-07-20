import * as db from 'zapatos/db'
import * as zs from 'zapatos/schema'
import { DateTime } from 'luxon'

export interface PatientRecord {
  patientId: number;
  departmentId: number;
  identityId?: number;
  state: string;
  address1?: string;
  address2?: string;
  city?: string;
  sex?: string; // 'M' | 'F';
  phone?: string;
  email?: string;
  timezone: string;
  firstName?: string;
  lastName?: string;
  birthday?: `${number}-${number}-${number}`; // TODO: date
  age?: number;
  zipcode?: string;
  eligibleId?: number;
  accountId?: number;
  accountEmail?: string;
  accountPhone?: string;
  preferredName?: string;
  pronouns?: string;
  language?: string;
  religion?: string;
  accountName?: string;
}

export function mapPatientRecord(record: (zs.telenutrition.schedule_patient.JSONSelectable & db.LateralResult<{
  identity?: db.SQLFragment<zs.telenutrition.iam_identity.JSONSelectable
      & db.LateralResult<{
    account?: db.SQLFragment<zs.common.account.JSONSelectable, never>
  }>, never>;
  userPatient?: db.SQLFragment<(zs.telenutrition.schedule_user_patient.JSONSelectable & db.LateralResult<{
    user: db.SQLFragment<zs.telenutrition.iam_user.JSONSelectable | undefined, never>;
  }>) | undefined, never>
}>)): PatientRecord {
  return {
    patientId: record.patient_id,
    departmentId: record.department_id,
    identityId: record.identity_id ?? undefined,
    state: record.state,
    address1: record.address ?? undefined,
    address2: record.address2 ?? undefined,
    city: record.city ?? undefined,
    sex: record.sex ?? undefined,
    phone: record.phone ?? undefined,
    email: record.email ?? undefined,
    timezone: record.timezone,
    firstName: record.identity?.first_name ?? record.first_name ?? undefined,
    lastName: record.identity?.last_name ?? record.last_name ?? undefined,
    birthday: record.identity?.birthday ?? record.birthday ?? undefined,
    age: calculateAge(record.identity?.birthday ?? record.birthday),
    zipcode: record.identity?.zip_code ?? record.zip_code ?? undefined,
    eligibleId: record.identity?.eligible_id ?? undefined,
    accountId: record.identity?.account_id ?? undefined,
    accountEmail: record.userPatient?.user?.email ?? undefined,
    accountPhone: record.userPatient?.user?.phone ?? undefined,
    preferredName: record.preferred_name ?? undefined,
    pronouns: record.pronouns ?? undefined,
    language: record.language ?? undefined,
    religion: record.religion ?? undefined,
    accountName: record.identity?.account?.name
  }
}

function calculateAge(birthdate: `${number}-${number}-${number}` | null) {
  if (!birthdate) {
    return undefined
  }

  const now = DateTime.fromJSDate(new Date)
  const birth = DateTime.fromSQL(birthdate)
  const diff = Math.trunc(now.diff(birth, 'years').years)
  return diff < 1 ? 0 : diff
}