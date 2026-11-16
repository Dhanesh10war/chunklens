import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { LandingPage } from '../LandingPage';

describe('LandingPage (SaaS Landing Page)', () => {
  it('renders hero headline, zero-egress security badge, and primary CTAs', () => {
    const html = renderToString(<LandingPage onLaunchApp={vi.fn()} />);

    expect(html).toContain('Stop Guessing Your RAG Chunks');
    expect(html).toContain('100% Client-Side · Zero Network Egress');
    expect(html).toContain('Launch Visualizer');
  });

  it('renders all three commercial SaaS pricing tiers (Community, Pro, Team)', () => {
    const html = renderToString(<LandingPage onLaunchApp={vi.fn()} />);

    // Tier 1: Community
    expect(html).toContain('Community');
    expect(html).toContain('$0');

    // Tier 2: Pro
    expect(html).toContain('Pro Developer');
    expect(html).toContain('$29');
    expect(html).toContain('Most Popular');

    // Tier 3: Team
    expect(html).toContain('Team &amp; Enterprise');
    expect(html).toContain('$99');
  });

  it('renders the interactive demo workspace preview and feature comparisons', () => {
    const html = renderToString(<LandingPage onLaunchApp={vi.fn()} />);

    expect(html).toContain('The Visual IDE for Document Chunking');
    expect(html).toContain('Chunk Stream');
    expect(html).toContain('Similarity Heatmap');
    expect(html).toContain('Export Pipeline');
    expect(html).toContain('Context Boundary Fractures');
    expect(html).toContain('Silent Token Bleed');
  });

  it('renders FAQ accordion section with architectural answers', () => {
    const html = renderToString(<LandingPage onLaunchApp={vi.fn()} />);

    expect(html).toContain('Frequently Asked Questions');
    expect(html).toContain('Why should I optimize chunks before inserting them into a vector database?');
    expect(html).toContain('Is my document text really never sent to any server?');
  });

  it('renders zero-egress CSP verification terminal block', () => {
    const html = renderToString(<LandingPage onLaunchApp={vi.fn()} />);

    expect(html).toContain("connect-src &#x27;none&#x27;");
    expect(html).toContain('Total outbound network calls: 0');
  });
});
