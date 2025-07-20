import { Result, ok, err } from 'neverthrow'
import { DateTime } from 'luxon'

import * as db from 'zapatos/db';
import '@mono/common/lib/zapatos/schema';
import * as zs from 'zapatos/schema';

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'

import { ReauthData, Sheet } from '@mono/common/src/referral/sources/caloptima';
import {
    CalOptimaReferral,
    CalOptimaService,
    MedicalCondition,
    UtilizationCriteria
} from '@mono/common/src/integration/cal-optima-connect/browser';
import Context from '@mono/common/src/context';
import { transformReauthDataToActionData } from '@mono/common/src/referral/sources/caloptima/caloptima';
import { ReferralActionType, updateScheduleReferralAction } from '@mono/common/src/referral/store';

const MTAG = ['ops', 'scripts', 'referrals', 'update-schedule-referral-actions'];

const args = process.argv.slice(2);  // Slice off the first two elements (node and script path)

const helpText = `
Usage: node update-schedule-referral-actions.ts <filename>
`;

// options
let filename: string | undefined = undefined;

// Loop through arguments to detect flags and options
args.forEach((arg) => {
    if (arg.startsWith('-')) {
        if (arg === '--help' || arg === '-h') {
            console.error(helpText);
            process.exit(0);
        }
    } else {
        filename = arg;
    }
});

if (filename === undefined) {
    console.error(helpText);
    process.exit(1);
} else {
    console.log(`\nRunning Referral Actions Update Script...\n\n\tProcessing referrals in file: ${filename}`);
}

async function main(): Promise<Result<void, ErrCode>> {
    const context = await Context.create();
    const { logger } = context;
    const TAG = [...MTAG, 'main'];

    try {
        if (!filename) {
            logger.error(context, TAG, 'Filename is required.')

            return err(ErrCode.ARGUMENT_ERROR)
        }

        const readResult = await Sheet.readGoogleSheetData(context, filename)

        if (readResult.isErr()) {
            logger.error(context, TAG, 'Error reading sheet.', {
                filename,
            })

            return err(readResult.error)
        }

        const { data, rows } = readResult.value

        let completed = 0;

        console.log(`\n\tUpdating ${data.length} referral actions...`);

        for (const patient of data) {
            if (patient.Medical_conditions_other_list.length > 0) {
                patient.Medical_conditions_list.push('Other');
            }

            const service: CalOptimaService = {
                cin: patient.Cin,
                taskDate: patient.Service_date,
                appointmentDate: patient.Service_date,
                serviceRequestDescription: patient.Description,
                taskDescription: patient.Message,
                note: patient.Dietitian_recommendation,
                agencyRelationship: 'Foodsmart',
                referredBy: 'Foodsmart',
                benefitExhausted: true, // per Chitra/Hollie this needs to be true for all reauths
                dischargePlan: patient.Referral_discharge_plan_with_mtm,
                medicalConditions: patient.Medical_conditions_list as MedicalCondition[],
                otherMedicalConditionDescription: patient.Medical_conditions_other_list.length > 0 ? patient.Medical_conditions_other_list.join(', ') : undefined,
                utilizationCriteria: ([(patient.Referral_member_recently_discharged || patient.Recent_inpatient_yn) && 'Recently Discharged', patient.Cafd_risk && 'High Risk of Hospitalization', patient.Cafd_coord && 'Extensive Care Coordination Needs'].filter(Boolean)) as UtilizationCriteria[],
                careCoordinationNeedDescription: patient.Cafd_coord_desc ? patient.Cafd_coord_desc : undefined,
                specialDiet: patient.Diet_types_list[0] ? true : false,
                specialDietDescription: patient.Diet_types_list[0] || undefined,
                otherDeliveryServices: false,
                hasFridge: true,
                hasReheat: true,
            };

            const referral: CalOptimaReferral = {
                patientId: '',
                serviceId: '',
                riskScore: patient.Risk_score,
                diagnosisIcd10: patient.Diagnosis_icd_10,
                foodBenefit: patient.Food_benefit,
                frequency: patient.Frequency,
                duration: patient.Duration,
                allergies: patient.Food_allergies_list,
                mechanicalAlteredDiet: patient.Mechanical_altered_diet,
                foodVendorOption: patient.VendorID,
                foodVendorName: patient.VendorName,
                dietitianRecommendation: patient.Dietitian_recommendation,
                specialRequest: patient.Diet_types_list[0] || undefined,
                serviceDate: patient.Service_date,
                description: patient.Description,
                message: patient.Message,
            };

            const originalReferralId = +patient.Original_referral_id;

            if (!originalReferralId) {
                console.error(`\t\tReauth ${++completed}/${data.length} - error: Original referral ID not a valid number`);
                continue;
            }

            const reauthData: ReauthData = {
                service,
                referral,
                originalReferralId,
            };

            const referralActionReauthData = await transformReauthDataToActionData(reauthData);

            const action = {
                action_type: ReferralActionType.FOOD_REAUTHORIZATION,
                action_date: DateTime.now().toISODate(),
                data: referralActionReauthData,
            };


            await updateScheduleReferralAction(context, originalReferralId, action);


            console.log(`\t\tReauth ${++completed}/${data.length} - success`);
        }

        console.log(`\n\tUpdated ${completed} reauth referral actions.`);

        return ok(undefined)
    }
    catch (e) {
        logger.exception(context, TAG, e);

        return err(ErrCode.EXCEPTION)
    }
}

main().then(() => {
    console.log('Referral action updates completed.')

    process.exit(0)
}).catch(e => {
    console.log('Exception during referral action updates.\n', e)

    process.exit(1)
})