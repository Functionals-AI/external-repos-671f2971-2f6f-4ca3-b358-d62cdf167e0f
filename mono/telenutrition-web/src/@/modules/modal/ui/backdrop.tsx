import { Dialog, Transition } from '@headlessui/react';
import { Fragment, ReactNode } from 'react';

interface BackdropProps {
  isOpen: boolean;
  children: ReactNode;
}

export default function Backdrop({ isOpen, children }: BackdropProps) {
  const noop = () => {};

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={noop}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0"
            style={{ background: 'rgb(0, 0, 0, 0.2)', backdropFilter: 'blur(6px)' }}
          />
        </Transition.Child>
        {children}
      </Dialog>
    </Transition>
  );
}
