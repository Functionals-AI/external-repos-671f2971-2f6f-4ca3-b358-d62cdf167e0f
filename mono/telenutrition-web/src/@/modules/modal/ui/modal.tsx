import { Dialog, Transition } from '@headlessui/react';
import { Fragment, ReactNode } from 'react';
import { useModal } from '..';
import { cn } from '@/utils';
import IconButton from '@/ui-components/button/icon';
import Footer from './footer';
import { useSpecificModalContext } from '../context';
import { AnimatePresence, motion } from 'framer-motion';

export type ModalSize = 'xl' | 'lg' | 'md' | 'sm';

type ModalProps = {
  children: ReactNode;
  panelClassName?: string;
  wrapperClassName?: string;
  size: ModalSize;
};

function Modal({ children, panelClassName, wrapperClassName, size }: ModalProps) {
  const specificModalContext = useSpecificModalContext();

  return (
    <AnimatePresence>
      <motion.div
        data-testid="modal-root"
        data-test={specificModalContext.type === 'primary' ? 'primary-modal' : 'secondary-modal'}
        className="fixed inset-0 overflow-y-auto"
        animate={{
          top: specificModalContext?.isDormant ? '-100%' : '0',
          pointerEvents: specificModalContext?.isDormant ? 'none' : 'auto',
        }}
        transition={{ duration: 0.3 }}
        {...(specificModalContext?.isDormant ? { inert: '' } : {})}
      >
        <div
          className={cn(
            'flex min-h-full items-center justify-center text-center px-2 md:px-8',
            wrapperClassName,
          )}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel
              className={cn(
                'min-h-[10rem]',
                'w-full transform overflow-hidden rounded-lg bg-white text-left align-middle transition-all shadow-hi',
                size === 'xl'
                  ? 'max-w-[65rem]'
                  : size === 'lg'
                    ? 'min-w-[70%] max-w-lg'
                    : size === 'md'
                      ? 'max-w-[42rem]'
                      : 'max-w-[27rem]',
                panelClassName,
              )}
            >
              <motion.div
                style={{
                  background: 'rgb(0, 0, 0, 0.2)',
                }}
                className="fixed inset-0"
                animate={{
                  zIndex: specificModalContext?.isDormant ? 999 : -1,
                  opacity: specificModalContext?.isDormant ? 1 : 0,
                  backdropFilter: specificModalContext?.isDormant ? 'blur(6px)' : 'blur(0px)',
                }}
                transition={{ duration: 0.2 }}
              />
              {children}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

interface ModalHeaderProps {
  title: ReactNode;
  subTitle?: ReactNode;
  className?: string;
}

function Header({ title, subTitle, className }: ModalHeaderProps) {
  const { closeAll } = useModal();
  const data = useSpecificModalContext();

  return (
    <div
      className={cn(
        'px-4 md:px-6 py-4 border-b border-solid border-neutral-200 flex items-center justify-between',
        className,
      )}
    >
      <div className="flex flex-col">
        <Dialog.Title as="h3" className="text-2xl font-medium leading-6 text-neutral-700">
          {title}
        </Dialog.Title>
        {subTitle && (
          <Dialog.Title as="p" className="text-md leading-4 text-neutral-400">
            {subTitle}
          </Dialog.Title>
        )}
      </div>
      {data && data.showCloseButton && (
        <IconButton
          size="sm"
          onClick={() => closeAll()}
          iconName={'x'}
          variant="quaternary"
          dataTestId="modal-close-button"
        />
      )}
    </div>
  );
}

function Body({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('w-full p-4 md:p-6 max-h-[80vh] overflow-y-scroll', className)}>
      {children}
    </div>
  );
}

Modal.Header = Header;
Modal.Body = Body;
Modal.Footer = Footer;

export default Modal;
