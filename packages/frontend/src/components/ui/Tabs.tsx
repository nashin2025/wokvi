'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';

const Tabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { defaultValue?: string; value?: string; onValueChange?: (value: string) => void }
>(({ className, defaultValue, value, onValueChange, children, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col', className)} {...props}>
    {children}
  </div>
));
Tabs.displayName = 'Tabs';

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-surface-100 dark:bg-surface-800 p-1 text-surface-600 dark:text-surface-400',
      className
    )}
    role="tablist"
    {...props}
  >
    {children}
  </div>
));
TabsList.displayName = 'TabsList';

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string; disabled?: boolean }
>(({ className, value, disabled, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-surface-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-surface-900 dark:data-[state=active]:text-surface-100',
      className
    )}
    role="tab"
    aria-selected="false"
    data-state="inactive"
    data-value={value}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
));
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    role="tabpanel"
    aria-labelledby={value}
    data-value={value}
    {...props}
  >
    {children}
  </div>
));
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };