import Avocado from '../../../../public/avocado.svg';
import { useTranslation } from 'react-i18next';
import parse from 'html-react-parser';
import { ReactNode } from 'react';
import SupportButton from '../../../components/support-button';

export default function AlreadyCancelled(props: { buttons?: ReactNode }) {
  const { t } = useTranslation();

  const buttons = props.buttons ?? [<SupportButton key={'btn-support'} />];

  return (
    <div className="flex flex-col justify-center items-center max-w-5xl m-auto gap-6">
      <h3>
        {t('AlreadyCanceledOrRescheduled', 'This appointment has been canceled or rescheduled')}
      </h3>
      <Avocado />
      <p>
        {parse(
          t(
            'QuestionsOrConcerns',
            'Questions or concerns? Please email {{email}} or visit our support page.',
            {
              email:
                '<a target="_blank" href="mailto:support@foodsmart.com">support@foodsmart.com</a>',
              interpolation: { escapeValue: false },
            },
          ),
        )}
      </p>
      {buttons}
    </div>
  );
}
