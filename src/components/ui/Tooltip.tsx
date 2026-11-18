import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useId,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface TooltipProps {
  content: React.ReactNode;
  shortcut?: string;
  children: React.ReactElement;
  position?: TooltipPlacement;
  placement?: TooltipPlacement;
  delayMs?: number;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
}

// Global warm-group state for skipping delay when hovering between adjacent buttons
let globalLastTooltipHiddenAt = 0;
let globalActiveTooltipCount = 0;

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  shortcut,
  children,
  position = 'bottom',
  placement,
  delayMs = 300,
  className,
  wrapperClassName,
  disabled = false,
}) => {
  const preferredPlacement = placement || position;
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);

  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const showTimeoutRef = useRef<number | null>(null);
  const touchTimerRef = useRef<number | null>(null);
  const isTouchingRef = useRef(false);

  const generatedId = useId();
  const tooltipId = `tooltip-${generatedId.replace(/:/g, '')}`;

  useEffect(() => {
    setMounted(true);
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    };
  }, []);

  const hide = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
    setIsVisible((prev) => {
      if (prev) {
        if (globalActiveTooltipCount > 0) globalActiveTooltipCount--;
        globalLastTooltipHiddenAt = Date.now();
        return false;
      }
      return false;
    });
  }, []);

  const show = useCallback(() => {
    if (disabled || !content) return;
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);

    // Skip delay if moving between adjacent buttons within warm-up window (300ms)
    const isWarmGroup =
      globalActiveTooltipCount > 0 || Date.now() - globalLastTooltipHiddenAt < 300;
    const effectiveDelay = isWarmGroup ? 0 : delayMs;

    if (effectiveDelay === 0) {
      setIsVisible((prev) => {
        if (!prev) globalActiveTooltipCount++;
        return true;
      });
    } else {
      showTimeoutRef.current = window.setTimeout(() => {
        setIsVisible((prev) => {
          if (!prev) globalActiveTooltipCount++;
          return true;
        });
      }, effectiveDelay);
    }
  }, [content, delayMs, disabled]);

  // Position calculation with auto-flip, cross-axis shifting, and boundary collision handling
  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const tr = triggerRef.current.getBoundingClientRect();
    const tt = tooltipRef.current.getBoundingClientRect();

    const W = window.innerWidth || document.documentElement.clientWidth;
    const H = window.innerHeight || document.documentElement.clientHeight;

    const padding = 8;
    const offset = 8;

    let side = preferredPlacement;

    // Rule: Never default to 'top' for anything within ~80px of top of viewport
    if (side === 'auto') {
      if (tr.top < 80) {
        side = 'bottom';
      } else if (tr.left < 80) {
        side = 'right';
      } else if (W - tr.right < 80) {
        side = 'left';
      } else {
        side = 'bottom';
      }
    } else if (side === 'top' && tr.top < 80) {
      side = 'bottom';
    }

    // Auto-flip if not enough room in preferred direction
    if (side === 'top') {
      const topSpace = tr.top - offset;
      const bottomSpace = H - tr.bottom - offset;
      if ((topSpace < tt.height || tr.top < 80) && bottomSpace >= tt.height) {
        side = 'bottom';
      }
    } else if (side === 'bottom') {
      const bottomSpace = H - tr.bottom - offset;
      const topSpace = tr.top - offset;
      if (bottomSpace < tt.height && topSpace >= tt.height && tr.top >= 80) {
        side = 'top';
      }
    } else if (side === 'left') {
      const leftSpace = tr.left - offset;
      const rightSpace = W - tr.right - offset;
      if (leftSpace < tt.width && rightSpace >= tt.width) {
        side = 'right';
      }
    } else if (side === 'right') {
      const rightSpace = W - tr.right - offset;
      const leftSpace = tr.left - offset;
      if (rightSpace < tt.width && leftSpace >= tt.width) {
        side = 'left';
      }
    }

    let x = 0;
    let y = 0;

    if (side === 'top' || side === 'bottom') {
      // Center along horizontal trigger axis
      x = tr.left + tr.width / 2 - tt.width / 2;
      // Shift along cross-axis to stay fully inside viewport with padding
      x = Math.max(padding, Math.min(W - tt.width - padding, x));

      if (side === 'top') {
        y = tr.top - tt.height - offset;
      } else {
        y = tr.bottom + offset;
      }
      y = Math.max(padding, Math.min(H - tt.height - padding, y));
    } else {
      // Center along vertical trigger axis
      y = tr.top + tr.height / 2 - tt.height / 2;
      // Shift along cross-axis to stay fully inside viewport with padding
      y = Math.max(padding, Math.min(H - tt.height - padding, y));

      if (side === 'left') {
        x = tr.left - tt.width - offset;
      } else {
        x = tr.right + offset;
      }
      x = Math.max(padding, Math.min(W - tt.width - padding, x));
    }

    setCoords({ x: Math.round(x), y: Math.round(y) });
  }, [preferredPlacement]);

  // Reposition on render, window resize, and scroll (capture: true for nested containers)
  useIsomorphicLayoutEffect(() => {
    if (!isVisible) {
      setCoords(null);
      return;
    }

    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true });

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
    };
  }, [isVisible, updatePosition]);

  // Keyboard navigation: Escape key closes tooltip immediately
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, hide]);

  // Touch handlers to prevent stuck tooltips
  const handleTouchStart = () => {
    isTouchingRef.current = true;
    touchTimerRef.current = window.setTimeout(() => {
      show();
    }, 500);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
    hide();
    setTimeout(() => {
      isTouchingRef.current = false;
    }, 150);
  };

  const handleMouseEnter = () => {
    if (isTouchingRef.current) return;
    show();
  };

  const handleFocus = () => {
    if (isTouchingRef.current) return;
    show();
  };

  return (
    <>
      <span
        ref={triggerRef}
        className={cn('inline-flex items-center', wrapperClassName)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={hide}
        onFocus={handleFocus}
        onBlur={hide}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        aria-describedby={isVisible ? tooltipId : undefined}
      >
        {children}
      </span>

      {mounted &&
        isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            id={tooltipId}
            style={{
              position: 'fixed',
              top: coords ? `${coords.y}px` : '-9999px',
              left: coords ? `${coords.x}px` : '-9999px',
              zIndex: 'var(--z-tooltip, 100)',
              opacity: coords ? 1 : 0,
              pointerEvents: 'none',
            }}
            className={cn(
              'pointer-events-none select-none max-w-[280px] rounded-control px-2 py-1 text-xs font-medium',
              'bg-surface-1 border border-separator shadow-elevated text-text flex items-center space-x-1.5',
              'transition-opacity duration-100 ease-out whitespace-nowrap',
              className
            )}
          >
            <span>{content}</span>
            {shortcut && (
              <kbd className="font-mono text-2xs px-1.5 py-0.5 rounded-control bg-surface-2 border border-separator text-text-secondary select-none">
                {shortcut}
              </kbd>
            )}
          </div>,
          document.body
        )}
    </>
  );
};
