import { AccountIds } from "@mono/common/lib/account/service";

const referrerOrganizations: { title: string; value: number, account?: number }[] = [
  { title: "Aetna Better Health Of Illinois", value: 202, account: AccountIds.AetnaABHIL }, 
  { title: "Aetna Medicare", value: 170, account: AccountIds.AetnaMedicare },
  { title: "Banner - University Family Care", value: 200, account: AccountIds.BannerHealth },
  { title: "CareOregon", value: 191, account: AccountIds.CareOregon },
  { title: "Chorus Community Health Plans", value: 174, account: AccountIds.CCHPMedicaid },
  { title: "CDPHP Provider", value: 181, account: AccountIds.CDPHP },
  { title: "CDPHP Care Manager", value: 181, account: AccountIds.CDPHP },
  { title: "Cigna Maternity", value: 193, account: AccountIds.CignaHouse },
  { title: "CountyCare", value: 18, account: AccountIds.CountyCare },
  { title: "Healthfirst Behavioral Health", value: 183, account: AccountIds.Healthfirst },
  { title: "Healthfirst Case Manager", value: 183, account: AccountIds.Healthfirst },
  { title: "HSCSN (Health Services for Children with Special Needs Inc)", value: 20, account: AccountIds.HSCSN },
  { title: "Independent Health", value: 8, account: AccountIds.IndependentHealth },
  { title: "Martin's Point Employees", value: 176, account: AccountIds.MartinsPointHealthCareInc },
  { title: "Martin's Point Generations Advantage", value: 177, account: AccountIds.MartinsPointGA },
  { title: "Mass General Brigham HP", value: 24, account: AccountIds.MassGeneralBrigham },
  { title: "M&T Bank", value: 146, account: AccountIds.MTBank },
  { title: "Quartz", value: 195, account: AccountIds.Quartz },
  { title: "Salesforce (Aetna)", value: 173, account: AccountIds.Salesforce },
  { title: "Salesforce (Included Health)", value: 173, account: AccountIds.Salesforce },
  { title: "Salesforce (United Health)", value: 173, account: AccountIds.Salesforce },
  { title: "Samaritan", value: 206, account: AccountIds.Samaritan },
  { title: "UHC DSNP", value: 199, account: AccountIds.UHC_DSNP },
  { title: "Umpqua Health Alliance Members (UHA)", value: 184, account: AccountIds.UmpquaMedicaid },
];

const audioAppointmentTypeIds: Record<number, number> = {
  2: 142, // 60 minute initial
  3: 141, // 30 minute follow-up
  221: 341 // 60 minute follow-up
};

type TwoTieredList = {
  [k: string]: {
    highLevelSearchTerm?: string;
    specificReason: string;
    defaultValue: string;
    icd10Code: string;
  }[];
};

