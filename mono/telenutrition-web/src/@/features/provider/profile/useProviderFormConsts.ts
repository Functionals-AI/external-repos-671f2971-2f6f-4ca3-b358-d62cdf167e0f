import { ProviderLanguage, ProviderSpecialty } from '@mono/telenutrition/lib/types';
import { useTranslation } from 'react-i18next';

export default function useProviderFormConsts() {
  const { t } = useTranslation();

  const formConsts: {
    minPatientAge: Record<number, string>,
    specialtyIds: Record<ProviderSpecialty, string>,
    languages: Record<ProviderLanguage, string>
  } = {
    minPatientAge: {
      0: t('All Ages'),
      2: t('Ages 2+ only'),
      14: t('Ages 14+ only'),
    },
    specialtyIds: {
      'allergies': t("Allergies"),
      'bariatric': t("Bariatric"),
      'cardiology': t("Cardiology"),
      'diabetes_metabolic_health': t("Diabetes/metabolic health"),
      'eating_disorders': t("Eating disorders"),
      'gastroenterology': t("Gastroenterology/GI"),
      'geriatrics': t("Geriatrics"),
      'maternal_prenatal_health': t("Maternal or prenatal health"),
      'mental_behavioral_health': t("Mental health/behavioral health"),
      'obesity_weight_management': t("Obesity/weight management"),
      'oncology_cancer': t("Oncology/Cancer"),
      'renal': t("Renal"),
      'skin_health': t("Skin health"),
      'sports_nutrition': t("Sports nutrition"),
      'transplant': t("Transplant"),
      'womens_health': t("Women's health"),
    },
    languages: {
      'en': t('English'),
      'es': t('Spanish'),
      'ar': t('Arabic'),
      'po': t('Polish'),
      'ru': t('Russian'),
      'fa': t('Farsi'),
      'fr': t('French'),
      'cmn': t('Mandarin'),
      'yue': t('Cantonese'),
      'vi': t('Vietnamese'),
      'ko': t('Korean'),
    }
  };

  return formConsts
}
