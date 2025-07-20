import { useTranslation } from 'react-i18next';

export default function useTranslationStrings() {
  const { t } = useTranslation();

  const terms = `<a target="_blank" href="/schedule/legal/app-terms">${t(
    'TermsOfService',
    'Terms of Service',
  )}</a>`;

  const privacy = `<a target="_blank" href="/schedule/legal/privacy">${t(
    'PrivacyPolicy',
    'Privacy Policy',
  )}</a>`;
  const disclaimer = `<a target="_blank" href="/schedule/legal/disclaimer">${t(
    'Disclaimer',
    'Disclaimer',
  )}</a>`;
  return {
    t,
    terms,
    privacy,
    disclaimer,
    ConsentToTermsDisclaimerAndPrivacy: t(
      'CheckingThisBoxToConsentToTermsDisclaimerPrivacy',
      `By checking this box, I have read, consent, and agree to our {{terms}}, {{privacy}} and {{disclaimer}}.`,
      {
        terms,
        privacy,
        disclaimer,
      },
    ),
  };
}
