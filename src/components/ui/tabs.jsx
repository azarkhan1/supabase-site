import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../lib/utils';

const TabsContext = createContext(null);

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  children,
  className,
  ...props
}) {
  const [activeTab, setActiveTab] = useState(value || defaultValue);

  const handleValueChange = (val) => {
    if (onValueChange) {
      onValueChange(val);
    } else {
      setActiveTab(val);
    }
  };

  const currentActive = value !== undefined ? value : activeTab;

  return (
    <TabsContext.Provider value={{ activeTab: currentActive, handleValueChange }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-start rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-slate-500 dark:text-slate-400 gap-1",
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ value, className, children, ...props }) {
  const { activeTab, handleValueChange } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => handleValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-semibold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-white dark:bg-slate-900 text-[#1e40af] dark:text-blue-400 shadow-sm"
          : "hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800/50 dark:hover:text-slate-100",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, ...props }) {
  const { activeTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      className={cn(
        "mt-4 focus-visible:outline-none",
        className
      )}
      {...props}
    />
  );
}
