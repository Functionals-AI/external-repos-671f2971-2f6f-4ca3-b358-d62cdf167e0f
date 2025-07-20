import { Result, ok, err } from 'neverthrow'

import * as db from 'zapatos/db';
import '@mono/common/lib/zapatos/schema';
import * as zs from 'zapatos/schema';

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'

import { performReferralReauthActions, ReauthData, Sheet, PerformReferralActionsOptions } from '@mono/common/src/referral/sources/caloptima';
import {
    CalOptimaReferral,
    CalOptimaService,
    createCaloptimaConnectContext,
    destroyCaloptimaConnectContext,
    MedicalCondition,
    UtilizationCriteria
} from '@mono/common/src/integration/cal-optima-connect/browser';
import Context from '@mono/common/src/context';
import { writeTSVFile } from '@mono/common/src/referral/sources/caloptima/sheet';

const MTAG = ['ops', 'scripts', 'referrals', 'process-completed-referrals-for-reauth'];

const args = process.argv.slice(2);  // Slice off the first two elements (node and script path)

const helpText = `
Usage: node process-completed-referrals-for-reauth.ts [options] <filename>

Options:
  -d, --dry-run    Perform a dry run (fill forms but do not submit)
  -H, --headed     Run in headed mode (show browser window)

`;

// options
let dryRun = false;
let headed = false;
let filename: string | undefined = undefined;
let errorOutputFilename: string | undefined = undefined;

// Loop through arguments to detect flags and options
args.forEach((arg) => {
    if (arg.startsWith('-')) {
        if (arg === '--dry-run' || arg === '-d') {
            dryRun = true;
        }
        if (arg === '--headed' || arg === '-H') {
            headed = true;
        }
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
    console.log(`\nRunning CalOptima Reauth Script...\n\n\tProcessing reauth for referrals in file: ${filename}`);

    errorOutputFilename = (filename as string).replace('.tsv', `_error_rows_${new Date().toISOString() .replace(/-/g, '').replace(/:/g, '').replace(/\..+/, '')}.tsv`);
}

if (dryRun) {
    console.log('\t\tDry run mode - forms will be filled but NOT submitted');
} else {
    console.log('\t\tNormal mode - forms will be filled AND submitted');
}

if (headed) {
    console.log('\t\tHeaded mode - browser window will be visible\n');
} else {
    console.log('\t\tHeadless mode - browser window will NOT be visible\n');
}

async function main(): Promise<Result<void, ErrCode>> {
  const context = await Context.create();
  const { logger } = context;
  const TAG = [...MTAG, 'main'];

  try  {
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

    console.log(`\n\tCreating CalOptima Connect context...`);

    const createCaloptimaConnectContextResult = await createCaloptimaConnectContext(context, headed);

    if (createCaloptimaConnectContextResult.isErr()) {
      logger.error(context, TAG, 'Error creating CalOptima Connect context.', {
         error: createCaloptimaConnectContextResult.error
      });

      return err(createCaloptimaConnectContextResult.error);
    }

    console.log(`\t\tCalOptima Connect context created\n\n\tAttempting to process ${data.length} reauthorization referrals...\n`);

    const calOptimaConnectContext = createCaloptimaConnectContextResult.value;

    if (dryRun) {
      // Setup dialog handling for context since cancelling an assessment creation will trigger a dialog
      calOptimaConnectContext.page.on('dialog', async dialog => {
        await dialog.accept();
      });
    }

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

      const options: PerformReferralActionsOptions = {
        sourceContext: calOptimaConnectContext,
        dryRun,
      }

      const performReferralReauthActionsResult = await performReferralReauthActions(context, reauthData, options);

      if (performReferralReauthActionsResult.isErr()) {
        logger.error(context, TAG, 'Error performing reauth.');

        console.log(`\t\tReauth ${++completed}/${data.length} - error (writing tsv row to error file)`);

        writeTSVFile((errorOutputFilename as string), rows, completed);
      } else {
        console.log(`\t\tReauth ${++completed}/${data.length} - success`);
      }
    }

    console.log(`\n\tProcessed ${completed} reauthorization referrals\n\tDestroying CalOptima Connect context...`);

    const destroyResult = await destroyCaloptimaConnectContext(context, calOptimaConnectContext);

    if (destroyResult.isErr()) {
      logger.error(context, TAG, 'Error destroying CalOptima context.', {
        error: destroyResult.error,
      });
    } else {
      console.log(`\t\tCalOptima Connect context destroyed`);
    }
    return ok(undefined)
  }
  catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION)
  }
}

main().then(() => {
  console.log('Referral reauth completed.')

  process.exit(0)
}).catch(e => {
  console.log('Exception during reauth processing.\n', e)

  process.exit(1)
})