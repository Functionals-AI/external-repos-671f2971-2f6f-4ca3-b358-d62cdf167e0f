import { err, ok, Result } from 'neverthrow';
import { ErrCode } from '../error';
import { IContext } from '../context';
import { z } from 'zod';
import { getFoodVendors } from '../food-vendor/store';

const MTAG = ['common', 'referral'];

export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskFactors {
  questionnaireDeterminationCode?: RiskLevel;
  questionnaireMetaMedicalRisk?: boolean;
  questionnaireMetaLifestyleAndWellbeingRisk?: boolean;
  questionnaireMetaFoodInsecurity?: boolean;
  recentlyDischarged?: boolean;
  diabetes?: boolean;
  cardiovascular?: boolean;
  chf?: boolean;
  stroke?: boolean;
  lung?: boolean;
  hiv?: boolean;
  cancer?: boolean;
  gestationalDiabetes?: boolean;
  perinatal?: boolean;
  behavioralHealth?: boolean;
  otherDiagnosis?: boolean;
}

export async function determineRiskLevel(
  context: IContext,
  riskFactors: RiskFactors,
): Promise<Result<RiskLevel | null, ErrCode>> {
  const { logger } = context;

  const TAG = [...MTAG, 'determineRiskLevel'];

  try {
    /*
            Each of the following buckets is worth 1 point:
                medical risk, lifestyle & wellbeing risk, food/nutrition insecurity risk

            Determined risk based on points:
                0 or 1:     low risk
                2:          medium risk
                3:     high risk
        */

    // if recently discharged (from referral) or questionnaire determined high risk, return high risk
    if (riskFactors.recentlyDischarged || riskFactors.questionnaireDeterminationCode === 'high') {
      logger.info(
        context,
        TAG,
        'Recently discharged per referral or questionnaire determined high risk, returning high risk',
      );

      return ok('high');
    }

    // determine and count up points from medical, lifestyle & wellbeing, food/nutrition insecurity and recent inpatient visit
    let riskBucketCount = [
      riskFactors.questionnaireMetaMedicalRisk,
      riskFactors.questionnaireMetaLifestyleAndWellbeingRisk,
      riskFactors.questionnaireMetaFoodInsecurity,
    ].filter((c) => c === true).length;

    // if the questionnaire did not determine medical risk, check for other medical conditions from referral
    if (!riskFactors.questionnaireMetaMedicalRisk) {
      const medicalAddedRisk =
        riskFactors.diabetes ||
        riskFactors.cardiovascular ||
        riskFactors.chf ||
        riskFactors.stroke ||
        riskFactors.lung ||
        riskFactors.hiv ||
        riskFactors.cancer ||
        riskFactors.gestationalDiabetes ||
        riskFactors.perinatal ||
        riskFactors.behavioralHealth ||
        riskFactors.otherDiagnosis;

      if (medicalAddedRisk) {
        logger.info(context, TAG, 'Medical added risk from referral, incrementing risk bucket count');

        riskBucketCount++;
      }
    }

    if (riskBucketCount >= 3) {
      logger.info(context, TAG, `Risk bucket count is ${riskBucketCount}, returning high risk`);

      return ok('high');
    }

    if (riskBucketCount === 2) {
      logger.info(context, TAG, `Risk bucket count is ${riskBucketCount}, returning medium risk`);

      return ok('medium');
    }

    logger.info(context, TAG, `Risk bucket count is ${riskBucketCount}, returning low risk`);

    return ok('low');
  } catch (error) {
    logger.exception(context, TAG, error);

    return err(ErrCode.EXCEPTION);
  }
}

export const BenefitTypesArray = [
  'prepared_meals',
  'frozen_meals',
  'refrigerated_meals',
  'hot_meals',
  'grocery_boxes',
] as const;

export type BenefitType = (typeof BenefitTypesArray)[number];

