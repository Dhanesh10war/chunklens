import React from 'react';
import { cn } from '../../utils/cn';

export interface SliderWithInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unitLabel?: string;
  onChange: (value: number) => void;
  className?: string;
}

export const SliderWithInput: React.FC<SliderWithInputProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unitLabel,
  onChange,
  className,
}) => {
  const sliderId = `slider-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const inputId = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') return;
    const num = Number(raw);
    if (!isNaN(num)) {
      const clamped = Math.max(min, Math.min(max, num));
      onChange(clamped);
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Header: Label + Synchronized Number Input */}
      <div className="flex items-center justify-between">
        <label htmlFor={sliderId} className="text-xs font-medium text-text-secondary select-none">
          {label}
        </label>
        <div className="flex items-center space-x-1.5">
          <input
            id={inputId}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleInputChange}
            aria-label={`${label} numeric value`}
            className="h-6 w-16 text-right font-mono text-xs tabular-nums bg-surface border border-border-default hover:border-border-hover rounded px-1.5 text-text-primary focus-ring"
          />
          {unitLabel && (
            <span className="text-xs text-text-tertiary font-mono select-none">
              {unitLabel}
            </span>
          )}
        </div>
      </div>

      {/* Range Slider */}
      <div className="relative flex items-center py-1">
        <input
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          aria-label={label}
          className="w-full h-1.5 bg-elevated rounded-lg appearance-none cursor-pointer accent-accent focus-ring"
        />
      </div>

      {/* Min / Max Range Indicators */}
      <div className="flex justify-between text-xs text-text-tertiary font-mono tabular-nums select-none -mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};
