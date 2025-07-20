export interface OrganizationProvider {
  organization_provider_id: string
  npi: string
  is_rendering: boolean
  is_billing: boolean
  first_name?: string
  last_name?: string
  organization_name?: string
  provider_type: string
  tax_id?: string
  taxonomy_code?: string
  license_type: string
  addresses?: Array<{
    address: {
      address1: string
      address2?: string
      city: string
      state: string
      zip_code: string
      zip_plus_four_code: string
    }
    address_type: string
  }>
  employment_start_date?: string
  employment_termination_date?: string
  qualifications: Qualification[]
}

export type OrganizationProvider2 = Omit<OrganizationProvider, 'qualifications'> & {
  ptan: string
  medicaid_provider_id: string
  employment_status: string
}

export interface Payer {
  payer_uuid: string
  payer_id: string
  payer_name: string
}

export interface Qualification {
  period?: {
    start_date: string
    end_date?: string
  }
  identifier_code: string
  identifier_value: {
    state: string
    provider_number: string
    type: string
    identifier_id: string,
  }
}

export type Regions = {
  type: 'national'
} | {
  type: 'states'
  states: string[]
}

export type AuthorizedSignatory = {
  first_name: string
  last_name: string
  title: string
  email: string
  phone: string
  fax: string
}

export type Contract = {
  effective_date: string
  expiration_date?: string
  regions?: {
    type: string
  }
  contract_status?: string
  authorized_signatory?: AuthorizedSignatory
  contract_id: string
  contracting_provider: OrganizationProvider2
  rendering_providers: {
    [property: string]: OrganizationProvider2
  }
  payer: Payer
}