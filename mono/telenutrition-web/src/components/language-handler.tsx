import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import usePostLogError from '../api/usePostLogError';
import _ from 'lodash';
import { useAppStateContext } from '../state/context';
import localStorageHelpers from '../utils/localStorageHelpers';

type ValidLocale = 'es' | 'en';

function getValidLocale(locale: string | null | undefined): ValidLocale | null {
  try {
    if (locale == null || locale == undefined) return null;

    if (/^en/.test(locale)) {
      return 'en';
    }
    if (/^es/.test(locale)) {
      return 'es';
    }

    return null;
  } catch (e) {
    return null;
  }
}

export default function LanguageHandler({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const { getAppState } = useAppStateContext();
  const router = useRouter();
  const [hasSet, setHasSet] = useState(false);
  const { post: postLogError } = usePostLogError();

  useEffect(() => {
    if (!router.isReady || hasSet) return;

    try {
      const locale = router.query.locale as string;
      const safeLocale = getValidLocale(locale);

      if (safeLocale) {
        localStorageHelpers.set('locale', safeLocale);
        i18n.changeLanguage(safeLocale);
        setHasSet(true);
        return;
      }

      const localStorageLocale = localStorageHelpers.get('locale');
      const safeLocalStorageLocale = getValidLocale(localStorageLocale);

      if (safeLocalStorageLocale) {
        localStorageHelpers.set('locale', safeLocalStorageLocale);
        i18n.changeLanguage(safeLocalStorageLocale);
        setHasSet(true);
        return;
      }

      // Fallback to browser language
      const validNavigatorLocale = getValidLocale(navigator.language);
      if (validNavigatorLocale) {
        i18n.changeLanguage(validNavigatorLocale);
        setHasSet(true);
        return;
      }
    } catch (e) {
      const message = _.get(e, 'message', 'Error in language-handler setting locale');
      postLogError({
        payload: {
          error: message,
          stackTrace: 'src/components/language-handlers.tsx',
          cid: getAppState().cid ?? '',
        },
      });
    }
  }, [router.isReady]);

  return <>{children}</>;
}
