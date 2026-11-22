import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ProWaitlistModal } from '../ProWaitlistModal';

describe('ProWaitlistModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const html = renderToString(<ProWaitlistModal isOpen={false} onClose={vi.fn()} />);
    expect(html).toBe('');
  });

  it('renders title, feature highlights, and edition options without explicit price tags when isOpen is true', () => {
    const html = renderToString(<ProWaitlistModal isOpen={true} onClose={vi.fn()} />);

    // Title and value prop
    expect(html).toContain('ChunkLens Pro &amp; Enterprise Editions');
    expect(html).toContain('Multi-file directory batch ingestion');
    expect(html).toContain('CI/CD Guard');
    expect(html).toContain('Enterprise');

    // Navigation tabs
    expect(html).toContain('Editions &amp; Specs');
    expect(html).toContain('Contact &amp; Queries');

    // Editions without price declarations
    expect(html).toContain('Developer Edition');
    expect(html).toContain('Local Batch &amp; Tuning');
    expect(html).toContain('Pipeline Automation');
    expect(html).toContain('Private Infrastructure');
    expect(html).not.toContain('$19');
    expect(html).not.toContain('$99');

    // Email form
    expect(html).toContain('Request Access');
    expect(html).toContain('Zero telemetry egress');
  });

  it('renders contact and query form fields when initialTab is contact', () => {
    const html = renderToString(
      <ProWaitlistModal isOpen={true} onClose={vi.fn()} initialTab="contact" />
    );

    // Form inputs for query section
    expect(html).toContain('Submit Direct Inquiry');
    expect(html).toContain('Your Name');
    expect(html).toContain('Work / Contact Email');
    expect(html).toContain('Business / Organization');
    expect(html).toContain('Edition / Topic of Interest');
    expect(html).toContain('Team Scale');
    expect(html).toContain('Tell Us Your Query / Requirements');
    expect(html).toContain('Submit Query');

    // Professional branding without exposing personal Gmail
    expect(html).toContain('ChunkLens Engineering Team');
    expect(html).not.toContain('dhanesh10war');
    expect(html).not.toContain('@gmail.com');
  });

  it('contains accessible modal dialog attributes', () => {
    const html = renderToString(<ProWaitlistModal isOpen={true} onClose={vi.fn()} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby="pro-modal-title"');
  });
});
