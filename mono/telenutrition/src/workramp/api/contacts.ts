import * as _ from 'lodash'
import { IContext } from "@mono/common/src/context";
import { Context } from '@mono/common'
import { ErrCode } from "@mono/common/lib/error";
import { Result, err, ok } from "neverthrow";
import axios from "axios";

const CONTACT_ENDPOINT = `https://app.workramp.com/api/v1/`
const MTAG = `telenutrition.workramp.api`


export interface CustomRegistrationFieldValue {
    value: string;
    name: string;
}

export interface SegmentFieldValue {
    name: string
}

export interface User {
    id: string;
    email: string;
    segments: SegmentFieldValue[]; 
    display_name: string;
    first_name: string;
    last_name: string;
    created_at: number; 
    custom_registration_field_values: CustomRegistrationFieldValue[];
}

export interface UserData {
    users: User[];
}

export interface ContactApiResponseRecord {
    page: number;
    per_page: number;
    has_more: boolean;
    url: string;
    data: UserData;
}


async function getAllContacts(context: IContext, academyId: string): Promise<Result<User[], ErrCode>> {
    const TAG = [MTAG, 'getAllContacts']
    const { logger, config } = context
  
    try {
    let has_more: boolean = true
    let page: number = 1
    let contactResults: User[] = [];
  
      do {
        const queryString = `page=${page.toString()}&per_page=100`
        const url = `${CONTACT_ENDPOINT}/academies/${academyId}/users/?${queryString}`
        const { status, data } = await axios.get(
            url,
            {
              headers: { 'Authorization': `Bearer ${config.common.workramp?.apiKey}` },
              validateStatus: () => true,
            },
          )

        if (status !== 200) {
          logger.error(context, TAG, `Error fetching academy contacts`, { academyId, httpCode: status })
          return err(ErrCode.SERVICE)
        }
        const allContacts = data.data.users;
        contactResults.push(...allContacts)
        has_more = data.has_more
        page = page+1
      } while (has_more)
      return ok(contactResults)
    } catch (e) {
      logger.exception(context, TAG, e)
      return err(ErrCode.EXCEPTION)
    }
  }



  export default {
    getAllContacts,
  }