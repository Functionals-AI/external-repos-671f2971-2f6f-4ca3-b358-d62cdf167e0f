import * as fs from 'fs';
import * as readline from 'readline';
import { Result, err, ok } from 'neverthrow'

import { IContext } from '../../../context'
import { ErrCode } from '../../../error'
import { MECHANICALLY_ALTERED_DIET_MAPPING } from '../../../integration/cal-optima-connect/browser';

// Define a type based on the headers in the Google Sheet
export type ReauthPatientData = {
    Cin: string;
    Patient_ID: string;
    Appointment_ID: string;
    Service_date: string;
    VendorID: string;
    VendorName: string;
    Risk_score: string;
    Diagnosis_icd_10: string;
    Food_benefit: string;
    Frequency: string;
    Duration: string;
    Food_allergies_list: string[];
    Mechanical_altered_diet: string;
    Diet_types_list: string[];
    Cuisine_preferences_list: string[];
    Food_sensitivities_list: string[];
    Description: string;
    Message: string;
    Dietitian_recommendation: string;
    First_risk_score: string;
    First_outbound_referral_date: string;
    First_Authorization_end_date: string;
    Ra_retake_flag: string;
    Medical_conditions_list: string[];
    Medical_conditions_other_list: string[];
    //Benefit_exhausted: string;
    Referral_discharge_plan_with_mtm: boolean;
    Referral_member_recently_discharged: boolean;
    Recent_inpatient_yn: boolean;
    //Cafd_diet: string;
    //Cafd_diet_desc: string;
    Cafd_risk: boolean;
    Cafd_coord: boolean;
    Cafd_coord_desc: string;
    //Cafd_delivery: string;
    Original_referral_id: string;
};

export const PROVIDER_MAPPING = {
    'Bento': 'Bento',
    'Gafoods': 'GA Foods',
    'Lifespring': 'Lifespring Home Nutrition',
    'Mealsonwheels': 'Meals on Wheels Orange County',
    'Mtmdemo': 'MTM Demo',
    'Sunterra': 'SunTerra',
};

export const MEDICAL_CONDITION_MATCHING_MAP = {
    'diabetes': 'Diabetes',
    'autoimmune': 'Auto Immune Disorder',
    'kidneydisease': 'Kidney Disease',
    'heartfailure': 'Heart Failure',
    'liverdisease': 'Liver Disease',
    'stroke': 'Stroke',
    'cancer': 'Cancer',
    'copd': 'COPD',
    'obesity': 'Obesity',
    'highcholesterol': 'High Cholesterol',
    'hypertension': 'Hypertension',
    'highbloodpressure': 'Hypertension',
    'arthritis': 'Arthritis',
    'gout': 'Gout',
    'ibd': 'IBD',
    'mentalhealth': 'Mental Health',
    'foodallergy': 'Food Allergy',
    'neurocognitivedisorder': 'Neurocognitive Disorder',
    'chewing': 'Chewing Difficulty',
};

export async function readTSVFile(filePath: string): Promise<string[][]> {
    const fileStream = fs.createReadStream(filePath);

    const lines = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const result: string[][] = [];

    for await (const line of lines) {
        const row = line.split('\t');
        result.push(row);
    }

    return result;
}

export async function writeTSVFile(outputFilePath: string, data: string[][], rowNum: number): Promise<void> {
  if (!fs.existsSync(outputFilePath)) {
    fs.writeFileSync(outputFilePath, data[0].join('\t'));
  }

  fs.appendFileSync(outputFilePath, '\n' + data[rowNum].join('\t'));
}

/*
 * Convert a string of comma-separated values to an array of strings, removing all duplicate and "none" values
 * @param input - The input string
 * @returns An array of strings
 */
export function processListString(input: string): string[] {
    if (input === "") {
        return [];
    }

    const parsedArray: string[] = JSON.parse(input);

    const uniqueArray: string[] = [...new Set(parsedArray)];

    const index = uniqueArray.indexOf("none");

    if (index > -1) {
        uniqueArray.splice(index, 1);
    }

    return uniqueArray;
}

/*
 * Convert a string such as 'E 10 11' to 'E10.11'
 * @param input - The input string
 * @returns The converted string
 */
