import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, helperText, children, className, id, ...props }, ref) => {
    const generatedId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

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
          <select
            ref={ref}
            id={generatedId}
            className={cn(
              'h-8 w-full appearance-none rounded-control bg-surface-2 text-text border border-border-default hover:border-border-hover pl-2.5 pr-8 text-base sm:text-xs font-sans transition-colors cursor-pointer focus-ring',
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-surface-1 text-text">
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="absolute right-2.5 pointer-events-none text-text-tertiary">
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        </div>
        {helperText && <span className="text-xs text-text-tertiary leading-tight">{helperText}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
