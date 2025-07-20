/**
 * The above TypeScript code defines functions to check the eligibility of a patient using an API
 * configuration.
 * @param {IContext} context - The `context` parameter is an object that contains information and
 * resources needed for the execution of the functions. It typically includes properties like `logger`
 * for logging messages, `config` for configuration settings, and other context-specific data required
 * by the functions.
 * @param {string} patientUid - The `patientUid` parameter is a unique identifier for a patient. It is
 * used to retrieve information about the patient's eligibility for a specific service or program. In
 * the provided code snippet, the `patientUid` is passed to the `handleAPIRequest` function to make an
 * API request and determine
 * @returns The code is returning a Promise that resolves to a Result object containing a boolean value
 * indicating whether the patient is eligible or not, along with an ErrCode in case of any errors.
 */
import axios from 'axios'

import { IContext } from "../../context";
import { ErrCode } from "../../error";
import _ = require("lodash")
import { Result, err, ok } from "neverthrow";

const MTAG = ['common', 'integration', 'cal-optima-safety-net-connect', 'api']
const CALOPTIMA_ORG_ID = 204
const ELIGIBLE_STATUS = 'T'
const INELIGIBLE_STATUS = 'F'

async function handleAPIRequest(context: IContext, patientUid: string): Promise<Result<boolean, ErrCode>> {
    const { logger, config } = context
    const TAG = [...MTAG, 'handleAPIRequest']

    if (!patientUid || !patientUid?.length) {
        logger.error(context, TAG, `No patient uid provided`)
        return err(ErrCode.SERVICE)
    }

    try {
        const filteredConfigs = config.ops?.eligibility?.imports?.filter(orgs => orgs.orgId === CALOPTIMA_ORG_ID)

        if (!filteredConfigs || !filteredConfigs?.length || !filteredConfigs[0]) {
            logger.error(context, TAG, `No org configured for orgId ${CALOPTIMA_ORG_ID}`)
            return err(ErrCode.INVALID_CONFIG)
        }

        const apiConfig = filteredConfigs[0]?.eligibilityAPI

        if (!apiConfig) {
            logger.error(context, TAG, `No eligibility API configured`)
            return err(ErrCode.INVALID_CONFIG)
        }

        const apiKey = apiConfig?.apiKey

        if (!apiKey) {
            logger.error(context, TAG, `API Authentication key not found`)
            return err(ErrCode.INVALID_CONFIG)
        }

        const { status, data: responseData } = await axios({
            method: 'get',
            url: `${apiConfig?.apiUrl}/${patientUid}`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
        })

        const isEligible = _.get(responseData, 'data.isEligible', 'F')

        return ok(isEligible.toUpperCase() === ELIGIBLE_STATUS)
    } catch (e) {
        if (!e.response) {
            logger.exception(context, TAG, e)
            return err(ErrCode.EXCEPTION)
        }

        // Axios error
        if (e.response.status === 404) {
            logger.error(context, TAG, `Patient Not Found`)
            return err(ErrCode.PATIENT_NOT_FOUND)
        } else {
            logger.error(context, TAG, `API check failure HTTP response code: ${e.response.status} Status Message: ${e.response.data?.status}`)
            return err(ErrCode.SERVICE)
        }
    }
}

export async function isPatientEligible(context: IContext, patientUid: string): Promise<Result<boolean, ErrCode>> {
    const { logger } = context
    const TAG = [...MTAG, 'isPatientEligible']

    const apiResult = await handleAPIRequest(context, patientUid)

    if (apiResult.isErr()) {
        logger.error(context, TAG, `Error while checking eligibility for patient ${patientUid}`)
        return err(ErrCode.SERVICE)
    }

    return ok(apiResult.value)
}

export default {
    isPatientEligible,
}
