import { err, ok, Result } from "neverthrow";
import { RowDataPacket } from "mysql2";

import { ErrCode } from "@mono/common/lib/error";
import { IContext } from "@mono/common/lib/context";

const TAG = `app.store.eligibility`;

export type EmploymentStatus = "A" | "T";
export interface UsersEligibleStoreRecord {
  id: number,
  person_id: string | null,
  subscriber_id: string,
  person_id_old: string | null,
  subscriber_id_old: string,
  group_number: string,
  email: string,
  email_crypt: Buffer,
  email_decrypt: string,
  firstname: string | null,
  lastname: string | null,
  organization_id: number,
  suborganization_id: string | null,
  suborganization_name: string | null,
  effective_date: Date | null,
  zip_code: string | null,
  birthday: Date | null,
  gender: string | null,
  office_location: string | null,
  department: string | null,
  building_code: string | null,
  employment_status: EmploymentStatus | null,
  raw_data: string | null,
  last_updated: Date | null,
  is_dependent: boolean | null,
  member_id_2: string | null,
  name_id: string | null,
  number_in_household: number | null,
  mobile_phone: string | null,
  address: string | null,
  city: string | null,
  state: string | null,
  country: string | null,
  plan_type: string | null,
  group_id: string | null,
  lob: string | null,
  account_id: number | null,
}

async function fetchByLastUpdated(
  context: IContext,
  lastUpdated: Date
): Promise<Result<UsersEligibleStoreRecord[], ErrCode>> {
  const {
    mysql: { reader },
    logger,
  } = context;

  try {
    const pool = await reader();
    const [usersEligibles] = await pool.query<
      UsersEligibleStoreRecord[] & RowDataPacket[]
    >(
      `
      SELECT
        id, 
        person_id, 
        subscriber_id, 
        person_id_old, 
        subscriber_id_old, 
        group_number, 
        email, 
        email_crypt,
        AES_DECRYPT(email_crypt, 'complicatedkeyforAESencryption') AS email_decrypt,
        firstname, 
        lastname, 
        organization_id, 
        suborganization_id, 
        suborganization_name, 
        effective_date, 
        zip_code, 
        birthday, 
        gender, 
        office_location, 
        department, 
        building_code, 
        employment_status, 
        raw_data, 
        last_updated, 
        is_dependent, 
        member_id_2, 
        name_id, 
        number_in_household, 
        mobile_phone, 
        address, 
        city, 
        state, 
        country, 
        plan_type, 
        group_id, 
        lob
      FROM tenants.go_users_eligible UE
      WHERE
        UE.last_updated > ?
    `,
      [lastUpdated]
    );

    return ok(usersEligibles);
  } catch (e) {
    logger.exception(context, `${TAG}.fetchByLastUpdated`, e);
    return err(ErrCode.EXCEPTION);
  }
}

export type EligibleUserInfo = Pick<UsersEligibleStoreRecord, "id" | "firstname" | "lastname" | "zip_code" | "birthday" | "person_id" | "organization_id" | "suborganization_id" | "email_decrypt" | "mobile_phone" | "account_id" | "raw_data">

export async function fetchEligibleUserInfo(context: IContext, eligibleId: number): Promise<Result<EligibleUserInfo, ErrCode>> {
  const {
    mysql: { reader },
    logger,
  } = context;

  try {
    const pool = await reader();

    const [usersEligible] = await pool.query<EligibleUserInfo[] & RowDataPacket[]>(`
        SELECT
          id,
          firstname,
          lastname,
          zip_code,
          birthday,
          person_id,
          organization_id,
          suborganization_id,
          AES_DECRYPT(email_crypt, 'complicatedkeyforAESencryption') AS email_decrypt,
          mobile_phone,
          account_id,
          raw_data
        FROM tenants.go_users_eligible UE
        WHERE UE.id = ?
      `, [eligibleId])

    if (usersEligible === undefined || usersEligible.length == 0) {
      return err(ErrCode.NOT_FOUND)
    }

    return ok(usersEligible[0]);
  } catch (e) {
    logger.exception(context, `${TAG}.fetchEligibleUserInfo`, e);
    return err(ErrCode.EXCEPTION);
  }
}

type EligibleUsersWhereable = {
  organization_id?: UsersEligibleStoreRecord["organization_id"];
  person_id: NonNullable<UsersEligibleStoreRecord["person_id"]>;
  account_ids?: NonNullable<UsersEligibleStoreRecord["account_id"]>[];
};

export type EligibleUsersShort = Pick<UsersEligibleStoreRecord, "id" | "firstname" | "lastname" | "birthday" | "organization_id" | "person_id" | "account_id" | "raw_data">

