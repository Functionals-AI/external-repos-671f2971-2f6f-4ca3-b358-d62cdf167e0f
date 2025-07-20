import { IContext } from "@mono/common/lib/context"
import { ErrCode } from "@mono/common/lib/error"
import axios from "axios"
import { err, ok, Result } from "neverthrow"
import { authenticate } from './auth';
import { OrganizationProvider, OrganizationProvider2, Payer, Qualification, Regions } from "./types";


const MTAG = 'telenutrition.candid.api.organization-providers'


export interface ProviderCredentialingSpan {
  provider_credentialing_span_id: string
  regions?: Regions
  rendering_provider: OrganizationProvider2
  contracting_provider: OrganizationProvider2
  payer: Payer
  dates: {
    start_date: string
    end_date: string
  }
  submitted_date: string
  credentialing_status: string
  payer_loaded_date: string
}


export interface GetAllOrganizationProvidersApiRequest {
  npi?: string,
  is_rendering?: boolean,
  limit?: number,
}

export interface GetAllOrganizationProvidersApiResponse {
  prev_page_token?: string,
  next_page_token?: string,
  items: OrganizationProvider[],
}

export async function getAllProviders(context: IContext, request?: GetAllOrganizationProvidersApiRequest): Promise<Result<GetAllOrganizationProvidersApiResponse, ErrCode>> {
  const tag = `${MTAG}.getAllProviders`
  const { config, logger } = context
  const { host } = config.telenutrition.candidhealth

  try {
    const authenticateResult = await authenticate(context);
    if (authenticateResult.isErr()) {
      logger.error(context, tag, `Error authenticating with the candid api`)
      return err(ErrCode.SERVICE);
    }
    const token = authenticateResult.value;

    const { status, data } = await axios.get<GetAllOrganizationProvidersApiResponse>(`${host}/api/organization-providers/v3`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        npi: request?.npi,
        is_rendering: request?.is_rendering,
        limit: request?.limit,
      },
    })

    return ok(data);

  } catch (e) {
    logger.exception(context, tag, e, e?.response?.data)
    return err(ErrCode.EXCEPTION)
  }
}


export type CreateOrganizationProviderApiRequest = Omit<OrganizationProvider, 'organization_provider_id' | 'qualifications'> & {
  qualifications: Omit<Qualification, 'identifier_id'>[]
}

export async function createProvider(context: IContext, request?: CreateOrganizationProviderApiRequest): Promise<Result<OrganizationProvider, ErrCode>> {
  const tag = `${MTAG}.createProvider`
  const { config, logger } = context
  const { host } = config.telenutrition.candidhealth

  try {
    const authenticateResult = await authenticate(context);
    if (authenticateResult.isErr()) {
      logger.error(context, tag, `Error authenticating with the candid api`)
      return err(ErrCode.SERVICE);
    }
    const token = authenticateResult.value;

    const { status, data } = await axios.post<OrganizationProvider>(`${host}/api/organization-providers/v3`,
      request,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      }
    )

    return ok(data);

  } catch (e) {
    logger.exception(context, tag, e, e?.response?.data)
    return err(ErrCode.EXCEPTION)
  }
}

export type UpdateOrganizationProviderApiRequest = Partial<Omit<OrganizationProvider, 'organization_provider_id' | 'qualifications'> & {
  qualifications: (Omit<Qualification, 'identifier_id'> & { type: string })[]
}>

export async function updateProvider(context: IContext, organizationProviderId: string, request?: UpdateOrganizationProviderApiRequest): Promise<Result<OrganizationProvider, ErrCode>> {
  const tag = `${MTAG}.updateProvider`
  const { config, logger } = context
  const { host } = config.telenutrition.candidhealth

  try {
    const authenticateResult = await authenticate(context);
    if (authenticateResult.isErr()) {
      logger.error(context, tag, `Error authenticating with the candid api`)
      return err(ErrCode.SERVICE);
    }
    const token = authenticateResult.value;

    const { status, data } = await axios.patch<OrganizationProvider>(`${host}/api/organization-providers/v3/${organizationProviderId}`,
      request,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      }
    )

    return ok(data);

  } catch (e) {
    logger.exception(context, tag, e, e?.response?.data)
    return err(ErrCode.EXCEPTION)
  }
}

interface GetProviderCredentialingSpansApiRequest {
  payer_uuid?: string,
  as_rendering_provider?: boolean,
  as_contracting_provider?: boolean,
}