export interface FoodOffering {
  offeringType: BenefitType;
  displayLabel: string;
}

export interface BenefitFactors {
  questionnaireBenefitTypePreference: BenefitType;
}

export async function determineBenefitType(
  context: IContext,
  benefitFactors: BenefitFactors,
): Promise<Result<BenefitType | null, ErrCode>> {
  const { logger } = context;

  const TAG = [...MTAG, 'determineBenefitType'];

  try {
    logger.info(context, TAG, `Determined benefit type: ${benefitFactors.questionnaireBenefitTypePreference}`);

    return ok(benefitFactors.questionnaireBenefitTypePreference);
  } catch (error) {
    logger.exception(context, TAG, error);

    return err(ErrCode.EXCEPTION);
  }
}

export const VendorCodeSchema = z.enum([
  'bento',
  'sunterra',
  'lifespring',
  'meals_on_wheels',
  'ga_foods',
  'loaves_and_fishes',
  'roots_food_group',
  'aggrigator',
  'moms_meals',
]);
export type VendorCode = z.infer<typeof VendorCodeSchema>;

export interface VendorData {
  vendorName: VendorCode;
  vendorDisplayLabel: string;
  vegetarianOptions?: boolean;
  offerings: BenefitType[];
}

export interface VendorPreferenceData {
  foodBenefit: string;
  vendorPreference?: string;
  previousVendor?: string;
  vegetarianFlag?: boolean;
}

