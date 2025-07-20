import useScrollingGroupManager from '@/modules/scrolling-group-manager/useScrollingGroupManager';
import RenderWidget from '../charting/render-widget';
import StepsNav from './steps-nav';
import ScrollingGroup from '@/modules/scrolling-group-manager/group';
import { getWidgetReactKey } from '@/modules/widgets/helpers';
import { ScrollingGroupProvider } from '@/modules/scrolling-group-manager/context';
import { ChartingConfig } from 'api/types';
import { useSessionContext } from '../useSessionContext';
import { Trans } from 'react-i18next';
import { cn } from '@/utils';

export default function SessionForm({ config }: { config: ChartingConfig }) {
  const {
    data: { encounterData },
    form,
  } = useSessionContext();

  const scrollingGroupManager = useScrollingGroupManager();
  const isEncounterStarted = encounterData.encounter != null;

  return (
    <div className="flex flex-1">
      <div className="border-r border-r-neutral-115 p-4 flex flex-col gap-y-4 w-60 h-[80vh] sticky top-0">
        <StepsNav
          disabled={!isEncounterStarted}
          groups={config.chartingGroups.groups}
          {...scrollingGroupManager}
        />
      </div>
      <div className="flex-1 h-full">
        <div
          ref={scrollingGroupManager.containerRef}
          id="charting-form-container"
          className={'overflow-y-scroll h-full overflow-x-hidden'}
        >
          <ScrollingGroupProvider {...scrollingGroupManager}>
            {isEncounterStarted
              ? config.chartingGroups.groups.map((group, i) => {
                  return (
                    <div
                      key={group.title}
                      data-testid={`widget-group-${group.groupKey}`}
                      className="w-full py-2"
                    >
                      <h4
                        className={cn(
                          'heading-s font-normal text-neutral-600 py-2 px-4 border-t border-t-neutral-150 border-b border-b-neutral-150',
                          i === 0 && 'border-t-transparent',
                        )}
                      >
                        {group.title}
                      </h4>
                      <div className="flex flex-col gap-y-2">
                        {group.widgets.map((widget) => (
                          <ScrollingGroup
                            key={getWidgetReactKey(widget)}
                            name={getWidgetReactKey(widget)}
                          >
                            <RenderWidget
                              key={getWidgetReactKey(widget)}
                              widget={widget}
                              form={form}
                            />
                          </ScrollingGroup>
                        ))}
                      </div>
                    </div>
                  );
                })
              : (() => {
                  const group = config.chartingGroups.groups[0];
                  return (
                    <div
                      data-testid={`widget-group-${group.groupKey}`}
                      className="flex flex-col gap-y-2"
                    >
                      <div key={group.title} className="w-full px-4 py-2">
                        <h4 className="heading-s font-normal text-neutral-600 pb-2">
                          {group.title}
                        </h4>
                        <div className="flex flex-col gap-y-2">
                          {group.widgets.map((widget) => (
                            <RenderWidget
                              key={getWidgetReactKey(widget)}
                              widget={widget}
                              form={form}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="py-16 flex flex-col gap-y-2 items-center justify-center">
                        <h3 className="text-neutral-1500 text-lg">
                          <Trans>Visit not started</Trans>
                        </h3>
                        <p className="text-neutral-600 text-sm">
                          <Trans>
                            You do not have access to charting until the visit has started.
                          </Trans>
                        </p>
                        <p className="text-neutral-600 text-sm">
                          <Trans>Click “Start visit” to begin charting.</Trans>
                        </p>
                      </div>
                    </div>
                  );
                })()}
          </ScrollingGroupProvider>
        </div>
      </div>
    </div>
  );
}
