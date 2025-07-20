import { GroupedAppointmentsByProvider, ValidDurationsType } from '../../api/useGetAppointments';
import { useTranslation } from 'react-i18next';
import ProviderImage from '../../components/provider-image';
import { getSortedAppointmentGroups } from './helpers';
import { UseScheduleAppointmentStateReturnData } from './useScheduleAppointmentState';
import { Button } from '@/ui-components/button';
import type { ProviderRecordShort } from '@mono/telenutrition/lib/types';
import { DateTime } from 'luxon';
import useProviderFormConsts from '@/features/provider/profile/useProviderFormConsts';
import _ from 'lodash';

interface DisplayAppointmentsForDayProps {
  groupedAppointmentsByProvider: GroupedAppointmentsByProvider[] | null;
  onSelectAppointment: UseScheduleAppointmentStateReturnData['onSelectAppointment'];
  providers?: ProviderRecordShort[];
  validDurationsType: ValidDurationsType;
}

export default function DisplayAppointmentsForDay({
  groupedAppointmentsByProvider,
  onSelectAppointment,
  providers,
  validDurationsType,
}: DisplayAppointmentsForDayProps) {
  const { t } = useTranslation();
  if (!groupedAppointmentsByProvider || !providers) return null;

  const sortedAppointmentGroups = getSortedAppointmentGroups(
    groupedAppointmentsByProvider,
    validDurationsType,
  );

  if (!sortedAppointmentGroups.length) {
    return (
      <div>
        <p>
          {t(
            'ThereAreNoAppointmentsWithThisProviderOnThisDay',
            'There are no appointments with this provider on this day.',
          )}
        </p>
      </div>
    );
  }

  return (
    <div>
      {sortedAppointmentGroups.map((group) => {
        const provider: ProviderRecordShort = providers.find((p) => p.providerId === group.providerId)!;
        return (
          <div key={`${group.providerId}-${group.appointments[0].appointmentIds[0]}`}>
            {provider && (
              <div className="flex items-center my-4">
                <ProviderImage
                  provider={{
                    name: provider.name,
                    initials: provider.initials,
                    photo: provider.photo,
                  }}
                />
                <div className="ml-4">
                  <h4>{provider.name}</h4>
                  <LanguageText languages={provider.languages} />
                </div>
              </div>
            )}
            <div className="inline-flex flex-wrap gap-4">
              {group.appointments.map((slot) => (
                <Button
                  onClick={() => onSelectAppointment(group.date, slot.appointmentIds)}
                  key={slot.appointmentIds[0]}
                  className="min-w-[3rem]"
                >
                  {DateTime.fromISO(slot.startTimestamp, { setZone: true }).toFormat('h:mma')}
                </Button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface LanguageTextProps {
  languages?: string[];
}

function LanguageText({ languages = [] }: LanguageTextProps) {
  const { t } = useTranslation();
  const { languages: languageMap } = useProviderFormConsts()

  const fullLanguage: string[] = languages
    ?.map<string | null>((l) => _.get(languageMap, l))
    .filter((l) => !!l) as string[];

  let text;
  if (fullLanguage.length <= 1) {
    const first = fullLanguage[0] ?? t('English', 'English');
    text = t('LanguageOnly', '{{language}} only', { language: first });
  } else {
    text = fullLanguage.join(', ');
  }

  return (
    <p>
      {t('Languages', 'Languages')}: {text}
    </p>
  );
}
