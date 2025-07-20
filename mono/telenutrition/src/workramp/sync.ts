import { IContext } from '@mono/common/lib/context';
import { Result, err, ok } from 'neverthrow';
import { ErrCode } from '@mono/common/lib/error';
import '@mono/common/lib/zapatos/schema';
import { Context, Logger } from '@mono/common'
import * as zs from 'zapatos/schema';
import * as db from 'zapatos/db';
import WorkrampApi from '../workramp/api'
import Store from "../scheduling/provider/store";
import Provider from "../scheduling/provider";
import { chunk } from 'lodash'
import * as _ from 'lodash'
import provider from '../scheduling/provider';


const MTAG = `telenutrition.workramp.sync`

export async function syncContacts(context: IContext): Promise<Result<boolean, ErrCode>> {
    const {logger, config, store: {writer}} = context
    const currentDate = new Date();
    const TAG = [MTAG, 'syncContacts']
  
    try {
      const pool = await writer()
      const fetchResult = await WorkrampApi.Contacts.getAllContacts(context, `${config.common.workramp?.academyId}`)
  
      if (fetchResult.isErr()) {
        return err(fetchResult.error)
      }
  
      const contacts = fetchResult.value
  
      logger.info(context, TAG, `Fetched ${contacts.length} contacts from the Workramp Api`)
      
      const storeProviders = await db.select('telenutrition.schedule_provider', { npi: db.conditions.isNotNull }).run(pool);
      const storeContactsByNpiMap = new Map(storeProviders.map(p => [p.npi, p.provider_id]))
      const records: zs.telenutrition.workramp_contact.Insertable[] = contacts.map(contact => {
        const customFieldValues = contact.custom_registration_field_values;
        let npi: number | null = null;
        let provider_id: number | null = null;
        // if custom registration field values exist and the 'npi' field is present
        if (customFieldValues.length > 0) {
            const npiField = customFieldValues.find(field => field.name === "npi");
            if (npiField) {
                npi = parseInt(npiField.value);
                provider_id = storeContactsByNpiMap.get(npi) ?? null;
            }
        }
        return {
            workramp_contact_id: contact.id,
            email: contact.email,
            first_name: contact.first_name,
            last_name: contact.last_name,
            npi: npi,
            provider_id: provider_id,
            updated_at: currentDate
        };
    });
    // insert or update table in PG using workramp_contact_id
      const upsertResult = await db.upsert('telenutrition.workramp_contact', records, ['workramp_contact_id']).run(pool)
      logger.info(context, 'syncContacts', `Upserted ${upsertResult.length} contacts`)
      logger.info(context, MTAG, `Updated contacts with provider ID if NPI is available within Workramp response`)
      return ok(true)
    } catch (e) {
      logger.exception(context, 'tag', e)
      return err(ErrCode.EXCEPTION)
    }
  }


  export async function syncContactPaths(context: IContext): Promise<Result<boolean, ErrCode>> {
    const {logger, config, store: {writer}} = context
    const currentDate = new Date();
    const TAG = [MTAG, 'syncContactPaths']

    try {
        const pool = await writer()
        const pathRecords: zs.telenutrition.workramp_contact_path.Insertable[] = []
        const storeContacts = await db.select('telenutrition.workramp_contact', db.all).run(pool);
        let contactCount: number = 0
        for(let contact of storeContacts){
            contactCount = contactCount+1
            const fetchResult = await WorkrampApi.ContactPaths.getAllPathsForAContact(context, `${config.common.workramp?.academyId}`, contact.workramp_contact_id)    
            if (fetchResult !== null) {
              const workrampPathData = fetchResult['value']
              if (workrampPathData !== undefined) {
                const pathsToUpsert: zs.telenutrition.workramp_contact_path.Insertable[] = workrampPathData
                .map(wrc => ({
                    workramp_contact_id: contact.workramp_contact_id,
                    path_id: wrc.path.id,
                    path_name: wrc.path.name,
                    path_created_at: wrc.created_at === null ? null : new Date(wrc.created_at),
                    path_due_at: wrc.due_at === null ? null : new Date(wrc.due_at),
                    path_completed_at: wrc.completed_at === null ? null : new Date(wrc.completed_at),
                    progress_percentage: wrc.progress_percentage, 
                    updated_at: currentDate, 
                }))
                let upsertedContactIds: string[] = []
                const upsertResult = await db.upsert('telenutrition.workramp_contact_path', pathsToUpsert, ['workramp_contact_id', 'path_id']).run(pool)
                upsertedContactIds = upsertedContactIds.concat(upsertResult.map(c => c.workramp_contact_id))
                logger.info(context, TAG, `Upserted ${upsertResult.length} path records for ${contact.workramp_contact_id} into the store.`)
              }
            else {
              continue
            }
          }
          else {
            continue
          }
  }      
    logger.info(context, TAG, `Fetched records for ${contactCount} contacts`)
    return ok(true)
    } catch (e) {
      logger.exception(context, 'tag', e)
      return err(ErrCode.EXCEPTION)
    }
  }

export default {
    syncContacts,
    syncContactPaths,
}