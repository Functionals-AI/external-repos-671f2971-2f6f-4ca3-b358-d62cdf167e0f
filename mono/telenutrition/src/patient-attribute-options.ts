import { IContext } from '@mono/common/lib/context';
export const getPatientAttributeOptions = ({ i18n }: IContext) =>
  ({
    main_reason: {
      general_wellness: {
        option_text: i18n.__('I want to improve my general wellness'),
        option_code: 'general_wellness',
      },
      lose_weight: { option_text: i18n.__('I want to lose weight'), option_code: 'lose_weight' },
      gain_weight: { option_text: i18n.__('I want to gain weight'), option_code: 'gain_weight' },
      improve_physical_fitness: {
        option_text: i18n.__('I want to improve my physical fitness'),
        option_code: 'improve_physical_fitness',
      },
      improve_mental_health: {
        option_text: i18n.__('I want to improve my mental health'),
        option_code: 'improve_mental_health',
      },
      help_getting_cooking_food: {
        option_text: i18n.__('I want help getting & cooking healthy food'),
        option_code: 'help_getting_cooking_food',
      },
      help_affording_food: {
        option_text: i18n.__('I want help affording healthy food'),
        option_code: 'help_affording_food',
      },
      supporting_pregnancy: {
        option_text: i18n.__('I want help supporting my Pregnancy'),
        option_code: 'supporting_pregnancy',
      },
      help_with_food_allergy: {
        option_text: i18n.__('I want help with a Food Allergy'),
        option_code: 'help_with_food_allergy',
      },
      hypertension: { option_text: i18n.__('Hypertension'), option_code: 'hypertension' },
      ibs: { option_text: i18n.__('Irritable bowel syndrome'), option_code: 'ibs' },
      mental_disorder: { option_text: i18n.__('Mental disorder'), option_code: 'mental_disorder' },
      congestive_heart_failure: {
        option_text: i18n.__('Congestive heart failure'),
        option_code: 'congestive_heart_failure',
      },
      malignant_neoplastic_disease: {
        option_text: i18n.__('Malignant neoplastic disease'),
        option_code: 'malignant_neoplastic_disease',
      },
      crohns_disease: { option_text: i18n.__("Crohn's disease"), option_code: 'crohns_disease' },
      ulcerative_colitis: { option_text: i18n.__('Ulcerative Colitis'), option_code: 'ulcerative_colitis' },
      rheumatoid_arthritis: { option_text: i18n.__('Rheumatoid arthritis'), option_code: 'rheumatoid_arthritis' },
      osteoarthritis: { option_text: i18n.__('Osteoarthritis'), option_code: 'osteoarthritis' },
      cerebrovascular_accident: {
        option_text: i18n.__('Cerebrovascular accident'),
        option_code: 'cerebrovascular_accident',
      },
      phenylketonuria: { option_text: i18n.__('Phenylketonuria'), option_code: 'phenylketonuria' },
      dementia: { option_text: i18n.__('Dementia'), option_code: 'dementia' },
      disorder_of_liver: { option_text: i18n.__('Disorder of liver'), option_code: 'disorder_of_liver' },
      gallbladder_calculus: { option_text: i18n.__('Gallbladder calculus'), option_code: 'gallbladder_calculus' },
      sleep_apnea: { option_text: i18n.__('Sleep apnea'), option_code: 'sleep_apnea' },
      gastritis: { option_text: i18n.__('Gastritis'), option_code: 'gastritis' },
      alzheimers_disease: { option_text: i18n.__("Alzheimer's disease"), option_code: 'alzheimers_disease' },
      copd: { option_text: i18n.__('Chronic obstructive pulmonary disease'), option_code: 'copd' },
      heart_disease: { option_text: i18n.__('Heart disease'), option_code: 'heart_disease' },
      hypercholesterolemia: { option_text: i18n.__('Hypercholesterolemia'), option_code: 'hypercholesterolemia' },
      chronic_kidney_disease: { option_text: i18n.__('Chronic kidney disease'), option_code: 'chronic_kidney_disease' },
      end_stage_renal_disease: {
        option_text: i18n.__('End-stage renal disease'),
        option_code: 'end_stage_renal_disease',
      },
      celiac_disease: { option_text: i18n.__('Celiac disease'), option_code: 'celiac_disease' },
      pre_eclampsia: { option_text: i18n.__('Pre-eclampsia'), option_code: 'pre_eclampsia' },
      autoimmune_disease: { option_text: i18n.__('Autoimmune disease'), option_code: 'autoimmune_disease' },
      eating_disorder: { option_text: i18n.__('Eating disorder'), option_code: 'eating_disorder' },
      arthritis: { option_text: i18n.__('Arthritis'), option_code: 'arthritis' },
      lymphedema: { option_text: i18n.__('Lymphedema'), option_code: 'lymphedema' },
      neuropathy: { option_text: i18n.__('Neuropathy'), option_code: 'neuropathy' },
      anemia: { option_text: i18n.__('Anemia'), option_code: 'anemia' },
      gerd: { option_text: i18n.__('Gastroesophageal Reflux Disease (GERD)'), option_code: 'gerd' },
      pcos: { option_text: i18n.__('Polycystic ovary syndrome (PCOS)'), option_code: 'pcos' },
      obesity: { option_text: i18n.__('Obesity'), option_code: 'obesity' },
      malnutrition: { option_text: i18n.__('Malnutrition'), option_code: 'malnutrition' },
      hiv: { option_text: i18n.__('HIV'), option_code: 'hiv' },
      aids: { option_text: i18n.__('AIDS'), option_code: 'aids' },
      type_1_diabetes: { option_text: i18n.__('Diabetes Type 1'), option_code: 'type_1_diabetes' },
      type_2_diabetes: { option_text: i18n.__('Diabetes Type 2'), option_code: 'type_2_diabetes' },
      disorder_of_thyroid_gland: { option_text: i18n.__('Thyroid Disease'), option_code: 'disorder_of_thyroid_gland' },
      gestational_diabetes_mellitus: {
        option_text: i18n.__('Diabetes Gestational'),
        option_code: 'gestational_diabetes_mellitus',
      },
      pregnancy_induced_hypertension: {
        option_text: i18n.__('Hypertension Pregnancy-induced'),
        option_code: 'pregnancy_induced_hypertension',
      },
      prediabetes: { option_text: i18n.__('Prediabetes'), option_code: 'prediabetes' },
    },
    medical_conditions: {
      hypertension: { option_text: i18n.__('Hypertension'), option_code: 'hypertension' },
      ibs: { option_text: i18n.__('IBS'), option_code: 'ibs' },
      mental_health_condition: {
        option_text: i18n.__('Mental health condition (depression, anxiety, other)'),
        option_code: 'mental_health_condition',
      },
      congestive_heart_failure: {
        option_text: i18n.__('Congestive Heart Failure'),
        option_code: 'congestive_heart_failure',
      },
      cancer: { option_text: i18n.__('Cancer'), option_code: 'cancer' },
      crohns_disease: { option_text: i18n.__("Crohn's Disease"), option_code: 'crohns_disease' },
      ulcerative_colitis: { option_text: i18n.__('Ulcerative Colitis'), option_code: 'ulcerative_colitis' },
      rheumatoid_arthritis: { option_text: i18n.__('Rheumatoid Arthritis'), option_code: 'rheumatoid_arthritis' },
      osteoarthritis: { option_text: i18n.__('Osteoarthritis'), option_code: 'osteoarthritis' },
      stroke: { option_text: i18n.__('Stroke'), option_code: 'stroke' },
      pku: { option_text: i18n.__('PKU'), option_code: 'pku' },
      dementia: { option_text: i18n.__('Dementia'), option_code: 'dementia' },
      liver_disease: { option_text: i18n.__('Liver Disease'), option_code: 'liver_disease' },
      gallbladder_stones: { option_text: i18n.__('Gallbladder Stones'), option_code: 'gallbladder_stones' },
      sleep_apnea: { option_text: i18n.__('Sleep Apnea'), option_code: 'sleep_apnea' },
      gastritis: { option_text: i18n.__('Gastritis'), option_code: 'gastritis' },
      alzheimers_disease: { option_text: i18n.__("Alzheimer's Disease"), option_code: 'alzheimers_disease' },
      copd: { option_text: i18n.__('COPD'), option_code: 'copd' },
      heart_disease: { option_text: i18n.__('Heart disease'), option_code: 'heart_disease' },
      high_cholesterol: { option_text: i18n.__('High cholesterol'), option_code: 'high_cholesterol' },
      chronic_kidney_disease: {
        option_text: i18n.__('Chronic kidney disease (CKD)'),
        option_code: 'chronic_kidney_disease',
      },
      esrd: { option_text: i18n.__('End-stage renal disease (ESRD) or dialysis'), option_code: 'esrd' },
      celiac_disease: { option_text: i18n.__('Celiac disease'), option_code: 'celiac_disease' },
      preeclampsia: { option_text: i18n.__('Preeclampsia'), option_code: 'preeclampsia' },
      autoimmune_disease: { option_text: i18n.__('Autoimmune Disease'), option_code: 'autoimmune_disease' },
      eating_disorders: { option_text: i18n.__('Eating disorders'), option_code: 'eating_disorders' },
      thyroid_issues: { option_text: i18n.__('Thyroid Disease'), option_code: 'thyroid_issues' },
      gestational_diabetes: { option_text: i18n.__('Diabetes Gestational'), option_code: 'gestational_diabetes' },
      arthritis: { option_text: i18n.__('Arthritis'), option_code: 'arthritis' },
      lymphedema: { option_text: i18n.__('Lymphedema'), option_code: 'lymphedema' },
      neuropathy: { option_text: i18n.__('Neuropathy'), option_code: 'neuropathy' },
      anemia: { option_text: i18n.__('Anemia'), option_code: 'anemia' },
      gerd: { option_text: i18n.__('Gastroesophageal Reflux Disease (GERD)'), option_code: 'gerd' },
      pcos: { option_text: i18n.__('Polycystic ovary syndrome (PCOS)'), option_code: 'pcos' },
      obesity: { option_text: i18n.__('Obesity'), option_code: 'obesity' },
      malnutrition: { option_text: i18n.__('Malnutrition'), option_code: 'malnutrition' },
      hiv: { option_text: i18n.__('HIV'), option_code: 'hiv' },
      aids: { option_text: i18n.__('AIDS'), option_code: 'aids' },
      type_1_diabetes: { option_text: i18n.__('Diabetes Type 1'), option_code: 'type_1_diabetes' },
      type_2_diabetes: { option_text: i18n.__('Diabetes Type 2'), option_code: 'type_2_diabetes' },
      pregnancy_induced_hypertension: {
        option_text: i18n.__('Hypertension Pregnancy-induced'),
        option_code: 'pregnancy_induced_hypertension',
      },
      prediabetes: { option_text: i18n.__('Prediabetes'), option_code: 'prediabetes' },
    },
    member_is_smoker: {
      smoker: {
        option_text: i18n.__('Yes'),
        option_code: 'smoker',
      },
      non_smoker: {
        option_text: i18n.__('No'),
        option_code: 'non_smoker',
      }
    },
    pregnancy: {
      pregnant: { option_text: i18n.__('Pregnant'), option_code: 'pregnant' },
      not_pregnant: { option_text: i18n.__('Not pregnant'), option_code: 'not_pregnant' },
    },
    pregnancy_risk: {
      normal_pregnancy: { option_text: i18n.__('No (Normal Pregnancy)'), option_code: 'normal_pregnancy' },
      high_risk_pregnancy: { option_text: i18n.__('Yes (High Risk Pregnancy)'), option_code: 'high_risk_pregnancy' },
    },
    medications_list: {
      appetite_suppressants: {
        option_text: i18n.__('Appetite Suppressants (e.g., Contrave)'),
        option_code: 'appetite_suppressants',
      },
      glp1_medications: {
        option_text: i18n.__('GLP-1 Medications (e.g., WeGovy, Ozempic, Mounjaro, Zepbound)'),
        option_code: 'glp1_medications',
      },
      lipase_inhibitors: {
        option_text: i18n.__('Lipase Inhibitors (e.g., Orlistat)'),
        option_code: 'lipase_inhibitors',
      },
      phentermine_medications: {
        option_text: i18n.__(
          'Phentermine Medications (e.g., Adipex, Atti-Plex P, Fastin, Ionamin, Lomaira, Phentercot, Phentride, Pro-Fast)',
        ),
        option_code: 'phentermine_medications',
      },
      blood_pressure_medications: {
        option_text: i18n.__('Blood Pressure Medications'),
        option_code: 'blood_pressure_medications',
      },
      diabetes_medications: {
        option_text: i18n.__('Diabetes Medications (e.g., Metformin, Insulin, SLGT2 Inhibitor, DPP4-inhibitor)'),
        option_code: 'diabetes_medications',
      },
      mental_health_medications: {
        option_text: i18n.__('Mental Health Medications (e.g., Anxiety, Depression)'),
        option_code: 'mental_health_medications',
      },
      thyroid_medications: { option_text: i18n.__('Thyroid Medications'), option_code: 'thyroid_medications' },
      cholesterol_medications: {
        option_text: i18n.__('Cholesterol Medications (e.g., Statins)'),
        option_code: 'cholesterol_medications',
      },
      diuretic_medications: {
        option_text: i18n.__('Diuretic Medications (e.g., Lasix)'),
        option_code: 'diuretic_medications',
      },
    },
    inpatient_visit_last_90_days: {
      inpatient_treatment_last_90_days: {
        option_text: i18n.__('Yes - Inpatient Treatment in the last 90 days'),
        option_code: 'inpatient_treatment_last_90_days',
      },
      no_inpatient_care_last_90_days: {
        option_text: i18n.__('No inpatient care in the last 90 days'),
        option_code: 'no_inpatient_care_last_90_days',
      },
    },
    inpatient_visit_facility: {
      long_term_acute_care: { option_text: i18n.__('Long-term Acute Care'), option_code: 'long_term_acute_care' },
      hospital: { option_text: i18n.__('Hospital'), option_code: 'hospital' },
      skilled_nursing_facility: {
        option_text: i18n.__('Skilled Nursing Facility'),
        option_code: 'skilled_nursing_facility',
      },
    },
    reason_for_inpatient_visit: {
      sepsis: { option_text: i18n.__('Sepsis'), option_code: 'sepsis' },
      pneumonia: { option_text: i18n.__('Pneumonia'), option_code: 'pneumonia' },
      heart_failure: { option_text: i18n.__('Heart Failure'), option_code: 'heart_failure' },
      acute_myocardial_infarction: {
        option_text: i18n.__('Acute Myocardial Infarction'),
        option_code: 'acute_myocardial_infarction',
      },
      cardiac_arrhythmia: { option_text: i18n.__('Cardiac Arrhythmia'), option_code: 'cardiac_arrhythmia' },
      cerebral_infarction: { option_text: i18n.__('Cerebral Infarction'), option_code: 'cerebral_infarction' },
      drug_overdose: { option_text: i18n.__('Drug Overdose'), option_code: 'drug_overdose' },
      food_poisoning: { option_text: i18n.__('Food Poisoning'), option_code: 'food_poisoning' },
      gastrointestinal_tract_disorder: {
        option_text: i18n.__('Gastrointestinal Tract Disorder'),
        option_code: 'gastrointestinal_tract_disorder',
      },
      cardiovascular_disease: { option_text: i18n.__('Cardiovascular Disease'), option_code: 'cardiovascular_disease' },
      osteoarthritis: { option_text: i18n.__('Osteoarthritis'), option_code: 'osteoarthritis' },
      diabetes: { option_text: i18n.__('Diabetes'), option_code: 'diabetes' },
      acute_and_unspecified_renal_failure: {
        option_text: i18n.__('Acute and Unspecified Renal Failure'),
        option_code: 'acute_and_unspecified_renal_failure',
      },
      copd: { option_text: i18n.__('COPD'), option_code: 'copd' },
    },
    gi_symptoms: {
      gi_symptoms_bloating: {
        option_text: i18n.__('Abdominal bloating'),
        option_code: 'gi_symptoms_bloating',
      },
      gi_symptoms_gas: {
        option_text: i18n.__('Gaseous substance'),
        option_code: 'gi_symptoms_gas',
      },
      gi_symptoms_diarrhea: {
        option_text: i18n.__('Diarrhea'),
        option_code: 'gi_symptoms_diarrhea',
      },
      gi_symptoms_heartburn: {
        option_text: i18n.__('Heartburn'),
        option_code: 'gi_symptoms_heartburn',
      },
      gi_symptoms_constipation: {
        option_text: i18n.__('Constipation'),
        option_code: 'gi_symptoms_constipation',
      },
      gi_symptoms_nausea: {
        option_text: i18n.__('Nausea'),
        option_code: 'gi_symptoms_nausea',
      },
      gi_symptoms_vomiting: {
        option_text: i18n.__('Vomiting'),
        option_code: 'gi_symptoms_vomiting',
      },
      gi_symptoms_chewing_difficulty: {
        option_text: i18n.__('Difficulty chewing'),
        option_code: 'gi_symptoms_chewing_difficulty',
      },
      gi_symptoms_swallowing_difficulty: {
        option_text: i18n.__('Difficulty swallowing'),
        option_code: 'gi_symptoms_swallowing_difficulty',
      },
      gi_symptoms_pain: {
        option_text: i18n.__('Gastrointestinal Pain'),
        option_code: 'gi_symptoms_pain',
      },
    },
    specialized_diet_type: {
      vegetarian: { option_text: i18n.__('Vegetarian'), option_code: 'vegetarian' },
      vegan: { option_text: i18n.__('Vegan'), option_code: 'vegan' },
      pescatarian: { option_text: i18n.__('Pescatarian'), option_code: 'pescatarian' },
      halal: { option_text: i18n.__('Halal'), option_code: 'halal' },
      kosher: { option_text: i18n.__('Kosher'), option_code: 'kosher' },
      high_protein: { option_text: i18n.__('High Protein'), option_code: 'high_protein' },
      low_carb: { option_text: i18n.__('Low Carb Diet'), option_code: 'low_carb' },
      atkins: { option_text: i18n.__('Atkins Diet'), option_code: 'atkins' },
      keto: { option_text: i18n.__('Keto'), option_code: 'keto' },
      intermittent_fasting: { option_text: i18n.__('Intermittent Fasting'), option_code: 'intermittent_fasting' },
      low_fat: { option_text: i18n.__('Low Fat Diet'), option_code: 'low_fat' },
      low_sodium: { option_text: i18n.__('Low Sodium'), option_code: 'low_sodium' },
      pureed_soft: { option_text: i18n.__('Pureed or Soft Diet'), option_code: 'pureed_soft' },
      low_fodmap: { option_text: i18n.__('Low FODMAP Diet'), option_code: 'low_fodmap' },
      pregnancy_diet: { option_text: i18n.__('Pregnancy Diet'), option_code: 'pregnancy_diet' },
      aip_diet: { option_text: i18n.__('AIP (Autoimmune Protocol) Diet'), option_code: 'aip_diet' },
    },
    food_sensitivity_intolerance: {
      gluten_intolerance: { option_text: i18n.__('Gluten Intolerance'), option_code: 'gluten_intolerance' },
      histamine_intolerance: { option_text: i18n.__('Histamine Intolerance'), option_code: 'histamine_intolerance' },
      fodmap_intolerance: { option_text: i18n.__('FODMAP Intolerance'), option_code: 'fodmap_intolerance' },
      nightshades_intolerance: {
        option_text: i18n.__('Nightshades Intolerance'),
        option_code: 'nightshades_intolerance',
      },
      lactose_intolerance: { option_text: i18n.__('Lactose Intolerance'), option_code: 'lactose_intolerance' },
      milk_intolerance: { option_text: i18n.__('Milk Intolerance'), option_code: 'milk_intolerance' },
      wheat_intolerance: { option_text: i18n.__('Wheat Intolerance'), option_code: 'wheat_intolerance' },
      monosodium_glutamate_intolerance: {
        option_text: i18n.__('Monosodium Glutamate Intolerance'),
        option_code: 'monosodium_glutamate_intolerance',
      },
      non_celiac_gluten_sensitivity: {
        option_text: i18n.__('Non-celiac Gluten Intolerance'),
        option_code: 'non_celiac_gluten_sensitivity',
      },
    },
    food_allergy: {
      milk_dairy_allergy: { option_text: i18n.__('Milk or Dairy'), option_code: 'milk_dairy_allergy' },
      egg_allergy: { option_text: i18n.__('Egg'), option_code: 'egg_allergy' },
      fish_allergy: { option_text: i18n.__('Fish (e.g., bass, flounder, cod)'), option_code: 'fish_allergy' },
      shellfish_allergy: {
        option_text: i18n.__('Shellfish (e.g., crab, lobster, shrimp)'),
        option_code: 'shellfish_allergy',
      },
      tree_nut_allergy: {
        option_text: i18n.__('Tree nut (e.g., almonds, walnuts, pecans, cashew, hazelnut, macadamia)'),
        option_code: 'tree_nut_allergy',
      },
      peanut_allergy: { option_text: i18n.__('Peanut'), option_code: 'peanut_allergy' },
      wheat_allergy: { option_text: i18n.__('Wheat'), option_code: 'wheat_allergy' },
      soy_allergy: { option_text: i18n.__('Soy'), option_code: 'soy_allergy' },
      sesame_allergy: { option_text: i18n.__('Sesame'), option_code: 'sesame_allergy' },
      poppy_seed_allergy: { option_text: i18n.__('Poppy Seed'), option_code: 'poppy_seed_allergy' },
      gluten_allergy: { option_text: i18n.__('Gluten'), option_code: 'gluten_allergy' },
      red_meat_allergy: { option_text: i18n.__('Red Meat'), option_code: 'red_meat_allergy' },
      corn_allergy: { option_text: i18n.__('Corn'), option_code: 'corn_allergy' },
      fruit_allergy: { option_text: i18n.__('Fruit'), option_code: 'fruit_allergy' },
      tryptophan_allergy: { option_text: i18n.__('Tryptophan'), option_code: 'tryptophan_allergy' },
      alcohol_allergy: { option_text: i18n.__('Alcohol'), option_code: 'alcohol_allergy' },
    },
    vitamin_supplements: {
      vitamin_a: { option_text: i18n.__('Vitamin A'), option_code: 'vitamin_a' },
      vitamin_b6: { option_text: i18n.__('Vitamin B6'), option_code: 'vitamin_b6' },
      vitamin_b12: { option_text: i18n.__('Vitamin B12'), option_code: 'vitamin_b12' },
      vitamin_c: { option_text: i18n.__('Vitamin C'), option_code: 'vitamin_c' },
      vitamin_d: { option_text: i18n.__('Vitamin D'), option_code: 'vitamin_d' },
      vitamin_e: { option_text: i18n.__('Vitamin E'), option_code: 'vitamin_e' },
      omega_3_fatty_acids: { option_text: i18n.__('Omega-3 fatty acids'), option_code: 'omega_3_fatty_acids' },
      folate: { option_text: i18n.__('Folate'), option_code: 'folate' },
      biotin: { option_text: i18n.__('Biotin'), option_code: 'biotin' },
      niacin: { option_text: i18n.__('Niacin'), option_code: 'niacin' },
      magnesium: { option_text: i18n.__('Magnesium'), option_code: 'magnesium' },
      iron: { option_text: i18n.__('Iron'), option_code: 'iron' },
      pantoethenic_acid: { option_text: i18n.__('Pantoethenic Acid'), option_code: 'pantoethenic_acid' },
      riboflavin: { option_text: i18n.__('Riboflavin'), option_code: 'riboflavin' },
      thiamine: { option_text: i18n.__('Thiamine'), option_code: 'thiamine' },
      calcium: { option_text: i18n.__('Calcium'), option_code: 'calcium' },
      multivitamin: { option_text: i18n.__('Multivitamin'), option_code: 'multivitamin' },
    },
    current_work_situation: {
      full_time: { option_text: i18n.__('Full-time'), option_code: 'full_time' },
      part_time: { option_text: i18n.__('Part-time'), option_code: 'part_time' },
      seasonal_or_temporary: { option_text: i18n.__('Seasonal or temporary'), option_code: 'seasonal_or_temporary' },
      unemployed: { option_text: i18n.__('Unemployed'), option_code: 'unemployed' },
      student: { option_text: i18n.__('Student'), option_code: 'student' },
      retired: { option_text: i18n.__('Retired'), option_code: 'retired' },
      taking_care_of_children_or_other_family_members: {
        option_text: i18n.__('Taking care of children or other family members'),
        option_code: 'taking_care_of_children_or_other_family_members',
      },
      not_seeking_work: { option_text: i18n.__('Not seeking work'), option_code: 'not_seeking_work' },
      other_work_situation: { option_text: i18n.__('Other work situation'), option_code: 'other_work_situation' },
    },
    activity_level: {
      low_activity_level: {
        option_text: i18n.__('Low - a lifestyle that includes only the physical activity of independent living'),
        option_code: 'low_activity_level',
      },
      medium_activity_level: {
        option_text: i18n.__(
          'Medium - a lifestyle that includes physical activity equivalent to walking about 1.5 to 3 miles per day at 3 to 4 miles per hour, in addition to the activities of independent living.',
        ),
        option_code: 'medium_activity_level',
      },
      high_activity_level: {
        option_text: i18n.__(
          'High - a lifestyle that includes physical activity equivalent to walking more than 3 miles per day at 3 to 4 miles per hour, in addition to the activities of independent living.',
        ),
        option_code: 'high_activity_level',
      },
    },
    health_related_activity_limitations: {
      not_limited_at_all: { option_text: i18n.__('Not limited at all'), option_code: 'not_limited_at_all' },
      somewhat_limited: { option_text: i18n.__('Somewhat limited'), option_code: 'somewhat_limited' },
      severely_limited: { option_text: i18n.__('Severely limited'), option_code: 'severely_limited' },
    },
    social_support: {
      always: { option_text: i18n.__('Always'), option_code: 'always' },
      sometimes: { option_text: i18n.__('Sometimes'), option_code: 'sometimes' },
      never: { option_text: i18n.__('Never'), option_code: 'never' },
    },
    cooking_frequency_at_home: {
      never_rarely: { option_text: i18n.__('Never or rarely (<1 time per month)'), option_code: 'never_rarely' },
      monthly: { option_text: i18n.__('Monthly (1-3 times per month)'), option_code: 'monthly' },
      weekly: { option_text: i18n.__('Weekly (1-6 times per week)'), option_code: 'weekly' },
      daily: { option_text: i18n.__('Daily'), option_code: 'daily' },
    },
    cooking_responsibility: {
      most_cooking_me: { option_text: i18n.__('I do most of the cooking'), option_code: 'most_cooking_me' },
      most_cooking_others: {
        option_text: i18n.__('Other household members do most of the cooking'),
        option_code: 'most_cooking_others',
      },
      cooking_shared: {
        option_text: i18n.__('Cooking is shared between me and other household members'),
        option_code: 'cooking_shared',
      },
      no_one_cooks: { option_text: i18n.__('No one cooks in my household'), option_code: 'no_one_cooks' },
      other: { option_text: i18n.__('Other'), option_code: 'other' },
    },
    meal_preparation_reason: {
      dont_know_how_to_cook: { option_text: i18n.__('I don’t know how to cook'), option_code: 'dont_know_how_to_cook' },
      not_interested_in_cooking: {
        option_text: i18n.__('I’m not interested in cooking'),
        option_code: 'not_interested_in_cooking',
      },
      dont_have_time_to_cook: {
        option_text: i18n.__('I don’t have the time to cook'),
        option_code: 'dont_have_time_to_cook',
      },
      cooking_is_too_expensive: {
        option_text: i18n.__('Cooking is too expensive'),
        option_code: 'cooking_is_too_expensive',
      },
      other: { option_text: i18n.__('Other'), option_code: 'other' },
    },
    grocery_acquisition_method: {
      walk_to_store: { option_text: i18n.__('Walk to the store'), option_code: 'walk_to_store' },
      drive_to_store: { option_text: i18n.__('Drive to the store'), option_code: 'drive_to_store' },
      public_transit_to_store: {
        option_text: i18n.__('Public transit (bus, subway, train) to the store'),
        option_code: 'public_transit_to_store',
      },
      other_transportation: {
        option_text: i18n.__('Other mode of transportation'),
        option_code: 'other_transportation',
      },
      ask_friend_to_buy: { option_text: i18n.__('Ask a friend to buy'), option_code: 'ask_friend_to_buy' },
      order_online_for_delivery: {
        option_text: i18n.__('Order online for delivery'),
        option_code: 'order_online_for_delivery',
      },
      dont_buy_groceries: {
        option_text: i18n.__("I don't buy groceries for my household"),
        option_code: 'dont_buy_groceries',
      },
      other: { option_text: i18n.__('Other'), option_code: 'other' },
    },
    grocery_purchasing_frequency: {
      never_rarely: { option_text: i18n.__('Never or rarely (<1 time per month)'), option_code: 'never_rarely' },
      monthly: { option_text: i18n.__('Monthly (1-3 times per month)'), option_code: 'monthly' },
      weekly: { option_text: i18n.__('Weekly (1-6 times per week)'), option_code: 'weekly' },
      daily: { option_text: i18n.__('Daily'), option_code: 'daily' },
    },
    grocery_payment_method: {
      cash: { option_text: i18n.__('Cash'), option_code: 'cash' },
      check: { option_text: i18n.__('Check'), option_code: 'check' },
      credit_card: { option_text: i18n.__('Credit card'), option_code: 'credit_card' },
      debit_card: { option_text: i18n.__('Debit card'), option_code: 'debit_card' },
      ebt_card: { option_text: i18n.__('EBT Card'), option_code: 'ebt_card' },
      ebt_card_but_dont_use: {
        option_text: i18n.__("I have an EBT card, but don't use it"),
        option_code: 'ebt_card_but_dont_use',
      },
      dont_buy_groceries_for_household: {
        option_text: i18n.__("I don't buy groceries for my household"),
        option_code: 'dont_buy_groceries_for_household',
      },
    },
    takeout_restaurant_frequency: {
      never_rarely: { option_text: i18n.__('Never or rarely (<1 time per month)'), option_code: 'never_rarely' },
      monthly: { option_text: i18n.__('Monthly (1-3 times per month)'), option_code: 'monthly' },
      weekly: { option_text: i18n.__('Weekly (1-6 times per week)'), option_code: 'weekly' },
      daily: { option_text: i18n.__('Daily'), option_code: 'daily' },
    },
    food_shortage_worry_frequency: {
      often: { option_text: i18n.__('Often'), option_code: 'often' },
      sometimes: { option_text: i18n.__('Sometimes'), option_code: 'sometimes' },
      never: { option_text: i18n.__('Never'), option_code: 'never' },
      dont_know_prefer_not_to_say: {
        option_text: i18n.__("Don't Know or I'd prefer not to say"),
        option_code: 'dont_know_prefer_not_to_say',
      },
    },
    food_security_last_12_months: {
      often: { option_text: i18n.__('Often'), option_code: 'often' },
      sometimes: { option_text: i18n.__('Sometimes'), option_code: 'sometimes' },
      never: { option_text: i18n.__('Never'), option_code: 'never' },
      dont_know_prefer_not_to_say: {
        option_text: i18n.__("Don't Know or I'd prefer not to say"),
        option_code: 'dont_know_prefer_not_to_say',
      },
    },
    household_food_adequacy_last_12_months: {
      enough_food_we_want: {
        option_text: i18n.__('Enough of the kinds of food we want to eat'),
        option_code: 'enough_food_we_want',
      },
      enough_but_not_always_wanted: {
        option_text: i18n.__('Enough but not always the kinds of food we want'),
        option_code: 'enough_but_not_always_wanted',
      },
      sometimes_not_enough: {
        option_text: i18n.__('Sometimes not enough to eat'),
        option_code: 'sometimes_not_enough',
      },
      often_not_enough: { option_text: i18n.__('Often not enough to eat'), option_code: 'often_not_enough' },
      dont_know_prefer_not_to_say: {
        option_text: i18n.__("Don't Know or I'd prefer not to say"),
        option_code: 'dont_know_prefer_not_to_say',
      },
    },
    difficulty_getting_eating_healthy_foods: {
      very_hard: { option_text: i18n.__('Very hard'), option_code: 'very_hard' },
      hard: { option_text: i18n.__('Hard'), option_code: 'hard' },
      somewhat_hard: { option_text: i18n.__('Somewhat hard'), option_code: 'somewhat_hard' },
      not_very_hard: { option_text: i18n.__('Not very hard'), option_code: 'not_very_hard' },
      not_hard_at_all: { option_text: i18n.__('Not hard at all'), option_code: 'not_hard_at_all' },
      dont_know_prefer_not_to_say: {
        option_text: i18n.__("Don't know or I'd prefer not to say"),
        option_code: 'dont_know_prefer_not_to_say',
      },
    },
    snap_ebt_assistance_interest: {
      interested_applying_snap_ebt: {
        option_text: i18n.__('Yes, I’m interested and would like help applying for SNAP or EBT benefits.'),
        option_code: 'interested_applying_snap_ebt',
      },
      interested_reapplying_snap_ebt: {
        option_text: i18n.__('Yes, My SNAP/EBT benefits will expire soon or have already expired, and I would like help with reapplying.'),
        option_code: 'interested_reapplying_snap_ebt',
      },
      already_have_ebt_card: { option_text: i18n.__('No, I have my EBT card.'), option_code: 'already_have_ebt_card' },
      applied_pending: {
        option_text: i18n.__('No, I have already applied for SNAP or EBT benefits and it is pending.'),
        option_code: 'applied_pending',
      },
      applied_denied: { option_text: i18n.__('No I applied and benefits were denied.'), option_code: 'applied_denied' },
      not_interested_snap_ebt: {
        option_text: i18n.__('No, I’m not interested.'),
        option_code: 'not_interested_snap_ebt',
      },
    },
    distance_from_grocery: {
      less_than_1_mile: { option_text: i18n.__('<1 mile'), option_code: 'less_than_1_mile' },
      '1-5_miles': { option_text: i18n.__('1-5 miles'), option_code: '1-5_miles' },
      '5-10_miles': { option_text: i18n.__('5-10 miles'), option_code: '5-10_miles' },
      '10-25_miles': { option_text: i18n.__('10-25 miles'), option_code: '10-25_miles' },
      '25+_miles': { option_text: i18n.__('25+ miles'), option_code: '25+_miles' },
    },
    confidence_in_food_abilities: {
      wash_food: { option_text: i18n.__('wash food'), option_code: 'wash_food' },
      cut_up_food: { option_text: i18n.__('cut up food'), option_code: 'cut_up_food' },
      heat_up_food: { option_text: i18n.__('heat up food'), option_code: 'heat_up_food' },
      cook_food_in_oven_stovetop_hot_plate: {
        option_text: i18n.__('cook food in an oven, stovetop, or hot plate'),
        option_code: 'cook_food_in_oven_stovetop_hot_plate',
      },
      store_food_in_refrigerator: {
        option_text: i18n.__('store my food in the refrigerator'),
        option_code: 'store_food_in_refrigerator',
      },
      save_food_in_freezer: {
        option_text: i18n.__('save my food in the freezer'),
        option_code: 'save_food_in_freezer',
      },
    },
    emotional_response_to_food: {
      food_stresses_me_out: { option_text: i18n.__('Food stresses me out'), option_code: 'food_stresses_me_out' },
      food_feels_like_a_chore: {
        option_text: i18n.__('Food feels like a chore'),
        option_code: 'food_feels_like_a_chore',
      },
      food_brings_me_joy: { option_text: i18n.__('Food brings me joy'), option_code: 'food_brings_me_joy' },
      food_brings_me_closer_to_people: {
        option_text: i18n.__('Food brings me closer to the people I care about'),
        option_code: 'food_brings_me_closer_to_people',
      },
      none: { option_text: i18n.__('None'), option_code: 'none' },
    },
    intervention: {
      alcohol_consumption: {
        option_text: i18n.__('Educated about alcohol consumption’s impact on nutrient absorption and health.'),
        option_code: 'alcohol_consumption',
      },
      ckd_healthy_kidney: {
        option_text: i18n.__(
          'Discussed the role healthy kidneys play in your body and the basics of a healthy kidney diet.',
        ),
        option_code: 'ckd_healthy_kidney',
      },
      ckd_review_labs: {
        option_text: i18n.__('Reviewed labs that can be affected by kidney disease.'),
        option_code: 'ckd_review_labs',
      },
      ckd_protein_needs: {
        option_text: i18n.__('Learned about protein needs with kidney disease.'),
        option_code: 'ckd_protein_needs',
      },
      ckd_limiting_potassium: {
        option_text: i18n.__('Discussed limiting potassium intake with declining kidney function.'),
        option_code: 'ckd_limiting_potassium',
      },
      ckd_limiting_phosphorus: {
        option_text: i18n.__('Discussed limiting phosphorus intake with declining kidney function.'),
        option_code: 'ckd_limiting_phosphorus',
      },
      ckd_blood_pressure: {
        option_text: i18n.__('Reviewed how managing your blood pressure can help prevent further kidney damage.'),
        option_code: 'ckd_blood_pressure',
      },
      ckd_heart_disease: {
        option_text: i18n.__('Discussed managing heart disease and diabetes with kidney disease.'),
        option_code: 'ckd_heart_disease',
      },
      ckd_safe_supplementation: {
        option_text: i18n.__('Reviewed safe supplementation with chronic kidney disease.'),
        option_code: 'ckd_safe_supplementation',
      },
      ckd_shopping_smart: {
        option_text: i18n.__('Educated on shopping smartly with chronic kidney disease.'),
        option_code: 'ckd_shopping_smart',
      },
      ckd_whole_food_diet: {
        option_text: i18n.__('Educated on adopting a whole food plant based diet with chronic kidney disease.'),
        option_code: 'ckd_whole_food_diet',
      },
      diabetes_program_overview: {
        option_text: i18n.__('Provided education about diabetes and provided overview of Foodsmart diabetes program.'),
        option_code: 'diabetes_program_overview',
      },
      diabetes_carbohydrate_overview: {
        option_text: i18n.__(
          'Provided education about carbohydrates and impact on blood sugar; reviewed types of carbohydrates.',
        ),
        option_code: 'diabetes_carbohydrate_overview',
      },
      diabetes_sugar: {
        option_text: i18n.__('Provided education about how sugar and sugar sweeteners impact blood sugar.'),
        option_code: 'diabetes_sugar',
      },
      diabetes_protein: {
        option_text: i18n.__(
          'Provided education on how protein helps with satiety, improves blood sugar levels, and how to incorporate plant-based protein.',
        ),
        option_code: 'diabetes_protein',
      },
      diabetes_fats: {
        option_text: i18n.__(
          'Provided education on how fats impact blood sugar and which fats can improve blood sugar balance.',
        ),
        option_code: 'diabetes_fats',
      },
      diabetes_fiber: {
        option_text: i18n.__('Provided education on how fiber impacts blood sugar and energy levels.'),
        option_code: 'diabetes_fiber',
      },
      diabetes_meal_timing: {
        option_text: i18n.__(
          'Provided education related to timing and balance of meals, focusing on eating more calories in the morning.',
        ),
        option_code: 'diabetes_meal_timing',
      },
      diabetes_stress: {
        option_text: i18n.__(
          'Provided education about how cortisol from high stress levels can increase blood sugar and reviewed strategies to reduce everyday stress.',
        ),
        option_code: 'diabetes_stress',
      },
      diabetes_movement: {
        option_text: i18n.__('Provided education about how moving helps balance blood sugar.'),
        option_code: 'diabetes_movement',
      },
      diabetes_meal_planning: {
        option_text: i18n.__(
          'Provided education about how consistent meal planning can help improve diabetes outcomes.',
        ),
        option_code: 'diabetes_meal_planning',
      },
      diabetes_blood_sugar: {
        option_text: i18n.__(
          'Reviewed checking blood sugar if experiencing symptoms of low blood sugar and follow the 15-15 rule if levels are <70 mg/dl.',
        ),
        option_code: 'diabetes_blood_sugar',
      },
      diabetes_carbohydrate_counting: {
        option_text: i18n.__(
          'Provided education on carbohydrate counting for managing blood glucose levels. Aim for a set number of carbohydrate choices per meal.',
        ),
        option_code: 'diabetes_carbohydrate_counting',
      },
      diabetes_management: {
        option_text: i18n.__(
          'Provided education on managing diabetes with balanced meals, portion control, and healthy carbohydrate choices.',
        ),
        option_code: 'diabetes_management',
      },
      diabetes_guidelines: {
        option_text: i18n.__(
          'Provided guidelines on consistent carbohydrate intake, shopping and cooking support to improve overall diet quality and save money.',
        ),
        option_code: 'diabetes_guidelines',
      },
      diabetes_food_overview: {
        option_text: i18n.__('Reviewed foods that impact blood sugar, including carb type, carb amounts, and fiber.'),
        option_code: 'diabetes_food_overview',
      },
      dining_out_strategies: {
        option_text: i18n.__(
          'Advised on dining out strategies, like using to-go containers, sharing an entree and ordering smaller portion sizes.',
        ),
        option_code: 'dining_out_strategies',
      },
      dining_out_special_occasions: {
        option_text: i18n.__('Suggested navigating special occasions with a healthy eating plan.'),
        option_code: 'dining_out_special_occasions',
      },
      dining_out_restaurants: {
        option_text: i18n.__('Suggested healthier restaurant choices and limiting how often dining out occurs.'),
        option_code: 'dining_out_restaurants',
      },
      dining_out_holidays: {
        option_text: i18n.__('Discussed holiday celebration strategies with family for maintaining healthy habits.'),
        option_code: 'dining_out_holidays',
      },
      emotional_eating_signs: {
        option_text: i18n.__('Discussed signs of emotional eating and how to differentiate with true hunger.'),
        option_code: 'emotional_eating_signs',
      },
      esrd_introduction: {
        option_text: i18n.__('Reviewed introduction to ESRD and common causes of kidney disease.'),
        option_code: 'esrd_introduction',
      },
      esrd_lab_results: {
        option_text: i18n.__('Discussed lab results associated with ESRD.'),
        option_code: 'esrd_lab_results',
      },
      esrd_sodium_fluid: {
        option_text: i18n.__('Reviewed sodium and fluid management with ESRD.'),
        option_code: 'esrd_sodium_fluid',
      },
      esrd_potassium: {
        option_text: i18n.__('Reviewed potassium intake with ESRD while on dialysis.'),
        option_code: 'esrd_potassium',
      },
      esrd_mineral_bone: {
        option_text: i18n.__('Discussed mineral bone disorder with ESRD.'),
        option_code: 'esrd_mineral_bone',
      },
      esrd_phosphorus: {
        option_text: i18n.__('Educated on phosphorus intake with ESRD.'),
        option_code: 'esrd_phosphorus',
      },
      esrd_protein_infection: {
        option_text: i18n.__('Discussed how ESRD affects albumin, protein, infection and inflammation.'),
        option_code: 'esrd_protein_infection',
      },
      esrd_activity: {
        option_text: i18n.__('Discussed how to stay active while on dialysis.'),
        option_code: 'esrd_activity',
      },
      esrd_shopping: { option_text: i18n.__('Educated on smart shopping with ESRD.'), option_code: 'esrd_shopping' },
      esrd_blood_sugar: {
        option_text: i18n.__('Discussed managing blood sugar with ESRD.'),
        option_code: 'esrd_blood_sugar',
      },
      esrd_supplementation: {
        option_text: i18n.__('Educated on safe supplementation for ESRD.'),
        option_code: 'esrd_supplementation',
      },
      esrd_whole_food_diet: {
        option_text: i18n.__('Educated on adopting a whole food plant based diet with ESRD.'),
        option_code: 'esrd_whole_food_diet',
      },
      fiber_goal: {
        option_text: i18n.__(
          'Reviewed your fiber daily goal from a variety of non-starchy vegetables, whole grains, beans, legumes, and fruits.',
        ),
        option_code: 'fiber_goal',
      },
      fiber_constipation: {
        option_text: i18n.__(
          'Provided education on dealing with constipation through increased fiber intake, hydration, and physical activity.',
        ),
        option_code: 'fiber_constipation',
      },
      fodmap_continuation: {
        option_text: i18n.__('Advised continuing low-FODMAP elimination diet and starting FODMAP challenges.'),
        option_code: 'fodmap_continuation',
      },
      fodmap_reintroduction: {
        option_text: i18n.__('Discussed careful reintroduction of high-FODMAP foods to test tolerance.'),
        option_code: 'fodmap_reintroduction',
      },
      fodmap_ibs: {
        option_text: i18n.__('Eliminated high-FODMAP foods to manage symptoms of IBS or IBD.'),
        option_code: 'fodmap_ibs',
      },
      fodmap_microbiome: {
        option_text: i18n.__(
          'Provided education on the gut microbiome and the health benefits of probiotics and prebiotics.',
        ),
        option_code: 'fodmap_microbiome',
      },
      food_bucks_overview: {
        option_text: i18n.__('Discussed and reviewed food incentives and how to redeem them and use to shop online.'),
        option_code: 'food_bucks_overview',
      },
      food_label_education: {
        option_text: i18n.__(
          'Provided education on reading a nutrition label focusing on ingredients and macro and micronutrients.',
        ),
        option_code: 'food_label_education',
      },
      foodsmart_website_meal_planning: {
        option_text: i18n.__(
          'Built 3 balanced meals per day and utilized resources like the Foodsmart website for meal planning.',
        ),
        option_code: 'foodsmart_website_meal_planning',
      },
      foodsmart_website_features: {
        option_text: i18n.__(
          'Encouraged exploring features in the Foodsmart website for meal planning, recipes, and grocery shopping or delivery.',
        ),
        option_code: 'foodsmart_website_features',
      },
      fruit_adding: {
        option_text: i18n.__('Educated on adding fruit to meals consistently throughout the day.'),
        option_code: 'fruit_adding',
      },
      fruit_goal: { option_text: i18n.__('Reviewed your goal servings of fruit per meal.'), option_code: 'fruit_goal' },
      good_gut_overview: {
        option_text: i18n.__(
          'Reviewed individual symptoms, discussed the purpose of elimination diets with reintroduction, and assessed appropriateness of an elimination diet versus alternative nutritional interventions.',
        ),
        option_code: 'good_gut_overview',
      },
      good_gut_diet_structure: {
        option_text: i18n.__(
          'Discussed structure of and approach to individualized elimination diet, including: length, approach, and symptom monitoring. Reviewed tips and resources for success, including label reading and use of Foodsmart resources for meal selection or menu planning.',
        ),
        option_code: 'good_gut_diet_structure',
      },
      good_gut_initial_implementation: {
        option_text: i18n.__(
          'Reviewed individual experience during initial diet implementation with focus on troubleshooting issues, identified potential adjustments to foods eliminated, and reinforced availability of Foodsmart resources for meal selection or menu planning.',
        ),
        option_code: 'good_gut_initial_implementation',
      },
      good_gut_principles_microbiome: {
        option_text: i18n.__(
          'Outlined principles related to digestive and microbiome health, including nutritional strategies to support a diverse microbiome, and identified individualized strategies to promote efficient digestion.',
        ),
        option_code: 'good_gut_principles_microbiome',
      },
      good_gut_strategies_adherence: {
        option_text: i18n.__(
          'Assessed adherence to nutritional protocol, reviewed adequacy of nutritional intake and relevance of lifestyle factors for individual goals, reviewed strategies for designing nutritional adequate meals during an elimination diet, and reinforced availability of Foodsmart resources for meal selection or menu planning.',
        ),
        option_code: 'good_gut_strategies_adherence',
      },
      good_gut_symptom_stress: {
        option_text: i18n.__(
          'Reviewed symptom changes and progress in relationship to nutritional protocol, encouraged diverse sources of fiber and protein to support microbiome diversity, and discussed individualized nutrition and lifestyle strategies to reduce stress to manage current or future stress-related digestive symptoms.',
        ),
        option_code: 'good_gut_symptom_stress',
      },
      good_gut_outside_preparation: {
        option_text: i18n.__(
          'Reviewed symptom changes and progress in relationship to nutritional protocol and identified protocol-specific guidelines for choosing and consuming foods prepared by others.',
        ),
        option_code: 'good_gut_outside_preparation',
      },
      good_gut_social_events: {
        option_text: i18n.__(
          'Reviewed symptom changes and progress in relationship to nutritional protocol and discussed strategies for navigating holidays, parties, and special events while on an elimination diet.',
        ),
        option_code: 'good_gut_social_events',
      },
      good_gut_reintroduction_process: {
        option_text: i18n.__(
          'Reviewed symptom changes and progress in relationship to nutritional protocol, reinforced principles of diverse nutritional intake to support digestive health, and reviewed process of food reintroduction (including timeline and approach to symptom monitoring).',
        ),
        option_code: 'good_gut_reintroduction_process',
      },
      good_gut_reintroduction_symptoms: {
        option_text: i18n.__(
          'Discussed current symptom response to food reintroduction(s), identified nutritional intake gaps and priorities based on current food intake and discussed opportunities for lifestyle or additional medical interventions as deemed appropriate.',
        ),
        option_code: 'good_gut_reintroduction_symptoms',
      },
      good_gut_symptom_changes: {
        option_text: i18n.__(
          'Discussed recent changes in symptom frequency or intensity, as related to reintroduced foods and current nutritional intake. Discussed food substitutions for long-term symptom management, based on identified trigger foods.',
        ),
        option_code: 'good_gut_symptom_changes',
      },
      good_gut_progress_review: {
        option_text: i18n.__(
          'Reviewed overall progress toward health and nutrition goals during 12-week program, identified specific achievements relevant to goals, and offered ongoing accountability and support through additional MNT sessions.',
        ),
        option_code: 'good_gut_progress_review',
      },
      healthy_mind_healthy_body_overview: {
        option_text: i18n.__('Provided an overview of the principles of intuitive eating.'),
        option_code: 'healthy_mind_healthy_body_overview',
      },
      healthy_mind_healthy_body_wellness: {
        option_text: i18n.__(
          'Encouraged patient to let go of restrictive dieting patterns and focus on long-term wellness.',
        ),
        option_code: 'healthy_mind_healthy_body_wellness',
      },
      healthy_mind_healthy_body_hunger_cue: {
        option_text: i18n.__("Taught patient to recognize and respond to their body's hunger cue."),
        option_code: 'healthy_mind_healthy_body_hunger_cue',
      },
      healthy_mind_healthy_body_labels: {
        option_text: i18n.__('Guided patient in removing the good and bad labels from foods.'),
        option_code: 'healthy_mind_healthy_body_labels',
      },
      healthy_mind_healthy_body_judgments: {
        option_text: i18n.__('Reviewed how to reframe internal or external judgments about food choices.'),
        option_code: 'healthy_mind_healthy_body_judgments',
      },
      healthy_mind_healthy_body_mindful_eating: {
        option_text: i18n.__('Educated the patient on the principles of mindful eating.'),
        option_code: 'healthy_mind_healthy_body_mindful_eating',
      },
      healthy_mind_healthy_body_joy: {
        option_text: i18n.__('Discussed how to reconnect with the joy of eating.'),
        option_code: 'healthy_mind_healthy_body_joy',
      },
      healthy_mind_healthy_body_emotion_hunger: {
        option_text: i18n.__('Provided strategies to help differentiate between physical hunger and emotional needs.'),
        option_code: 'healthy_mind_healthy_body_emotion_hunger',
      },
      healthy_mind_healthy_body_body_image: {
        option_text: i18n.__('Discussed the importance of positive body image.'),
        option_code: 'healthy_mind_healthy_body_body_image',
      },
      healthy_mind_healthy_body_physical_activity: {
        option_text: i18n.__('Emphasized the importance of finding physical activities that are enjoyable.'),
        option_code: 'healthy_mind_healthy_body_physical_activity',
      },
      healthy_mind_healthy_body_satisfaction: {
        option_text: i18n.__(
          'Reviewed how to choose foods that both satisfy their taste buds and nourish their bodies.',
        ),
        option_code: 'healthy_mind_healthy_body_satisfaction',
      },
      healthy_mind_healthy_body_intuitive_eating: {
        option_text: i18n.__(
          'Reinforced the key principles of intuitive eating and helped patient create a personalized plan.',
        ),
        option_code: 'healthy_mind_healthy_body_intuitive_eating',
      },
      healthy_parent_healthy_baby_prenatal: {
        option_text: i18n.__(
          'Discussed the importance of nutrition in the prenatal period and how nutrition impacts your pregnancy.',
        ),
        option_code: 'healthy_parent_healthy_baby_prenatal',
      },
      healthy_parent_healthy_baby_first_trimester_nutrients: {
        option_text: i18n.__(
          'Reviewed key nutrients that support you and your growing baby during the first trimester.',
        ),
        option_code: 'healthy_parent_healthy_baby_first_trimester_nutrients',
      },
      healthy_parent_healthy_baby_nausea: {
        option_text: i18n.__('Discussed strategies for managing pregnancy-related nausea and constipation.'),
        option_code: 'healthy_parent_healthy_baby_nausea',
      },
      healthy_parent_healthy_baby_exercise: {
        option_text: i18n.__(
          'Emphasized the benefits of frequent, safe exercise during pregnancy and how to create the right exercise plan.',
        ),
        option_code: 'healthy_parent_healthy_baby_exercise',
      },
      healthy_parent_healthy_baby_second_trimester_nutrients: {
        option_text: i18n.__(
          'Reviewed key nutrients that support you and your growing baby during the second trimester.',
        ),
        option_code: 'healthy_parent_healthy_baby_second_trimester_nutrients',
      },
      healthy_parent_healthy_baby_safe_foods: {
        option_text: i18n.__(
          'Discussed how to manage cravings and food aversions as well as foods to avoid during pregnancy.',
        ),
        option_code: 'healthy_parent_healthy_baby_safe_foods',
      },
      healthy_parent_healthy_baby_brain_development: {
        option_text: i18n.__('Identified key nutrients and where to find them for optimal brain development.'),
        option_code: 'healthy_parent_healthy_baby_brain_development',
      },
      healthy_parent_healthy_baby_hydration: {
        option_text: i18n.__('Educated on easy ways to stay hydrated during pregnancy.'),
        option_code: 'healthy_parent_healthy_baby_hydration',
      },
      healthy_parent_healthy_baby_third_trimester_nutrients: {
        option_text: i18n.__(
          'Reviewed key nutrients that support you and your growing baby during the third trimester.',
        ),
        option_code: 'healthy_parent_healthy_baby_third_trimester_nutrients',
      },
      healthy_parent_healthy_baby_third_trimester: {
        option_text: i18n.__(
          'Discussed the importance of staying active and safe during the final stages of pregnancy.',
        ),
        option_code: 'healthy_parent_healthy_baby_third_trimester',
      },
      healthy_parent_healthy_baby_breastfeeding: {
        option_text: i18n.__(
          'Educated on the benefits of breastfeeding, how to prepare formula and making a feeding plan for your infant.',
        ),
        option_code: 'healthy_parent_healthy_baby_breastfeeding',
      },
      healthy_parent_healthy_baby_postpartum: {
        option_text: i18n.__('Reviewed postpartum nutrition for helping your body recover from birth.'),
        option_code: 'healthy_parent_healthy_baby_postpartum',
      },
      health_plate_portions: {
        option_text: i18n.__(
          'Discussed Healthy Plate as a way to control portion sizes and the importance of trying different foods, especially non-starchy vegetables and different lean proteins.',
        ),
        option_code: 'health_plate_portions',
      },
      health_plate_knowledge: {
        option_text: i18n.__(
          'Increased knowledge of nutrition management by providing appropriate education on Healthy Plate guidelines with a focus on macro and micronutrient consumption.',
        ),
        option_code: 'health_plate_knowledge',
      },
      health_plate_guidelines: {
        option_text: i18n.__(
          'Reviewed Healthy Plate guidelines: 1/2 plate non-starchy vegetables, 1/4 plate lean protein, 1/4 plate carbs (whole grains or fruit), small serving healthy fat.',
        ),
        option_code: 'health_plate_guidelines',
      },
      health_plate_weight_management: {
        option_text: i18n.__('Discussed the Healthy Plate guidelines for weight management and portion control.'),
        option_code: 'health_plate_weight_management',
      },
      healthy_weight_smart: {
        option_text: i18n.__(
          'Provided a clear explanation of SMART (Specific, Measurable, Achievable, Relevant, Time-bound) goals, emphasizing their importance in creating actionable and realistic health and wellness objectives.',
        ),
        option_code: 'healthy_weight_smart',
      },
      healthy_weight_perfect_plate: {
        option_text: i18n.__(
          'Introduced the concept of the "Perfect Plate," focusing on portion control, balance of macronutrients (proteins, fats, and carbohydrates), and the inclusion of fruits, vegetables, and whole grains.',
        ),
        option_code: 'healthy_weight_perfect_plate',
      },
      healthy_weight_labels: {
        option_text: i18n.__('Reviewed how to read and interpret nutrition labels.'),
        option_code: 'healthy_weight_labels',
      },
      healthy_weight_physical_activity: {
        option_text: i18n.__(
          'Discussed the importance of incorporating regular physical activity into daily life, emphasizing the benefits for weight management.',
        ),
        option_code: 'healthy_weight_physical_activity',
      },
      healthy_weight_mindful_eating: {
        option_text: i18n.__(
          'Introduced the principles of mindful eating, emphasizing awareness of hunger cues, the sensory experience of eating, and the emotional aspects of food.',
        ),
        option_code: 'healthy_weight_mindful_eating',
      },
      healthy_weight_menu_choices: {
        option_text: i18n.__(
          'Educated patient on making healthier menu choices when dining out, including portion control, choosing nutrient-dense options, and understanding menu terminology.',
        ),
        option_code: 'healthy_weight_menu_choices',
      },
      healthy_weight_cost: {
        option_text: i18n.__(
          'Provided guidance on selecting nutritious, budget-friendly foods, focusing on whole foods, seasonal produce, and cost-effective protein sources.',
        ),
        option_code: 'healthy_weight_cost',
      },
      healthy_weight_cravings: {
        option_text: i18n.__(
          'Introduced strategies to manage and reduce cravings, such as mindful eating, stress management, and incorporating satisfying, nutrient-dense foods into the diet.',
        ),
        option_code: 'healthy_weight_cravings',
      },
      healthy_weight_action_plan: {
        option_text: i18n.__(
          'Guided patient in creating an action plan to address setbacks, focusing on small, achievable steps to regain momentum.',
        ),
        option_code: 'healthy_weight_action_plan',
      },
      healthy_weight_plateau: {
        option_text: i18n.__(
          'Provided general strategies to overcome plateaus, such as adjusting nutrition, varying physical activity, and reviewing lifestyle habits.',
        ),
        option_code: 'healthy_weight_plateau',
      },
      healthy_weight_social_events: {
        option_text: i18n.__('Educated patient on strategies for social events.'),
        option_code: 'healthy_weight_social_events',
      },
      healthy_weight_long_term: {
        option_text: i18n.__('Educated patient on strategies for long term success.'),
        option_code: 'healthy_weight_long_term',
      },
      heart_health_diet_education: {
        option_text: i18n.__(
          'Provided diet education on strategies to increase intake of healthy fats and fiber and decrease intake of saturated fats to reach overall goals of improving lipid panel.',
        ),
        option_code: 'heart_health_diet_education',
      },
      heart_health_variety: {
        option_text: i18n.__(
          'Reviewed to eat a variety of foods with healthy fats, particularly focusing on omega-3 fats found in fatty fish and certain nuts/seeds.',
        ),
        option_code: 'heart_health_variety',
      },
      heart_health_prevention: {
        option_text: i18n.__(
          'Educated on heart disease prevention and the importance of a heart-healthy diet, regular exercise, and stress management.',
        ),
        option_code: 'heart_health_prevention',
      },
      heart_health_cholesterol: {
        option_text: i18n.__(
          'Provided diet education on nutritional strategies to aid with management of cholesterol (LDL, HDL, triglycerides).',
        ),
        option_code: 'heart_health_cholesterol',
      },
      heart_health_causes: {
        option_text: i18n.__(
          'Educated on major causes of heart disease, hypertension and high cholesterol and how they affect heart health.',
        ),
        option_code: 'heart_health_causes',
      },
      heart_health_foods: {
        option_text: i18n.__(
          'Emphasized fruits, vegetables, whole grains, healthy fats and lean protein to support heart health.',
        ),
        option_code: 'heart_health_foods',
      },
      heart_health_fats: {
        option_text: i18n.__(
          'Discussed the difference between saturated and unsaturated fats and the role they play in heart health.',
        ),
        option_code: 'heart_health_fats',
      },
      heart_health_sodium: {
        option_text: i18n.__('Identified foods that are high in sodium and developed strategies to avoid them.'),
        option_code: 'heart_health_sodium',
      },
      heart_health_fiber: {
        option_text: i18n.__('Discussed the importance of fiber and how to add more to your diet.'),
        option_code: 'heart_health_fiber',
      },
      heart_health_sugar: {
        option_text: i18n.__(
          'Identified sources of added sugar that can be hidden in your diet and ways to reduce sugar intake.',
        ),
        option_code: 'heart_health_sugar',
      },
      heart_health_hydration: {
        option_text: i18n.__(
          'Reviewed the importance of staying hydrated and easy ways to help you stay hydrated each day.',
        ),
        option_code: 'heart_health_hydration',
      },
      heart_health_label: {
        option_text: i18n.__(
          'Educated on how to read a nutrition label and find heart-healthy foods within your budget.',
        ),
        option_code: 'heart_health_label',
      },
      heart_health_plant_protein: {
        option_text: i18n.__(
          'Discussed ways to incorporate plant-based protein and new cooking techniques to build heart-healthy meals.',
        ),
        option_code: 'heart_health_plant_protein',
      },
      heart_health_physical_exercise: {
        option_text: i18n.__(
          'Educated on the importance of daily movement and finding an exercise routine that works.',
        ),
        option_code: 'heart_health_physical_exercise',
      },
      heart_health_sleep_stress: {
        option_text: i18n.__(
          'Discussed how sleep and stress can affect your heart and identified ways to improve the quality of your sleep and ways to reduce stress.',
        ),
        option_code: 'heart_health_sleep_stress',
      },
      heart_health_lifestyle: {
        option_text: i18n.__('Reviewed ways to maintain your heart-healthy lifestyle.'),
        option_code: 'heart_health_lifestyle',
      },
      hydration_importance: {
        option_text: i18n.__(
          'Discussed the importance of hydration and aim for proper fluid intake with meals and snacks.',
        ),
        option_code: 'hydration_importance',
      },
      hydration_goals: {
        option_text: i18n.__(
          'Recommend staying hydrated by drinking at least your goal number of ounces of water daily.',
        ),
        option_code: 'hydration_goals',
      },
      hydration_reminders: {
        option_text: i18n.__(
          'Educated on staying hydrated by setting reminders or integrating water intake into your routine.',
        ),
        option_code: 'hydration_reminders',
      },
      hydration_energy: {
        option_text: i18n.__(
          'Discussed the importance of hydration for helping to ensure adequate energy levels. Explained that hunger and thirst cues can be easily confused.',
        ),
        option_code: 'hydration_energy',
      },
      micronutrients_education: {
        option_text: i18n.__('Provided education on specific micronutrients and impact on health or disease state.'),
        option_code: 'micronutrients_education',
      },
      peak_performance_overview: {
        option_text: i18n.__(
          'Provided overview of program curriculum, discussed member goals, and discussed basics of sports performance using the nutritional pyramid of importance.',
        ),
        option_code: 'peak_performance_overview',
      },
      peak_performance_macronutrients: {
        option_text: i18n.__(
          'Reviewed weekly progress, discussed the functional role of macronutrients in an athlete’s diet, explained principles for adjusting macronutrient intake based on training type or intensity, and created a personalized list of performance foods.',
        ),
        option_code: 'peak_performance_macronutrients',
      },
      peak_performance_metrics: {
        option_text: i18n.__(
          'Reviewed weekly progress, defined nutrition-specific metrics to monitor (as needed), and discussed recommendations for timing nutrition to promote optimal energy during and recovery from training.',
        ),
        option_code: 'peak_performance_metrics',
      },
      peak_performance_hydration: {
        option_text: i18n.__(
          'Reviewed weekly progress, discussed role of hydration in health and athletic performance, evaluated current adequacy of hydration, and discussed strategies for monitoring and adapting hydration for optimal health and performance.',
        ),
        option_code: 'peak_performance_hydration',
      },
      peak_performance_supplements: {
        option_text: i18n.__(
          'Established current intake of sports-related dietary supplements, evaluated individual decision-making process for use of dietary supplements, and communicated principles for determining effectiveness and safety of dietary supplements.',
        ),
        option_code: 'peak_performance_supplements',
      },
      peak_performance_travel: {
        option_text: i18n.__(
          'Discussed strategies for adjusting nutritional intake during travel, including meal choice at restaurants and ways to adapt available foods to satisfy performance plate goals.',
        ),
        option_code: 'peak_performance_travel',
      },
      peak_performance_body_composition: {
        option_text: i18n.__(
          'Discussed relevance of body composition to athletic performance, reviewed strategies for adapting nutritional intake based on body composition goals, and discussed appropriate pace and timing for body weight modification.',
        ),
        option_code: 'peak_performance_body_composition',
      },
      peak_performance_knowledge: {
        option_text: i18n.__(
          'Reinforced sports nutrition knowledge foundations (role of macronutrients, fuel timing) and evaluated potential benefits and pitfalls of various eating patterns.',
        ),
        option_code: 'peak_performance_knowledge',
      },
      peak_performance_energy_availability: {
        option_text: i18n.__(
          'Discussed principles of energy availability for sport, signs or symptoms of RED-s or Low EA and strategies to reduce the risk of low EA or RED-s.',
        ),
        option_code: 'peak_performance_energy_availability',
      },
      peak_performance_alcohol: {
        option_text: i18n.__(
          'Explained the impact of alcohol on athletic performance or recovery, and discussed strategies to mitigate undesirable effects of alcohol consumption relevant to individual preferences.',
        ),
        option_code: 'peak_performance_alcohol',
      },
      peak_performance_sleep: {
        option_text: i18n.__(
          'Evaluated current sleep habits, reviewed foods which could negatively impact sleep quantity or quality, and created individual goals for improving sleep hygiene.',
        ),
        option_code: 'peak_performance_sleep',
      },
      peak_performance_tactics: {
        option_text: i18n.__(
          'Outlined nutritional tactics to optimize health and body composition when training load is decreased (off-season), introduced mindful eating and meal planning tactics to adjust caloric intake for reduced activity, and reinforced available Foodsmart resources to support fueling goals.',
        ),
        option_code: 'peak_performance_tactics',
      },
      physical_activity_stability: {
        option_text: i18n.__('Encouraged adding flexibility, stability, and balance exercises to the regimen.'),
        option_code: 'physical_activity_stability',
      },
      physical_activity_cardio: {
        option_text: i18n.__(
          'Focused on cardiovascular or endurance activities, strength-training, stretching for flexibility, and balance exercises.',
        ),
        option_code: 'physical_activity_cardio',
      },
      physical_activity_work: {
        option_text: i18n.__('Increased activity at work by setting reminders to stand up every hour.'),
        option_code: 'physical_activity_work',
      },
      physical_activity_goal: {
        option_text: i18n.__('Reviewed your goal number of minutes of exercise per day.'),
        option_code: 'physical_activity_goal',
      },
      portion_control_hands: {
        option_text: i18n.__(
          'Discussed portion control using hands as a guide (fist = carbs, palm = protein, thumb = fats) as well as using calorie guide provided in the patient summary.',
        ),
        option_code: 'portion_control_hands',
      },
      portion_control_strategies: {
        option_text: i18n.__('Practiced portion control strategies and mindful eating habits.'),
        option_code: 'portion_control_strategies',
      },
      sleep_weight: {
        option_text: i18n.__(
          'Discussed the importance of sleep in weight loss and suggested techniques to improve sleep hygiene.',
        ),
        option_code: 'sleep_weight',
      },
      sleep_quality: {
        option_text: i18n.__(
          'Recommended improving sleep quality by working on sleep hygiene, including physical activity, reducing sugar intake, avoiding caffeine, and creating a bedtime routine.',
        ),
        option_code: 'sleep_quality',
      },
      food_insecurity_nutrition_label: {
        option_text: i18n.__(
          'Discussed reading a nutrition label to create a plate packed with superfoods that are nutrient-dense and cost-effective.',
        ),
        option_code: 'food_insecurity_nutrition_label',
      },
      food_insecurity_kitchen_tools: {
        option_text: i18n.__('Reviewed kitchen tools and appliances that are available to use to make healthy meals.'),
        option_code: 'food_insecurity_kitchen_tools',
      },
      food_insecurity_budget_tools: {
        option_text: i18n.__(
          'Reviewed food budget and how to stretch the dollar with coupons, budgeting tools, and affordable foods.',
        ),
        option_code: 'food_insecurity_budget_tools',
      },
      food_insecurity_shopping: {
        option_text: i18n.__('Discussed how to make grocery shopping faster and cheaper using Foodsmart tools.'),
        option_code: 'food_insecurity_shopping',
      },
      food_insecurity_meal_planning: {
        option_text: i18n.__('Discussed easy meal planning techniques to save money and reduce food waste.'),
        option_code: 'food_insecurity_meal_planning',
      },
      food_insecurity_budget_foods: {
        option_text: i18n.__(
          'Discussed stretching the budget with canned and frozen foods, filling snacks, and plant-based proteins.',
        ),
        option_code: 'food_insecurity_budget_foods',
      },
      food_insecurity_cooking_techniques: {
        option_text: i18n.__(
          'Reviewed simple cooking techniques and food safety basics that will help with healthy cooking.',
        ),
        option_code: 'food_insecurity_cooking_techniques',
      },
      food_insecurity_impulse: {
        option_text: i18n.__(
          'Reviewed the importance to avoid impulse purchases and expensive fast foods runs with healthy and affordable tips for busy days.',
        ),
        option_code: 'food_insecurity_impulse',
      },
      food_insecurity_local_resources: {
        option_text: i18n.__(
          'Discussed local resources to help access affordable healthy foods like food banks, school programs, and farmers markets.',
        ),
        option_code: 'food_insecurity_local_resources',
      },
      food_insecurity_barriers: {
        option_text: i18n.__('Reviewed barriers to health goals and created a SNAP reenrollment plan.'),
        option_code: 'food_insecurity_barriers',
      },
      food_insecurity_past_goals: {
        option_text: i18n.__(
          'Summarized past goals and accomplishments that turned into healthy habits and set new goals to continue for improvements.',
        ),
        option_code: 'food_insecurity_past_goals',
      },
      stress_coping: {
        option_text: i18n.__('Reviewed coping skills to improve stress management.'),
        option_code: 'stress_coping',
      },
      tracking_journal: {
        option_text: i18n.__('Recommend using a food journal to track food intake, symptoms, and meal times.'),
        option_code: 'tracking_journal',
      },
      vegetables_adding: {
        option_text: i18n.__(
          'Educated on adding vegetables (non-starchy) to meals and snacks consistently throughout the day.',
        ),
        option_code: 'vegetables_adding',
      },
      vegetables_goal: {
        option_text: i18n.__('Reviewed your goal number of servings of vegetables per meal.'),
        option_code: 'vegetables_goal',
      },
      wallet_wellness_strategies: {
        option_text: i18n.__('Provided healthy nutrition strategies to save money.'),
        option_code: 'wallet_wellness_strategies',
      },
      wallet_wellness_snap: { option_text: i18n.__('Enrolled member in SNAP.'), option_code: 'wallet_wellness_snap' },
      wallet_wellness_goals: {
        option_text: i18n.__(
          'Reviewed background and customized health goals and needs, food budget, lifestyle, and cooking skills.',
        ),
        option_code: 'wallet_wellness_goals',
      },
      wallet_wellness_balanced_meals: {
        option_text: i18n.__(
          'Discussed how to build a balanced meal using nutritionally dense and cost-effective foods.',
        ),
        option_code: 'wallet_wellness_balanced_meals',
      },
      wallet_wellness_budget_meals: {
        option_text: i18n.__(
          'Discovered budget-friendly recipes in the Foodsmart app and made a list of low-cost foods to keep on hand.',
        ),
        option_code: 'wallet_wellness_budget_meals',
      },
      wallet_wellness_foodsmart_website: {
        option_text: i18n.__('Utilized the Foodsmart website to help meal plan while accounting for time and budget.'),
        option_code: 'wallet_wellness_foodsmart_website',
      },
      wallet_wellness_local_produce: {
        option_text: i18n.__(
          'Focused on local seasonal produce and when to buy canned or frozen foods to cut down on meal costs.',
        ),
        option_code: 'wallet_wellness_local_produce',
      },
      wallet_wellness_protein: {
        option_text: i18n.__(
          'Reviewed the cost and nutrient breakdown of different protein sources like beans, lentils, tofu, red meat, poultry, and seafood.',
        ),
        option_code: 'wallet_wellness_protein',
      },
      wallet_wellness_deals: {
        option_text: i18n.__(
          'Discussed money-saving tips by finding best deals with generic brands, bulk foods, and cost/unit.',
        ),
        option_code: 'wallet_wellness_deals',
      },
      wallet_wellness_gardening: {
        option_text: i18n.__('Reviewed the basics of growing the easiest foods at home to supplement groceries.'),
        option_code: 'wallet_wellness_gardening',
      },
      wallet_wellness_takeout: {
        option_text: i18n.__(
          'Reviewed meal planning strategy for busy and emergency nights to avoid expensive takeout.',
        ),
        option_code: 'wallet_wellness_takeout',
      },
      wallet_wellness_storage: {
        option_text: i18n.__(
          'Discussed storage options for food to prevent unnecessary waste and to stretch food scraps.',
        ),
        option_code: 'wallet_wellness_storage',
      },
      wallet_wellness_leftovers: {
        option_text: i18n.__(
          'Discussed turning one meal into multiple meals by safely storing and repurposing leftovers.',
        ),
        option_code: 'wallet_wellness_leftovers',
      },
      weight_management_knowledge: {
        option_text: i18n.__(
          'Discussed increasing knowledge of nutrition to support weight management through balanced meals, portion control, lean protein, and fiber-rich carbohydrates.',
        ),
        option_code: 'weight_management_knowledge',
      },
      weight_management_satiety: {
        option_text: i18n.__(
          'Recommend adding a source of protein, fiber, or healthy fat to all meals or snacks for increased satiety and more lasting energy.',
        ),
        option_code: 'weight_management_satiety',
      },
      weight_management_setbacks: {
        option_text: i18n.__(
          'Discussed strategies for navigating slips and setbacks in healthy eating and lifestyle changes.',
        ),
        option_code: 'weight_management_setbacks',
      },
      weight_management_balanced_meals: {
        option_text: i18n.__('Educated on balanced meal planning and portion control for weight management.'),
        option_code: 'weight_management_balanced_meals',
      },
      weight_management_weight_checks: {
        option_text: i18n.__('Encouraged regular weight checks and diet recall to track progress.'),
        option_code: 'weight_management_weight_checks',
      },
      weight_management_intuitive_eating: {
        option_text: i18n.__('Introduced principles of intuitive eating and mindfulness surrounding food.'),
        option_code: 'weight_management_intuitive_eating',
      },
      weight_management_nutrients: {
        option_text: i18n.__(
          'Educated on macro and micronutrients to meet dietary recommendations for optimal health and weight maintenance.',
        ),
        option_code: 'weight_management_nutrients',
      },
      weight_management_mindful_eating: {
        option_text: i18n.__(
          'Practiced mindful eating by savoring every bite, minimizing distractions, and engaging all senses while eating.',
        ),
        option_code: 'weight_management_mindful_eating',
      },
      weight_management_fridge_pantry: {
        option_text: i18n.__('Discussed prepping the fridge and pantry for success and simple and healthy meals.'),
        option_code: 'weight_management_fridge_pantry',
      },
      weight_management_hunger_cues: {
        option_text: i18n.__('Promoted mindful eating, including recognizing hunger and fullness cues.'),
        option_code: 'weight_management_hunger_cues',
      },
      weight_management_calories: {
        option_text: i18n.__(
          'Provided education on calorie tracking; recommended eating within your calorie goal range per day to promote sustained weight loss.',
        ),
        option_code: 'weight_management_calories',
      },
      healthy_weight_gain: {
        option_text: i18n.__('Reviewed strategies to support healthy weight gain.'),
        option_code: 'healthy_weight_gain',
      },
      good_gut_post_operative: {
        option_text: i18n.__('Reviewed pre-operative bariatric surgery guidelines.'),
        option_code: 'good_gut_post_operative',
      },
      diabetes_added_sugars: {
        option_text: i18n.__('Reviewed food-based strategies for lowering added sugar intake.'),
        option_code: 'diabetes_added_sugars',
      },
      healthy_weight_nutriquiz: {
        option_text: i18n.__(
          'Provided education regarding nutritional excesses and inadequacies based on Nutriquiz results.',
        ),
        option_code: 'healthy_weight_nutriquiz',
      },
      pediatric_meal_planning: {
        option_text: i18n.__('Reviewed mealtime division of responsibilities for pediatric feeding.'),
        option_code: 'pediatric_meal_planning',
      },
      good_gut_new_food_introduction: {
        option_text: i18n.__('Developed strategies for introduction of new foods.'),
        option_code: 'good_gut_new_food_introduction',
      },
      healthy_weight_macronutrients: {
        option_text: i18n.__('Discussed specific macronutrient(s) goal(s) with implementation strategies.'),
        option_code: 'healthy_weight_macronutrients',
      },
      healthy_weight_micronutrients: {
        option_text: i18n.__('Discussed specific micronutrient(s) goal(s) with implementation strategies.'),
        option_code: 'healthy_weight_micronutrients',
      },
      food_insecurity_community_resources: {
        option_text: i18n.__('Identified local community agencies and/or food pantries to access additional food.'),
        option_code: 'food_insecurity_community_resources',
      },
      weight_management_modified_foods: {
        option_text: i18n.__('Discussed strategies for incorporating modified texture foods and beverages.'),
        option_code: 'weight_management_modified_foods',
      },
      healthy_weight_nutrients_interactions: {
        option_text: i18n.__('Provided education about drug-nutrient interactions.'),
        option_code: 'healthy_weight_nutrients_interactions',
      },
      healthy_weight_food_group_goals: {
        option_text: i18n.__('Identified specific food group targets in relationship to goals.'),
        option_code: 'healthy_weight_food_group_goals',
      },
      healthy_weight_barriers: {
        option_text: i18n.__('Identified strategies to overcome barriers to reaching health goals.'),
        option_code: 'healthy_weight_barriers',
      },
      food_insecurity_recipes: {
        option_text: i18n.__('Discussed recipes and food preparation tips to utilize food available.'),
        option_code: 'food_insecurity_recipes',
      },
      healthy_parent_healthy_baby_nursing: {
        option_text: i18n.__('Reviewed nutritional needs for nursing and postpartum mothers.'),
        option_code: 'healthy_parent_healthy_baby_nursing',
      },
      healthy_weight_nutrition_label_nutrients_concerns: {
        option_text: i18n.__('Provided education for reading nutritional labels to identify nutrient(s) of concern.'),
        option_code: 'healthy_weight_nutrition_label_nutrients_concerns',
      },
      healthy_weight_meal_timing_goals: {
        option_text: i18n.__('Discussed meal timing in relationship to goals.'),
        option_code: 'healthy_weight_meal_timing_goals',
      },
      healthy_weight_evidence_based_nutrition: {
        option_text: i18n.__('Countered current beliefs with evidence-based information.'),
        option_code: 'healthy_weight_evidence_based_nutrition',
      },
      healthy_weight_whole_grains: {
        option_text: i18n.__('Reviewed types and nutritional importance of whole grains.'),
        option_code: 'healthy_weight_whole_grains',
      },
      food_insecurity_foodsmart_bucks_meal_ordering: {
        option_text: i18n.__('Placed meal order or supported member in ordering prepared meals.'),
        option_code: 'food_insecurity_foodsmart_bucks_meal_ordering',
      },
      food_insecurity_foodsmart_bucks_grocery_shopping: {
        option_text: i18n.__('Placed grocery order or supported member in ordering groceries.'),
        option_code: 'food_insecurity_foodsmart_bucks_grocery_shopping',
      },
      pediatrics_solid_food_introduction: {
        option_text: i18n.__('Introduced solid foods for pediatric member.'),
        option_code: 'pediatrics_solid_food_introduction',
      },
      pediatrics_picky_eating: {
        option_text: i18n.__('Reintroduction of certain foods for picky eaters.'),
        option_code: 'pediatrics_picky_eating',
      },
      wallet_wellness_snap_eligibility_consent: {
        option_text: i18n.__('Discussed SNAP eligibility and consent for enrollment.'),
        option_code: 'wallet_wellness_snap_eligibility_consent',
      },
      wallet_wellness_snap_approved: {
        option_text: i18n.__('SNAP application was accepted, discussed how to effectively use SNAP benefit.'),
        option_code: 'wallet_wellness_snap_approved',
      },
      wallet_wellness_snap_reenroll: {
        option_text: i18n.__('Re-applied member for SNAP.'),
        option_code: 'wallet_wellness_snap_reenroll',
      },
      wallet_wellness_snap_declined: {
        option_text: i18n.__('SNAP application was denied, reviewed SNAP application.'),
        option_code: 'wallet_wellness_snap_declined',
      },
      wallet_wellness_snap_other_options: {
        option_text: i18n.__('Discussed Alternative Government Subsidies.'),
        option_code: 'wallet_wellness_snap_other_options',
      },
      food_insecurity_goals: {
        is_inactive: true,
        option_text: i18n.__(
          'Reviewed background and customized health goals and needs, food budget, lifestyle, and cooking skills.',
        ),
        option_code: 'food_insecurity_goals',
      },
    },
    problem: {
      increased_energy_expenditure: {
        option_text: i18n.__('Increased energy expenditure'),
        option_code: 'increased_energy_expenditure',
      },
      inadequate_energy_intake: {
        option_text: i18n.__('Inadequate (suboptimal) energy intake'),
        option_code: 'inadequate_energy_intake',
      },
      excessive_energy_intake: {
        option_text: i18n.__('Excessive energy intake'),
        option_code: 'excessive_energy_intake',
      },
      inadequate_oral_intake: {
        option_text: i18n.__('Inadequate (suboptimal) oral intake'),
        option_code: 'inadequate_oral_intake',
      },
      excessive_oral_intake: { option_text: i18n.__('Excessive oral intake'), option_code: 'excessive_oral_intake' },
      limited_food_acceptance: {
        option_text: i18n.__('Limited food acceptance'),
        option_code: 'limited_food_acceptance',
      },
      inadequate_en_infusion: { option_text: i18n.__('Inadequate EN infusion'), option_code: 'inadequate_en_infusion' },
      excessive_en_infusion: { option_text: i18n.__('Excessive EN infusion'), option_code: 'excessive_en_infusion' },
      en_composition_inconsistent_with_needs: {
        option_text: i18n.__('EN composition inconsistent with needs'),
        option_code: 'en_composition_inconsistent_with_needs',
      },
      en_administration_inconsistent_with_needs: {
        option_text: i18n.__('EN administration inconsistent with needs'),
        option_code: 'en_administration_inconsistent_with_needs',
      },
      inadequate_pn_infusion: { option_text: i18n.__('Inadequate PN infusion'), option_code: 'inadequate_pn_infusion' },
      excessive_pn_infusion: { option_text: i18n.__('Excessive PN infusion'), option_code: 'excessive_pn_infusion' },
      pn_composition_inconsistent_with_needs: {
        option_text: i18n.__('PN composition inconsistent with needs'),
        option_code: 'pn_composition_inconsistent_with_needs',
      },
      pn_administration_inconsistent_with_needs: {
        option_text: i18n.__('PN administration inconsistent with needs'),
        option_code: 'pn_administration_inconsistent_with_needs',
      },
      inadequate_fluid_intake: {
        option_text: i18n.__('Inadequate fluid intake'),
        option_code: 'inadequate_fluid_intake',
      },
      excessive_fluid_intake: { option_text: i18n.__('Excessive fluid intake'), option_code: 'excessive_fluid_intake' },
      inadequate_bioactive_substance_intake: {
        option_text: i18n.__('Inadequate bioactive substance intake'),
        option_code: 'inadequate_bioactive_substance_intake',
      },
      excessive_bioactive_substance_intake: {
        option_text: i18n.__('Excessive bioactive substance intake'),
        option_code: 'excessive_bioactive_substance_intake',
      },
      increased_nutrient_needs: {
        option_text: i18n.__('Increased nutrient needs'),
        option_code: 'increased_nutrient_needs',
      },
      decreased_nutrient_needs: {
        option_text: i18n.__('Decreased nutrient needs'),
        option_code: 'decreased_nutrient_needs',
      },
      imbalance_of_nutrients: { option_text: i18n.__('Imbalance of nutrients'), option_code: 'imbalance_of_nutrients' },
      inadequate_protein_energy_intake: {
        option_text: i18n.__('Inadequate (suboptimal) protein-energy intake'),
        option_code: 'inadequate_protein_energy_intake',
      },
      inadequate_fat_intake: { option_text: i18n.__('Inadequate fat intake'), option_code: 'inadequate_fat_intake' },
      excessive_fat_intake: { option_text: i18n.__('Excessive fat intake'), option_code: 'excessive_fat_intake' },
      intake_of_types_of_fats_inconsistent_with_needs: {
        option_text: i18n.__('Intake of types of fats inconsistent with needs'),
        option_code: 'intake_of_types_of_fats_inconsistent_with_needs',
      },
      inadequate_protein_intake: {
        option_text: i18n.__('Inadequate protein intake'),
        option_code: 'inadequate_protein_intake',
      },
      excessive_protein_intake: {
        option_text: i18n.__('Excessive protein intake'),
        option_code: 'excessive_protein_intake',
      },
      intake_of_proteins_inconsistent_with_needs: {
        option_text: i18n.__('Intake of types of proteins or amino acids inconsistent with needs'),
        option_code: 'intake_of_proteins_inconsistent_with_needs',
      },
      inadequate_carbohydrate_intake: {
        option_text: i18n.__('Inadequate carbohydrate intake'),
        option_code: 'inadequate_carbohydrate_intake',
      },
      excessive_carbohydrate_intake: {
        option_text: i18n.__('Excessive carbohydrate intake'),
        option_code: 'excessive_carbohydrate_intake',
      },
      intake_of_carbs_inconsistent_with_needs: {
        option_text: i18n.__('Intake of types of carbohydrates inconsistent with needs'),
        option_code: 'intake_of_carbs_inconsistent_with_needs',
      },
      inconsistent_carbohydrates: {
        option_text: i18n.__('Inconsistent carbohydrates'),
        option_code: 'inconsistent_carbohydrates',
      },
      inadequate_fiber_intake: {
        option_text: i18n.__('Inadequate fiber intake'),
        option_code: 'inadequate_fiber_intake',
      },
      excessive_fiber_intake: { option_text: i18n.__('Excessive fiber intake'), option_code: 'excessive_fiber_intake' },
      inadequate_vitamin_mineral_intake: {
        option_text: i18n.__('Inadequate intake of vitamin or mineral'),
        option_code: 'inadequate_vitamin_mineral_intake',
      },
      excessive_vitamin_mineral_intake: {
        option_text: i18n.__('Excessive intake of vitamin or mineral'),
        option_code: 'excessive_vitamin_mineral_intake',
      },
      swallowing_difficulty: { option_text: i18n.__('Swallowing difficulty'), option_code: 'swallowing_difficulty' },
      biting_chewing_difficulty: {
        option_text: i18n.__('Biting or chewing difficulty'),
        option_code: 'biting_chewing_difficulty',
      },
      breastfeeding_difficulty: {
        option_text: i18n.__('Breastfeeding difficulty'),
        option_code: 'breastfeeding_difficulty',
      },
      altered_gi_function: { option_text: i18n.__('Altered GI function'), option_code: 'altered_gi_function' },
      impaired_nutrient_utilization: {
        option_text: i18n.__('Impaired nutrient utilization'),
        option_code: 'impaired_nutrient_utilization',
      },
      altered_nutrition_related_lab_values: {
        option_text: i18n.__('Altered nutrition-related laboratory values'),
        option_code: 'altered_nutrition_related_lab_values',
      },
      food_medication_interaction: {
        option_text: i18n.__('Food-medication interaction'),
        option_code: 'food_medication_interaction',
      },
      underweight: { option_text: i18n.__('Underweight'), option_code: 'underweight' },
      unintended_weight_loss: { option_text: i18n.__('Unintended weight loss'), option_code: 'unintended_weight_loss' },
      unintended_weight_gain: { option_text: i18n.__('Unintended weight gain'), option_code: 'unintended_weight_gain' },
      growth_rate_below_expected: {
        option_text: i18n.__('Growth rate below expected'),
        option_code: 'growth_rate_below_expected',
      },
      chronic_disease_malnutrition: {
        option_text: i18n.__('Chronic disease or condition-related malnutrition (undernutrition)'),
        option_code: 'chronic_disease_malnutrition',
      },
      acute_disease_malnutrition: {
        option_text: i18n.__('Acute disease or injury-related malnutrition'),
        option_code: 'acute_disease_malnutrition',
      },
      non_illness_pediatric_malnutrition: {
        option_text: i18n.__('Non illness-related pediatric malnutrition'),
        option_code: 'non_illness_pediatric_malnutrition',
      },
      illness_related_pediatric_malnutrition: {
        option_text: i18n.__('Illness-related pediatric malnutrition'),
        option_code: 'illness_related_pediatric_malnutrition',
      },
      food_nutrition_knowledge_deficit: {
        option_text: i18n.__('Food- and nutrition-related knowledge deficit'),
        option_code: 'food_nutrition_knowledge_deficit',
      },
      not_ready_for_diet_lifestyle_change: {
        option_text: i18n.__('Not ready for diet or lifestyle change'),
        option_code: 'not_ready_for_diet_lifestyle_change',
      },
      disordered_eating_pattern: {
        option_text: i18n.__('Disordered eating pattern'),
        option_code: 'disordered_eating_pattern',
      },
      limited_adherence_nutrition_recommendations: {
        option_text: i18n.__('Limited adherence to nutrition-related recommendations'),
        option_code: 'limited_adherence_nutrition_recommendations',
      },
      undesirable_food_choices: {
        option_text: i18n.__('Undesirable food choices'),
        option_code: 'undesirable_food_choices',
      },
      physical_inactivity: { option_text: i18n.__('Physical inactivity'), option_code: 'physical_inactivity' },
      overweight_obesity: {
        is_inactive: true,
        option_text: i18n.__('Overweight or Obesity'),
        option_code: 'overweight_obesity',
      },
      excessive_physical_activity: {
        option_text: i18n.__('Excessive physical activity'),
        option_code: 'excessive_physical_activity',
      },
      intake_of_unsafe_food: { option_text: i18n.__('Intake of unsafe food'), option_code: 'intake_of_unsafe_food' },
      limited_access_to_food: { option_text: i18n.__('Limited access to food'), option_code: 'limited_access_to_food' },
      limited_ability_to_prepare_food_for_eating: {
        option_text: i18n.__('Limited ability to prepare food for eating'),
        option_code: 'limited_ability_to_prepare_food_for_eating',
      },
      excessive_alcohol_intake: {
        option_text: i18n.__('Excessive alcohol intake'),
        option_code: 'excessive_alcohol_intake',
      },
      inability_to_manage_self_care: {
        option_text: i18n.__('Inability to manage self-care'),
        option_code: 'inability_to_manage_self_care',
      },
      self_feeding_difficulty: {
        option_text: i18n.__('Self-feeding difficulty'),
        option_code: 'self_feeding_difficulty',
      },
      overweight: { option_text: i18n.__('Overweight'), option_code: 'overweight' },
      obesity: { option_text: i18n.__('Obesity'), option_code: 'obesity' },
    },
  }) as const;

