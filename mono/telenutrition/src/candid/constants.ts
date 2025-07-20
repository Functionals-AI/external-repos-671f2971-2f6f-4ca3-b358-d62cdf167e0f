import { CreateOrganizationProviderApiRequest } from "./api/organization-providers";

export const FOODSMART_PROVIDER: CreateOrganizationProviderApiRequest = {
  npi: "1972146694",
  is_rendering: false,
  is_billing: true,
  organization_name: "Zipongo Health Provider Group, PA",
  provider_type: "ORGANIZATION",
  tax_id: "843379970",
  license_type: "RD",
  addresses: [
    {
      address: {
        address1: "595 Pacific Avenue",
        address2: "4th Floor",
        city: "San Francisco",
        state: "CA",
        zip_code: "94133",
        zip_plus_four_code: "4685"
      },
      address_type: "DEFAULT"
    }
  ],
  qualifications: [],
}
