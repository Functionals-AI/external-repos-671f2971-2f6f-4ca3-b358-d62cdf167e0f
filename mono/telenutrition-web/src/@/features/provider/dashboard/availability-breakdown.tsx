import { Badge } from '@/ui-components/badge';
import { useTranslation } from 'react-i18next';

export default function AvailabilityBreakdown() {
  const { t } = useTranslation();
  return (
    <div>
      <div className="h-16 flex items-center">
        <h3>{t('Availability Breakdown')}</h3>
      </div>
      <div className="flex flex-col gap-y-2 py-4">
        <div className="flex items-center gap-x-2">
          <Badge className="h-6" variant="neutral">
            4
          </Badge>
          {t('Frozen')}
        </div>
        <div className="flex items-center gap-x-2">
          <Badge className="h-6" variant="statusRed">
            12
          </Badge>
          {t('No Show')}
        </div>
        <div className="flex items-center gap-x-2">
          <Badge className="h-6" variant="statusGreen">
            3
          </Badge>
          {t('Initial Sessions')}
        </div>
        <div className="flex items-center gap-x-2">
          <Badge className="h-6" variant="blue">
            1
          </Badge>
          {t('Follow Up Sessions')}
        </div>
      </div>
    </div>
  );
}
