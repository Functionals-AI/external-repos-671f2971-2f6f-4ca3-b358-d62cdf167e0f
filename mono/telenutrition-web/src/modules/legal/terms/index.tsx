import enHtml from './en';
import esHtml from './es';

interface LegalProps {
  locale: string;
}

export default function Legal({ locale }: LegalProps) {
  const termsHtml = locale === 'es' ? esHtml : enHtml;

  return (
    <div className="max-w-6xl px-12 mx-auto py-12">
      <style jsx global>{`
        h1,
        h2,
        h3 {
          padding-top: 2rem;
          padding-bottom: 1rem;
        }

        h1,
        h2,
        h3,
        strong {
          font-size: 30px;
          font-weight: 700;
          color: black;
          padding-top: 2rem;
          padding-bottom: 1rem;
        }
      `}</style>
      <div dangerouslySetInnerHTML={{ __html: termsHtml }} />
    </div>
  );
}