const reasonsList: TwoTieredList = {
  "Chronic Kidney Disease": [
    {
      highLevelSearchTerm: "Renal Transplant",
      specificReason: "Post Kidney Transplant (<36 mos)",
      defaultValue: "0",
      icd10Code: "Z94.0",
    },
    {
      highLevelSearchTerm: "Renal Disease, CKD",
      specificReason: "Stage 1 Chronic Kidney Disease",
      defaultValue: "0",
      icd10Code: "N18.1",
    },
    {
      highLevelSearchTerm: "Renal Disease, CKD",
      specificReason: "Stage 2 Chronic Kidney Disease",
      defaultValue: "0",
      icd10Code: "N18.2",
    },
    {
      highLevelSearchTerm: "Renal Disease, CKD",
      specificReason: "Stage 3 Chronic Kidney Disease",
      defaultValue: "0",
      icd10Code: "N18.3",
    },
    {
      highLevelSearchTerm: "Renal Disease, CKD",
      specificReason: "Stage 4 Chronic Kidney Disease",
      defaultValue: "0",
      icd10Code: "N18.4",
    },
    {
      highLevelSearchTerm: "Renal Disease, CKD",
      specificReason: "Stage 5 Chronic Kidney Disease",
      defaultValue: "0",
      icd10Code: "N18.5",
    },
    {
      highLevelSearchTerm: "Renal Disease, CKD",
      specificReason: "End Stage Renal Disease",
      defaultValue: "0",
      icd10Code: "N18.6",
    },
    {
      highLevelSearchTerm: "Renal Disease, CKD",
      specificReason: "Chronic Kidney Disease, Unspecified",
      defaultValue: "1",
      icd10Code: "N18.9",
    },
  ],
  "Diabetes Mellitus": [
    {
      highLevelSearchTerm: "DM",
      specificReason: "Type 1 DM with Ketoacidosis",
      defaultValue: "0",
      icd10Code: "E10.1",
    },
    {
      highLevelSearchTerm: "DM",
      specificReason: "Type 1 DM with Kidney Complications",
      defaultValue: "0",
      icd10Code: "E10.2",
    },
    {
      highLevelSearchTerm: "DM",
      specificReason: "Type 1 DM with Ophthalmic Complications",
      defaultValue: "0",
      icd10Code: "E10.3",
    },
    {
      highLevelSearchTerm: "DM",
      specificReason: "Type 1 DM with Neurological Complications",
      defaultValue: "0",
      icd10Code: "E10.4",
    },
    {
      highLevelSearchTerm: "DM",
      specificReason: "Type 1 DM with Circulatory Complications",
      defaultValue: "0",
      icd10Code: "E10.5",
    },
    {
      highLevelSearchTerm: "DM",
      specificReason: "Type 1 DM with Other Complications",
      defaultValue: "0",
      icd10Code: "E10.8",
    },
    {
      highLevelSearchTerm: "DM",
      specificReason: "Type 1 DM without Complications",
      defaultValue: "1",
      icd10Code: "E10.9",
    },
    {
      highLevelSearchTerm: "DM",
      specificReason: "Type 2 DM with Hyperosmolarity",
      defaultValue: "0",
      icd10Code: "E11.0",
    },
    {
      highLevelSearchTerm: "DM",
      specificReason: "Type 2 DM with Ketoacidosis",
      defaultValue: "0",
      icd10Code: "E11.1",
    },
    {
      highLevelSearchTerm: "DM",
      specificReason: "Type 2 DM with Kidney Complications",
      defaultValue: "0",
      icd10Code: "E11.2",
    },
    {
      highLevelSearchTerm: "DM",
      specificReason: "Type 2 DM with Ophthalmic Complications",
      defaultValue: "0",
      icd10Code: "E11.3",
    },
    {
      highLevelSearchTerm: "DM",
      specificReason: "Type 2 DM with Neurological Complications",
      defaultValue: "0",
      icd10Code: "E11.4",
    },
    {
      highLevelSearchTerm: "DM",
      specificReason: "Type 2 DM with Circulatory Complications",
      defaultValue: "0",
      icd10Code: "E11.5",
    },
    {
      highLevelSearchTerm: "DM",
      specificReason: "Type 2 DM with Other Complications",
      defaultValue: "0",
      icd10Code: "E11.8",
    },
    {
      highLevelSearchTerm: "DM",
      specificReason: "Type 2 DM without Complications",
      defaultValue: "1",
      icd10Code: "E11.9",
    },
  ],
  "Weight Loss": [
    { specificReason: "Overweight", defaultValue: "1", icd10Code: "E66.3" },
    { specificReason: "Obese", defaultValue: "0", icd10Code: "E66.9" },
  ],
  "Nutritional Insecurity": [
    {
      specificReason: "Food Insecurity",
      defaultValue: "1",
      icd10Code: "Z59.41",
    },
    {
      specificReason: "Protein Intake Deficiency (Kwashiorkor)",
      defaultValue: "0",
      icd10Code: "E40",
    },
    {
      specificReason: "Caloric Intake Deficiency (Nutritional marasmus)",
      defaultValue: "0",
      icd10Code: "E41",
    },
    {
      specificReason: "Protein and Caloric Deficiency (Marasmic kwashiorkor)",
      defaultValue: "0",
      icd10Code: "E42",
    },
    {
      specificReason: "Vitamin A Deficiency",
      defaultValue: "0",
      icd10Code: "E50.9",
    },
    {
      specificReason: "Thiamine Deficiency",
      defaultValue: "0",
      icd10Code: "E51.9",
    },
    {
      specificReason: "Niacin Deficiency",
      defaultValue: "0",
      icd10Code: "E52",
    },
    {
      specificReason: "Riboflavin Deficiency",
      defaultValue: "0",
      icd10Code: "E53.0",
    },
    {
      specificReason: "Pyridoxine Deficiency",
      defaultValue: "0",
      icd10Code: "E53.1",
    },
    {
      specificReason: "Other B Group Vitamin Deficiency",
      defaultValue: "0",
      icd10Code: "E53.9",
    },
    {
      specificReason: "Absorbic acid deficiency",
      defaultValue: "0",
      icd10Code: "E54",
    },
    {
      specificReason: "Vitamin D Deficiency (Rickets)",
      defaultValue: "0",
      icd10Code: "E55.0",
    },
    {
      specificReason: "Vitamin E Deficiency",
      defaultValue: "0",
      icd10Code: "E56.0",
    },
    {
      specificReason: "Vitamin K Deficiency",
      defaultValue: "0",
      icd10Code: "E56.1",
    },
    {
      specificReason: "Dietary Calcium Deficiency",
      defaultValue: "0",
      icd10Code: "E58",
    },
    {
      specificReason: "Dietary Selenium Deficiency",
      defaultValue: "0",
      icd10Code: "E59",
    },
    {
      specificReason: "Dietary Zinc Deficiency",
      defaultValue: "0",
      icd10Code: "E60",
    },
    {
      specificReason: "Copper Deficiency",
      defaultValue: "0",
      icd10Code: "E61.0",
    },
    {
      specificReason: "Iron Deficiency",
      defaultValue: "0",
      icd10Code: "E61.1",
    },
    {
      specificReason: "Magnesium Deficiency",
      defaultValue: "0",
      icd10Code: "E61.2",
    },
    {
      specificReason: "Manganese Deficiency",
      defaultValue: "0",
      icd10Code: "E61.3",
    },
    {
      specificReason: "Chromium Deficiency",
      defaultValue: "0",
      icd10Code: "E61.4",
    },
    {
      specificReason: "Molybdenum Deficiency",
      defaultValue: "0",
      icd10Code: "E61.5",
    },
    {
      specificReason: "Vanadium Deficiency",
      defaultValue: "0",
      icd10Code: "E61.6",
    },
    {
      specificReason: "Other Nutrient Deficiency",
      defaultValue: "0",
      icd10Code: "E61.9",
    },
  ],
  "Gastrointestinal Issues": [
    {
      specificReason: "Gastroesophageal reflux disease",
      defaultValue: "0",
      icd10Code: "K21.9",
    },
    {
      specificReason: "Fatty liver disease (NASH)",
      defaultValue: "0",
      icd10Code: "K75.81",
    },
    { specificReason: "Pancreatitis", defaultValue: "0", icd10Code: "K86.9" },
    {
      specificReason: "Diverticulitis",
      defaultValue: "0",
      icd10Code: "K57.92",
    },
    { specificReason: "Gastroparesis", defaultValue: "0", icd10Code: "K31.84" },
    {
      specificReason: "Crohn's Disease",
      defaultValue: "0",
      icd10Code: "K50.90",
    },
    {
      specificReason: "Ulcerative Colitis",
      defaultValue: "0",
      icd10Code: "K51.90",
    },
    {
      specificReason: "Other Iritable Bowel Syndrome",
      defaultValue: "0",
      icd10Code: "K52.9",
    },
    {
      specificReason: "Eosinophilic Esophagitis",
      defaultValue: "0",
      icd10Code: "K20.0",
    },
  ],
  "Cardiovascular Issues": [
    {
      highLevelSearchTerm:
        "Heart Disease, Venous thromboembolism, VTE, MI, CHF",
      specificReason: "Hypertension",
      defaultValue: "0",
      icd10Code: "I10",
    },
    {
      highLevelSearchTerm: "Heart Disease, Venous thromboembolism VTE, MI, CHF",
      specificReason: "Hyperlipidemia",
      defaultValue: "0",
      icd10Code: "E78.5",
    },
    {
      highLevelSearchTerm: "Heart Disease, Venous thromboembolism VTE, MI, CHF",
      specificReason: "Atherosclerosis",
      defaultValue: "0",
      icd10Code: "I70.91",
    },
    {
      highLevelSearchTerm: "Heart Disease, Venous thromboembolism VTE, MI, CHF",
      specificReason: "Myocardial Infarction",
      defaultValue: "0",
      icd10Code: "I21.A",
    },
    {
      highLevelSearchTerm: "Heart Disease, Venous thromboembolism VTE, MI, CHF",
      specificReason: "Congestive Heart Failure",
      defaultValue: "0",
      icd10Code: "I50.1",
    },
    {
      highLevelSearchTerm: "Heart Disease, Venous thromboembolism VTE, MI, CHF",
      specificReason: "Ischemic Stroke",
      defaultValue: "0",
      icd10Code: "I63.9",
    },
    {
      highLevelSearchTerm: "Heart Disease, Venous thromboembolism VTE, MI, CHF",
      specificReason: "Pulmonary Embolism",
      defaultValue: "0",
      icd10Code: "I26.99",
    },
    {
      highLevelSearchTerm: "Heart Disease, Venous thromboembolism VTE, MI, CHF",
      specificReason: "Deep Vein Thrombosis",
      defaultValue: "0",
      icd10Code: "I80.3",
    },
  ],
  Pregnancy: [
    {
      highLevelSearchTerm: "Pueperium",
      specificReason: "Gestational Hypertension without Proteinuria",
      defaultValue: "0",
      icd10Code: "O13.9",
    },
    {
      highLevelSearchTerm: "Pueperium",
      specificReason: "Pre-eclampsia",
      defaultValue: "0",
      icd10Code: "O14.9",
    },
    {
      highLevelSearchTerm: "Pueperium",
      specificReason: "Excessive Vomitting in Pregnancy",
      defaultValue: "0",
      icd10Code: "O21.9",
    },
    {
      highLevelSearchTerm: "Pueperium",
      specificReason: "Malnutrition in Pregnancy",
      defaultValue: "0",
      icd10Code: "O25.10",
    },
    {
      highLevelSearchTerm: "Pueperium",
      specificReason: "Gestational Diabetes Mellitus",
      defaultValue: "0",
      icd10Code: "O24.419",
    },
    {
      highLevelSearchTerm: "Pueperium",
      specificReason: "Excessive Weight Gain in Pregnancy",
      defaultValue: "0",
      icd10Code: "O26.00",
    },
    {
      highLevelSearchTerm: "Pueperium",
      specificReason: "Low Weight Gain in Pregnancy",
      defaultValue: "0",
      icd10Code: "O26.10",
    },
  ],
  Cancer: [
    {
      highLevelSearchTerm: "Neoplasm",
      specificReason: "Esophageal cancer",
      defaultValue: "0",
      icd10Code: "C15.9",
    },
    {
      highLevelSearchTerm: "Neoplasm",
      specificReason: "Stomach cancer",
      defaultValue: "0",
      icd10Code: "C16.9",
    },
    {
      highLevelSearchTerm: "Neoplasm",
      specificReason: "Colon cancer",
      defaultValue: "0",
      icd10Code: "C18.9",
    },
    {
      highLevelSearchTerm: "Neoplasm",
      specificReason: "Rectal cancer",
      defaultValue: "0",
      icd10Code: "C20",
    },
    {
      highLevelSearchTerm: "Neoplasm",
      specificReason: "Liver cancer",
      defaultValue: "0",
      icd10Code: "C22.9",
    },
    {
      highLevelSearchTerm: "Neoplasm",
      specificReason: "Pancreatic cancer",
      defaultValue: "0",
      icd10Code: "C25.9",
    },
    {
      highLevelSearchTerm: "Neoplasm",
      specificReason: "Lung cancer",
      defaultValue: "0",
      icd10Code: "C34.92",
    },
    {
      highLevelSearchTerm: "Neoplasm",
      specificReason: "Melanoma",
      defaultValue: "0",
      icd10Code: "C43.9",
    },
    {
      highLevelSearchTerm: "Neoplasm",
      specificReason: "Breast cancer",
      defaultValue: "0",
      icd10Code: "C50.919",
    },
    {
      highLevelSearchTerm: "Neoplasm",
      specificReason: "Uterine cancer",
      defaultValue: "0",
      icd10Code: "C55",
    },
    {
      highLevelSearchTerm: "Neoplasm",
      specificReason: "Ovarian cancer",
      defaultValue: "0",
      icd10Code: "C56.9",
    },
    {
      highLevelSearchTerm: "Neoplasm",
      specificReason: "Prostate cancer",
      defaultValue: "0",
      icd10Code: "C61",
    },
    {
      highLevelSearchTerm: "Neoplasm",
      specificReason: "Kidney cancer",
      defaultValue: "0",
      icd10Code: "C64.9",
    },
    {
      highLevelSearchTerm: "Neoplasm",
      specificReason: "Bladder cancer",
      defaultValue: "0",
      icd10Code: "C67.9",
    },
    {
      highLevelSearchTerm: "Neoplasm",
      specificReason: "Brain cancer",
      defaultValue: "0",
      icd10Code: "C71.9",
    },
    {
      highLevelSearchTerm: "Neoplasm",
      specificReason: "Thyroid cancer",
      defaultValue: "0",
      icd10Code: "C73",
    },
    {
      highLevelSearchTerm: "Neoplasm",
      specificReason: "Hodgkin Lymphoma",
      defaultValue: "0",
      icd10Code: "C81.70",
    },
    {
      highLevelSearchTerm: "Neoplasm",
      specificReason: "non-Hodgkin Lymphoma",
      defaultValue: "0",
      icd10Code: "C85.90",
    },
    {
      highLevelSearchTerm: "Neoplasm",
      specificReason: "Multiple Myeloma",
      defaultValue: "0",
      icd10Code: "C90.0",
    },
    {
      highLevelSearchTerm: "Neoplasm",
      specificReason: "Leukemia",
      defaultValue: "0",
      icd10Code: "C95.9",
    },
    {
      highLevelSearchTerm: "Neoplasm",
      specificReason: "Other Cancer",
      defaultValue: "0",
      icd10Code: "C80.1",
    },
  ],
  "Food Allergies": [
    {
      specificReason: "Allergy to Peanuts",
      defaultValue: "0",
      icd10Code: "Z91.010",
    },
    {
      specificReason: "Allergy to Milk Products",
      defaultValue: "0",
      icd10Code: "Z91.011",
    },
    {
      specificReason: "Allergy to Eggs",
      defaultValue: "0",
      icd10Code: "Z91.012",
    },
    {
      specificReason: "Allergy to Seafood",
      defaultValue: "0",
      icd10Code: "Z91.013",
    },
    {
      specificReason: "Allergy to Mammalian Meats",
      defaultValue: "0",
      icd10Code: "Z91.014",
    },
    {
      specificReason: "Allergy to Other Foods",
      defaultValue: "1",
      icd10Code: "Z91.018",
    },
  ],
};