export function convertICD(input: string): string {
    let firstSpaceRemoved = input.replace(' ', ''); // Remove the first space
    let icd = firstSpaceRemoved.replace(' ', '.'); // Replace the second space with a '.'

    return icd;
}

export function convertMechanicallyAlteredDietValue(value: string): string {
    // Find the key in the MECHANICALLY_ALTERED_DIET_MAPPING object based on the value
    const mappedKey = Object.keys(MECHANICALLY_ALTERED_DIET_MAPPING).find(
        key => MECHANICALLY_ALTERED_DIET_MAPPING[key as keyof typeof MECHANICALLY_ALTERED_DIET_MAPPING].toLowerCase().includes(value.trim().toLowerCase())
    );

    if (!mappedKey) {
        // If it was not found by value, try to find it by key
        if (Object.keys(MECHANICALLY_ALTERED_DIET_MAPPING).includes(value.trim().toLowerCase())) {
          return value.trim().toLowerCase();
        }
    
        throw new Error(`Value "${value}" not found in MECHANICALLY_ALTERED_DIET_MAPPING`);
    }

    return mappedKey;
}

/*
 * Process the medical conditions list, matching the conditions to the keys in the MEDICAL_CONDITION_MATCHING_MAP
 * @param inputArray - The array of medical conditions
 * @returns An object with two arrays: matched and other
 *   - matched: An array of matched conditions
 *   - other: An array of unmatched conditions
 *       The arrays are unique and sorted
 *       The conditions in the matched array have been matched to keys in the MEDICAL_CONDITION_MATCHING_MAP
 *       The conditions in the other array are raw unmatched conditions, any underscores replaced with spaces
 */
export function processMedicalConditions(inputArray: string[]): { matched: string[], other: string[] } {
    let matched: string[] = [];
    let other: string[] = [];

    inputArray.forEach(condition => {
        // Clean the input string (trim, lowercase, remove spaces/underscores)
        const cleanedCondition = condition.trim().toLowerCase().replace(/\_/gi, '').replace(/ /gi, '');

        // Check if any key from the map is a substring of the cleaned condition
        const mappedCondition = Object.keys(MEDICAL_CONDITION_MATCHING_MAP).find(key =>
            cleanedCondition.includes(key)
        );

        if (mappedCondition) {
            matched.push(MEDICAL_CONDITION_MATCHING_MAP[mappedCondition]); // Add to matched conditions
        } else {
            other.push(condition.trim().replace(/\_/gi, ' ')); // Add the original (unmatched) condition to other
        }
    });

    matched = [...new Set(matched)];
    other = [...new Set(other)];

    return { matched, other };
}

