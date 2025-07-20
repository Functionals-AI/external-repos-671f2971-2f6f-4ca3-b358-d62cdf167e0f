import DataDisplay from '@/ui-components/data-display';
import Section from '@/ui-components/section';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import { ReactNode } from 'react';
import { useDemographicFields } from '@/features/provider/patient/profile/util';

export default function PatientDemographicsSection({
  patient,
  rightChild,
}: {
  patient: PatientRecord;
  rightChild?: ReactNode;
}) {
  const fields = useDemographicFields();
  return (
    <Section title="Overview">
      <div className="flex justify-between">
        <div className="flex-1 grid grid-cols-12 gap-4 min-w-xl max-w-2xl">
          {fields.map((field) => {
            const found = patient[field.id as keyof typeof patient];
            if (found) {
              return (
                <DataDisplay
                  key={field.id}
                  label={field.label}
                  content={
                    field.type === 'select'
                      ? field.options.find(
                          (option: { label: string; value: string }) => option.value === found,
                        )?.label
                      : found
                  }
                  className={field.className}
                />
              );
            } else {
              return (
                <DataDisplay
                  key={field.id}
                  label={field.label}
                  content={'-'}
                  className={field.className}
                />
              );
            }
          })}
        </div>
        {!!rightChild && rightChild}
      </div>
    </Section>
  );
}
