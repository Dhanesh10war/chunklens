import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Copy,
  Mail,
  ShieldCheck,
  Terminal,
  FolderArchive,
  ArrowRight,
  Building2,
  MessageSquare,
  Send,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { copyToClipboard } from '../../utils/clipboard';
import { cn } from '../../utils/cn';

export type ProTier = 'pro' | 'team' | 'enterprise';
export type ModalTab = 'editions' | 'contact';

interface ProWaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTier?: ProTier;
  initialTab?: ModalTab;
}

const WEB3FORMS_ACCESS_KEY = 'aaac4e6d-8629-4820-8584-f1ba6f69775d';

const STORAGE_KEY_EMAIL = 'chunklens_pro_waitlist_email';
const STORAGE_KEY_TIER = 'chunklens_pro_waitlist_tier';
const STORAGE_KEY_NUM = 'chunklens_pro_waitlist_number';

export const ProWaitlistModal: React.FC<ProWaitlistModalProps> = ({
  isOpen,
  onClose,
  initialTier = 'pro',
  initialTab = 'editions',
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>(initialTab);
  const [selectedTier, setSelectedTier] = useState<ProTier>(initialTier);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [waitlistNumber, setWaitlistNumber] = useState<number>(() => Math.floor(135 + Math.random() * 55));
  const [isCopied, setIsCopied] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false);

  // Query section state
  const [queryName, setQueryName] = useState('');
  const [queryEmail, setQueryEmail] = useState('');
  const [queryBusiness, setQueryBusiness] = useState('');
  const [queryTopic, setQueryTopic] = useState('Developer Edition (Local Batch & Vector Export)');
  const [queryTeamScale, setQueryTeamScale] = useState('2-10 engineers');
  const [queryText, setQueryText] = useState('');
  const [queryError, setQueryError] = useState('');
  const [isSubmittingQuery, setIsSubmittingQuery] = useState(false);
  const [isQuerySubmitted, setIsQuerySubmitted] = useState(false);

  // Restore prior early access registration if saved in localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedEmail = localStorage.getItem(STORAGE_KEY_EMAIL);
      const savedTier = localStorage.getItem(STORAGE_KEY_TIER) as ProTier | null;
      const savedNum = localStorage.getItem(STORAGE_KEY_NUM);

      if (savedEmail && savedNum) {
        setEmail(savedEmail);
        if (savedTier) setSelectedTier(savedTier);
        setWaitlistNumber(parseInt(savedNum, 10) || 142);
        setIsSubmitted(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (initialTier) setSelectedTier(initialTier);
  }, [initialTier]);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const priorityCode = `CHUNKLENS-PRO-#${waitlistNumber}-${selectedTier.toUpperCase()}`;

  const handleEarlyAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setValidationError('Please enter a valid work email address.');
      return;
    }

    setValidationError('');
    setIsSubmittingWaitlist(true);

    const assignedNum = Math.floor(135 + Math.random() * 55);
    setWaitlistNumber(assignedNum);

    const generatedCode = `CHUNKLENS-PRO-#${assignedNum}-${selectedTier.toUpperCase()}`;

    // Dispatch notification to Web3Forms so site owner centrally collects the waitlist registration
    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          name: 'Early Access Request',
          email: trimmed,
          subject: `[ChunkLens Waitlist] ${selectedTier.toUpperCase()} - ${trimmed}`,
          from_name: 'ChunkLens Waitlist',
          reply_to: trimmed,
          message: `New Early Access Registration:\nWork Email: ${trimmed}\nEdition: ${selectedTier.toUpperCase()}\nQueue Reference: ${generatedCode}\nDate: ${new Date().toISOString()}`,
        }),
      }).catch(() => {});
    } catch {}

    try {
      localStorage.setItem(STORAGE_KEY_EMAIL, trimmed);
      localStorage.setItem(STORAGE_KEY_TIER, selectedTier);
      localStorage.setItem(STORAGE_KEY_NUM, assignedNum.toString());
    } catch {}

    // Pre-populate query email if empty
    if (!queryEmail) {
      setQueryEmail(trimmed);
    }

    setIsSubmittingWaitlist(false);
    setIsSubmitted(true);
  };

  const handleCopyCode = async () => {
    const textToCopy = `ChunkLens Early Access Registration\nEmail: ${email}\nEdition: ${selectedTier.toUpperCase()}\nReference: ${priorityCode}\nTarget: ChunkLens Engineering Team\nhttps://chunklens.com`;
    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2200);
    }
  };

  const handleOpenContact = () => {
    if (email && !queryEmail) {
      setQueryEmail(email);
    }
    if (selectedTier === 'pro') {
      setQueryTopic('Developer Edition (Local Batch & Vector Export)');
    } else if (selectedTier === 'team') {
      setQueryTopic('CI/CD Guard (Pipeline Automation & GitHub Action)');
    } else if (selectedTier === 'enterprise') {
      setQueryTopic('Enterprise (Air-Gapped & Private VPC)');
    }
    setIsQuerySubmitted(false);
    setActiveTab('contact');
  };

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = queryName.trim();
    const trimmedEmail = queryEmail.trim();
    const trimmedBusiness = queryBusiness.trim();
    const trimmedQuery = queryText.trim();

    if (!trimmedName) {
      setQueryError('Please provide your name.');
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setQueryError('Please provide a valid contact email address.');
      return;
    }
    if (!trimmedBusiness) {
      setQueryError('Please provide your company or organization name.');
      return;
    }
    if (!trimmedQuery) {
      setQueryError('Please describe your query or project requirements.');
      return;
    }

    setQueryError('');
    setIsSubmittingQuery(true);

    // Generate a dedicated unique ticket for this specific inquiry
    const inquiryTicket = `INQ-${Math.floor(1000 + Math.random() * 9000)}`;

    // Only link early access waitlist code if the emails actually match
    const isSameUserAsWaitlist =
      isSubmitted && email.trim() !== '' && email.trim().toLowerCase() === trimmedEmail.toLowerCase();

    const referenceField = isSameUserAsWaitlist
      ? `${inquiryTicket} (Linked Waitlist: ${priorityCode})`
      : inquiryTicket;

    try {
      // Background dispatch payload directly to Web3Forms relay
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          name: trimmedName,
          email: trimmedEmail,
          subject: `[ChunkLens Inquiry] ${trimmedBusiness} - ${queryTopic} (${trimmedName})`,
          from_name: `${trimmedName} (via ChunkLens)`,
          reply_to: trimmedEmail,
          message: `Name: ${trimmedName}\nContact Email: ${trimmedEmail}\nOrganization: ${trimmedBusiness}\nTopic of Interest: ${queryTopic}\nTeam Scale: ${queryTeamScale}\nReference: ${referenceField}\n\nQuery / Requirements:\n${trimmedQuery}\n\n---\nDelivered via ChunkLens Inquiries`,
        }),
      });

      const result = await response.json().catch(() => null);
      if (result && !result.success) {
        setQueryError(result.message || 'Failed to dispatch inquiry. Please check your submission.');
        setIsSubmittingQuery(false);
        return;
      }
    } catch {
      setQueryError('Unable to send inquiry over network. Please check your connection.');
      setIsSubmittingQuery(false);
      return;
    }

    // Clear all fields immediately (one-time submission)
    setQueryName('');
    setQueryEmail('');
    setQueryBusiness('');
    setQueryText('');
    setQueryTopic('Developer Edition (Local Batch & Vector Export)');
    setQueryTeamScale('2-10 engineers');
    setQueryError('');

    setIsSubmittingQuery(false);
    setIsQuerySubmitted(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pro-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-surface-1 border border-separator rounded-card shadow-modal max-w-3xl w-full overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="relative border-b border-separator px-6 py-4 bg-surface-2/30">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 right-4 h-8 w-8 rounded-control flex items-center justify-center text-text-tertiary hover:text-text hover:bg-surface-2 transition-colors focus-ring"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-mono font-medium bg-surface-2 text-text-secondary border border-separator">
              Early Access &amp; Inquiries
            </span>
            <span className="inline-flex items-center gap-1 text-2xs text-text-muted font-mono">
              <ShieldCheck className="h-3 w-3 text-status-success" />
              <span>Zero-Egress Architecture</span>
            </span>
          </div>

          <h2 id="pro-modal-title" className="text-lg font-bold text-text tracking-tight">
            ChunkLens Pro &amp; Enterprise Editions
          </h2>
          <p className="text-xs text-text-secondary mt-1 max-w-2xl leading-relaxed">
            Extended capabilities for high-throughput batch processing, automated CI/CD token guardrails, and air-gapped private deployments.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-separator px-6 pt-2 bg-surface-2/20 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('editions')}
            className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5 focus-ring',
              activeTab === 'editions'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text'
            )}
          >
            <FolderArchive className="h-3.5 w-3.5" />
            <span>Editions &amp; Specs</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5 focus-ring',
              activeTab === 'contact'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text'
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Contact &amp; Queries</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {activeTab === 'editions' ? (
            <>
              {/* Edition Selection Cards */}
              <div>
                <div className="text-xs font-medium text-text-secondary mb-3">
                  Select an edition to review specifications or request early access:
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Developer Edition */}
                  <button
                    type="button"
                    onClick={() => setSelectedTier('pro')}
                    className={cn(
                      'p-4 rounded-card border text-left transition-all relative flex flex-col justify-between focus-ring',
                      selectedTier === 'pro'
                        ? 'border-accent bg-accent-subtle/40 shadow-subtle'
                        : 'border-separator bg-surface-2/20 hover:border-separator'
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <FolderArchive className="h-4 w-4 text-accent" />
                          <span className="text-xs font-semibold text-text">Developer Edition</span>
                        </div>
                        {selectedTier === 'pro' && (
                          <span className="h-4 w-4 rounded-full bg-accent text-white flex items-center justify-center text-2xs">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="text-2xs font-mono text-text-muted mb-2.5">Local Batch &amp; Tuning</div>
                      <ul className="text-2xs text-text-secondary space-y-1.5 leading-relaxed">
                        <li>• Multi-file directory batch ingestion (1,000+ files)</li>
                        <li>• Automated chunk size &amp; overlap grid search</li>
                        <li>• Direct export to Pinecone, Qdrant, Chroma, &amp; Weaviate</li>
                        <li>• Custom local ONNX and Ollama vector models</li>
                      </ul>
                    </div>
                    <div className="mt-3 pt-2 border-t border-separator/60 text-2xs text-text-muted">
                      Workstation deployment
                    </div>
                  </button>

                  {/* Team CI/CD Guard */}
                  <button
                    type="button"
                    onClick={() => setSelectedTier('team')}
                    className={cn(
                      'p-4 rounded-card border text-left transition-all relative flex flex-col justify-between focus-ring',
                      selectedTier === 'team'
                        ? 'border-accent bg-accent-subtle/40 shadow-subtle'
                        : 'border-separator bg-surface-2/20 hover:border-separator'
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Terminal className="h-4 w-4 text-accent" />
                          <span className="text-xs font-semibold text-text">CI/CD Guard</span>
                        </div>
                        {selectedTier === 'team' && (
                          <span className="h-4 w-4 rounded-full bg-accent text-white flex items-center justify-center text-2xs">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="text-2xs font-mono text-text-muted mb-2.5">Pipeline Automation</div>
                      <ul className="text-2xs text-text-secondary space-y-1.5 leading-relaxed">
                        <li>• Headless CLI &amp; GitHub Action (<code className="text-2xs bg-surface-2 px-1 rounded">@chunklens/guard</code>)</li>
                        <li>• Pull request linter for context cliffs &amp; bloat</li>
                        <li>• Automated prompt token cost diffs on documentation PRs</li>
                        <li>• Shared evaluation benchmarks and team presets</li>
                      </ul>
                    </div>
                    <div className="mt-3 pt-2 border-t border-separator/60 text-2xs text-text-muted">
                      Engineering teams
                    </div>
                  </button>

                  {/* Enterprise Air-Gapped */}
                  <button
                    type="button"
                    onClick={() => setSelectedTier('enterprise')}
                    className={cn(
                      'p-4 rounded-card border text-left transition-all relative flex flex-col justify-between focus-ring',
                      selectedTier === 'enterprise'
                        ? 'border-accent bg-accent-subtle/40 shadow-subtle'
                        : 'border-separator bg-surface-2/20 hover:border-separator'
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-accent" />
                          <span className="text-xs font-semibold text-text">Enterprise</span>
                        </div>
                        {selectedTier === 'enterprise' && (
                          <span className="h-4 w-4 rounded-full bg-accent text-white flex items-center justify-center text-2xs">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="text-2xs font-mono text-text-muted mb-2.5">Private Infrastructure</div>
                      <ul className="text-2xs text-text-secondary space-y-1.5 leading-relaxed">
                        <li>• Self-hosted Helm charts &amp; Docker Compose container</li>
                        <li>• Cryptographic zero-egress compliance documentation</li>
                        <li>• Enterprise SAML 2.0 / Okta / Azure AD single sign-on</li>
                        <li>• Dedicated engineering support &amp; custom tokenizers</li>
                      </ul>
                    </div>
                    <div className="mt-3 pt-2 border-t border-separator/60 text-2xs text-text-muted">
                      Regulated &amp; air-gapped VPC
                    </div>
                  </button>
                </div>
              </div>

              {/* Registration Form / Success State */}
              <div className="pt-2">
                {!isSubmitted ? (
                  <form onSubmit={handleEarlyAccessSubmit} className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (validationError) setValidationError('');
                          }}
                          placeholder="Enter work email for early access..."
                          className="w-full px-3.5 py-2.5 rounded-control border border-separator bg-surface-2 text-text text-xs placeholder:text-text-tertiary focus-ring outline-none font-mono"
                          aria-label="Work email address"
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={isSubmittingWaitlist}
                        icon={<ArrowRight className="h-3.5 w-3.5" />}
                        className="h-10 px-5 text-xs font-semibold justify-center shadow-card"
                      >
                        <span>{isSubmittingWaitlist ? 'Registering...' : 'Request Access'}</span>
                      </Button>
                    </div>
                    {validationError && (
                      <p className="text-2xs text-status-error font-medium">{validationError}</p>
                    )}
                    <p className="text-2xs text-text-muted flex items-center gap-1.5">
                      <ShieldCheck className="h-3 w-3 text-status-success shrink-0" />
                      <span>
                        Zero telemetry egress. Your preference is registered with the ChunkLens Team.
                      </span>
                    </p>
                  </form>
                ) : (
                  <div className="p-4 rounded-card border border-status-success/30 bg-status-success-subtle space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-status-success text-white flex items-center justify-center">
                          <Check className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-text">
                            Early Access Request Registered
                          </h4>
                          <p className="text-2xs text-text-secondary">
                            Edition: <span className="font-semibold text-text">{selectedTier.toUpperCase()}</span> · Work Email: {email}
                          </p>
                        </div>
                      </div>
                      <div className="px-2.5 py-1 rounded bg-surface-1 border border-separator font-mono text-2xs text-accent font-semibold">
                        {priorityCode}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={isCopied ? <Check className="h-3.5 w-3.5 text-status-success" /> : <Copy className="h-3.5 w-3.5" />}
                        onClick={handleCopyCode}
                        className="text-xs"
                      >
                        <span>{isCopied ? 'Reference Copied' : 'Copy Reference'}</span>
                      </Button>

                      <button
                        type="button"
                        onClick={handleOpenContact}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-medium text-text bg-surface-1 hover:bg-surface-2 border border-separator transition-colors focus-ring"
                      >
                        <Mail className="h-3.5 w-3.5 text-accent" />
                        <span>Contact Team</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsSubmitted(false)}
                        className="text-2xs text-text-tertiary hover:text-text underline p-1 text-right"
                      >
                        Change Email / Edition
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Queries & Contact Section */
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-text mb-1">
                  Submit Direct Inquiry or Request Custom Specifications
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Have questions regarding batch ingestion limits, custom tokenizers, CI/CD integration, or private VPC pilots? Submit your inquiry directly to our engineering lead.
                </p>
              </div>

              {!isQuerySubmitted ? (
                <form onSubmit={handleQuerySubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Name */}
                    <div>
                      <label className="block text-2xs font-semibold text-text mb-1.5">
                        Your Name <span className="text-status-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={queryName}
                        onChange={(e) => {
                          setQueryName(e.target.value);
                          if (queryError) setQueryError('');
                        }}
                        placeholder="e.g. Alex Rivera"
                        className="w-full px-3 py-2 rounded-control border border-separator bg-surface-2 text-text text-xs placeholder:text-text-tertiary focus-ring outline-none"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-2xs font-semibold text-text mb-1.5">
                        Work / Contact Email <span className="text-status-error">*</span>
                      </label>
                      <input
                        type="email"
                        value={queryEmail}
                        onChange={(e) => {
                          setQueryEmail(e.target.value);
                          if (queryError) setQueryError('');
                        }}
                        placeholder="alex@company.com"
                        className="w-full px-3 py-2 rounded-control border border-separator bg-surface-2 text-text text-xs placeholder:text-text-tertiary focus-ring outline-none font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Business / Organization */}
                  <div>
                    <label className="block text-2xs font-semibold text-text mb-1.5">
                      Business / Organization <span className="text-status-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={queryBusiness}
                      onChange={(e) => {
                        setQueryBusiness(e.target.value);
                        if (queryError) setQueryError('');
                      }}
                      placeholder="e.g. Acme Corp, Research Lab, or Independent Engineer"
                      className="w-full px-3 py-2 rounded-control border border-separator bg-surface-2 text-text text-xs placeholder:text-text-tertiary focus-ring outline-none"
                      required
                    />
                  </div>

                  {/* More Options: Topic of Interest & Team Scale */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-2xs font-semibold text-text mb-1.5">
                        Edition / Topic of Interest
                      </label>
                      <select
                        value={queryTopic}
                        onChange={(e) => setQueryTopic(e.target.value)}
                        className="w-full px-3 py-2 rounded-control border border-separator bg-surface-2 text-text text-xs focus-ring outline-none"
                      >
                        <option value="Developer Edition (Local Batch & Vector Export)">Developer Edition (Local Batch &amp; Vector Export)</option>
                        <option value="CI/CD Guard (Pipeline Automation & GitHub Action)">CI/CD Guard (Pipeline Automation &amp; GitHub Action)</option>
                        <option value="Enterprise (Air-Gapped & Private VPC)">Enterprise (Air-Gapped &amp; Private VPC)</option>
                        <option value="Custom Tokenizers & ONNX Models">Custom Tokenizers &amp; ONNX Models</option>
                        <option value="General Architecture & Licensing Query">General Technical / Licensing Query</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-2xs font-semibold text-text mb-1.5">
                        Team Scale
                      </label>
                      <select
                        value={queryTeamScale}
                        onChange={(e) => setQueryTeamScale(e.target.value)}
                        className="w-full px-3 py-2 rounded-control border border-separator bg-surface-2 text-text text-xs focus-ring outline-none"
                      >
                        <option value="Individual (1 engineer)">Individual (1 engineer)</option>
                        <option value="Small Team (2-10 engineers)">Small Team (2-10 engineers)</option>
                        <option value="Mid-Scale (11-50 engineers)">Mid-Scale (11-50 engineers)</option>
                        <option value="Enterprise (50+ engineers)">Enterprise (50+ engineers)</option>
                      </select>
                    </div>
                  </div>

                  {/* Query Textbox */}
                  <div>
                    <label className="block text-2xs font-semibold text-text mb-1.5">
                      Tell Us Your Query / Requirements <span className="text-status-error">*</span>
                    </label>
                    <textarea
                      value={queryText}
                      onChange={(e) => {
                        setQueryText(e.target.value);
                        if (queryError) setQueryError('');
                      }}
                      rows={4}
                      placeholder="Describe your document ingestion volume, embedding pipeline, compliance targets, or specific questions..."
                      className="w-full px-3 py-2 rounded-control border border-separator bg-surface-2 text-text text-xs placeholder:text-text-tertiary focus-ring outline-none resize-none leading-relaxed"
                      required
                    />
                  </div>

                  {queryError && (
                    <p className="text-2xs text-status-error font-medium">{queryError}</p>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                    <p className="text-2xs text-text-muted flex items-center gap-1.5">
                      <ShieldCheck className="h-3 w-3 text-status-success shrink-0" />
                      <span>Delivered directly to the ChunkLens Engineering Team.</span>
                    </p>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={isSubmittingQuery}
                      icon={<Send className="h-3.5 w-3.5" />}
                      className="h-9 px-4 text-xs font-semibold justify-center shadow-card"
                    >
                      <span>{isSubmittingQuery ? 'Submitting...' : 'Submit Query'}</span>
                    </Button>
                  </div>
                </form>
              ) : (
                /* Inquiry Sent Confirmation State */
                <div className="p-4 rounded-card border border-status-success/30 bg-status-success-subtle space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-status-success text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-text">
                        Query Submitted Successfully
                      </h4>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Thank you for reaching out! Your query has been delivered directly to the ChunkLens Team. We will review your requirements and respond to your email shortly.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-separator/40">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsQuerySubmitted(false)}
                      className="text-xs"
                    >
                      <span>Submit Another Query</span>
                    </Button>

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={onClose}
                      className="text-xs"
                    >
                      <span>Done</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-separator px-6 py-3.5 bg-surface-2/20 flex items-center justify-between text-2xs text-text-muted">
          <span>ChunkLens Visualizer &amp; Learn Track remain free and open.</span>
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary hover:text-text transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
