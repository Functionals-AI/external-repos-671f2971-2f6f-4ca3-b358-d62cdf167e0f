import { err, ok, Result } from "neverthrow";
import { DateTime } from "luxon";
import { ListObjectsCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { PassThrough } from "stream";
import { stringify } from "csv-stringify";
import { IContext } from "../../../context";
import { ErrCode } from "../../../error";
import { getActionableReferrals, getRequestedReferralActionsForSource, getScheduleReferral, ReferralAction, ReferralActionStatus, ReferralActionType, Sources, updateScheduleReferralAction, updateScheduleReferralActionToCompleted } from "../../store";
import { getQuestionnaire } from "../../../questionnaire/store";
import { BenefitFactors, BenefitType, determineBenefitType, determineRiskLevel, determineVendor, RiskFactors, RiskLevel, VendorCode } from "../../determinations";
import { DENIAL_REASONS, INPUT_OUTPUT_COLUMN_NAME_MAPPING, OUTPUT_COLUMN_MAPPING, OUTPUT_HARDCODED_VALUES, OUTPUT_INPUT_COLUMN_CONCATENATION_MAPPING, PROVIDERS } from "./mappings";
import { AccountIds } from '../../../account/service';

const MTAG = ['common', 'referral', 'sources', 'santaclara'];

export async function createReferralFoodActions(context: IContext): Promise<Result<void, ErrCode>> {
    const { logger } = context;
    const TAG = [...MTAG, 'createReferralActions'];

    try {
        logger.info(context, TAG, `Creating referral actions for Santa Clara outbound referrals.`);

        // get all actionable Santa Clara referrals
        const actionableSantaClaraReferralResults = await getActionableReferrals(context, { sources: Sources.SantaClara, requireNewQuestionnaire: true });

        if (actionableSantaClaraReferralResults.isErr()) {
            logger.error(context, TAG, 'Error getting completed referrals', { error: actionableSantaClaraReferralResults.error });
            return err(ErrCode.SERVICE);
        }

        const actionableSantaClaraReferrals = actionableSantaClaraReferralResults.value;

        logger.info(context, TAG, `Found ${actionableSantaClaraReferrals.length} actionable Santa Clara referrals.`);

        // for each referral, determine if it should be receiving a food benefit
        // for referrals that should receive a food benefit, determine the benefit type/vendor and create a new referral action
        for (const actionableSantaClaraReferral of actionableSantaClaraReferrals) {
            logger.info(context, TAG, `Processing referral ${actionableSantaClaraReferral.referralId}`, { actionableSantaClaraReferral });

            // get the latest questionnaire data
            const questionnaireResult = await getQuestionnaire(context, actionableSantaClaraReferral.questionnaireId);

            if (questionnaireResult.isErr()) {
                logger.error(context, TAG, `Error getting questionnaire with id ${actionableSantaClaraReferral.questionnaireId}`, { error: questionnaireResult.error });
                continue;
            }

            const questionnaire = questionnaireResult.value;

            // get referral data
            const referralResult = await getScheduleReferral(context, actionableSantaClaraReferral.referralId);

            if (referralResult.isErr()) {
                logger.error(context, TAG, `Error getting referral with id ${actionableSantaClaraReferral.referralId}`, { error: referralResult.error });
                continue;
            }

            const referral = referralResult.value;

            // determine if they get a food referral aka are at risk
            const riskFactors: RiskFactors = {};

            // set risk factors from questionnaire
            riskFactors.questionnaireDeterminationCode = questionnaire.determination_code as RiskLevel;
            riskFactors.questionnaireMetaMedicalRisk = questionnaire.determination_meta?.categoryRisks?.medicalAddedRisk;
            riskFactors.questionnaireMetaLifestyleAndWellbeingRisk = questionnaire.determination_meta?.categoryRisks?.lifestyleAndWellbeingAddedRisk;
            riskFactors.questionnaireMetaFoodInsecurity = questionnaire.determination_meta?.categoryRisks?.foodNutritionInsecurityAddedRisk;

            // set risk factors from referral source data
            const sourceData = referral.sourceData as any;
            const referralDaysOld = Math.floor((Date.now() - new Date(referral?.createdAt).getTime()) / (1000 * 60 * 60 * 24));

            riskFactors.recentlyDischarged = sourceData.Discharged == '1' && referralDaysOld <= 90;
            riskFactors.diabetes = sourceData.Diabetes == '1';
            riskFactors.cardiovascular = sourceData.Cardiovascular == '1';
            riskFactors.chf = sourceData.CHF == '1';
            riskFactors.stroke = sourceData.Stroke == '1';
            riskFactors.lung = sourceData.LUNG == '1';
            riskFactors.hiv = sourceData.HIV == '1';
            riskFactors.cancer = sourceData.Cancer == '1';
            riskFactors.gestationalDiabetes = sourceData.GestationalDiabetes == '1';
            riskFactors.perinatal = sourceData.Perinatal == '1';
            riskFactors.behavioralHealth = sourceData.BehavioralHealth == '1';
            // riskFactors.otherDiagnosis = sourceData.OtherDiagnoses != ''; // not enough info on this field to consider risk factor impact

            logger.debug(context, TAG, 'Risk factors set from referral data and questionnaire', { riskFactors, questionnaire, referral });

            const riskLevel = await determineRiskLevel(context, riskFactors);

            if (riskLevel.isErr()) {
                logger.error(context, TAG, 'Error determining risk level', { error: riskLevel.error });
                continue;
            }

            let referralActionDataResult: Result<any, ErrCode> = err(ErrCode.NOT_FOUND);

            const referralAction: ReferralAction = {
                action_type: ReferralActionType.FOOD_REFERRAL,
                action_date: DateTime.now().toISODate(),
                status: ReferralActionStatus.REQUESTED,
            };

            if (riskLevel.value != 'low') {
                // determine the benefit type (from mandatory question in questionnaire)
                const questionnaireBenefitTypePreference = questionnaire.form_data.meal_type_preference;
                const benefitFactors: BenefitFactors = { questionnaireBenefitTypePreference };

                logger.debug(context, TAG, 'Benefit factors set from questionnaire', { benefitFactors });

                const benefitType = await determineBenefitType(context, benefitFactors);

                if (benefitType.isErr()) {
                    logger.error(context, TAG, 'Error determining benefit type', { error: benefitType.error });
                    continue;
                }

                if (benefitType.value === null) {
                    logger.error(context, TAG, 'Benefit type is null');
                    continue;
                }

                // determine the referral vendor
                const foodBenefit = benefitType.value;
                const vendorPreference = questionnaire.form_data.vendor_preference;

                logger.debug(context, TAG, 'Food benefit and vendor preference set from questionnaire', { foodBenefit, vendorPreference });

                const vendor = await determineVendor(context, AccountIds.SantaClara, { foodBenefit, vendorPreference });

                if (vendor.isErr()) {
                    logger.error(context, TAG, 'Error determining vendor', { error: vendor.error });
                    continue;
                }

                if (vendor.value === null) {
                    logger.error(context, TAG, 'Vendor is null');
                    continue;
                }

                referralActionDataResult = await generateReferralActionData(context, referral.sourceData, foodBenefit, vendor.value);
            } else {
                logger.info(context, TAG, `Referral ${actionableSantaClaraReferral.referralId} is low risk`);

                referralAction.action_type = ReferralActionType.DECLINE;

                referralActionDataResult = await generateReferralActionData(context, referral.sourceData);
            }

            // Update referral actions - add a new referral action with status 'requested'
            if (referralActionDataResult.isErr()) {
                logger.error(context, TAG, 'Error generating referral action data', { error: referralActionDataResult.error });
                continue;
            }

            referralAction.data = referralActionDataResult.value;

            const updateReferralResult = await updateScheduleReferralAction(context, actionableSantaClaraReferral.referralId, referralAction);

            if (updateReferralResult.isErr()) {
                logger.error(context, TAG, 'Error updating referral action', { error: updateReferralResult.error, referralId: actionableSantaClaraReferral.referralId });
                continue;
            }

            logger.info(context, TAG, `Referral ${referralAction.action_type} requested for referralId ${actionableSantaClaraReferral.referralId}`);
        }

        return ok(undefined);
    } catch (error) {
        logger.exception(context, TAG, error);

        return err(ErrCode.EXCEPTION);
    }
}

export async function generateReferralActionData(context: IContext, sourceData: any, foodBenefit?: BenefitType, vendorName?: VendorCode): Promise<Result<any, ErrCode>> {
    const { logger } = context;
    const TAG = [...MTAG, 'generateReferralActionData'];

    try {
        // Generate and/or populate all referral data fields required to generate an outbound referral row in S3
        const referralData = {
            DeterminationDate: new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
            RecommendedServices: '0',
        };

        if (foodBenefit && vendorName) {
            referralData.RecommendedServices = foodBenefit == 'grocery_boxes' ? '2' : '1';
        }

        // For each value in sourceData, which is a key in OUTPUT_COLUMN_MAPPING, get the value from sourceData and set it in referralData
        Object.keys(OUTPUT_COLUMN_MAPPING).forEach((key) => {
            const value = sourceData[key];
            if (value !== undefined) {
                referralData[key] = value;
            }
        });

        // For each mapping in INPUT_OUTPUT_COLUMN_NAME_MAPPING, get the value from sourceData and set it in referralData
        Object.keys(INPUT_OUTPUT_COLUMN_NAME_MAPPING).forEach((key) => {
            const outputKey = INPUT_OUTPUT_COLUMN_NAME_MAPPING[key];
            referralData[outputKey] = sourceData[key];
        });

        // For each mapping in OUTPUT_INPUT_COLUMN_CONCATENATION_MAPPING, concatenate the values from sourceData and set it in referralData
        Object.keys(OUTPUT_INPUT_COLUMN_CONCATENATION_MAPPING).forEach((key) => {
            const outputKey = key;
            const inputKeys = OUTPUT_INPUT_COLUMN_CONCATENATION_MAPPING[key];

            const inputValues = inputKeys.map((inputKey) => sourceData[inputKey]);

            // If inputvalues has two values, join them with a comma, else just set the value
            if (inputValues.length === 2 && inputValues[1] !== '') {
                referralData[outputKey] = inputValues.join(', ');
            } else {
                referralData[outputKey] = inputValues[0];
            }
        });

        // For each hardcoded value, set the value in referralData
        Object.keys(OUTPUT_HARDCODED_VALUES).forEach((key) => {
            referralData[key] = OUTPUT_HARDCODED_VALUES[key];
        });

        // if recommendedServices is 0, set DENIAL_REASON to IE (member determined to be low risk)
        if (referralData.RecommendedServices === '0') {
            const denialReason = DENIAL_REASONS.find(dr => dr.code === 'IE');

            referralData['DenialReason'] = denialReason!.code;
        } else {
            // set provider name and ids from PROVIDERS based on vendorName
            const provider = PROVIDERS.find(p => p.questionnaireName === vendorName);

            referralData['AssignedMtmMsfProviderName'] = provider!.name;
            referralData['AssignedMtmMsfProviderID'] = provider!.ID;
            referralData['AssignedMtmMsfPaytoProviderID'] = provider!.ID;

        }

        // if CURRENT_LINE_OF_BUSINESS column value is 1, and RecommendedServices column value is 2, and CHF column value is 1 or DIABETES column value is 1, set VBID_GROCERY_GIFT_CARD_ELIGIBLE to 1
        if (sourceData.CurrentLineOfBusiness === '1' && referralData.RecommendedServices === '2' && (sourceData.CHF === '1' || sourceData.Diabetes === '1')) {
            referralData['VbidGroceryGiftCardEligible'] = '1';
        } else {
            referralData['VbidGroceryGiftCardEligible'] = '0';
        }

        return ok(referralData);
    } catch (error) {
        logger.exception(context, TAG, error);

        return err(ErrCode.EXCEPTION);
    }
}

export async function createReferralDeclineActions(context: IContext): Promise<Result<void, ErrCode>> {
    const { logger } = context;
    const TAG = [...MTAG, 'createReferralDeclineActions'];

    try {
        logger.info(context, TAG, `Creating referral actions for Santa Clara outbound referrals that are declined.`);

        // TODO: this might need to be updated to get all actionable Santa Clara referrals with potential for being declined
        // get all actionable Santa Clara referrals
        const actionableSantaClaraReferralResults = await getActionableReferrals(context, { sources: Sources.SantaClara, requireNewQuestionnaire: false });

        if (actionableSantaClaraReferralResults.isErr()) {
            logger.error(context, TAG, 'Error getting completed referrals', { error: actionableSantaClaraReferralResults.error });
            return err(ErrCode.SERVICE);
        }

        const actionableSantaClaraReferrals = actionableSantaClaraReferralResults.value;

        // TODO: update this message
        logger.info(context, TAG, `Found ${actionableSantaClaraReferrals.length} actionable Santa Clara referrals with potential for being declined, however we have not yet received requirements for declining referrals for reasons other than low risk.`);

        // for each referral, determine if it should be declined
        // for referrals that should be declined, create a new referral action
        for (const actionableSantaClaraReferral of actionableSantaClaraReferrals) {
            // TODO: should be declined if they are no longer elligible - requires santa clara to send elligibility data
            // TODO: should be declined if they haven't been reached to schedule an appointment - need requirements for this
        }

        return ok(undefined);
    } catch (error) {
        logger.exception(context, TAG, error);

        return err(ErrCode.EXCEPTION);
    }
}

export async function completeReferralFoodActions(context: IContext, bucketName: string, key: string): Promise<Result<void, ErrCode>> {
    const { logger, aws: { s3Client } } = context;
    const TAG = [...MTAG, 'completeReferralActions'];

    try {
        logger.info(context, TAG, `Completing referral actions for Santa Clara outbound referrals.`);

        const requestedActionsResult = await getRequestedReferralActionsForSource(context, Sources.SantaClara);

        if (requestedActionsResult.isErr()) {
            logger.error(context, TAG, 'Error getting requested referral actions', { error: requestedActionsResult.error });
            return err(ErrCode.SERVICE);
        }

        const requestedActions = requestedActionsResult.value;

        logger.info(context, TAG, `Found ${requestedActions.length} requested referral actions.`);

        let referralActionsCompleted = 0;

        if (requestedActions.length != 0) {
            // Ensure file for today does not already exist in S3
            const listObjectsCommand = new ListObjectsCommand({
                Bucket: bucketName,
                Prefix: key,
            });

            const listObjectsCommandResult = await s3Client.send(listObjectsCommand);

            if (listObjectsCommandResult.Contents?.length) {
                logger.error(context, TAG, `File ${key} already exists in S3 bucket ${bucketName}!`);

                return err(ErrCode.ALREADY_EXISTS);
            }

            // Create a PassThrough stream to handle streaming data
            const passThrough = new PassThrough();

            // Start streaming upload to S3
            const upload = new Upload({
                client: s3Client,
                params: {
                    Bucket: bucketName,
                    Key: key,
                    Body: passThrough,
                    ContentType: "text/plain",
                },
            });

            // Function to write a row to the stream & mark as delivered
            async function writeRow(row: string[]) {
                return new Promise<boolean>((resolve) => {
                    stringify([row], {
                        header: false,
                        delimiter: '|',
                        quoted: false,
                        quoted_match: /\|/,
                    }, (err, output) => {
                        if (err) return resolve(false);

                        try {
                            // Write row to stream
                            const success = passThrough.write(output);

                            if (!success) {
                                // Wait for drain event if buffer is full
                                passThrough.once("drain", async () => {
                                    resolve(true);
                                });
                            } else {
                                resolve(true);
                            }
                        } catch (error) {
                            resolve(false);
                        }
                    });
                });
            }

            // write header to the file in S3
            await writeRow(Object.values(OUTPUT_COLUMN_MAPPING));

            try {
                // for each requested action, generate a row to write to a file in S3 and update the referral action
                for (const requestedAction of requestedActions) {
                    // generate a referral row using the data in the requested action (decline or food referral agnostic)
                    const outboundData = requestedAction.referralAction.data;
                    const row: string[] = [];

                    // for each key in the output column mapping, get the value from the outbound data and append it to the row we're building
                    for (const key of Object.keys(OUTPUT_COLUMN_MAPPING)) {
                        let columnValue = outboundData[key];

                        if (columnValue === undefined) {
                            columnValue = '';
                        }

                        // Santa Clara wants the DeterminationDate to be the current date when the file is delivered
                        // Set this here because it's possible that the determination date was set in the past if there was an issue
                        // delivering the row for any referral actions on the same day that they were generated
                        if (key === 'DeterminationDate') {
                            columnValue = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
                        }

                        row.push(columnValue);
                    }

                    // write the row to the file in S3 and mark the referral action as 'completed'
                    const writeRowResult = await writeRow(row);

                    if (writeRowResult) {
                        const updateScheduleReferralActionToCompletedResult = await updateScheduleReferralActionToCompleted(context, requestedAction.referralId);

                        if (updateScheduleReferralActionToCompletedResult.isOk()) {
                            logger.info(context, TAG, `Referral ${requestedAction.referralId} action marked as complete.`);

                            referralActionsCompleted++;
                        } else {
                            throw new Error(`Failed to mark referral ${requestedAction.referralId} as completed.`);
                        }
                    } else {
                        throw new Error(`Failed to write row to S3 for referral ${requestedAction.referralId}.`);
                    }
                }
            } catch (error) {
                logger.error(context, TAG, `Error occurred while processing rows: ${error.message}`);

                return err(ErrCode.EXCEPTION);
            } finally {
                try {
                    passThrough.end(); // Ensure stream is closed
                    await upload.done(); // Ensure S3 upload finishes

                    logger.info(context, TAG, "S3 upload completed.");
                } catch (finalError) {
                    logger.error(context, TAG, `Error finalizing S3 upload: ${finalError.message}`);
                }
            }

            logger.info(context, TAG, `Wrote ${referralActionsCompleted}/${requestedActions.length} referral actions to S3 bucket ${bucketName} with key ${key}.`);
        }

        return ok(undefined);
    } catch (error) {
        logger.exception(context, TAG, error);

        return err(ErrCode.EXCEPTION);
    }
}