import { Button } from '@/ui-components/button';
import classNames from 'utils/classNames';
import { AvatarProps, MenuItem } from '.';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/ui-components/avatar';
import { cn } from '@/utils';
import Icon from '../../ui-components/icons/Icon';
import { useRouter } from 'next/navigation';

interface DesktopMenuProps {
  menuItems: MenuItem[];
  currentPath: string | null;
  avatar: AvatarProps;
}

export default function DesktopMenu({ menuItems, currentPath, avatar }: DesktopMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  return (
    <AnimatePresence initial={false} exitBeforeEnter>
      <motion.div
        animate={{ width: isExpanded ? '12rem' : '5rem' }}
        className="z-40 bg-fs-green-600 hidden md:fixed md:inset-y-0 md:left-0 md:flex md:flex-col md:w-20 md:overflow-y-auto md:pb-4"
      >
        <section className={cn('py-6 pl-4')}>
          <Button
            dataTestId="profile-avatar"
            onClick={() => {
              if (avatar.href) {
                router.push(avatar.href);
              }
            }}
            className={cn(
              '!p-0',
              isExpanded && '!pr-3',
              'rounded-full transition-all',
              'w-fit h-fit',
              'flex items-center justify-start gap-x-3',
              avatar.href === currentPath
                ? 'bg-fs-green-300 text-white fill-white'
                : 'text-green-100 fill-green-100 hover:text-white hover:fill-white hover:bg-fs-green-300',
            )}
          >
            <Avatar className={cn('p-1')}>
              <AvatarImage src={avatar.src} />
              <AvatarFallback>{avatar.fallback}</AvatarFallback>
            </Avatar>
            {isExpanded && (
              <motion.p
                className="text-white font-normal"
                key={isExpanded ? 'open' : 'closed'}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {avatar.text}
              </motion.p>
            )}
          </Button>
        </section>
        <nav className="flex-1">
          <ul role="list" className={'flex flex-col gap-y-3 px-4'}>
            {menuItems.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  className={classNames(
                    'group',
                    'focusable',
                    'transition-colors rounded-full',
                    item.href === currentPath
                      ? 'bg-fs-green-300 text-white fill-white'
                      : 'text-green-100 fill-green-100 hover:text-white hover:fill-white hover:bg-fs-green-300',
                    'group flex gap-x-3 p-3 text-md leading-6 font-regular no-underline',
                  )}
                >
                  <Icon
                    name={item.iconName}
                    size="md"
                    aria-hidden="true"
                    color={item.href === currentPath ? 'white' : 'fsGreen-100'}
                    className="group-hover:text-white"
                  />
                  {isExpanded && (
                    <motion.p
                      className="text-white font-normal"
                      key={isExpanded ? 'open' : 'closed'}
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {item.name}
                    </motion.p>
                  )}
                  <span className="sr-only">{item.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center justify-end w-full pb-4 pr-6">
          <Button
            className="text-white bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent w-8 h-8"
            onClick={() => setIsExpanded((v) => !v)}
            variant={'quaternary'}
          >
            <motion.div
              animate={{ rotateZ: isExpanded ? -180 : 0 }}
              transition={{
                duration: 0.5,
                type: 'spring',
              }}
            >
              <Icon name={'chevrons-right'} color={'white'} size={'lg'} />
            </motion.div>
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
