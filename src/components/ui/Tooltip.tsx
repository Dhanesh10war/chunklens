import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

export interface TooltipProps {
  content: string;
  shortcut?: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delayMs?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  shortcut,
  children,
  position = 'top',
  delayMs = 400,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const show = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, delayMs);
  };

  const hide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  }[position];

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 pointer-events-none whitespace-nowrap rounded px-2 py-1 text-[11px] font-medium bg-elevated text-text-primary border border-border-default shadow-elevated flex items-center space-x-1.5 animate-in fade-in duration-100',
            positionClasses,
            className
          )}
        >
          <span>{content}</span>
          {shortcut && (
            <kbd className="font-mono text-[10px] px-1 py-0.2 rounded bg-surface border border-border-subtle text-text-tertiary">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
};
