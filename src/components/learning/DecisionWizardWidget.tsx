import React, { useState } from 'react';
import { WIZARD_QUESTIONS, computeWizardRecommendation } from '../../data/learning/wizard';
import { ChunkingConfig } from '../../engine/types';
import { Sparkles, ArrowRight, Check, RotateCcw, Copy } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { copyToClipboard } from '../../utils/clipboard';

interface DecisionWizardWidgetProps {
  onApplyConfig?: (config: ChunkingConfig) => void;
  className?: string;
}

export const DecisionWizardWidget: React.FC<DecisionWizardWidgetProps> = ({
  onApplyConfig,
  className,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({
    'document-type': 'technical-markdown',
    'retrieval-goal': 'balanced-qa',
    'model-family': 'dense-embeddings',
  });
  const [isCopied, setIsCopied] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  const activeQuestion = WIZARD_QUESTIONS[currentStep];
  const isFinished = currentStep >= WIZARD_QUESTIONS.length;
  const recommendation = computeWizardRecommendation(answers);

  const handleSelectOption = (optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [activeQuestion.id]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentStep < WIZARD_QUESTIONS.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsApplied(false);
  };

  const handleCopyCode = async () => {
    const jsonStr = JSON.stringify(recommendation.config, null, 2);
    const success = await copyToClipboard(jsonStr);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleApply = () => {
    if (onApplyConfig) {
      onApplyConfig(recommendation.config);
      setIsApplied(true);
      setTimeout(() => setIsApplied(false), 2500);
    }
  };

  return (
    <div className={cn('p-5 sm:p-6 rounded-card border border-separator bg-surface-1 shadow-card flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-separator text-xs">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 rounded-control bg-accent-subtle text-accent flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="font-semibold text-text text-sm">Interactive RAG Decision Wizard</h3>
            <p className="text-2xs text-text-secondary">Answer 3 questions to calculate your optimal chunking parameters</p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 font-mono text-2xs text-text-tertiary">
          <span>{`Step ${Math.min(currentStep + 1, WIZARD_QUESTIONS.length)} of ${WIZARD_QUESTIONS.length}`}</span>
        </div>
      </div>

      {!isFinished ? (
        /* Question Form */
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-text mb-1">{activeQuestion.question}</h4>
            <p className="text-xs text-text-secondary mb-4">{activeQuestion.description}</p>

            <div className="space-y-2">
              {activeQuestion.options.map((opt) => {
                const isSelected = answers[activeQuestion.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.id)}
                    className={cn(
                      'w-full p-3 rounded-control border text-left transition-all active-press focus-ring flex items-start space-x-3',
                      isSelected
                        ? 'border-accent bg-accent-subtle shadow-subtle'
                        : 'border-separator bg-surface-2 hover:bg-surface-3'
                    )}
                  >
                    <div
                      className={cn(
                        'h-4 w-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition-colors',
                        isSelected ? 'border-accent bg-accent text-accent' : 'border-separator bg-surface-1'
                      )}
                    >
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-surface-1" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-text">{opt.label}</div>
                      <div className="text-2xs text-text-secondary mt-0.5 leading-relaxed">{opt.detail}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-separator">
            <button
              type="button"
              disabled={currentStep === 0}
              onClick={handleBack}
              className="px-3 py-1.5 rounded-control text-xs font-medium text-text-secondary hover:text-text disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              Back
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleNext}
              icon={<ArrowRight className="h-3.5 w-3.5" />}
              className="text-xs"
            >
              {currentStep === WIZARD_QUESTIONS.length - 1 ? 'Calculate Recommendation' : 'Next Question'}
            </Button>
          </div>
        </div>
      ) : (
        /* Results & Recommendation Display */
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="p-3 rounded-control bg-accent-subtle border border-accent/30">
              <span className="text-2xs font-mono font-bold text-accent block mb-1">
                Recommended Strategy
              </span>
              <h4 className="text-base font-bold text-text mb-1">{recommendation.strategyName}</h4>
              <p className="text-xs text-text-secondary leading-relaxed">{recommendation.rationale}</p>
            </div>

            {/* Parameter Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-control bg-surface-2 border border-separator">
                <span className="text-2xs text-text-tertiary block font-mono">Strategy</span>
                <span className="text-xs font-bold font-mono text-text capitalize">{recommendation.config.strategy}</span>
              </div>
              <div className="p-2 rounded-control bg-surface-2 border border-separator">
                <span className="text-2xs text-text-tertiary block font-mono">Target Size</span>
                <span className="text-xs font-bold font-mono text-accent tabular-nums">
                  {recommendation.config.chunkSize} tokens
                </span>
              </div>
              <div className="p-2 rounded-control bg-surface-2 border border-separator">
                <span className="text-2xs text-text-tertiary block font-mono">Overlap</span>
                <span className="text-xs font-bold font-mono text-text tabular-nums">
                  {recommendation.config.chunkOverlap} tokens ({Math.round((recommendation.config.chunkOverlap / recommendation.config.chunkSize) * 100)}%)
                </span>
              </div>
              <div className="p-2 rounded-control bg-surface-2 border border-separator">
                <span className="text-2xs text-text-tertiary block font-mono">Encoding</span>
                <span className="text-xs font-bold font-mono text-text truncate block">{recommendation.config.encoding}</span>
              </div>
            </div>

            {/* Best Practice Bullet Points */}
            <div className="p-3 rounded-control bg-surface-2/60 border border-separator text-xs">
              <span className="font-semibold text-text block mb-2">Production Checklist:</span>
              <ul className="space-y-1.5 text-2xs text-text-secondary">
                {recommendation.bestPractices.map((bp, i) => (
                  <li key={i} className="flex items-start space-x-1.5">
                    <Check className="h-3 w-3 text-status-success shrink-0 mt-0.5" />
                    <span>{bp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-separator gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-control text-xs text-text-secondary hover:text-text hover:bg-surface-2 transition-colors active-press"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-control text-xs font-medium bg-surface-2 hover:bg-surface-3 border border-separator text-text transition-colors active-press focus-ring"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-status-success" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy JSON'}</span>
              </button>

              {onApplyConfig && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApply}
                  icon={isApplied ? <Check className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                  className="text-xs shadow-subtle"
                >
                  {isApplied ? 'Applied to Workbench!' : 'Apply to Workbench'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
