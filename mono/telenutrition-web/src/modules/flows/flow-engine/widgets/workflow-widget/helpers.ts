import { DeveloperError } from '../../../../../utils/errors';
import type {
  FlowWidget,
  FlowWidget as TFlowWidget,
  WorkflowWidget as TWorkflowWidget,
} from '@mono/telenutrition/lib/types';
import {
  convertNextStepConfigToNextBasicStepConfig,
  getStepFromRepo,
} from '../../workflow-engine/helpers';
import { FlowValueBasic } from '../../workflow-engine/types';
import _ from 'lodash';

export function getAllPossibleUniqueKeys(allWidgets: FlowWidget[]): string[] {
  const allUniqueKeys = new Set<string>();

  function recursiveCheckWidgets(widgets: FlowWidget[]) {
    widgets.forEach((widget) => {
      if (widget.type === 'columns') {
        recursiveCheckWidgets(widget.widgets);
      }
      if (widget.type === 'workflow') {
        recursiveCheckWidgets(Object.values(widget.steps));
      }
      if ('key' in widget) {
        allUniqueKeys.add(widget.key);
      }
    });
  }

  recursiveCheckWidgets(allWidgets);

  return Array.from(allUniqueKeys);
}

export function getRecordByKey<T>(config: Record<string, T>, key: string): T {
  const found = Object.entries(config).find((step) => step[0] === key);
  if (!found) throw new Error('Unable to find workflow state id in workflow states.');
  return found[1];
}

export const getWidgetsList = (
  widgetWorkflow: TWorkflowWidget,
  getFlowStateValue: (key: string | string[]) => FlowValueBasic | null,
): TFlowWidget[] => {
  const widgetRows: string[] = [];

  const { start } = widgetWorkflow.workflow;
  const startStep = getRecordByKey(widgetWorkflow.workflow.config, start);
  widgetRows.push(startStep.step);

  let currWorkflowStep = startStep;
  let error = 0;
  while (true) {
    error++;

    if (!currWorkflowStep.next) break;

    const next = convertNextStepConfigToNextBasicStepConfig(
      currWorkflowStep.next,
      getFlowStateValue,
    );
    if (!next) break;
    if (!('step' in next)) {
      throw new DeveloperError(
        'Workflow widget only supports config with step as next. Please Contact support',
      );
    }
    currWorkflowStep = getRecordByKey(widgetWorkflow.workflow.config, next.step);
    widgetRows.push(currWorkflowStep.step);

    if (error > 10) throw new Error('infinite flow:');
  }

  const widgetsAsRows = widgetRows.map((widgetName) =>
    getStepFromRepo(widgetWorkflow.steps, widgetName),
  );

  return widgetsAsRows;
};
