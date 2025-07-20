'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/utils';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import Icon, { IconProps } from './icons/Icon';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn('w-full flex justify-start border-b border-b-neutral-115 gap-x-6', '', className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    iconName?: IconProps['name'];
  }
>(({ className, children, iconName, ...props }, ref) => (
  <TabsPrimitive.Trigger
    data-testid="tabs-trigger"
    ref={ref}
    className={cn(
      'group',
      'py-3 border-b-2 border-b-transparent text-[#787C7B]',
      'data-[state=active]:border-b-2 data-[state=active]:border-b-fs-green-300 data-[state=active]:text-neutral-1500 children:data-[state=active]:fill-status-green-400',
      'flex gap-x-2 items-center',
      'hover:border-b-neutral-200 focus:border-b-neutral-200 focus:ring-0 focus:outline-0 focus:text-neutral-1500 hover:text-neutral-1500',
      className,
    )}
    {...props}
  >
    {iconName && (
      <Icon
        size="sm"
        name={iconName}
        className="group-hover:fill-neutral-1500 group-hover:text-neutral-1500 group-focus:text-fs-green-300 group-data-[state=active]:text-fs-green-300"
      />
    )}
    {children}
  </TabsPrimitive.Trigger>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  >
    <AnimatePresence>
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -10, opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  </TabsPrimitive.Content>
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
