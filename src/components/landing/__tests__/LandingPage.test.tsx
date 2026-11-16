import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { LandingPage } from '../LandingPage';
import { LandingFeatures } from '../LandingFeatures';
import { LandingUseCases } from '../LandingUseCases';
import { LandingSecurity } from '../LandingSecurity';
import { LandingDocs } from '../LandingDocs';

describe('LandingPage (Multi-Page SaaS Product)', () => {
  it('renders hero headline, zero-egress security badge, and primary CTAs on Overview', () => {
    const html = renderToString(<LandingPage onLaunchApp={vi.fn()} />);

    expect(html).toContain('Stop Guessing Your RAG Chunks');
    expect(html).toContain('100% Client-Side · Zero Egress');
    expect(html).toContain('Launch Visualizer');
  });

  it('renders all three commercial SaaS pricing tiers with frozen status and early access waitlist', () => {
    const html = renderToString(<LandingPage onLaunchApp={vi.fn()} />);

    // Tier 1: Community
    expect(html).toContain('Community');
    expect(html).toContain('$0');
    expect(html).toContain('Available Now');

    // Tier 2: Pro (Frozen / Early Access)
    expect(html).toContain('Pro Developer');
    expect(html).toContain('$29');
    expect(html).toContain('Target Q1 2027');
    expect(html).toContain('Join Early Access Priority');

    // Tier 3: Team (Frozen / Waitlist)
    expect(html).toContain('Team &amp; Enterprise');
    expect(html).toContain('$99');
    expect(html).toContain('Waitlist');
    expect(html).toContain('Request Enterprise Pilot');
  });

  it('renders the interactive live mini-chunker playground and token cost calculator', () => {
    const html = renderToString(<LandingPage onLaunchApp={vi.fn()} />);

    expect(html).toContain('Live Document Chunking Simulation');
    expect(html).toContain('Target Budget');
    expect(html).toContain('Calculate Your RAG Ingestion Waste');
    expect(html).toContain('Documents Ingested Monthly');
  });

  it('renders FAQ accordion section with architectural answers', () => {
    const html = renderToString(<LandingPage onLaunchApp={vi.fn()} />);

    expect(html).toContain('Frequently Asked Questions');
    expect(html).toContain('Why should I optimize chunks before inserting them into a vector database?');
    expect(html).toContain('Is my document text really never sent to any server?');
  });

  it('renders Features page with all 4 splitters and continuity scoring math', () => {
    const html = renderToString(<LandingFeatures onLaunchApp={vi.fn()} />);

    expect(html).toContain('Four Purpose-Built Splitters. Zero Guesswork.');
    expect(html).toContain('Recursive Character Splitter');
    expect(html).toContain('Fixed Character');
    expect(html).toContain('Exact BPE Tokenizer');
    expect(html).toContain('Markdown &amp; Heading');
    expect(html).toContain('Boundary Continuity Scoring');
    expect(html).toContain('High Overlap Warning Engine');
  });

  it('renders Use Cases page with enterprise verticals and calibrated configurations', () => {
    const html = renderToString(<LandingUseCases onLaunchApp={vi.fn()} />);

    expect(html).toContain('Engineered for High-Stakes RAG Workflows');
    expect(html).toContain('Legal Contracts &amp; Master Service Agreements');
    expect(html).toContain('Quarterly Financial Earnings &amp; 10-K Filings');
    expect(html).toContain('Software Repositories &amp; API Documentation');
    expect(html).toContain('Clinical Case Records &amp; Medical Literature');
  });

  it('renders Security page with zero-egress CSP and terminal audit verification', () => {
    const html = renderToString(<LandingSecurity onLaunchApp={vi.fn()} />);

    expect(html).toContain('True Zero-Egress. Your Data Never Leaves Your Machine.');
    expect(html).toContain("connect-src &#x27;none&#x27;");
    expect(html).toContain('Terminal Verification Command');
    expect(html).toContain('SOC 2 Type II');
    expect(html).toContain('HIPAA Compatible');
  });

  it('renders Docs page with LangChain, LlamaIndex, and keyboard shortcuts', () => {
    const html = renderToString(<LandingDocs onLaunchApp={vi.fn()} />);

    expect(html).toContain('Export Production Code with One Click');
    expect(html).toContain('LangChain (Python)');
    expect(html).toContain('LlamaIndex (Python)');
    expect(html).toContain('Visualizer Keyboard Shortcuts');
  });
});
