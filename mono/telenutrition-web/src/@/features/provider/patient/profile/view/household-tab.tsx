import Section, { SectionDivider } from '@/ui-components/section';
import DataDisplay from '@/ui-components/data-display';
import PatientTable from '@/modules/data-table/custom-table/patient-table';
import { useTranslation } from 'react-i18next';
import { Household, HouseholdMemberWithSchedulingInfo } from 'api/types';
import { useModal } from '@/modules/modal';
import { Button } from '@/ui-components/button';

export default function HouseholdTab({
  accountHolder,
  household,
}: {
  accountHolder: HouseholdMemberWithSchedulingInfo;
  household: Household;
}) {
  const { t } = useTranslation();
  const modal = useModal();

  const openAddMemberModal = () => {
    modal.openPrimary({
      type: 'add-household-member',
      holder: accountHolder,
      holderUserId: household.userId,
    });
  };

  return (
    <div className="py-4">
      <Section title={t('Account holder')} sectionClassName="grid grid-cols-12 gap-4">
        {accountHolder.preferredName ? (
          <DataDisplay
            label={t('Preferred name')}
            content={accountHolder.preferredName ?? '-'}
            className="col-span-3"
          />
        ) : (
          <DataDisplay
            label={t('Name')}
            content={`${accountHolder.firstName ?? '-'} ${accountHolder.lastName ?? '-'}`}
            className="col-span-3"
          />
        )}
        <DataDisplay
          label={t('Phone number')}
          content={accountHolder.phone}
          className="col-span-3"
        />
        <DataDisplay
          label={t('Email')}
          content={accountHolder.email}
          className="col-span-6 col-start-1"
        />
      </Section>
      <SectionDivider />
      <Section title={t('Additional members')} sectionClassName="flex flex-col gap-y-2">
        <div className="flex flex-row-reverse">
          <Button dataTestId="add-member-button" variant="secondary" onClick={openAddMemberModal}>
            {t('Add member')}
          </Button>
        </div>
        <div>
          <PatientTable
            type="patients"
            data={household.members.filter(
              (member) => member.identityId !== accountHolder.identityId,
            )}
            isTablePaginationVisible
          />
        </div>
      </Section>
    </div>
  );
}
