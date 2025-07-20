'use client';

import { Tabs, TabsTrigger, TabsList } from '@/ui-components/tabs';
import { TabsContent } from '@radix-ui/react-tabs';
import BasicTab from './basic';
import IconsTab from './icons';

enum TABS {
  BASIC = 'basic',
  ICONS = 'icons',
}

export default function Page() {
  return (
    <div className="p-8">
      <Tabs defaultValue={TABS.BASIC}>
        <TabsList>
          <TabsTrigger value={TABS.BASIC}>Basic</TabsTrigger>
          <TabsTrigger value={TABS.ICONS}>Icons</TabsTrigger>
        </TabsList>
        <TabsContent value={TABS.BASIC}>
          <BasicTab />
        </TabsContent>
        <TabsContent value={TABS.ICONS}>
          <IconsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