export async function fetchEligibleUsers(
  context: IContext,
  where: EligibleUsersWhereable
): Promise<Result<EligibleUsersShort[], ErrCode>> {
  const {
    mysql: { reader },
    logger,
  } = context;

  try {
    const pool = await reader();
    const accountIds = where.account_ids || [];
    const [usersEligible] = await pool.query<EligibleUsersShort[] & RowDataPacket[]>(`
      SELECT
        id,
        firstname,
        lastname,
        birthday,
        organization_id,
        person_id,
        account_id,
        raw_data
      FROM tenants.go_users_eligible UE
      WHERE lower(UE.person_id) = ?` +
        (where.organization_id ? ` AND UE.organization_id = ${where.organization_id}` : '') +
        (accountIds.length > 0 ? ` AND (UE.account_id IS NULL OR UE.account_id IN (${accountIds.map(id => '?').join(',')}))` :'') // always consider null account_id for now
    , [where.person_id.trim().toLowerCase(), ...accountIds]);
    return ok(usersEligible);
  } catch (e) {
    logger.exception(context, `${TAG}.fetchEligibleUser`, e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function fetchEligibleIds(
  context: IContext,
  where: { eligibleIds: number[] } | { memberIds: string[] }
): Promise<Result<EligibleUsersShort[], ErrCode>> {
  const {
    mysql: { reader },
    logger,
  } = context;

  const query: { field: string, ids: any[] } = 'eligibleIds' in where ?
    { field: 'UE.id', ids: where.eligibleIds } :
    { field: 'lower(UE.person_id)', ids: where.memberIds.map(id => id.toLowerCase()) };

  try {
    const pool = await reader();

    const [usersEligible] = await pool.query<EligibleUsersShort[] & RowDataPacket[]>(`
      SELECT
        id,
        firstname,
        lastname,
        birthday,
        organization_id,
        person_id,
        account_id,
        raw_data
      FROM tenants.go_users_eligible UE
      WHERE ${query.field} IN (${query.ids.map(id=>'?').join(',')})
      `, query.ids);

    return ok(usersEligible);
  } catch (e) {
    logger.exception(context, `${TAG}.fetchEligibleUser`, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface InertEligibleUserRecord {
  firstname?: string | null,
  lastname?: string | null,
  organization_id: number,
  suborganization_id?: string | null,
  suborganization_name?: string | null,
  effective_date?: Date | null,
  zip_code?: string | null,
  birthday?: string | null,
  gender?: string | null,
  department?: string | null,
  last_updated?: Date | null,
  is_dependent?: boolean | null,
  person_id?: string | null,
  name_id?: string | null,
  number_in_household?: number | null,
  mobile_phone?: string | null,
  address?: string | null,
  city?: string | null,
  state?: string | null,
  country?: string | null,
  plan_type?: string | null,
  group_id?: string | null,
  email?: string | null;
}

type RecordValue =  string | number | {script: string} | Date | boolean;

export async function insertEligibleUser(
  context: IContext,
  record: InertEligibleUserRecord
): Promise<Result<UsersEligibleStoreRecord, ErrCode>> {
  const {
    mysql: { writer },
    logger,
  } = context;

  try {
    const pool = await writer();

    const insertInto: Record<string, RecordValue> = {
      ...(record.firstname && {firstname: record.firstname}),
      ...(record.lastname && {lastname: record.lastname}),
      ...(record.suborganization_id && {suborganization_id: record.suborganization_id}),
      ...(record.suborganization_name && {suborganization_name: record.suborganization_name}),
      ...(record.effective_date && {effective_date: record.effective_date}),
      ...(record.zip_code && {zip_code: record.zip_code}),
      ...(record.birthday && {birthday: record.birthday}),
      ...(record.gender && {gender: record.gender}),
      ...(record.department && {department: record.department}),
      ...(record.last_updated && {last_updated: record.last_updated}),
      ...(record.is_dependent && {is_dependent: record.is_dependent}),
      ...(record.person_id && {person_id: record.person_id}),
      ...(record.name_id && {name_id: record.name_id}),
      ...(record.number_in_household && {number_in_household: record.number_in_household}),
      ...(record.mobile_phone && {mobile_phone: record.mobile_phone}),
      ...(record.address && {address: record.address}),
      ...(record.city && {city: record.city}),
      ...(record.state && {state: record.state}),
      ...(record.country && {country: record.country}),
      ...(record.plan_type && {plan_type: record.plan_type}),
      ...(record.group_id && {group_id: record.group_id}),
      ...(record.email ? {
        email: { script: `MD5('${record.email}')`},
        email_crypt: {script: `AES_ENCRYPT('${record.email}', 'complicatedkeyforAESencryption')`},
      } : {
        email: '',
        email_crypt: '',
      }),
      organization_id: record.organization_id,

      // Required fields - kept empty string
      subscriber_id: '',
      subscriber_id_old: '',
      group_number: '',
      raw_data: '',
    }

    const entries = Object.entries(insertInto);

    const formatValue = (value: RecordValue) => {
      if (typeof value === 'string') {
        return `"${value}"`;
      }
      if (typeof value === 'object' && "script" in value) {
        return value.script
      }

      return value;
    }

    const query = `
      INSERT INTO tenants.go_users_eligible
        (${entries.map((e) => e[0]).join(", ")})
      VALUES
        (${entries.map((e) => formatValue(e[1])).join(", ")})
    `;

    logger.info(context, `${TAG}.insertEligibleUser`, `Insert into go_users_eligible:, ${query}`)

    const [eligibleUser] = await pool.query<
      UsersEligibleStoreRecord & RowDataPacket[]
    >(query);

    return ok(eligibleUser);
  } catch (e) {
    logger.exception(context, `${TAG}.insertEligibleUser`, e);
    return err(ErrCode.EXCEPTION);
  }
}

export default {
  fetchByLastUpdated,
  fetchEligibleIds,
  fetchEligibleUserInfo,
  fetchEligibleUsers,
  insertEligibleUser,
};
