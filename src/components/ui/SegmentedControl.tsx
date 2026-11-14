import React from 'react';
import { cn } from '../../utils/cn';

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: 'subtle' | 'underline';
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = 'subtle',
  size = 'md',
  className,
  ariaLabel,
}: SegmentedControlProps<T>) {
  if (variant === 'underline') {
    return (
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn('flex space-x-4 border-b border-border-default', className)}
      >
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={opt.value}
              role="tab"
              aria-selected={isSelected}
              onClick={() => onChange(opt.value)}
              className={cn(
                'flex items-center space-x-1.5 pb-2 text-xs font-medium border-b-2 transition-colors active-press focus-ring',
                isSelected
                  ? 'border-accent text-text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              )}
            >
              {opt.icon && <span className="shrink-0">{opt.icon}</span>}
              <span>{opt.label}</span>
              {opt.badge !== undefined && (
                <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-elevated text-text-tertiary">
                  {opt.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // 'subtle' pill variant (Linear / Raycast style)
  const sizeClasses = size === 'sm' ? 'h-7 p-0.5 text-xs' : 'h-8 p-1 text-xs';

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center rounded-md bg-elevated border border-border-subtle select-none',
        sizeClasses,
        className
      )}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-center justify-center space-x-1.5 px-2.5 py-1 rounded-[5px] font-medium whitespace-nowrap transition-all active-press focus-ring',
              isSelected
                ? 'bg-surface text-text-primary shadow-subtle border border-border-subtle'
                : 'text-text-secondary hover:text-text-primary border border-transparent'
            )}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
            {opt.badge !== undefined && (
              <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-surface text-text-tertiary">
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
