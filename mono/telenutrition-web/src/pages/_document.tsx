import { Head, Html, Main, NextScript } from 'next/document';
import i18n from '../utils/i18n';

export default function Document() {
  return (
    <Html lang={i18n.language}>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
