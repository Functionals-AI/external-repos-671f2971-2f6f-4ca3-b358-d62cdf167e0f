import { useEffect } from 'react';
import Loading from '../../../components/loading';
import useGetQueryParam from '../../../hooks/useGetQueryParam';
import useHeaderLayoutConfig from '../../../hooks/useHeaderLayoutConfig';
import Terms from '../../../modules/legal/terms';

type AppLocale = 'es' | 'en';
const validLocales: AppLocale[] = ['en', 'es'];

function isAppLocale(locale: string): locale is AppLocale {
  return validLocales.some((l) => l === locale);
}

export default function TermsPage() {
  const localeResult = useGetQueryParam('locale');
  const { setConfig } = useHeaderLayoutConfig();

  useEffect(() => {
    setConfig({
      hideLanguageSelector: { mobile: true, desktop: true },
    });
  }, []);

  if (localeResult.loading) {
    return <Loading />;
  }

  let locale = 'en';
  if (localeResult.ok) {
    if (isAppLocale(localeResult.value)) {
      locale = localeResult.value;
    }
  }

  return <Terms locale={locale} />;
}
