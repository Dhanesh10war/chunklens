import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { LandingPage } from '../LandingPage';
import { LandingFeatures } from '../LandingFeatures';
import { LandingUseCases } from '../LandingUseCases';
import { LandingSecurity } from '../LandingSecurity';
import { LandingDocs } from '../LandingDocs';

describe('LandingPage (Multi-Page Product Architecture)', () => {
  it('renders hero headline, zero-egress security badge, and primary CTAs on Overview', () => {
    const html = renderToString(<LandingPage onLaunchApp={vi.fn()} />);

    expect(html).toContain('Stop Guessing Your RAG Chunks');
    expect(html).toContain('100% Client-Side · Zero Network Egress');
    expect(html).toContain('Launch Visualizer');
  });

  it('renders product architecture and engineering roadmap block (no pricing tiers or waitlists)', () => {
    const html = renderToString(<LandingPage onLaunchApp={vi.fn()} />);

    expect(html).toContain('Engineered for Production RAG');
    expect(html).not.toContain('open-source');
    expect(html).not.toContain('GitHub');
    expect(html).not.toContain('$29');
    expect(html).not.toContain('$99');
    expect(html).not.toContain('Waitlist');
  });

  it('renders the interactive live mini-chunker playground and transparent cost calculator', () => {
    const html = renderToString(<LandingPage onLaunchApp={vi.fn()} />);

    expect(html).toContain('Live Document Chunking Simulation');
    expect(html).toContain('Target Budget');
    expect(html).toContain('Step-by-Step Cost Calculator');
    expect(html).toContain('Monthly Ingested Documents');
  });

  it('renders FAQ accordion section with architectural answers', () => {
    const html = renderToString(<LandingPage onLaunchApp={vi.fn()} />);

    expect(html).toContain('Frequently Asked Questions');
    expect(html).toContain('Why should I optimize chunks before inserting them into a vector database?');
    expect(html).toContain('Is my document text really never sent to any server?');
  });

  it('renders Features page with all 5 strategies and lexical continuity scoring math', () => {
    const html = renderToString(<LandingFeatures onLaunchApp={vi.fn()} />);

    expect(html).toContain('Five Purpose-Built Strategies. Zero Guesswork.');
    expect(html).toContain('Recursive Character Splitter');
    expect(html).toContain('Fixed Character');
    expect(html).toContain('Exact BPE Tokenizer');
    expect(html).toContain('Markdown &amp; Heading');
    expect(html).toContain('Tabular &amp; CSV');
    expect(html).toContain('Lexical Continuity Scoring');
    expect(html).toContain('Overlap Redundancy Analysis');
  });

  it('renders Use Cases page with production verticals and calibrated configurations', () => {
    const html = renderToString(<LandingUseCases onLaunchApp={vi.fn()} />);

    expect(html).toContain('Engineered for High-Stakes RAG Workflows');
    expect(html).toContain('Legal Contracts &amp; Master Service Agreements');
    expect(html).toContain('Quarterly Financial Earnings &amp; 10-K Filings');
    expect(html).toContain('Software Repositories &amp; API Documentation');
    expect(html).toContain('Clinical Case Records &amp; Medical Literature');
  });

  it('renders Security page with zero-egress CSP and factual compliance disclaimer', () => {
    const html = renderToString(<LandingSecurity onLaunchApp={vi.fn()} />);

    expect(html).toContain('True Zero-Egress. Your Data Never Leaves Your Machine.');
    expect(html).toContain("connect-src &#x27;none&#x27;");
    expect(html).toContain('Terminal Verification Command');
    expect(html).toContain('Your documents are not uploaded. Whether this fits your compliance requirements is for your team to decide.');
    expect(html).not.toContain('SOC 2');
    expect(html).not.toContain('HIPAA');
  });

  it('renders Docs page with LangChain, LlamaIndex, and keyboard shortcuts', () => {
    const html = renderToString(<LandingDocs onLaunchApp={vi.fn()} />);

    expect(html).toContain('Export Production Code with One Click');
    expect(html).toContain('LangChain (Python)');
    expect(html).toContain('LlamaIndex (Python)');
    expect(html).toContain('Visualizer Keyboard Shortcuts');
  });
});
