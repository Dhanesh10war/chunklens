import React, { useState } from 'react';
import {
  Layers,
  ShieldCheck,
  ArrowRight,
  Check,
  Copy,
  Grid3X3,
  Cpu,
  FileCode,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Github,
  Sun,
  Moon,
  ExternalLink,
  Lock,
  SplitSquareVertical,
} from 'lucide-react';
import { useTheme } from '../../utils/theme';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface LandingPageProps {
  onLaunchApp: (sampleId?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
  const { isDark, toggleTheme } = useTheme();
  const [activeDemoTab, setActiveDemoTab] = useState<'chunks' | 'heatmap' | 'code'>('chunks');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [copiedCode, setCopiedCode] = useState(false);

  const toggleFaq = (idx: number) => {
    setActiveFaq((curr) => (curr === idx ? null : idx));
  };

  const samplePythonCode = `from langchain_text_splitters import RecursiveCharacterTextSplitter
import tiktoken

# Optimized via ChunkLens Visualizer
enc = tiktoken.get_encoding("cl100k_base")
splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
    encoding_name="cl100k_base",
    chunk_size=400,
    chunk_overlap=40,
    separators=["\\n\\n", "\\n", " ", ""]
)

chunks = splitter.split_text(corpus_text)
print(f"Created {len(chunks)} optimized chunks with 94.2% boundary continuity")`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(samplePythonCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text font-sans antialiased selection:bg-accent/20 selection:text-text flex flex-col">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-40 surface-translucent border-b border-separator select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <div className="h-7 w-7 rounded-control bg-surface-2 border border-separator flex items-center justify-center text-accent shrink-0 shadow-subtle">
              <Layers className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-text">ChunkLens</span>
            <span className="text-2xs font-mono text-text-tertiary px-1.5 py-0.5 rounded-control bg-surface-2 border border-separator">
              v0.3.0
            </span>
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-6 text-xs text-text-secondary">
            <a href="#features" className="hover:text-text transition-colors">
              Features
            </a>
            <a href="#demo" className="hover:text-text transition-colors">
              Live Preview
            </a>
            <a href="#security" className="hover:text-text transition-colors">
              Zero-Egress Security
            </a>
            <a href="#pricing" className="hover:text-text transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-text transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="h-8 w-8 rounded-control flex items-center justify-center text-text-secondary hover:text-text hover:bg-surface-2 transition-colors active-press focus-ring"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* GitHub Repo */}
            <a
              href="https://github.com/Dhanesh10war/chunklens"
              target="_blank"
              rel="noreferrer"
              className="h-8 w-8 rounded-control flex items-center justify-center text-text-secondary hover:text-text hover:bg-surface-2 transition-colors active-press focus-ring hidden sm:flex"
              aria-label="GitHub Repository"
            >
              <Github className="h-4 w-4" />
            </a>

            {/* Launch App CTA */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => onLaunchApp()}
              icon={<ArrowRight className="h-3.5 w-3.5" />}
              className="h-8 px-3.5 rounded-control text-xs font-medium"
            >
              <span>Launch Visualizer</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-16 sm:pt-24 pb-16 px-4 sm:px-6 overflow-hidden">
        {/* Subtle decorative background radial glow */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-accent/5 rounded-full blur-3xl pointer-events-none -z-10"
          aria-hidden="true"
        />

        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Security Pill Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-status-success-subtle border border-status-success/25 text-status-success-text text-xs font-mono mb-6 shadow-subtle select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-status-success shrink-0" />
            <span>100% Client-Side · Zero Network Egress · Web Worker Powered</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text leading-[1.1] mb-5">
            Stop Guessing Your RAG Chunks.{' '}
            <span className="text-accent block sm:inline">Visualize &amp; Optimize First.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-lg text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
            Eliminate context boundary hallucinations and cut 30%–50% of wasted vector store token costs before ingestion.
            Tune splitters, token budgets, and boundary continuity in real time on your machine.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-center mb-10">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onLaunchApp()}
              icon={<ArrowRight className="h-4 w-4" />}
              className="w-full sm:w-auto px-6 py-2.5 rounded-control text-sm font-semibold shadow-card"
            >
              <span>Launch Interactive Visualizer</span>
            </Button>

            <button
              onClick={() => onLaunchApp('legal-saas-agreement')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-control text-sm font-medium bg-surface-2 hover:bg-surface-3 border border-separator text-text transition-colors active-press focus-ring"
            >
              Try with Legal Agreement
            </button>
          </div>

          {/* Micro-proof points */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-text-tertiary select-none font-mono">
            <div className="flex items-center justify-center space-x-1.5">
              <Check className="h-3.5 w-3.5 text-status-success" />
              <span>Zero server upload</span>
            </div>
            <div className="flex items-center justify-center space-x-1.5">
              <Check className="h-3.5 w-3.5 text-status-success" />
              <span>5 BPE Tokenizers</span>
            </div>
            <div className="flex items-center justify-center space-x-1.5">
              <Check className="h-3.5 w-3.5 text-status-success" />
              <span>4 RAG Splitters</span>
            </div>
            <div className="flex items-center justify-center space-x-1.5">
              <Check className="h-3.5 w-3.5 text-status-success" />
              <span>Code Export in 1-Click</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE LIVE DEMO PREVIEW */}
      <section id="demo" className="py-12 px-4 sm:px-6 bg-surface-2/40 border-y border-separator">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text mb-2">
              The Visual IDE for Document Chunking
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              Inspect semantic flow, token budget boundaries, and cosine overlap before writing a single vector embedding.
            </p>
          </div>

          {/* Mock Interactive Workspace Container */}
          <div className="rounded-card border border-separator bg-surface-1 shadow-modal overflow-hidden">
            {/* Mock Header */}
            <div className="px-4 py-3 border-b border-separator bg-surface-2/60 flex flex-wrap items-center justify-between gap-3 text-xs select-none">
              <div className="flex items-center space-x-3">
                <span className="font-mono font-semibold text-text">SaaS Master Subscription Agreement</span>
                <span className="px-2 py-0.5 rounded-control bg-accent-subtle text-accent border border-accent/20 font-mono text-2xs">
                  Legal Contract · Markdown
                </span>
              </div>

              {/* Interactive Demo View Tabs */}
              <div className="flex items-center space-x-1 bg-surface-1 p-0.5 rounded-control border border-separator">
                <button
                  type="button"
                  onClick={() => setActiveDemoTab('chunks')}
                  className={cn(
                    'px-2.5 py-1 rounded-control text-xs font-medium transition-all active-press',
                    activeDemoTab === 'chunks'
                      ? 'bg-surface-2 text-text font-semibold shadow-subtle'
                      : 'text-text-secondary hover:text-text'
                  )}
                >
                  <Layers className="h-3 w-3 inline mr-1 text-accent" />
                  Chunk Stream
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDemoTab('heatmap')}
                  className={cn(
                    'px-2.5 py-1 rounded-control text-xs font-medium transition-all active-press',
                    activeDemoTab === 'heatmap'
                      ? 'bg-surface-2 text-text font-semibold shadow-subtle'
                      : 'text-text-secondary hover:text-text'
                  )}
                >
                  <Grid3X3 className="h-3 w-3 inline mr-1 text-accent" />
                  Similarity Heatmap
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDemoTab('code')}
                  className={cn(
                    'px-2.5 py-1 rounded-control text-xs font-medium transition-all active-press',
                    activeDemoTab === 'code'
                      ? 'bg-surface-2 text-text font-semibold shadow-subtle'
                      : 'text-text-secondary hover:text-text'
                  )}
                >
                  <FileCode className="h-3 w-3 inline mr-1 text-accent" />
                  Export Pipeline
                </button>
              </div>
            </div>

            {/* Mock Metrics Line */}
            <div className="px-4 py-2 border-b border-separator bg-surface-1 flex items-center justify-between flex-wrap gap-3 text-xs font-mono text-text-secondary">
              <div className="flex items-center space-x-6">
                <div>
                  <span className="text-text-tertiary">Partitions: </span>
                  <span className="text-text font-semibold">14 chunks</span>
                </div>
                <div>
                  <span className="text-text-tertiary">Ingested Tokens: </span>
                  <span className="text-text font-semibold">5,412 tok</span>
                </div>
                <div>
                  <span className="text-text-tertiary">Boundary Continuity: </span>
                  <span className="text-status-success font-semibold">94.2%</span>
                  <span className="text-text-tertiary"> (Smooth flow)</span>
                </div>
              </div>

              <div className="text-accent font-semibold">
                Est. Cost: $0.0001 <span className="text-text-tertiary font-normal">(@ $0.02 / 1M)</span>
              </div>
            </div>

            {/* Dynamic Tab Body */}
            <div className="p-4 sm:p-6 bg-bg min-h-[300px]">
              {activeDemoTab === 'chunks' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1 */}
                  <div className="p-4 rounded-card border border-separator bg-surface-1 shadow-subtle flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-accent">#1</span>
                          <span className="text-2xs font-mono text-text-tertiary">384 tokens</span>
                        </div>
                        <span className="text-2xs font-mono px-2 py-0.5 rounded-control bg-status-success-subtle text-status-success-text border border-status-success/20">
                          Complete Section
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-3 font-sans leading-relaxed">
                        1. DEFINITIONS AND ORDER OF PRECEDENCE. "Subscription Services" means the proprietary software-as-a-service application ordered by Customer under an Order Form. Customer acknowledges that all intellectual property rights remain vested in Provider...
                      </p>
                    </div>
                    {/* Token bar */}
                    <div className="mt-3 pt-2 border-t border-separator">
                      <div className="flex justify-between text-2xs font-mono text-text-tertiary mb-1">
                        <span>Token budget: 384 / 400</span>
                        <span>96% full</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full w-[96%]" />
                      </div>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="p-4 rounded-card border border-separator bg-surface-1 shadow-subtle flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-accent">#2</span>
                          <span className="text-2xs font-mono text-text-tertiary">392 tokens</span>
                        </div>
                        <span className="text-2xs font-mono px-2 py-0.5 rounded-control bg-accent-subtle text-accent border border-accent/20">
                          40 Tok Overlap
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-3 font-sans leading-relaxed">
                        2. SERVICE LEVEL AGREEMENT &amp; UPTIME. Provider warrants 99.9% uptime during each calendar month. In the event Provider fails to meet the Uptime Commitment, Customer shall be eligible to receive Service Credits calculated in accordance with Exhibit A...
                      </p>
                    </div>
                    {/* Token bar */}
                    <div className="mt-3 pt-2 border-t border-separator">
                      <div className="flex justify-between text-2xs font-mono text-text-tertiary mb-1">
                        <span>Token budget: 392 / 400</span>
                        <span>98% full</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full w-[98%]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeDemoTab === 'heatmap' && (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="inline-flex items-center space-x-2 mb-3">
                    <span className="h-3 w-3 rounded-control border border-accent bg-accent" />
                    <span className="text-xs font-mono text-text font-semibold">Continuous Cosine Similarity Ramp</span>
                  </div>
                  <p className="text-xs text-text-secondary max-w-md mb-4">
                    ChunkLens computes $N \times N$ token vectors in Web Workers. Filter self-similarity, spot accidental duplications, and trace boundary transitions at 60 FPS.
                  </p>
                  <div className="h-3 w-64 rounded-full border border-separator/40 shadow-subtle mb-4"
                    style={{ background: 'linear-gradient(to right, var(--heat-low), var(--heat-mid), var(--heat-high))' }}
                  />
                  <div className="flex justify-between w-64 text-2xs font-mono text-text-tertiary">
                    <span>Low Overlap (0%)</span>
                    <span>High Overlap (≥70%)</span>
                  </div>
                </div>
              )}

              {activeDemoTab === 'code' && (
                <div className="relative">
                  <div className="flex items-center justify-between pb-2 border-b border-separator mb-2">
                    <span className="text-xs font-mono text-text-secondary">LangChain Python (Direct Implementation)</span>
                    <button
                      onClick={handleCopyCode}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-control bg-surface-2 hover:bg-surface-3 border border-separator text-text-secondary hover:text-text text-2xs font-mono transition-colors active-press focus-ring"
                    >
                      {copiedCode ? <Check className="h-3 w-3 text-status-success" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-bg rounded-control border border-separator/60 font-mono text-2xs text-text-secondary overflow-x-auto leading-relaxed">
                    <code>{samplePythonCode}</code>
                  </pre>
                </div>
              )}
            </div>

            {/* Bottom Bar with CTA */}
            <div className="p-3 bg-surface-2/60 border-t border-separator flex items-center justify-between text-xs">
              <span className="text-text-secondary">Try all chunkers live with your own files</span>
              <button
                onClick={() => onLaunchApp()}
                className="text-accent hover:text-accent-hover font-semibold inline-flex items-center space-x-1"
              >
                <span>Open Full Workspace</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PAIN VS SOLUTION (3 CRITICAL PROBLEMS SOLVED) */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono text-accent font-semibold">Why RAG Pipelines Fail</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text mt-2 mb-3">
              Three Silent Flaws In Traditional Chunking
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              Most teams debug RAG by changing prompts or re-indexing vector databases. The actual failure happened during chunking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-card border border-separator bg-surface-1 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-control bg-status-warn-subtle border border-status-warn/25 flex items-center justify-center text-status-warn mb-4">
                  <SplitSquareVertical className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-text mb-2">Context Boundary Fractures</h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  Standard splitters sever text mid-sentence or split tables across chunks. When the LLM retrieves only one chunk, it hallucinates because the critical context was in the neighboring chunk.
                </p>
              </div>
              <div className="pt-3 border-t border-separator text-2xs font-mono text-status-success-text">
                ✓ ChunkLens continuity scoring &amp; orphan detection alert you before ingestion.
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-card border border-separator bg-surface-1 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-control bg-accent-subtle border border-accent/25 flex items-center justify-center text-accent mb-4">
                  <DollarSign className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-text mb-2">Silent Token Bleed</h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  A blind 20% overlap across 10,000 documents results in paying for millions of redundant tokens in vector DB storage and crowds out prompt space for actual answers.
                </p>
              </div>
              <div className="pt-3 border-t border-separator text-2xs font-mono text-status-success-text">
                ✓ Measure exact Ingested vs Document tokens and simulate embedding costs in real time.
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-card border border-separator bg-surface-1 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-control bg-status-success-subtle border border-status-success/25 flex items-center justify-center text-status-success mb-4">
                  <Cpu className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-text mb-2">Character Counting Blindspots</h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  Splitting by character count ignores Byte-Pair Encoding. 1,000 characters of Markdown code can range from 180 to 450 real tokens, overflowing small vector search budgets.
                </p>
              </div>
              <div className="pt-3 border-t border-separator text-2xs font-mono text-status-success-text">
                ✓ Client-side OpenAI TikToken BPE tokenizers give exact token numbers before embedding.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ZERO-EGRESS SECURITY & CONFIDENTIALITY */}
      <section id="security" className="py-16 px-4 sm:px-6 bg-surface-2/30 border-y border-separator">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            {/* Left text */}
            <div className="flex-1">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-control bg-status-success-subtle text-status-success-text text-2xs font-mono border border-status-success/20 mb-4 select-none">
                <Lock className="h-3 w-3" />
                <span>Enterprise Confidentiality</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text mb-4">
                Your Documents Never Leave Your Browser
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6">
                Unlike cloud document ingestion platforms, ChunkLens runs 100% on your machine. PDF extraction, BPE tokenization, and vector cosine calculations execute in isolated Web Workers.
              </p>

              <div className="space-y-3 text-xs text-text-secondary">
                <div className="flex items-start space-x-2.5">
                  <ShieldCheck className="h-4 w-4 text-status-success shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-text">Strict Content Security Policy:</strong> Enforces <code className="font-mono text-2xs bg-surface-2 px-1 py-0.5 rounded border border-separator">connect-src 'none'</code>. The browser physically blocks any network egress.
                  </span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <ShieldCheck className="h-4 w-4 text-status-success shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-text">Confidentiality-Ready:</strong> Safe for confidential legal master agreements, proprietary source code repositories, and HIPAA-sensitive medical files.
                  </span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <ShieldCheck className="h-4 w-4 text-status-success shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-text">Self-Hosted Fonts &amp; Assets:</strong> Inter and JetBrains Mono fonts are bundled locally with zero CDN trackers or cookies.
                  </span>
                </div>
              </div>
            </div>

            {/* Right Terminal Verification Box */}
            <div className="w-full lg:w-[420px] rounded-card border border-separator bg-bg shadow-card overflow-hidden">
              <div className="px-3 py-2 bg-surface-2 border-b border-separator flex items-center justify-between text-2xs font-mono text-text-tertiary select-none">
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-status-error/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-status-warn/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-status-success/60" />
                  <span className="ml-2 text-text-secondary">CSP Network Audit</span>
                </div>
                <span>bash</span>
              </div>
              <div className="p-4 font-mono text-2xs text-text-secondary space-y-2 leading-relaxed overflow-x-auto">
                <div className="text-text-tertiary"># Verify zero network requests in DevTools:</div>
                <div className="text-accent">$ curl -I https://chunklens.app</div>
                <div className="text-text">HTTP/2 200 OK</div>
                <div className="text-status-success-text">Content-Security-Policy: default-src 'self'; connect-src 'none'; worker-src 'self' blob:;</div>
                <div className="text-text-tertiary mt-2"># Total outbound network calls: 0</div>
                <div className="text-text-tertiary"># Telemetry scripts: 0</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SAAS PRICING MATRIX */}
      <section id="pricing" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-mono text-accent font-semibold">Predictable Tiers</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text mt-2 mb-3">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              Start with the free open-source visualizer. Upgrade when you need team collaboration, batch processing, and CI/CD quality gates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TIER 1: Community (Free) */}
            <div className="p-6 rounded-card border border-separator bg-surface-1 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-semibold text-text-secondary mb-1">Community</div>
                <div className="flex items-baseline space-x-1 mb-4">
                  <span className="text-3xl font-bold text-text">$0</span>
                  <span className="text-xs text-text-tertiary font-mono">/ forever</span>
                </div>
                <p className="text-xs text-text-secondary mb-6">
                  Perfect for individual AI developers tuning chunk parameters for single documents.
                </p>

                <div className="space-y-2.5 text-xs text-text-secondary border-t border-separator pt-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
                    <span>100% Client-Side Visualizer</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
                    <span>Single document inspection</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
                    <span>5 bundled TikToken BPE tokenizers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
                    <span>Cosine similarity matrix heatmap</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
                    <span>LangChain &amp; LlamaIndex code export</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
                    <span>Zero telemetry &amp; zero egress</span>
                  </div>
                </div>
              </div>

              <Button
                variant="secondary"
                size="md"
                onClick={() => onLaunchApp()}
                className="w-full text-xs font-semibold"
              >
                <span>Launch Free Visualizer</span>
              </Button>
            </div>

            {/* TIER 2: Pro ($29/mo) - Highlighted */}
            <div className="p-6 rounded-card border-2 border-accent bg-surface-1 shadow-card flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-accent text-white font-mono text-2xs font-semibold shadow-subtle">
                Most Popular
              </div>

              <div>
                <div className="text-xs font-mono font-semibold text-accent mb-1">Pro Developer</div>
                <div className="flex items-baseline space-x-1 mb-4">
                  <span className="text-3xl font-bold text-text">$29</span>
                  <span className="text-xs text-text-tertiary font-mono">/ month</span>
                </div>
                <p className="text-xs text-text-secondary mb-6">
                  For engineers building production RAG systems with query testing and multi-doc corpora.
                </p>

                <div className="space-y-2.5 text-xs text-text-secondary border-t border-separator pt-4 mb-6">
                  <div className="flex items-center space-x-2 text-text font-medium">
                    <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span>Everything in Community, plus:</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span>Batch Multi-Document Ingestion (50 docs)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span>Query Retrieval Simulator (Top-k recall test)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span>Anthropic Contextual Retrieval prepender</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span>Local WebGPU embedding models (BGE-Small)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span>Custom API Keys (OpenAI / Cohere)</span>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => onLaunchApp()}
                className="w-full text-xs font-semibold"
              >
                <span>Start Pro 14-Day Trial</span>
              </Button>
            </div>

            {/* TIER 3: Team / Enterprise ($99/mo) */}
            <div className="p-6 rounded-card border border-separator bg-surface-1 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-semibold text-text-secondary mb-1">Team &amp; Enterprise</div>
                <div className="flex items-baseline space-x-1 mb-4">
                  <span className="text-3xl font-bold text-text">$99</span>
                  <span className="text-xs text-text-tertiary font-mono">/ month</span>
                </div>
                <p className="text-xs text-text-secondary mb-6">
                  For teams automating knowledge base quality and syncing directly with vector databases.
                </p>

                <div className="space-y-2.5 text-xs text-text-secondary border-t border-separator pt-4 mb-6">
                  <div className="flex items-center space-x-2 text-text font-medium">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
                    <span>Everything in Pro, plus:</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
                    <span>Shared Team Presets &amp; Workspaces</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
                    <span>Direct Vector DB Push (Pinecone / Qdrant)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
                    <span>GitHub Actions CI/CD Knowledge Gate</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
                    <span>Preset versioning &amp; diff changelog</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
                    <span>SAML / SSO &amp; Priority SLA support</span>
                  </div>
                </div>
              </div>

              <Button
                variant="secondary"
                size="md"
                onClick={() => onLaunchApp()}
                className="w-full text-xs font-semibold"
              >
                <span>Contact for Team Plan</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-16 px-4 sm:px-6 bg-surface-2/30 border-t border-separator">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-text mb-2">Frequently Asked Questions</h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              Everything you need to know about ChunkLens architecture, security, and integration.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Why should I optimize chunks before inserting them into a vector database?',
                a: 'Once embeddings are calculated and stored in Pinecone, Qdrant, or Chroma, fixing bad chunk boundaries requires re-embedding your entire knowledge base. Unoptimized chunks cause severed facts (hallucinations), bloated vector indexes, and wasted context window space.',
              },
              {
                q: 'Is my document text really never sent to any server?',
                a: "Yes. ChunkLens is built with an uncompromising zero-egress architecture. The strict Content Security Policy declares connect-src 'none'. All PDF extraction, TikToken tokenization, and vector cosine calculations happen in isolated client-side Web Workers on your machine.",
              },
              {
                q: 'Which tokenizers are supported for exact BPE calculation?',
                a: 'ChunkLens bundles official TikToken encoders including cl100k_base (GPT-4, text-embedding-3), o200k_base (GPT-4o), p50k_base (text-davinci-003), and r50k_base. You can switch tokenizers with one click to observe variance.',
              },
              {
                q: 'How does the boundary continuity metric work?',
                a: 'Boundary continuity measures the semantic cosine similarity between chunk N and chunk N+1. High scores (>40%) indicate natural prose flow across sections, while low scores (<20%) alert you that a key concept was severed abruptly.',
              },
              {
                q: 'Can I export the exact chunking code to my Python or Node.js codebase?',
                a: 'Yes. ChunkLens features one-click copyable code generators for LangChain Python, LlamaIndex, Haystack, LangChain JS, and standalone Python scripts with matching delimiters and token parameters.',
              },
            ].map((faq, idx) => (
              <div
                key={`faq-${idx}`}
                className="rounded-card border border-separator bg-surface-1 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-4 py-3.5 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-text hover:bg-surface-2/60 transition-colors focus-ring"
                >
                  <span>{faq.q}</span>
                  {activeFaq === idx ? (
                    <ChevronUp className="h-4 w-4 text-text-tertiary shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-text-tertiary shrink-0 ml-2" />
                  )}
                </button>
                {activeFaq === idx && (
                  <div className="px-4 pb-4 pt-1 text-xs text-text-secondary leading-relaxed border-t border-separator/40 bg-surface-2/20">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FINAL CTA BANNER */}
      <section className="py-20 px-4 sm:px-6 bg-accent/5 border-t border-separator text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text mb-3">
            Ready to Eliminate RAG Retrieval Failures?
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mb-8">
            Join AI engineers who inspect and optimize their chunks before ingesting them into vector databases.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => onLaunchApp()}
            icon={<ArrowRight className="h-4 w-4" />}
            className="px-8 py-3 rounded-control text-sm font-semibold shadow-card mx-auto"
          >
            <span>Launch Visualizer (No Sign-Up Required)</span>
          </Button>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="py-8 px-4 sm:px-6 border-t border-separator bg-surface-1 text-xs text-text-secondary">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-accent" />
            <span className="font-semibold text-text">ChunkLens</span>
            <span className="text-text-tertiary font-mono">· MIT Licensed Open Source</span>
          </div>

          <div className="flex items-center space-x-6 text-2xs text-text-tertiary">
            <button onClick={() => onLaunchApp()} className="hover:text-text transition-colors">
              Visualizer
            </button>
            <a href="#features" className="hover:text-text transition-colors">
              Features
            </a>
            <a href="#security" className="hover:text-text transition-colors">
              Zero-Egress CSP
            </a>
            <a href="#pricing" className="hover:text-text transition-colors">
              Pricing
            </a>
            <a
              href="https://github.com/Dhanesh10war/chunklens"
              target="_blank"
              rel="noreferrer"
              className="hover:text-text transition-colors inline-flex items-center space-x-1"
            >
              <span>GitHub</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="text-2xs text-text-tertiary font-mono">
            100% Client-Side · Zero Telemetry
          </div>
        </div>
      </footer>
    </div>
  );
};
