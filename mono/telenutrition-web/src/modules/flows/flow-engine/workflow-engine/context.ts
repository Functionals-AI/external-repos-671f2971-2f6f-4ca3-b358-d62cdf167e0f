import { useContext, createContext } from 'react';
import type { UseWorkflowEngineReturn } from './types';
import { DeveloperError } from '../../../../utils/errors';

export const WorkflowEngineContext = createContext<UseWorkflowEngineReturn | null>(null);

export function useWorkflowEngineContext() {
  const context = useContext(WorkflowEngineContext);
  if (!context) throw new DeveloperError('Missing WorkflowEngineContext.Provider');

  return context;
}
