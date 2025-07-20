// Define the column mapping for the output file
export const OUTPUT_COLUMN_MAPPING: Record<string, string> = {
    CIN: 'CIN',
    SCFHPMemberID: 'SCFHP Member ID',
    HealthPlanMemberID: 'Health Plan Member ID',
    MemberFirstName: 'Member First Name',
    MemberLastName: 'Member Last Name',
    MemberResidentialAddress: 'Member Residential Address',
    MemberResidentialCity: 'Member City',
    MemberResidentialZip: 'Member Residential Zip',
    MemberMailingAddress: 'Member Mailing Address',
    MemberMailingCity: 'Member Mailing City',
    MemberMailingZip: 'Member Mailing Zip',
    MemberEmailAddress: 'Member Email Address',
    MemberDateOfBirth: 'Member Date Of Birth',
    AuthorizationID: 'Authorization ID',
    AuthorizationStartDate: 'Authorization Start Date',
    AuthorizationEndDate: 'Authorization End Date',
    RecommendedServices: 'Recommended Services',
    DenialReason: 'Denial Reason',
    DeterminationDate: 'Determination Date',
    AssignedMtmMsfProviderName: 'Assigned MTM/MSF Provider Name',
    AssignedMtmMsfProviderID: 'Assigned MTM/MSF Provider ID',
    AssignedMtmMsfPaytoProviderID: 'Assigned MTM/MSF Payto Provider ID',
    ProviderAssignmentLetterDate: 'Provider Assignment Letter Date',
    VbidGroceryGiftCardEligible: 'VBID Grocery Gift Card Eligible',
    ReferredFromProviderID: 'Referred From Provider ID',
    ReferredFromPaytoProviderID: 'Referred From Payto Provider ID',
    Diagnoses: 'Diagnosis(es)',
    FoodAllergy1MilkDairy: 'Food Allergy 1 - Milk/Dairy',
    FoodAllergy2Egg: 'Food Allergy 2 - Egg',
    FoodAllergy3Fish: 'Food Allergy 3 - Fish',
    FoodAllergy4Shellfish: 'Food Allergy 4 - Shellfish',
    FoodAllergy5Treenut: 'Food Allergy 5 - Tree Nut',
    FoodAllergy6Peanut: 'Food Allergy 6 - Peanut',
    FoodAllergy7Wheat: 'Food Allergy 7 - Wheat',
    FoodAllergy8Soy: 'Food Allergy 8 - Soy',
    FoodAllergy9Sesame: 'Food Allergy 9 - Sesame',
    FoodAllergy10Lactose: 'Food Allergy 10 - Lactose',
    FoodAllergy11NonCeliacGlutenSensitivity: 'Food Allergy 11 - Non-celiac gluten sensitivity',
    FoodAllergy12Histamine: 'Food Allergy 12 - Histamine',
    FoodAllergy13Fodmap: 'Food Allergy 13 - FODMAP',
    FoodAllergy14Nightshades: 'Food Allergy 14 - Nightshades',
};

// Define a mapping of input column names to output column names for columns that have different names between the two but are still passthrough
export const INPUT_OUTPUT_COLUMN_NAME_MAPPING: Record<string, string> = {
    MemberPhysicalCity: 'MemberResidentialCity',
    MemberPhysicalZip: 'MemberResidentialZip',
};

// Define a mapping of output column names to input column names for columns that are concatenated from multiple input columns
export const OUTPUT_INPUT_COLUMN_CONCATENATION_MAPPING: Record<string, string[]> = {
    MemberResidentialAddress: ['MemberPhysicalAddress1', 'MemberPhysicalAddress2'],
    MemberMailingAddress: ['MemberMailingAddress1', 'MemberMailingAddress2'],
};

// Define hardcoded values for output columns
export const OUTPUT_HARDCODED_VALUES: Record<string, string> = {
    ProviderAssignmentLetterDate: '',
    ReferredFromProviderID: 'P0076764',
    ReferredFromPaytoProviderID: 'P0076764',
    Diagnoses: '',
    FoodAllergy1MilkDairy: '0',
    FoodAllergy2Egg: '0',
    FoodAllergy3Fish: '0',
    FoodAllergy4Shellfish: '0',
    FoodAllergy5Treenut: '0',
    FoodAllergy6Peanut: '0',
    FoodAllergy7Wheat: '0',
    FoodAllergy8Soy: '0',
    FoodAllergy9Sesame: '0',
    FoodAllergy10Lactose: '0',
    FoodAllergy11NonCeliacGlutenSensitivity: '0',
    FoodAllergy12Histamine: '0',
    FoodAllergy13Fodmap: '0',
    FoodAllergy14Nightshades: '0',
};

export const DENIAL_REASONS = [
    { code: 'IE', description: 'Ineligible' },
    { code: 'NR', description: 'No Referral' },
];

// Define a list of providers with their corresponding names and IDs
export const PROVIDERS = [
    { questionnaireName: 'aggrigator', name: `Aggrigator, Inc.`, ID: `P0071779` },
    { questionnaireName: 'loaves_and_fishes', name: `Loaves and Fishes Family Kitchen`, ID: `P0077210` },
    { questionnaireName: 'moms_meals', name: `Mom's Meals`, ID: `P0047912` },
    { questionnaireName: 'roots_food_group', name: `Roots Food Group Management LLC`, ID: `P0073018` },
    { questionnaireName: 'sunterra', name: `SunTerra Produce Traders Inc`, ID: `P0074414` },
    { questionnaireName: 'food_health_collective', name: `Food Health Collective`, ID: `P0081123` },
    { questionnaireName: 'ga_foods', name: `G.A. Food Services of Pinellas County LLC`, ID: `P0081125` },
    { questionnaireName: 'homestyle_direct', name: `Homestyle Direct, LLC`, ID: `P0081133` },
    { questionnaireName: 'performance_kitchen', name: `Performance Kitchen, PBC`, ID: `P0081141` },
];