const stateOptions: { value: string; label: string }[] = [
  {
    value: "AL",
    label: "Alabama",
  },
  {
    value: "AK",
    label: "Alaska",
  },
  {
    value: "AZ",
    label: "Arizona",
  },
  {
    value: "AR",
    label: "Arkansas",
  },
  {
    value: "CA",
    label: "California",
  },
  {
    value: "CO",
    label: "Colorado",
  },
  {
    value: "CT",
    label: "Connecticut",
  },
  {
    value: "DE",
    label: "Delaware",
  },
  {
    value: "DC",
    label: "District of Columbia",
  },
  {
    value: "FL",
    label: "Florida",
  },
  {
    value: "GA",
    label: "Georgia",
  },
  {
    value: "HI",
    label: "Hawaii",
  },
  {
    value: "ID",
    label: "Idaho",
  },
  {
    value: "IL",
    label: "Illinois",
  },
  {
    value: "IN",
    label: "Indiana",
  },
  {
    value: "IA",
    label: "Iowa",
  },
  {
    value: "KS",
    label: "Kansas",
  },
  {
    value: "KY",
    label: "Kentucky",
  },
  {
    value: "LA",
    label: "Louisiana",
  },
  {
    value: "ME",
    label: "Maine",
  },
  {
    value: "MD",
    label: "Maryland",
  },
  {
    value: "MA",
    label: "Massachusetts",
  },
  {
    value: "MI",
    label: "Michigan",
  },
  {
    value: "MN",
    label: "Minnesota",
  },
  {
    value: "MS",
    label: "Mississippi",
  },
  {
    value: "MO",
    label: "Missouri",
  },
  {
    value: "MT",
    label: "Montana",
  },
  {
    value: "NE",
    label: "Nebraska",
  },
  {
    value: "NV",
    label: "Nevada",
  },
  {
    value: "NH",
    label: "New Hampshire",
  },
  {
    value: "NJ",
    label: "New Jersey",
  },
  {
    value: "NM",
    label: "New Mexico",
  },
  {
    value: "NY",
    label: "New York",
  },
  {
    value: "NC",
    label: "North Carolina",
  },
  {
    value: "ND",
    label: "North Dakota",
  },
  {
    value: "OH",
    label: "Ohio",
  },
  {
    value: "OK",
    label: "Oklahoma",
  },
  {
    value: "OR",
    label: "Oregon",
  },
  {
    value: "PA",
    label: "Pennsylvania",
  },
  {
    value: "RI",
    label: "Rhode Island",
  },
  {
    value: "SC",
    label: "South Carolina",
  },
  {
    value: "SD",
    label: "South Dakota",
  },
  {
    value: "TN",
    label: "Tennessee",
  },
  {
    value: "TX",
    label: "Texas",
  },
  {
    value: "UT",
    label: "Utah",
  },
  {
    value: "VT",
    label: "Vermont",
  },
  {
    value: "VA",
    label: "Virginia",
  },
  {
    value: "VI",
    label: "Virgin Islands",
  },
  {
    value: "WA",
    label: "Washington",
  },
  {
    value: "WV",
    label: "West Virginia",
  },
  {
    value: "WI",
    label: "Wisconsin",
  },
  {
    value: "WY",
    label: "Wyoming",
  },
];

const statesWithTimezone = [
  "AL",
  "AK",
  "AZ",
  "FL",
  "ID",
  "IN",
  "KS",
  "KY",
  "MI",
  "NE",
  "NV",
  "ND",
  "OR",
  "SD",
  "TN",
  "TX",
];

export { reasonsList, referrerOrganizations, stateOptions, statesWithTimezone, audioAppointmentTypeIds };
