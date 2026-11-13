import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'secondary',
      size = 'md',
      icon,
      iconRight,
      isLoading = false,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium font-sans rounded-md select-none transition-colors active-press focus-ring disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100';

    const sizeStyles = {
      sm: 'h-7 px-2.5 text-xs gap-1.5',
      md: 'h-8 px-3 text-xs gap-2',
      lg: 'h-9 px-4 text-sm gap-2',
    }[size];

    const variantStyles = {
      primary:
        'bg-[var(--accent-solid)] text-[var(--on-accent)] hover:bg-[var(--accent-solid-hover)] border border-transparent shadow-subtle',
      secondary:
        'bg-surface text-text-primary border border-border-default hover:bg-elevated hover:border-border-hover',
      ghost:
        'bg-transparent text-text-secondary hover:text-text-primary hover:bg-elevated border border-transparent',
      danger:
        'bg-status-error/10 text-status-error border border-status-error/20 hover:bg-status-error/20',
    }[variant];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles, variantStyles, className)}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-3.5 w-3.5 text-current shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        ) : (
          icon && <span className="shrink-0 text-current">{icon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && iconRight && <span className="shrink-0 text-current">{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
