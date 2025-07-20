import * as _ from 'lodash'
import { IContext } from "@mono/common/src/context";
import { Context } from '@mono/common'
import { ErrCode } from "@mono/common/lib/error";
import { Result, err, ok } from "neverthrow";
import axios from "axios";
import Logger from '@mono/common/src/logger'

const MTAG = `telenutrition.workramp.api`

const CONTACT_ENDPOINT = `https://app.workramp.com/api/v1/`


export interface PathEnrollment {
    awarded: boolean;
    awarded_at: number | null;
    can_recertify: boolean;
    completed: boolean;
    completed_at: number;
    created_at: number;
    due_at: number;
    expired: boolean;
    expires_at: number;
    has_learner_seen_award: boolean;
    has_learner_seen_completed_and_requires_grading: boolean;
    id: string;
    is_completed_and_requires_grading: boolean;
    is_started: boolean;
    last_accessed_at: number;
    path: {
        created_at: number;
        description: string | null;
        id: string;
        name: string;
    };
    progress_percentage: number;
    public_url: string | null;
    short_id: string | null;
    time_spent_cache: number;
    updated_at: number;
}

export interface SegmentFieldValue {
    name: string
}

export interface Contact {
    academy_segments: SegmentFieldValue[]; 
    created_at: number;
    display_name: string;
    email: string;
    first_name: string;
    id: string;
    is_pending: boolean;
    last_name: string;
}

export interface ContactPathData {
    contact: Contact;
    path_enrollments: PathEnrollment[];
}

async function getAllPathsForAContact(context: IContext, academyId: string, contactId: string): Promise<Result<PathEnrollment[],ErrCode>> {
    const TAG = [MTAG, 'getAllPathsForAContact']
    const { logger, config } = context
    try {
        let has_more: boolean = true
        let page: number = 1
        let pathEnrollmentInfo: PathEnrollment[] = []
    do {
        const queryString = `page=${page.toString()}&per_page=1000`
        const url = `${CONTACT_ENDPOINT}/academies/${academyId}/contacts/${contactId}/paths?${queryString}`
        const { status, data } = await axios.get(
            url,
            {
              headers: { 'Authorization': `Bearer ${config.common.workramp?.apiKey}` },
              validateStatus: () => true,
            },
          )

        if (status !== 200) {
          logger.error(context, TAG, `Error fetching paths for a contact`, { academyId, httpCode: status })
          return err(ErrCode.SERVICE)
        }
        pathEnrollmentInfo = data.data.path_enrollments
        has_more = data.has_more
        page = page+1
      } while (has_more)
      return ok(pathEnrollmentInfo)
    } catch (e) {
      logger.exception(context, TAG, e)
      return err(ErrCode.EXCEPTION)
    }
  }


  export default {
    getAllPathsForAContact,
}