import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en.json' with { type: 'json' };
import translationES from './locales/es.json' with { type: 'json' };
import translationZH from './locales/zh.json' with { type: 'json' };
import translationKO from './locales/ko.json' with { type: 'json' };
import translationPL from './locales/pl.json' with { type: 'json' };
import translationTL from './locales/tl.json' with { type: 'json' };

const resources = {
  en: {
    translation: translationEN
  },
  es: {
    translation: translationES
  },
  zh: {
    translation: translationZH
  },
  ko: {
    translation: translationKO
  },
  pl: {
    translation: translationPL
  },
  tl: {
    translation: translationTL
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: true
    }
  });

export default i18n;