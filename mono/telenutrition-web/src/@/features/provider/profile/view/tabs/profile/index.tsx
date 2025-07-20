import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';

import Section from '@/ui-components/section';
import { Button } from '@/ui-components/button';
import ProviderAvatarAndName from '@/smart-components/provider-avatar-and-name';
import { useProviderContext } from 'app/schedule/provider/provider-context';
import ProviderInfoDisplay from './info-display';

export default function ProfileTab() {
  const { t } = useTranslation();
  
  const router = useRouter()
    
  const {
    providerData: { provider, licenseSummary },
  } = useProviderContext();

  return (
    <div className="p-4">
      <Section 
        title={t('Dietitian Profile')}
        subtitle={<Button 
          variant="secondary" 
          className="ml-4"
          onClick={() => {
            router.push('/schedule/provider/profile/edit')
          }}
        >
          <Edit size={16} /> {t('Update')}
        </Button>}
      >
        <div className="flex py-6">
          <div className="flex-1 flex flex-col gap-y-8">
            <ProviderAvatarAndName provider={provider} />
            <ProviderInfoDisplay provider={provider} />
          </div>
        </div>
      </Section>
      <Section.Divider />
    </div>
  );
}
