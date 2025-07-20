'use client';

import { useEffect } from 'react';
import Intercom, {hide} from '@intercom/messenger-js-sdk';
import { useFeatureFlags } from '@/modules/feature-flag';
import type { ProviderRecord } from '@mono/telenutrition/lib/types';

const INTERCOM_APP_ID = process.env.NEXT_PUBLIC_INTERCOM_APP_ID;

interface Props {
  provider: ProviderRecord;
  intercomHash: string;
}

export default function useIntercom({ provider, intercomHash }: Props) {
  const featureFlags = useFeatureFlags();

  useEffect(() => {
    if (window.Cypress) return;
    if (!featureFlags.hasFeature('intercom_ENG_2121')) return;
    if (!INTERCOM_APP_ID) {
      console.log('Error loading intercom config');
      return;
    }

    Intercom({
      app_id: INTERCOM_APP_ID,
      user_id: provider.providerId.toString(),
      email: provider.email,
      user_hash: intercomHash,
      // we don't want the default intercom button showing because it doesnt go to the chatbot
      hide_default_launcher: true,
    });
    
  }, [featureFlags, intercomHash, provider.email, provider.providerId]);
}