export async function determineVendor(
  context: IContext,
  source: number,
  data: VendorPreferenceData,
): Promise<Result<VendorCode | null, ErrCode>> {
  const { logger } = context;

  const TAG = [...MTAG, 'determineVendor'];

  try {
    let vendor: VendorCode | null = null;

    // get vendor data
    const vendorResult = await getFoodVendors(context, source);

    if (vendorResult.isErr()) {
      logger.error(context, TAG, 'Error getting food vendors');
      return err(vendorResult.error);
    }

    let vendors = vendorResult.value;

    // Check for invalid foodBenefit type
    if (data.foodBenefit && !BenefitTypesArray.includes(data.foodBenefit as BenefitType)) {
      logger.info(context, TAG, `foodBenefit ${data.foodBenefit} is not a valid type, returning null`);
      return ok(vendor);
    }

    // All possible vendors for the source
    let possibleVendors = vendors;

    if (possibleVendors.length === 0) {
      logger.info(context, TAG, `No vendors available for source: ${source}, returning null`);

      return ok(vendor);
    }

    // Filter out vendors based on whether they offer vegetarian options
    if (data.vegetarianFlag) {
      possibleVendors = possibleVendors.filter((vendor) => vendor.vegetarianOptions);
    }

    // Filter out vendors based on food benefits offered
    if (data.foodBenefit) {
      possibleVendors = possibleVendors.filter((vendor) => vendor.offerings.includes(data.foodBenefit as BenefitType));
    }

    // Check if the member has a vendor preference and if that vendor is in the list of possible vendors
    if (data.vendorPreference) {
      if (possibleVendors.find((vendor) => vendor.vendorName === data.vendorPreference)) {
        possibleVendors = possibleVendors.filter((vendor) => vendor.vendorName === data.vendorPreference);
      }
    }

    // From the remaining possible vendors, choose previous vendor if available else randomly select one
    if (data.previousVendor && possibleVendors.find((vendor) => vendor.vendorName === data.previousVendor)) {
      vendor = possibleVendors.find((vendor) => vendor.vendorName === data.previousVendor)?.vendorName ?? null;
    } else if (possibleVendors.length > 0) {
      const randomIndex = Math.floor(Math.random() * possibleVendors.length);
      vendor = possibleVendors[randomIndex].vendorName ?? null;
    }

    logger.info(context, TAG, `Selected vendor: ${vendor} based on data: ${JSON.stringify(data)}`);

    if (!vendor) {
      /*
       *  Per Chitra - Always assign a vendor! Try first assigning within the same category
       *  next within meals (Hot meals <-->Refrigerated meals <--> Frozen meals)
       *  and then toggle categories to MTM vs groceries.
       */

      // Vendors are already source specific from the SQL query, no need to filter by source

      // Try to keep vegetarian options if available
      if (data.vegetarianFlag && vendors.find((vendor) => vendor.vegetarianOptions)) {
        logger.debug(context, TAG, `Vegetarian options available, filtering backup vendors`);

        vendors = vendors.filter((vendor) => vendor.vegetarianOptions);
      }

      // Next, try to find a vendor that offers the same food benefit type, if not try to match closest type first
      if (data.foodBenefit && vendors.find((vendor) => vendor.offerings.includes(data.foodBenefit as BenefitType))) {
        logger.debug(context, TAG, `Food benefit ${data.foodBenefit} available, filtering backup vendors`);

        vendors = vendors.filter((vendor) => vendor.offerings.includes(data.foodBenefit as BenefitType));
      } else if (
        (data.foodBenefit === 'frozen_meals' || data.foodBenefit === 'hot_meals') &&
        vendors.find((vendor) => vendor.offerings.includes('refrigerated_meals'))
      ) {
        logger.debug(
          context,
          TAG,
          `Food benefit ${data.foodBenefit} not available but refrigerated_meals is, filtering backup vendors`,
        );

        vendors = vendors.filter((vendor) => vendor.offerings.includes('refrigerated_meals'));
      } else if (
        data.foodBenefit === 'frozen_meals' &&
        vendors.find((vendor) => vendor.offerings.includes('hot_meals'))
      ) {
        logger.debug(
          context,
          TAG,
          `Food benefit ${data.foodBenefit} not available but hot_meals is, filtering backup vendors`,
        );

        vendors = vendors.filter((vendor) => vendor.offerings.includes('hot_meals'));
      } else if (
        data.foodBenefit === 'hot_meals' &&
        vendors.find((vendor) => vendor.offerings.includes('frozen_meals'))
      ) {
        logger.debug(
          context,
          TAG,
          `Food benefit ${data.foodBenefit} not available but frozen_meals is, filtering backup vendors`,
        );

        vendors = vendors.filter((vendor) => vendor.offerings.includes('frozen_meals'));
      } else if (
        data.foodBenefit === 'refrigerated_meals' &&
        vendors.find((vendor) => vendor.offerings.includes('frozen_meals'))
      ) {
        logger.debug(
          context,
          TAG,
          `Food benefit ${data.foodBenefit} not available but frozen_meals is, filtering backup vendors`,
        );

        vendors = vendors.filter((vendor) => vendor.offerings.includes('frozen_meals'));
      } else if (
        data.foodBenefit === 'refrigerated_meals' &&
        vendors.find((vendor) => vendor.offerings.includes('hot_meals'))
      ) {
        logger.debug(
          context,
          TAG,
          `Food benefit ${data.foodBenefit} not available but hot_meals is, filtering backup vendors`,
        );

        vendors = vendors.filter((vendor) => vendor.offerings.includes('hot_meals'));
      } else {
        logger.debug(
          context,
          TAG,
          `Food benefit ${data.foodBenefit} or similar is not available, no filtering done on backup vendors`,
        );
      }

      // Now that we've filtered as much as we can, choose a random vendor from the remaining list
      logger.debug(context, TAG, `Choosing randomly from fallback vendors: ${JSON.stringify(vendors)}`);

      const randomIndex = Math.floor(Math.random() * vendors.length);
      vendor = vendors[randomIndex].vendorName;

      logger.info(context, TAG, `Selected fallback vendor: ${vendor}`);
    }

    return ok(vendor);
  } catch (error) {
    console.log(error);
    logger.exception(context, TAG, error);

    return err(ErrCode.EXCEPTION);
  }
}
