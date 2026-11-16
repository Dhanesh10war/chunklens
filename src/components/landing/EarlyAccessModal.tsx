import React, { useState } from 'react';
import { X, Sparkles, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';

interface EarlyAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  tierName?: string;
}

export const EarlyAccessModal: React.FC<EarlyAccessModalProps> = ({
  isOpen,
  onClose,
  tierName = 'Pro Developer',
}) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="early-access-title"
        className="w-full max-w-md rounded-panel bg-surface-1 border border-separator shadow-modal p-6 text-text relative select-none"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-tertiary hover:text-text p-1 rounded-control hover:bg-surface-2 transition-colors active-press focus-ring"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {!submitted ? (
          <div>
            <div className="h-10 w-10 rounded-control bg-accent-subtle border border-accent/25 flex items-center justify-center text-accent mb-4">
              <Sparkles className="h-5 w-5" />
            </div>

            <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-control bg-surface-2 text-text-secondary text-2xs font-mono border border-separator mb-2">
              <span>Future Release · Early Access Priority</span>
            </div>

            <h3 id="early-access-title" className="text-lg font-bold tracking-tight text-text mb-2">
              Join the {tierName} Waitlist
            </h3>

            <p className="text-xs text-text-secondary leading-relaxed mb-5 font-sans">
              We are actively finalizing batch multi-document parsing, vector store direct sync, and the synthetic query retrieval simulator. Be the first to get access when it ships.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="early-access-email" className="block text-2xs font-mono font-semibold text-text-secondary mb-1.5">
                  Work Email Address
                </label>
                <input
                  id="early-access-email"
                  type="email"
                  required
                  placeholder="engineer@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-control bg-surface-2 border border-separator text-xs text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent font-sans"
                />
              </div>

              <div className="flex items-center space-x-2 text-2xs text-text-tertiary">
                <ShieldCheck className="h-3.5 w-3.5 text-status-success-text shrink-0" />
                <span>Zero spam. You will only receive early beta access credentials.</span>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <Button variant="secondary" size="sm" onClick={onClose} type="button">
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" icon={<ArrowRight className="h-3.5 w-3.5" />}>
                  Join Priority Access
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="py-4 text-center flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-status-success-subtle border border-status-success/30 flex items-center justify-center text-status-success mb-3">
              <Check className="h-6 w-6" />
            </div>

            <h3 className="text-base font-bold text-text mb-1.5">You're on the list!</h3>
            <p className="text-xs text-text-secondary max-w-xs mb-6">
              Thank you for your interest in ChunkLens {tierName}. We will reach out to <strong className="text-text">{email}</strong> as soon as pilot invites open.
            </p>

            <Button variant="primary" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