export const getPesStatementOptions = ({ i18n }: IContext) =>
  ({
    increased_energy_expenditure: [
      { option_text: i18n.__('Wound healing'), option_code: 'wound_healing' },
      { option_text: i18n.__('Fever'), option_code: 'fever' },
      { option_text: i18n.__('Cancer'), option_code: 'cancer' },
      { option_text: i18n.__('COPD'), option_code: 'copd' },
      { option_text: i18n.__('Cerebral palsy'), option_code: 'cerebral_palsy' },
      { option_text: i18n.__('Cystic fibrosis'), option_code: 'cystic_fibrosis' },
      { option_text: i18n.__('Physical activity'), option_code: 'physical_activity' },
    ],
    inadequate_energy_intake: [
      { option_text: i18n.__('Catabolism energy increases'), option_code: 'catabolism_energy_increases' },
      { option_text: i18n.__('Poor intake'), option_code: 'poor_intake' },
      { option_text: i18n.__('Chewing or swallowing issues'), option_code: 'chewing_swallowing_issues' },
      { option_text: i18n.__('Taste changes'), option_code: 'taste_changes' },
      { option_text: i18n.__('Limited access to food'), option_code: 'limited_access_to_food' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
    ],
    excessive_energy_intake: [
      { option_text: i18n.__('Limited access to healthy food'), option_code: 'limited_access_to_food' },
      { option_text: i18n.__('Bingeing or disordered eating'), option_code: 'bingeing_disordered_eating' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Lack of value to change'), option_code: 'lack_of_value_to_change' },
      { option_text: i18n.__('Appetite stimulants'), option_code: 'appetite_stimulants' },
      { option_text: i18n.__('Decreased metabolism or needs'), option_code: 'decreased_metabolism_needs' },
    ],
    inadequate_oral_intake: [
      { option_text: i18n.__('Poor intake'), option_code: 'poor_intake' },
      { option_text: i18n.__('Catabolism energy increases'), option_code: 'catabolism_energy_increases' },
      { option_text: i18n.__('Chewing or swallowing issues'), option_code: 'chewing_swallowing_issues' },
      { option_text: i18n.__('Taste changes'), option_code: 'taste_changes' },
      { option_text: i18n.__('Limited access to food'), option_code: 'limited_access_to_food' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Depression or disordered eating'), option_code: 'depression_disordered_eating' },
    ],
    excessive_oral_intake: [
      { option_text: i18n.__('Bingeing or disordered eating'), option_code: 'bingeing_disordered_eating' },
      { option_text: i18n.__('Limited access to healthy food'), option_code: 'limited_access_to_food' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Poor satiety cues'), option_code: 'poor_satiety_cues' },
      { option_text: i18n.__('Appetite stimulants'), option_code: 'appetite_stimulants' },
      { option_text: i18n.__('Unwilling to reduce intake'), option_code: 'unwilling_to_reduce_intake' },
      { option_text: i18n.__('Lack of value to change'), option_code: 'lack_of_value_to_change' },
    ],
    limited_food_acceptance: [
      { option_text: i18n.__('GI pain or discomfort'), option_code: 'gi_pain_or_discomfort' },
      { option_text: i18n.__('Neurological disorders'), option_code: 'neurological_disorders' },
      { option_text: i18n.__('Food aversions'), option_code: 'food_aversions' },
      { option_text: i18n.__('Self-limitations'), option_code: 'self_limitations' },
      { option_text: i18n.__('Behavioral issues'), option_code: 'behavioral_issues' },
      { option_text: i18n.__('Unsupported beliefs or attitudes'), option_code: 'unsupported_beliefs_attitudes' },
    ],
    inadequate_en_infusion: [
      { option_text: i18n.__('Altered nutrient absorption'), option_code: 'altered_nutrient_absorption' },
      { option_text: i18n.__('Inappropriate formula'), option_code: 'inappropriate_formula' },
      { option_text: i18n.__('Formula or rate intolerance'), option_code: 'formula_or_rate_intolerance' },
      { option_text: i18n.__('Inadequate rate'), option_code: 'inadequate_rate' },
      { option_text: i18n.__('Infusion schedule interrupted'), option_code: 'infusion_schedule_interrupted' },
      { option_text: i18n.__('NPO'), option_code: 'npo' },
    ],
    excessive_en_infusion: [
      { option_text: i18n.__('Decreased energy needs'), option_code: 'decreased_energy_needs' },
      { option_text: i18n.__('Excessive rate'), option_code: 'excessive_rate' },
      { option_text: i18n.__('Pump malfunction'), option_code: 'pump_malfunction' },
      { option_text: i18n.__('Rate setting error'), option_code: 'rate_setting_error' },
      { option_text: i18n.__('Overfeeding'), option_code: 'overfeeding' },
    ],
    en_composition_inconsistent_with_needs: [
      { option_text: i18n.__('Needs different than estimate'), option_code: 'needs_different_than_estimate' },
      { option_text: i18n.__('Excessive GI losses'), option_code: 'excessive_gi_losses' },
      { option_text: i18n.__('End of life'), option_code: 'end_of_life' },
    ],
    en_administration_inconsistent_with_needs: [
      { option_text: i18n.__('Inadequate or excessive rate'), option_code: 'inadequate_excessive_rate' },
      { option_text: i18n.__('Infusion schedule interrupted'), option_code: 'infusion_schedule_interrupted' },
      { option_text: i18n.__('End of life'), option_code: 'end_of_life' },
    ],
    inadequate_pn_infusion: [
      { option_text: i18n.__('Altered nutrient absorption'), option_code: 'altered_nutrient_absorption' },
      { option_text: i18n.__('Pump malfunction'), option_code: 'pump_malfunction' },
      { option_text: i18n.__('Inadequate rate'), option_code: 'inadequate_rate' },
      { option_text: i18n.__('Awaiting PN access'), option_code: 'awaiting_pn_access' },
      { option_text: i18n.__('Infusion schedule interrupted'), option_code: 'infusion_schedule_interrupted' },
      { option_text: i18n.__('PN intolerance'), option_code: 'pn_intolerance' },
    ],
    excessive_pn_infusion: [
      { option_text: i18n.__('Decreased energy needs'), option_code: 'decreased_energy_needs' },
      { option_text: i18n.__('Excessive rate'), option_code: 'excessive_rate' },
      { option_text: i18n.__('Pump malfunction'), option_code: 'pump_malfunction' },
      { option_text: i18n.__('Rate setting error'), option_code: 'rate_setting_error' },
      { option_text: i18n.__('Overfeeding'), option_code: 'overfeeding' },
    ],
    pn_composition_inconsistent_with_needs: [
      { option_text: i18n.__('Needs different than estimate'), option_code: 'needs_different_than_estimate' },
      { option_text: i18n.__('End of life'), option_code: 'end_of_life' },
    ],
    pn_administration_inconsistent_with_needs: [
      { option_text: i18n.__('Inadequate or excessive rate'), option_code: 'inadequate_excessive_rate' },
      { option_text: i18n.__('Infusion schedule interrupted'), option_code: 'infusion_schedule_interrupted' },
      { option_text: i18n.__('End of life'), option_code: 'end_of_life' },
    ],
    inadequate_fluid_intake: [
      { option_text: i18n.__('Chewing or swallowing issues'), option_code: 'chewing_swallowing_issues' },
      { option_text: i18n.__('Need for thickened fluids'), option_code: 'need_for_thickened_fluids' },
      { option_text: i18n.__('Excess fluid losses'), option_code: 'excess_fluid_losses' },
      { option_text: i18n.__('Increased exercise'), option_code: 'increased_exercise' },
      { option_text: i18n.__('Decreased thirst cues'), option_code: 'decreased_thirst_cues' },
      { option_text: i18n.__('Limited access to fluid'), option_code: 'limited_access_to_fluid' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Impaired cognition'), option_code: 'impaired_cognition' },
    ],
    excessive_fluid_intake: [
      { option_text: i18n.__('End-stage renal disease'), option_code: 'end_stage_renal_disease' },
      { option_text: i18n.__('Nephrotic syndrome'), option_code: 'nephrotic_syndrome' },
      { option_text: i18n.__('Heart failure'), option_code: 'heart_failure' },
      { option_text: i18n.__('SIADH'), option_code: 'siadh' },
      { option_text: i18n.__('Increased thirst cues'), option_code: 'increased_thirst_cues' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
    ],
    inadequate_bioactive_substance_intake: [
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Altered GI function'), option_code: 'altered_gi_function' },
      { option_text: i18n.__('Limited access to bioactive foods'), option_code: 'limited_access_to_bioactive_foods' },
    ],
    excessive_bioactive_substance_intake: [
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Altered GI function'), option_code: 'altered_gi_function' },
      { option_text: i18n.__('Misuse of a substance'), option_code: 'misuse_of_a_substance' },
      { option_text: i18n.__('Alcohol or caffeine addiction'), option_code: 'alcohol_or_caffeine_addiction' },
      { option_text: i18n.__('Lack of value for change'), option_code: 'lack_of_value_for_change' },
    ],
    increased_nutrient_needs: [
      { option_text: i18n.__('Altered absorption or metabolism'), option_code: 'altered_absorption_metabolism' },
      { option_text: i18n.__('Pancreas or liver issues'), option_code: 'pancreas_liver_issues' },
      { option_text: i18n.__('Short bowel syndrome'), option_code: 'short_bowel_syndrome' },
      { option_text: i18n.__('Celiac disease'), option_code: 'celiac_disease' },
      { option_text: i18n.__('Crohn’s disease'), option_code: 'crohns_disease' },
      { option_text: i18n.__('Wound healing'), option_code: 'wound_healing' },
      { option_text: i18n.__('Infection'), option_code: 'infection' },
      { option_text: i18n.__('Increased demand for nutrient(s)'), option_code: 'increased_demand_for_nutrients' },
      { option_text: i18n.__('Bariatric Surgery'), option_code: 'bariatric_surgery' },
    ],
    decreased_nutrient_needs: [
      { option_text: i18n.__('Liver disease'), option_code: 'liver_disease' },
      { option_text: i18n.__('Renal disease'), option_code: 'renal_disease' },
      { option_text: i18n.__('Altered cholesterol regulation'), option_code: 'altered_cholesterol_regulation' },
      { option_text: i18n.__('IBD flare-up'), option_code: 'ibd_flare_up' },
      { option_text: i18n.__('Heart failure'), option_code: 'heart_failure' },
      { option_text: i18n.__('IBS food intolerances'), option_code: 'ibs_food_intolerances' },
      { option_text: i18n.__('Desired weight loss'), option_code: 'desired_weight_loss' },
    ],
    imbalance_of_nutrients: [
      { option_text: i18n.__('High dose supplements'), option_code: 'high_dose_supplements' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Food faddism'), option_code: 'food_faddism' },
      { option_text: i18n.__('Beliefs or Attitudes'), option_code: 'beliefs_or_attitudes' },
      { option_text: i18n.__('Limited nutrition skill'), option_code: 'limited_nutrition_skill' },
    ],
    inadequate_protein_energy_intake: [
      { option_text: i18n.__('Catabolism energy increases'), option_code: 'catabolism_energy_increases' },
      { option_text: i18n.__('Wound healing'), option_code: 'wound_healing' },
      { option_text: i18n.__('Malabsorption'), option_code: 'malabsorption' },
      { option_text: i18n.__('Limited access to food'), option_code: 'limited_access_to_food' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
    ],
    inadequate_fat_intake: [
      { option_text: i18n.__('Catabolism energy increases'), option_code: 'catabolism_energy_increases' },
      { option_text: i18n.__('Fat malabsorption'), option_code: 'fat_malabsorption' },
      { option_text: i18n.__('Altered GI function'), option_code: 'altered_gi_function' },
      { option_text: i18n.__('Less than optimal food choices'), option_code: 'less_than_optimal_food_choices' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
    ],
    excessive_fat_intake: [
      { option_text: i18n.__('Limited access to healthy foods'), option_code: 'limited_access_to_food' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Lack of value for change'), option_code: 'lack_of_value_for_change' },
      { option_text: i18n.__('Disordered eating'), option_code: 'disordered_eating' },
      { option_text: i18n.__('Intake of high-fat foods'), option_code: 'intake_of_high_fat_foods' },
    ],
    intake_of_types_of_fats_inconsistent_with_needs: [
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Limited access to healthy foods'), option_code: 'limited_access_to_food' },
      { option_text: i18n.__('Lack of value for change'), option_code: 'lack_of_value_for_change' },
      { option_text: i18n.__('Physiological altered fat needs'), option_code: 'physiological_altered_fat_needs' },
    ],
    inadequate_protein_intake: [
      { option_text: i18n.__('Catabolism energy increases'), option_code: 'catabolism_energy_increases' },
      { option_text: i18n.__('Malabsorption'), option_code: 'malabsorption' },
      { option_text: i18n.__('Need dependent on age'), option_code: 'need_dependent_on_age' },
      { option_text: i18n.__('Wound healing'), option_code: 'wound_healing' },
      { option_text: i18n.__('Burn healing'), option_code: 'burn_healing' },
      { option_text: i18n.__('Self-feeding barriers'), option_code: 'self_feeding_barriers' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Disordered eating'), option_code: 'disordered_eating' },
    ],
    excessive_protein_intake: [
      { option_text: i18n.__('Liver disease'), option_code: 'liver_disease' },
      { option_text: i18n.__('Renal disease'), option_code: 'renal_disease' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Metabolic abnormalities'), option_code: 'metabolic_abnormalities' },
      { option_text: i18n.__('Food faddism'), option_code: 'food_faddism' },
    ],
    intake_of_proteins_inconsistent_with_needs: [
      { option_text: i18n.__('Liver disease'), option_code: 'liver_disease' },
      { option_text: i18n.__('Renal disease'), option_code: 'renal_disease' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Misused specialized products'), option_code: 'misused_specialized_products' },
      { option_text: i18n.__('Food faddism'), option_code: 'food_faddism' },
      { option_text: i18n.__('PKU'), option_code: 'pku' },
      { option_text: i18n.__('Celiac disease'), option_code: 'celiac_disease' },
      { option_text: i18n.__('Limited protein access'), option_code: 'limited_protein_access' },
      {
        option_text: i18n.__('Lack of willingness to modify protein or amino acid intake'),
        option_code: 'lack_of_willingness_to_modify_protein_or_amino_acid_intake',
      },
    ],
    inadequate_carbohydrate_intake: [
      { option_text: i18n.__('Increased activity level'), option_code: 'increased_activity_level' },
      { option_text: i18n.__('Malabsorption'), option_code: 'malabsorption' },
      { option_text: i18n.__('Metabolic changes'), option_code: 'metabolic_changes' },
      { option_text: i18n.__('Limited access to food'), option_code: 'limited_access_to_food' },
      { option_text: i18n.__('Self-feeding barriers'), option_code: 'self_feeding_barriers' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
    ],
    excessive_carbohydrate_intake: [
      { option_text: i18n.__('Diabetes'), option_code: 'diabetes' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Disordered eating'), option_code: 'disordered_eating' },
      { option_text: i18n.__('Meds causing hyperglycemia'), option_code: 'meds_causing_hyperglycemia' },
      { option_text: i18n.__('Lactase deficiency'), option_code: 'lactase_deficiency' },
      {
        option_text: i18n.__('Lack of willingness to modify carb intake'),
        option_code: 'lack_of_willingness_to_modify_carb_intake',
      },
      {
        option_text: i18n.__('Physiological causes requiring modified carbohydrate intake'),
        option_code: 'physiological_causes_requiring_modified_carbohydrate_intake',
      },
      { option_text: i18n.__('Depression'), option_code: 'depression' },
      {
        option_text: i18n.__('Limited adherence to previous recommendations'),
        option_code: 'limited_adherence_to_previous_recommendations',
      },
      { option_text: i18n.__('Limited nutrition skill'), option_code: 'limited_nutrition_skill' },
    ],
    intake_of_carbs_inconsistent_with_needs: [
      { option_text: i18n.__('Altered carb needs d/t disease'), option_code: 'altered_carb_needs_disease' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Disordered eating'), option_code: 'disordered_eating' },
      {
        option_text: i18n.__('Lack of willingness to modify carb intake'),
        option_code: 'lack_of_willingness_to_modify_carb_intake',
      },
      {
        option_text: i18n.__('Physiological causes requiring modified carbohydrate intake'),
        option_code: 'physiological_causes_requiring_modified_carbohydrate_intake',
      },
      { option_text: i18n.__('Depression'), option_code: 'depression' },
      {
        option_text: i18n.__('Limited adherence to previous recommendations'),
        option_code: 'limited_adherence_to_previous_recommendations',
      },
      { option_text: i18n.__('Limited nutrition skill'), option_code: 'limited_nutrition_skill' },
      { option_text: i18n.__('Cultural practices'), option_code: 'cultural_practices' },
    ],
    inconsistent_carbohydrates: [
      { option_text: i18n.__('Need for carb timing'), option_code: 'need_for_carb_timing' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Disordered eating'), option_code: 'disordered_eating' },
      {
        option_text: i18n.__('Lack of willingness to modify carb timing'),
        option_code: 'lack_of_willingness_to_modify_carb_timing',
      },
    ],
    inadequate_fiber_intake: [
      { option_text: i18n.__('Limited access to fibrous foods'), option_code: 'limited_access_to_fibrous_foods' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Prolonged low fiber diet'), option_code: 'prolonged_low_fiber_diet' },
      { option_text: i18n.__('Non optimal food prep practices'), option_code: 'non_optimal_food_prep_practices' },
      {
        option_text: i18n.__('Lack of willingness to consume fibrous foods'),
        option_code: 'lack_of_willingness_to_consume_fibrous_foods',
      },
      { option_text: i18n.__('IBD'), option_code: 'ibd' },
      { option_text: i18n.__('Short bowel syndrome'), option_code: 'short_bowel_syndrome' },
    ],
    excessive_fiber_intake: [
      { option_text: i18n.__('Obsession with bowel frequency'), option_code: 'obsession_bowel_frequency' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Need for low fiber diet'), option_code: 'need_for_low_fiber_diet' },
      { option_text: i18n.__('IBS'), option_code: 'ibs' },
      { option_text: i18n.__('Short bowel syndrome'), option_code: 'short_bowel_syndrome' },
      { option_text: i18n.__('Bowel obstruction'), option_code: 'bowel_obstruction' },
    ],
    inadequate_vitamin_mineral_intake: [
      { option_text: i18n.__('Increased needs d/t disease'), option_code: 'increased_needs_disease' },
      { option_text: i18n.__('Malabsorption'), option_code: 'malabsorption' },
      { option_text: i18n.__('Med-related alterations'), option_code: 'med_related_alterations' },
      { option_text: i18n.__('Limited access to food'), option_code: 'limited_access_to_food' },
      { option_text: i18n.__('Geography or season'), option_code: 'geography_season' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Depression or disordered eating'), option_code: 'depression_disordered_eating' },
    ],
    excessive_vitamin_mineral_intake: [
      { option_text: i18n.__('Decreased needs d/t disease'), option_code: 'decreased_needs_disease' },
      { option_text: i18n.__('Foods or supplements in excess'), option_code: 'foods_supplements_excess' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Accidental overdose'), option_code: 'accidental_overdose' },
      { option_text: i18n.__('Depression or disordered eating'), option_code: 'depression_disordered_eating' },
    ],
    swallowing_difficulty: [
      { option_text: i18n.__('Inflammation'), option_code: 'inflammation' },
      { option_text: i18n.__('Surgery'), option_code: 'surgery' },
      { option_text: i18n.__('Tumors'), option_code: 'tumors' },
      { option_text: i18n.__('Prior ventilation'), option_code: 'prior_ventilation' },
      { option_text: i18n.__('Cerebral palsy'), option_code: 'cerebral_palsy' },
      { option_text: i18n.__('Multiple sclerosis'), option_code: 'multiple_sclerosis' },
      { option_text: i18n.__('Stroke'), option_code: 'stroke' },
    ],
    biting_chewing_difficulty: [
      { option_text: i18n.__('Oral or facial dysfunction'), option_code: 'oral_facial_dysfunction' },
      { option_text: i18n.__('Oral surgery'), option_code: 'oral_surgery' },
      { option_text: i18n.__('Poor dentition'), option_code: 'poor_dentition' },
      { option_text: i18n.__('Tooth pain'), option_code: 'tooth_pain' },
      { option_text: i18n.__('Jaw pain'), option_code: 'jaw_pain' },
      { option_text: i18n.__('Xerostomia'), option_code: 'xerostomia' },
      { option_text: i18n.__('Side effects of chemo or radiation'), option_code: 'side_effects_chemo_radiation' },
    ],
    breastfeeding_difficulty: [
      {
        option_text: i18n.__('Infant: Latching or sucking difficulty'),
        option_code: 'infant_latching_sucking_difficulty',
      },
      { option_text: i18n.__('Infant: Lethargy'), option_code: 'infant_lethargy' },
      { option_text: i18n.__('Infant: Sleepiness'), option_code: 'infant_sleepiness' },
      { option_text: i18n.__('Infant: Swallowing difficulty'), option_code: 'infant_swallowing_difficulty' },
      { option_text: i18n.__('Infant: Alternate route of feeding'), option_code: 'infant_alternate_route_feeding' },
      { option_text: i18n.__('Mother: Breast pain'), option_code: 'mother_breast_pain' },
      { option_text: i18n.__('Mother: Nipple abnormality'), option_code: 'mother_nipple_abnormality' },
      { option_text: i18n.__('Mother: Mastitis'), option_code: 'mother_mastitis' },
      { option_text: i18n.__('Mother: Inadequate milk supply'), option_code: 'mother_inadequate_milk_supply' },
      { option_text: i18n.__('Mother: Lack of support'), option_code: 'mother_lack_of_support' },
    ],
    altered_gi_function: [
      { option_text: i18n.__('Bowel resection'), option_code: 'bowel_resection' },
      { option_text: i18n.__('Pancreas or liver issues'), option_code: 'pancreas_liver_issues' },
      { option_text: i18n.__('Short bowel syndrome'), option_code: 'short_bowel_syndrome' },
      { option_text: i18n.__('IBD'), option_code: 'ibd' },
      { option_text: i18n.__('Celiac disease'), option_code: 'celiac_disease' },
      { option_text: i18n.__('Cystic fibrosis'), option_code: 'cystic_fibrosis' },
      { option_text: i18n.__('GI cancer'), option_code: 'gi_cancer' },
      {
        option_text: i18n.__('Nausea or Vomiting or Diarrhea or Constipation'),
        option_code: 'nausea_or_vomiting_or_diarrhea_or_constipation',
      },
      { option_text: i18n.__('Gastroparesis'), option_code: 'gastroparesis' },
    ],
    impaired_nutrient_utilization: [
      { option_text: i18n.__('Altered GI function'), option_code: 'altered_gi_function' },
      { option_text: i18n.__('Malabsorption'), option_code: 'malabsorption' },
      { option_text: i18n.__('Metabolic disorders'), option_code: 'metabolic_disorders' },
      { option_text: i18n.__('Medications'), option_code: 'medications' },
      { option_text: i18n.__('Alcohol or drug addiction'), option_code: 'alcohol_drug_addiction' },
    ],
    altered_nutrition_related_lab_values: [
      {
        option_text: i18n.__('Kidney, liver, cardiac, endocrine, neurological or pulmonary dysfunction'),
        option_code: 'kidney_liver_dysfunction',
      },
      { option_text: i18n.__('Metabolic disorders'), option_code: 'metabolic_disorders' },
      { option_text: i18n.__('Overhydration'), option_code: 'overhydration' },
      { option_text: i18n.__('Refeeding syndrome'), option_code: 'refeeding_syndrome' },
    ],
    food_medication_interaction: [
      {
        option_text: i18n.__('Ingestion or administration of medication or food resulting in a harmful reaction'),
        option_code: 'harmful_reaction_food_medication',
      },
    ],
    underweight: [
      { option_text: i18n.__('Disordered eating'), option_code: 'disordered_eating' },
      { option_text: i18n.__('Excessive physical activity'), option_code: 'excessive_physical_activity' },
      { option_text: i18n.__('Inadequate energy intake'), option_code: 'inadequate_energy_intake' },
      { option_text: i18n.__('Limited access to food'), option_code: 'limited_access_to_food' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
    ],
    unintended_weight_loss: [
      { option_text: i18n.__('Increased nutrient needs'), option_code: 'increased_nutrient_needs' },
      { option_text: i18n.__('Chewing or swallowing issues'), option_code: 'chewing_swallowing_issues' },
      { option_text: i18n.__('Functional decline'), option_code: 'functional_decline' },
      { option_text: i18n.__('Limited access to food'), option_code: 'limited_access_to_food' },
      { option_text: i18n.__('Prolonged hospitalization'), option_code: 'prolonged_hospitalization' },
      { option_text: i18n.__('Depression or disordered eating'), option_code: 'depression_disordered_eating' },
      { option_text: i18n.__('Cancer'), option_code: 'cancer' },
      { option_text: i18n.__('Catabolic illness'), option_code: 'catabolic_illness' },
      {
        option_text: i18n.__('Decreased ability to consume sufficient energy'),
        option_code: 'decreased_ability_to_consume_sufficient_energy',
      },
      { option_text: i18n.__('Food insecurity'), option_code: 'food_insecurity' },
      { option_text: i18n.__('Difficulty self-feeding'), option_code: 'difficulty_self_feeding' },
    ],
    unintended_weight_gain: [
      { option_text: i18n.__('Physical immobility or trauma'), option_code: 'physical_immobility_trauma' },
      { option_text: i18n.__('Hypothyroidism'), option_code: 'hypothyroidism' },
      { option_text: i18n.__('Cushing’s syndrome'), option_code: 'cushings_syndrome' },
      { option_text: i18n.__('Antidepressants'), option_code: 'antidepressants' },
      { option_text: i18n.__('Antipsychotics'), option_code: 'antipsychotics' },
      { option_text: i18n.__('Steroids'), option_code: 'steroids' },
      { option_text: i18n.__('Edema'), option_code: 'edema' },
      { option_text: i18n.__('Not ready for lifestyle change'), option_code: 'not_ready_for_lifestyle_change' },
      { option_text: i18n.__('Excess energy intake'), option_code: 'excess_energy_intake' },
    ],
    growth_rate_below_expected: [
      { option_text: i18n.__('Critical illness'), option_code: 'critical_illness' },
      { option_text: i18n.__('Nutrient malabsorption'), option_code: 'nutrient_malabsorption' },
      { option_text: i18n.__('Feeding barriers'), option_code: 'feeding_barriers' },
      { option_text: i18n.__('Limited access to food'), option_code: 'limited_access_to_food' },
      { option_text: i18n.__('Limited food acceptance'), option_code: 'limited_food_acceptance' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Diabetes Type 1'), option_code: 'type_1_diabetes' },
    ],
    chronic_disease_malnutrition: [
      { option_text: i18n.__('Altered GI function'), option_code: 'altered_gi_function' },
      { option_text: i18n.__('Increased energy needs'), option_code: 'increased_energy_needs' },
      { option_text: i18n.__('Organ failure'), option_code: 'organ_failure' },
      { option_text: i18n.__('Cancer'), option_code: 'cancer' },
      { option_text: i18n.__('Malabsorption'), option_code: 'malabsorption' },
      { option_text: i18n.__('CKD'), option_code: 'ckd' },
    ],
    acute_disease_malnutrition: [
      { option_text: i18n.__('Altered GI function'), option_code: 'altered_gi_function' },
      { option_text: i18n.__('Sepsis'), option_code: 'sepsis' },
      { option_text: i18n.__('Pneumonia'), option_code: 'pneumonia' },
      { option_text: i18n.__('Wounds or burns'), option_code: 'wounds_burns' },
      { option_text: i18n.__('Major surgeries'), option_code: 'major_surgeries' },
      { option_text: i18n.__('Increased energy needs'), option_code: 'increased_energy_needs' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
    ],
    non_illness_pediatric_malnutrition: [
      { option_text: i18n.__('Limited access to food'), option_code: 'limited_access_to_food' },
      { option_text: i18n.__('Feeding intolerances'), option_code: 'feeding_intolerances' },
      { option_text: i18n.__('Neglect or poverty'), option_code: 'neglect_poverty' },
    ],
    illness_related_pediatric_malnutrition: [
      { option_text: i18n.__('Catabolism energy increases'), option_code: 'catabolism_energy_increases' },
      { option_text: i18n.__('Altered nutrient utilization'), option_code: 'altered_nutrient_utilization' },
      { option_text: i18n.__('Depression or disordered eating'), option_code: 'depression_disordered_eating' },
    ],
    food_nutrition_knowledge_deficit: [
      {
        option_text: i18n.__('Unsupported nutrition beliefs or attitudes'),
        option_code: 'unsupported_nutrition_beliefs_attitudes',
      },
      { option_text: i18n.__('Lack of prior education'), option_code: 'lack_prior_education' },
      { option_text: i18n.__('Impaired cognition'), option_code: 'impaired_cognition' },
      { option_text: i18n.__('Prior incorrect knowledge'), option_code: 'prior_incorrect_knowledge' },
    ],
    not_ready_for_diet_lifestyle_change: [
      { option_text: i18n.__('Unsupported nutrition beliefs'), option_code: 'unsupported_nutrition_beliefs' },
      { option_text: i18n.__('Impaired cognition'), option_code: 'impaired_cognition' },
      { option_text: i18n.__('Lack of social support'), option_code: 'lack_of_social_support' },
      { option_text: i18n.__('Denial of need to change'), option_code: 'denial_of_need_to_change' },
      { option_text: i18n.__('Limited financial resources'), option_code: 'limited_financial_resources' },
      { option_text: i18n.__('Lack of self-efficacy'), option_code: 'lack_of_self_efficacy' },
      { option_text: i18n.__('Specify diet or lifestyle change'), option_code: 'specify_diet_lifestyle_change' },
    ],
    disordered_eating_pattern: [
      { option_text: i18n.__('Obsession to be thin'), option_code: 'obsession_to_be_thin' },
      { option_text: i18n.__('Anorexia nervosa'), option_code: 'anorexia_nervosa' },
      { option_text: i18n.__('Bulimia nervosa'), option_code: 'bulimia_nervosa' },
      { option_text: i18n.__('PICA'), option_code: 'pica' },
      { option_text: i18n.__('Other eating disorders'), option_code: 'other_eating_disorders' },
      { option_text: i18n.__('Low self-esteem'), option_code: 'low_self_esteem' },
      { option_text: i18n.__('Fear of Weight Gain'), option_code: 'fear_of_weight_gain' },
    ],
    limited_adherence_nutrition_recommendations: [
      { option_text: i18n.__('Specific diet education'), option_code: 'specific_diet_education' },
      { option_text: i18n.__('Lack of social support'), option_code: 'lack_social_support' },
      { option_text: i18n.__('Lack of value for change'), option_code: 'lack_value_for_change' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Unwilling to apply info'), option_code: 'unwilling_to_apply_info' },
      { option_text: i18n.__('Unsupported nutrition beliefs'), option_code: 'unsupported_nutrition_beliefs' },
    ],
    undesirable_food_choices: [
      { option_text: i18n.__('Diet requirements'), option_code: 'diet_requirements' },
      { option_text: i18n.__('Impaired cognition'), option_code: 'impaired_cognition' },
      { option_text: i18n.__('Limited financial resources'), option_code: 'limited_financial_resources' },
      { option_text: i18n.__('Disinterest in diet intervention'), option_code: 'disinterest_diet_intervention' },
      { option_text: i18n.__('Allergies or aversions'), option_code: 'allergies_aversions' },
      { option_text: i18n.__('Other aversions'), option_code: 'other_aversions' },
    ],
    physical_inactivity: [
      { option_text: i18n.__('Lifestyle'), option_code: 'lifestyle' },
      { option_text: i18n.__('Functional or physical inability'), option_code: 'functional_or_physical_inability' },
      { option_text: i18n.__('Cognitive impairment'), option_code: 'cognitive_impairment' },
      { option_text: i18n.__('Lack of social support'), option_code: 'lack_social_support' },
      { option_text: i18n.__('Limited access to equipment'), option_code: 'limited_access_to_equipment' },
      { option_text: i18n.__('Time constraints'), option_code: 'time_constraints' },
    ],
    overweight_obesity: [
      { option_text: i18n.__('Decreased nutrient needs'), option_code: 'decreased_nutrient_needs' },
      { option_text: i18n.__('Excessive energy intake'), option_code: 'excessive_energy_intake' },
      { option_text: i18n.__('Depression or disordered eating'), option_code: 'depression_disordered_eating' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Not ready for lifestyle change'), option_code: 'not_ready_lifestyle_change' },
      { option_text: i18n.__('Physical inactivity'), option_code: 'physical_inactivity' },
      { option_text: i18n.__('Increased stress'), option_code: 'increased_stress' },
    ],
    excessive_physical_activity: [
      { option_text: i18n.__('Lifestyle'), option_code: 'lifestyle' },
      { option_text: i18n.__('Disordered eating'), option_code: 'disordered_eating' },
      { option_text: i18n.__('Body dysmorphia'), option_code: 'body_dysmorphia' },
      { option_text: i18n.__('Irrational nutrition beliefs'), option_code: 'irrational_nutrition_beliefs' },
      { option_text: i18n.__('Addictive personality'), option_code: 'addictive_personality' },
    ],
    intake_of_unsafe_food: [
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Exposure to contaminated food'), option_code: 'exposure_to_contaminated_food' },
      { option_text: i18n.__('Foodborne illness'), option_code: 'foodborne_illness' },
      { option_text: i18n.__('Poisoning'), option_code: 'poisoning' },
      { option_text: i18n.__('Impaired cognition'), option_code: 'impaired_cognition' },
      { option_text: i18n.__('Limited access to safe food'), option_code: 'limited_access_to_safe_food' },
      { option_text: i18n.__('Limited safe food storage or prep'), option_code: 'limited_safe_food_storage_prep' },
    ],
    limited_access_to_food: [
      { option_text: i18n.__('Poor housing condition'), option_code: 'poor_housing_condition' },
      { option_text: i18n.__('No running water'), option_code: 'no_running_water' },
      { option_text: i18n.__('Limited financial resources'), option_code: 'limited_financial_resources' },
      { option_text: i18n.__('Accessibility barriers'), option_code: 'accessibility_barriers' },
      { option_text: i18n.__('Caregiver neglect or abuse'), option_code: 'caregiver_neglect_abuse' },
      {
        option_text: i18n.__('Lack of food planning, purchasing, and preparation skills'),
        option_code: 'lack_food_planning_skills',
      },
      { option_text: i18n.__('Lack of community support'), option_code: 'lack_community_support' },
      { option_text: i18n.__('Mental illness'), option_code: 'mental_illness' },
      { option_text: i18n.__('Condition of home'), option_code: 'condition_of_home' },
      { option_text: i18n.__('Inability to pay water bill'), option_code: 'inability_pay_water_bill' },
      { option_text: i18n.__('No finances for food'), option_code: 'no_finances_for_food' },
    ],
    limited_ability_to_prepare_food_for_eating: [
      { option_text: i18n.__('Limited cognitive ability'), option_code: 'limited_cognitive_ability' },
      { option_text: i18n.__('Limited physical ability'), option_code: 'limited_physical_ability' },
      { option_text: i18n.__('Limited cooking skills'), option_code: 'limited_cooking_skills' },
    ],
    excessive_alcohol_intake: [
      { option_text: i18n.__('Beliefs or Attitudes'), option_code: 'beliefs_or_attitudes' },
      { option_text: i18n.__('Alcohol abuse knowledge deficit'), option_code: 'alcohol_abuse_knowledge_deficit' },
      { option_text: i18n.__('Competing values'), option_code: 'competing_values' },
      { option_text: i18n.__('Alcohol addiction'), option_code: 'alcohol_addiction' },
    ],
    inability_to_manage_self_care: [
      { option_text: i18n.__('Limited social support'), option_code: 'inadequate_social_support' },
      { option_text: i18n.__('Developmental readiness'), option_code: 'developmental_readiness' },
      { option_text: i18n.__('Competing values'), option_code: 'competing_values' },
      { option_text: i18n.__('Beliefs or Attitudes'), option_code: 'beliefs_or_attitudes' },
      {
        option_text: i18n.__('Limited interest in learning or applying information'),
        option_code: 'limited_interest_in_learning_or_applying_information',
      },
      { option_text: i18n.__('Impaired cognitive abilities'), option_code: 'impaired_cognitive_abilities' },
    ],
    self_feeding_difficulty: [
      { option_text: i18n.__('Limited physical strength'), option_code: 'limited_physical_strength' },
      { option_text: i18n.__('Impaired cognitive abilities'), option_code: 'impaired_cognitive_abilities' },
      { option_text: i18n.__('Poor physical coordination'), option_code: 'poor_physical_coordination' },
      {
        option_text: i18n.__('Limited access to adaptive eating devices or modified foods'),
        option_code: 'limited_access_to_adaptive_eating_devices_or_modified_foods',
      },
    ],
    overweight: [
      { option_text: i18n.__('Excessive energy intake'), option_code: 'excessive_energy_intake' },
      { option_text: i18n.__('Depression or disordered eating'), option_code: 'depression_disordered_eating' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Not ready for lifestyle change'), option_code: 'not_ready_lifestyle_change' },
      { option_text: i18n.__('Physical inactivity'), option_code: 'physical_inactivity' },
      { option_text: i18n.__('Increased stress'), option_code: 'increased_stress' },
      { option_text: i18n.__('Decreased nutrient needs'), option_code: 'decreased_nutrient_needs' },
    ],
    obesity: [
      { option_text: i18n.__('Excessive energy intake'), option_code: 'excessive_energy_intake' },
      { option_text: i18n.__('Depression or disordered eating'), option_code: 'depression_disordered_eating' },
      { option_text: i18n.__('Knowledge deficit'), option_code: 'knowledge_deficit' },
      { option_text: i18n.__('Not ready for lifestyle change'), option_code: 'not_ready_lifestyle_change' },
      { option_text: i18n.__('Physical inactivity'), option_code: 'physical_inactivity' },
      { option_text: i18n.__('Increased stress'), option_code: 'increased_stress' },
      { option_text: i18n.__('Decreased nutrient needs'), option_code: 'decreased_nutrient_needs' },
    ],
  }) as const;
