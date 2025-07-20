export enum FederationSource {
  Foodapp = 1,
  QcsLead = 2,
  Referral = 3,
  Okta = 4,
  AthenaPatient = 5,
  CallCenter = 6, // deprecated
  CallCenterAgent = 7,
  CallCenterDial = 8,
  Retool = 9,
}

export interface FederationIdentityRecord {
  // the federated identifier
  fid: string
  src: FederationSource
}

export interface AppIdentityRecord {
  // the user identifier
  uid: number
}

export interface ProviderIdRecord extends FederationIdentityRecord {
  src: FederationSource.Okta;
}

export interface EmployeeIdentityRecord extends FederationIdentityRecord {
  src: FederationSource.Okta | FederationSource.CallCenterAgent | FederationSource.CallCenterDial;
}

export type IdentityRecord = AppIdentityRecord | FederationIdentityRecord;

export interface IdentityAttributes {
  firstName?: string,
  lastName?: string,
  zipCode?: string,
  birthday?: Date,
}