function patientVendorToFoodVendorOption(context: IContext, patientVendor: string): Result<string, ErrCode> {
  const { config, logger } = context
  const TAG = [ 'patientVendorToFoodVendorOption' ]

  try {
    const referralConfig = config.common.referrals?.find(r => r.source === 'cal-optima')

    if (!referralConfig) {
      logger.error(context, TAG, 'Referral config is required.', {
        patientVendor,
      })

      return err(ErrCode.INVALID_CONFIG)
    }
    
    let option: string | undefined 

    if (patientVendor.toLowerCase() === 'gafoods' || patientVendor.toLowerCase() === 'ga_foods') {
      option = referralConfig.cal_optima_connect.food_vendors?.ga_foods?.option
    }
    else if (patientVendor.toLowerCase() === 'lifespring') {
      option = referralConfig.cal_optima_connect.food_vendors?.lifespring?.option
    }      
    else if (patientVendor.toLowerCase() === 'mealsonwheels' || patientVendor.toLowerCase() === 'meals_on_wheels') {
      option = referralConfig.cal_optima_connect.food_vendors?.meals_on_wheels?.option
    }
    else if (patientVendor.toLowerCase() === 'sunterra') {
      option = referralConfig.cal_optima_connect.food_vendors?.sunterra?.option
    }
    else if (patientVendor.toLowerCase() === 'bento') {
      option = referralConfig.cal_optima_connect.food_vendors?.bento?.option
    }

    if (!option) {
      logger.error(context, TAG, 'Invalid patient vendor.', {
        patientVendor,
      })

      return err(ErrCode.INVALID_DATA)
    }

    return ok(option)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export function recordToPatientReauthData(context: IContext, record: string[]): Result<ReauthPatientData, ErrCode> {
  const { logger } = context 
  const TAG = [ 'recordToPatientReauthData' ]

  try {
    const fields = record.map(str => str.trim());;

    if (fields[7] == 'None') {
      return err(ErrCode.INVALID_DATA)
    }

    const cuisinePreferences = processListString(fields[13]);
    const foodSensitivities = processListString(fields[14]);
    const medicalConditionsResult = processMedicalConditions(processListString(fields[23]));

    const foodVendorOptionResult = patientVendorToFoodVendorOption(context, fields[4])

    if (foodVendorOptionResult.isErr()) {
      logger.error(context, TAG, 'Reauth error, patient data vendor is invalid, skipping patient...', {
        record,
      })

      return err(foodVendorOptionResult.error)
    }

    const foodVendorOption = foodVendorOptionResult.value      

    const patientData: ReauthPatientData = {
        Cin: fields[0],
        Patient_ID: fields[1],
        Appointment_ID: fields[2],
        Service_date: fields[3],
        VendorID: foodVendorOption,
        VendorName: fields[4].toLowerCase(),
        Risk_score: fields[5].toLowerCase(),
        Diagnosis_icd_10: convertICD(fields[6]),
        Food_benefit: fields[7].toLowerCase().replace(' ', '_'),
        Frequency: fields[8].toLowerCase(),
        Duration: fields[9].toLowerCase(),
        Food_allergies_list: processListString(fields[10]),
        Mechanical_altered_diet: convertMechanicallyAlteredDietValue(fields[11]),
        Diet_types_list: processListString(fields[12]),
        Cuisine_preferences_list: cuisinePreferences,
        Food_sensitivities_list: foodSensitivities,
        Description: fields[15],
        Message: fields[16],
        Dietitian_recommendation: `${fields[17]}${foodSensitivities.length > 0 ? ' Food sensitivities: ' + foodSensitivities.join(', ') : ''}${cuisinePreferences.length > 0 ? ' Cuisine Prefences: ' + cuisinePreferences.join(', ') : ''}`,
        First_risk_score: fields[18],
        First_outbound_referral_date: fields[19],
        First_Authorization_end_date: fields[20],
        Ra_retake_flag: fields[21],
        Medical_conditions_list: medicalConditionsResult.matched,
        Medical_conditions_other_list: medicalConditionsResult.other,
        Referral_discharge_plan_with_mtm: fields[25].toLowerCase() !== '',
        Referral_member_recently_discharged: fields[26].toLowerCase() === 't',
        Recent_inpatient_yn: fields[27].toLowerCase() === 'yes',
        Cafd_risk: fields[30].toLowerCase() === 't',
        Cafd_coord: fields[31].toLowerCase() === 't',
        Cafd_coord_desc: fields[32],
        Original_referral_id: fields[34],
    };

    return ok(patientData)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export const readGoogleSheetData = async (context: IContext, tsvFilePath: string): Promise<Result<{data: ReauthPatientData[], rows: string[][]}, ErrCode>> => {
  const { logger } = context 
  const TAG = [ 'readGoogleSheetData' ]

  try {
    const data: ReauthPatientData[] = [];

    const rows = await readTSVFile(tsvFilePath);

    if (rows?.length) {
        const header = rows[0]; // The first row is the header

        // Iterate through the data rows and map each one to the PatientData type
        for (let i = 1; i < rows.length; i++) {
          const patientDataResult = recordToPatientReauthData(context, rows[i])

          if (patientDataResult.isErr()) {
            logger.error(context, TAG, 'Error processing row, skipping...', {
              row: rows[i]
            })

            continue;
          }

          data.push(patientDataResult.value);
        }
    } else {
        console.log(`Unable to read rows from ${tsvFilePath}...`);

        return err(ErrCode.INVALID_DATA)
    }

    return ok(
      {
        data,
        rows
      }
    );
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  readGoogleSheetData,
}