'use client';

import { useFeatureFlags } from '@/modules/feature-flag';
import { FeatureFlag, FeatureState } from '@/modules/feature-flag/feature-flags';
import { FormV2, useForm } from '@/modules/form/form';
import RadioTableItem from '@/modules/form/radio-table-item';
import ButtonBar from '@/ui-components/button/group';
import Container from '@/ui-components/container';
import Button from 'components/button';

interface FormFields {
  flags: Record<FeatureFlag, FeatureState>;
}

export default function Page() {
  const featureFlags = useFeatureFlags();

  const form = useForm<FormFields>({
    defaultValues: { flags: featureFlags.getFeatureValues() },
  });

  function handleSubmit(value: FormFields) {
    featureFlags.updateFlags(value.flags);

    window.location.reload();
  }

  function handleResetFlags() {
    featureFlags.resetFeatureFlags();

    form.reset({ flags: featureFlags.getFeatureValues() });
  }

  return (
    <Container className=" !px-4 !py-8">
      <FormV2 form={form} onSubmit={handleSubmit} className="flex flex-col gap-y-8">
        <RadioTableItem
          form={form}
          id="flags"
          columns={[
            {
              type: 'radio',
              label: 'On',
              value: 'on',
            },
            {
              type: 'radio',
              label: 'Off',
              value: 'off',
            },
            {
              type: 'display',
              label: 'Default Value',
              component: (question) => (
                <div>{featureFlags.featureFlagData[question.key as FeatureFlag].defaultValue}</div>
              ),
            },
          ]}
          rows={Object.entries(featureFlags.featureFlagData).map(([key, flagData]) => ({
            key,
            label: flagData.name,
            required: true,
            sublabel: flagData.featureList.map((str) => `- ${str}`).join('<br/>'),
          }))}
        />
        <ButtonBar className="pl-16">
          <ButtonBar.Group>
            <Button variant="secondary" onClick={handleResetFlags}>
              Reset all feature flags
            </Button>
            <Button type="submit">Save and refresh</Button>
          </ButtonBar.Group>
        </ButtonBar>
      </FormV2>
    </Container>
  );
}
