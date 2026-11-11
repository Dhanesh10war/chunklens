import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, icon, className, id, ...props }, ref) => {
    const generatedId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={generatedId}
            className="text-xs font-medium text-text-secondary select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-2.5 flex items-center pointer-events-none text-text-tertiary">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={generatedId}
            className={cn(
              'h-8 w-full rounded-md bg-surface text-text-primary border text-xs font-sans px-2.5 transition-colors placeholder:text-text-tertiary focus-ring',
              error
                ? 'border-status-error focus-visible:ring-status-error'
                : 'border-border-default hover:border-border-hover',
              icon && 'pl-8',
              className
            )}
            {...props}
          />
        </div>
        {(error || helperText) && (
          <span
            className={cn(
              'text-[11px] leading-tight',
              error ? 'text-status-error' : 'text-text-tertiary'
            )}
          >
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
