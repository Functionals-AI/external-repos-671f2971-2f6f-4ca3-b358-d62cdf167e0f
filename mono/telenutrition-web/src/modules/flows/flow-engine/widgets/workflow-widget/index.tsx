import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import FlowWidget, { FlowWidgetProps } from '../flow-widget';
import type {
  FlowWidget as TFlowWidget,
  WorkflowWidget as TWorkflowWidget,
} from '@mono/telenutrition/lib/types';
import { findWidget } from '../../workflow-engine/helpers';
import { AnimatePresence, motion } from 'framer-motion';
import _ from 'lodash';
import { getAllPossibleUniqueKeys, getWidgetsList } from './helpers';

export default function WorkflowWidget({
  widget,
  getFlowStateValue,
  getFlowStateDisplayValue,
}: FlowWidgetProps<TWorkflowWidget>) {
  const { watch, getValues, register, setValue } = useFormContext();

  const allPossibleWidgetKeys = getAllPossibleUniqueKeys(Object.values(widget.steps));

  useEffect(() => {
    allPossibleWidgetKeys.forEach((key) => {
      const existingValue = getFlowStateValue(key);
      if (existingValue) {
        setValue(key, existingValue);
      }
    });
  }, []);

  const getWorkflowStateValue = (key: string | string[]): string | null => {
    const workflowValues = getValues();
    if (!_.isString(key)) return null;
    const value = workflowValues[key];
    if (value) return value as string;
    return null;
  };

  const getWidgets = () => getWidgetsList(widget, getWorkflowStateValue);

  const [widgets, setWidgets] = useState<TFlowWidget[]>(() => getWidgets());

  useEffect(() => {
    setWidgets(getWidgets());
    const subscription = watch((value, { name, type }) => {
      setWidgets(getWidgets());
    });
    return () => subscription.unsubscribe();
  }, [widget]);

  const nonVisibleWidgetKeys: string[] = allPossibleWidgetKeys.filter(
    (key) => !findWidget(widgets, key),
  );

  return (
    <div className="flex flex-col gap-y-4">
      {widgets.map((w) => (
        <AnimatePresence key={'key' in w ? w.key : w.name} exitBeforeEnter>
          <motion.div
            key={'key' in w ? w.key : w.name}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <FlowWidget
              widget={w}
              getFlowStateValue={getWorkflowStateValue}
              getFlowStateDisplayValue={getWorkflowStateValue}
            />
          </motion.div>
        </AnimatePresence>
      ))}
      {/** Inject hidden inputs for non-visible keys to set a "null" value */}
      {nonVisibleWidgetKeys.map((nonVisibleWidgetKey) => (
        <input
          key={nonVisibleWidgetKey}
          style={{ display: 'none' }}
          {...register(nonVisibleWidgetKey, { value: null })}
        />
      ))}
    </div>
  );
}
