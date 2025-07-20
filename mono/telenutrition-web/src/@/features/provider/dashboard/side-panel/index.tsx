import { TabsContent } from '@radix-ui/react-tabs';

import { Tabs, TabsList, TabsTrigger } from '@/ui-components/tabs';
import { Badge } from '@/ui-components/badge';
import TaskList from '../task-list';
import OnDemandList from './on-demand-list';
import { useSidePanelContext } from './context';
import { Trans } from 'react-i18next';

enum TABS {
  TASKS = 'tasks',
  ON_DEMAND = 'on-demand',
}

export default function SidePanel() {
  const { tasks, filteredOverbookingSlots } = useSidePanelContext();

  return (
    <Tabs defaultValue={TABS.TASKS}>
      <TabsList>
        {tasks.length > 0 && (
          <TabsTrigger value={TABS.TASKS}>
            <Trans>Tasks</Trans>
            <Badge variant="statusGreen">{tasks.length > 99 ? '99+' : tasks.length}</Badge>
          </TabsTrigger>
        )}
        <TabsTrigger value={TABS.ON_DEMAND}>
          <Trans>On Demand</Trans>
          {filteredOverbookingSlots.length > 0 && (
            <Badge variant="statusGreen">{filteredOverbookingSlots.length}</Badge>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent value={TABS.TASKS}>
        <TaskList />
      </TabsContent>
      <TabsContent value={TABS.ON_DEMAND}>
        <OnDemandList />
      </TabsContent>
    </Tabs>
  );
}
