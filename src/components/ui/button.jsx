import React from 'react';
import { cn } from '../../lib/utils';

export const Button = React.forwardRef(({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  disabled,
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] transition-all';
  
  const variants = {
    primary: 'bg-[#1e40af] hover:bg-[#1d3557] text-white focus:ring-[#1e40af]',
    success: 'bg-[#166534] hover:bg-[#14532d] text-white focus:ring-[#166534]',
    danger: 'bg-[#991b1b] hover:bg-[#7f1d1d] text-white focus:ring-[#991b1b]',
    warning: 'bg-[#854d0e] hover:bg-[#713f12] text-white focus:ring-[#854d0e]',
    secondary: 'bg-[#f1f5f9] hover:bg-[#e2e8f0] text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 focus:ring-slate-400',
    outline: 'border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-slate-500 bg-transparent',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-slate-500 bg-transparent'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  };

  return (
    <button
      type={type}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      ref={ref}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
