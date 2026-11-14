import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { PrivacyPopover } from '../PrivacyPopover';

describe('PrivacyPopover Component (Item 3.2)', () => {
  it('renders privacy badge with accessible dialog attributes', () => {
    const html = renderToString(<PrivacyPopover />);

    // Button attributes
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('100% client-side · zero network egress');

    // Closed by default
    expect(html).not.toContain('Zero Network Egress</h3>');
  });

  it('collapses text to icon on smaller screens via responsive classes', () => {
    const html = renderToString(<PrivacyPopover />);
    expect(html).toContain('hidden min-[1200px]:inline');
  });
});
