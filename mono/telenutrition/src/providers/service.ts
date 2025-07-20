import '@mono/common/lib/zapatos/schema'
import { Result, err, ok } from "neverthrow"
import { Logger } from "@mono/common"
import { ErrCode } from "@mono/common/lib/error"
import { IContext } from "@mono/common/lib/context"

import Store from "./store";
const MTAG = Logger.tag();

export type ProviderProfileStateEntry = {
    providerId: number
    providerid: number
    firstName?: string
    firstname?: string
    lastName?: string
    lastname?: string
    displayName?: string
    displayname?: string
    languages?: string[]
    background?: string
    state: string
    hobbies?: string
    education?: string
    experience?: string
    specialties?: string
    carePhilosophy?: string
    carephilosophy?: string
    favoriteFoods?: string
    favoritefoods?: string
    professionalTitles?: string
    professionaltitles?: string
    specialtyCategories?: string
    specialtycategories?: string
}

export type ProviderProfile = ProviderProfileStateEntry & { states?: string[] }

function repairProfileCasing (record: ProviderProfile) {
    if (record.providerid) record.providerId = record.providerid;
    if (record.firstname) record.firstName = record.firstname;
    if (record.lastname) record.lastName = record.lastname;
    if (record.displayname) record.displayName = record.displayname;
    if (record.carephilosophy) record.carePhilosophy = record.carephilosophy;
    if (record.favoritefoods) record.favoriteFoods = record.favoritefoods;
    if (record.professionaltitles) record.professionalTitles = record.professionaltitles;
    if (record.specialtycategories) record.specialtyCategories = record.specialtycategories;

    return record;
}

function coalesceProfilesByState (profiles: ProviderProfile[], profile: ProviderProfileStateEntry): ProviderProfile[] {
    const existingIndex: number = profiles.findIndex(p => p && p.providerId === profile.providerId);
    const profileExists: boolean = existingIndex >= 0 && Array.isArray(profiles[existingIndex].states)

    if (profileExists) {
        profiles![existingIndex]!.states!.push(profile.state);
    } else if (profile.state) {
        const addition: ProviderProfile = { ...profile, states: [profile.state] }

        profiles.push(addition);
    }

    return profiles;
}

export async function getAllProviderPublicProfiles (context: IContext): Promise<Result<ProviderProfile[], ErrCode>> {
    const { logger } = context;

    const TAG = [...MTAG, 'getAllProviderPublicProfiles'];
    try {
        const profileRecords = await Store.fetchAllProviderPublicProfiles(context);

        if (profileRecords.isErr() || !profileRecords.value) {
            return err(ErrCode.EXCEPTION);
        }

        const profiles: ProviderProfileStateEntry[] = (profileRecords!.value || []).map(repairProfileCasing);
        const coalescedProfiles: ProviderProfile[] = profiles?.reduce(coalesceProfilesByState, [])
            .map(record => {
                if (record && !record.displayName && record.firstName && record.lastName)
                    record.displayName = [record.firstName, record.lastName].join(' ');
                return record;
            });

        return ok(coalescedProfiles);
    } catch (e) {
        logger.exception(context, TAG, e);
        return err(ErrCode.EXCEPTION);
    }
}
