import { createContext, useContext } from 'react';
import { DeveloperError } from 'utils/errors';
import { useModal } from '.';

interface SpecificModalContext {
  isDormant: boolean;
  showCloseButton?: boolean;
  type: 'primary' | 'secondary';
}

const SpecificModalContext = createContext<SpecificModalContext | null>(null);

const useSpecificModalContext = () => {
  const modal = useModal();
  const context = useContext(SpecificModalContext);
  if (!context) throw new DeveloperError('Must have specific modal context provider');

  const closeModal = context.type === 'primary' ? modal.closeAll : modal.closeSecondary;

  return { ...context, closeModal };
};

export { useSpecificModalContext, SpecificModalContext };
