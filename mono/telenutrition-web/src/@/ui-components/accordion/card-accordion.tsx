import { cn } from '@/utils';
import { Disclosure } from '@headlessui/react';
import { ReactNode } from 'react';
import Icon from '../icons/Icon';

type CardAccordionItem = {
  header: string;
  icons?: ReactNode;
  children?: ReactNode;
};

type CardAccordionProps = CardAccordionItem;

export default function CardAccordion({ header, icons, children }: CardAccordionProps) {
  return (
    <div className="border border-neutral-500 rounded-md p-4">
      <Disclosure>
        {({ open }) => (
          <>
            <Disclosure.Button
              as="div"
              className={cn('cursor-pointer flex items-center w-full justify-between')}
            >
              <div className="flex items-center gap-x-2">
                <Icon
                  name="chevron-right"
                  className={cn('rotate-00 transition-all', !open && ' rotate-00')}
                />
                <h6>{header}</h6>
              </div>
              {icons}
            </Disclosure.Button>
            <Disclosure.Panel className={cn('pt-6 pl-6 transition-all')}>
              {children}
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </div>
  );
}
