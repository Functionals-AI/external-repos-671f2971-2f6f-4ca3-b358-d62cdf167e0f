import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enJson from '../translations/locales/en.json';
import esJson from '../translations/locales/es.json';
import Backend from 'i18next-http-backend';

const resources = {
  en: {
    translation: enJson,
  },
  es: {
    translation: esJson,
  },
};

if (process.env.NODE_ENV === 'development') {
  i18n
    .use(initReactI18next) // passes i18n down to react-i18next
    .use(Backend)
    .init({
      nsSeparator: false,
      keySeparator: false,
      // fallbackLng: false,
      resources,
      lng: 'en', // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
      // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
      // if you're using a language detector, do not define the lng option

      interpolation: {
        escapeValue: false, // react already safes from xss
      },

      // Auto-save missing translations is off. Uncomment below to turn it on temporarily, but do not commit.

      // saveMissing: true,
      // backend: {
      //   addPath: '/api/add-translation',
      // },
    });
} else {
  i18n
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
      resources,
      lng: 'en', // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
      // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
      // if you're using a language detector, do not define the lng option

      interpolation: {
        escapeValue: false, // react already safes from xss
      },
    });
}

export default i18n;