export async function getProviderCredentialingSpans(context: IContext, organizationProviderId: string, request?: GetProviderCredentialingSpansApiRequest): Promise<Result<ProviderCredentialingSpan[], ErrCode>> {
  const tag = `${MTAG}.getProviderCredentialingSpans`
  const { config, logger } = context
  const { host } = config.telenutrition.candidhealth

  try {
    const authenticateResult = await authenticate(context);
    if (authenticateResult.isErr()) {
      logger.error(context, tag, `Error authenticating with the candid api`)
      return err(ErrCode.SERVICE);
    }
    const token = authenticateResult.value;

    const { status, data } = await axios.get<ProviderCredentialingSpan[]>(`${host}/api/v1/organization_providers/${organizationProviderId}/provider_credentialing_spans`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          payer_uuid: request?.payer_uuid,
          as_rendering_provider: request?.as_rendering_provider,
          as_contracting_provider: request?.as_contracting_provider
        },
      }
    )

    return ok(data);

  } catch (e) {
    logger.exception(context, tag, e, e?.response?.data)
    return err(ErrCode.EXCEPTION)
  }
}

interface CreateProviderCredentialingSpansApiRequest {
  start_date?: string
  end_date?: string
  regions?: Regions
  rendering_provider_id: string
  contracting_provider_id: string
  payer_uuid: string
  submitted_date?: string
  payer_loaded_date?: string
}

export async function createProviderCredentialingSpan(context: IContext, organizationProviderId: string, request: CreateProviderCredentialingSpansApiRequest): Promise<Result<ProviderCredentialingSpan, ErrCode>> {
  const tag = `${MTAG}.createProviderCredentialingSpan`
  const { config, logger } = context
  const { host } = config.telenutrition.candidhealth

  try {
    const authenticateResult = await authenticate(context);
    if (authenticateResult.isErr()) {
      logger.error(context, tag, `Error authenticating with the candid api`)
      return err(ErrCode.SERVICE);
    }
    const token = authenticateResult.value;

    const { status, data } = await axios.post<ProviderCredentialingSpan>(`${host}/api/v1/organization_providers/${organizationProviderId}/provider_credentialing_spans`,
      request,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      }
    )

    return ok(data);

  } catch (e) {
    logger.exception(context, tag, e, e?.response?.data)
    return err(ErrCode.EXCEPTION)
  }
}


export type UpdateProviderCredentialingSpansApiRequest = Partial<Omit<CreateProviderCredentialingSpansApiRequest, 'rendering_provider_id' | 'contracting_provider_id' | 'payer_uuid'>>

export async function updateProviderCredentialingSpan(context: IContext, organizationProviderId: string, providerCredentialingSpanId: string, request: UpdateProviderCredentialingSpansApiRequest): Promise<Result<ProviderCredentialingSpan, ErrCode>> {
  const tag = `${MTAG}.updateProviderCredentialingSpan`
  const { config, logger } = context
  const { host } = config.telenutrition.candidhealth

  try {
    const authenticateResult = await authenticate(context);
    if (authenticateResult.isErr()) {
      logger.error(context, tag, `Error authenticating with the candid api`)
      return err(ErrCode.SERVICE);
    }
    const token = authenticateResult.value;

    const { status, data } = await axios.patch<ProviderCredentialingSpan>(`${host}/api/v1/organization_providers/${organizationProviderId}/provider_credentialing_spans/${providerCredentialingSpanId}`,
      request,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      }
    )

    return ok(data);

  } catch (e) {
    logger.exception(context, tag, e, e?.response?.data)
    return err(ErrCode.EXCEPTION)
  }
}

export async function deleteProviderCredentialingSpan(context: IContext, organizationProviderId: string, providerCredentialingSpanId: string): Promise<Result<void, ErrCode>> {
  const tag = `${MTAG}.deleteProviderCredentialingSpan`
  const { config, logger } = context
  const { host } = config.telenutrition.candidhealth

  try {
    const authenticateResult = await authenticate(context);
    if (authenticateResult.isErr()) {
      logger.error(context, tag, `Error authenticating with the candid api`)
      return err(ErrCode.SERVICE);
    }
    const token = authenticateResult.value;

    const { status, data } = await axios.delete<ProviderCredentialingSpan>(`${host}/api/v1/organization_providers/${organizationProviderId}/provider_credentialing_spans/${providerCredentialingSpanId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      }
    )

    return ok(undefined);

  } catch (e) {
    logger.exception(context, tag, e, e?.response?.data)
    return err(ErrCode.EXCEPTION)
  }
}


export default {
  getAllProviders,
  createProvider,
  updateProvider,
  getProviderCredentialingSpans,
  createProviderCredentialingSpan,
  updateProviderCredentialingSpan,
  deleteProviderCredentialingSpan,
}
