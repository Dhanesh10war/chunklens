import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Header } from '../Header';
import { DetectedFormatInfo } from '../../utils/fileFormatDetector';

describe('Header Component (Responsive Priority & Overflow Menu - Item 3.6)', () => {
  const mockFormat: DetectedFormatInfo = {
    formatId: 'markdown',
    label: 'Markdown',
    extension: '.md',
    recommendedStrategy: 'markdown',
    badge: 'MD',
    confidence: 'high',
    description: 'Markdown document with structural headings',
  };

  const defaultProps = {
    documentTitle: 'Quarterly Financial Performance',
    detectedFormat: mockFormat,
    onResetDocument: vi.fn(),
    onExportClick: vi.fn(),
    onTokenizerClick: vi.fn(),
    isCompareMode: false,
    onToggleCompare: vi.fn(),
    isSidebarOpen: true,
    onToggleSidebar: vi.fn(),
    onOpenCommandPalette: vi.fn(),
  };

  it('renders brand, document title, export button, and overflow menu trigger', () => {
    const html = renderToString(<Header {...defaultProps} />);

    // Brand and document title
    expect(html).toContain('ChunkLens');
    expect(html).toContain('Quarterly Financial Performance');
    expect(html).toContain('MD');

    // Export button (primary action - always visible)
    expect(html).toContain('Export');
    expect(html).toContain('aria-label="Export code and chunks"');

    // Overflow trigger button
    expect(html).toContain('aria-label="More actions"');
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('aria-expanded="false"');
  });

  it('keeps theme toggle visible at >=768px via hidden md:flex responsive classes (Amendment E)', () => {
    const html = renderToString(<Header {...defaultProps} />);

    // Theme toggle button must have `hidden md:flex` so it remains visible at >=768px
    expect(html).toContain('hidden md:flex');
    expect(html).toContain('Switch to light mode');
  });

  it('truncates document title cleanly without breaking layout', () => {
    const html = renderToString(
      <Header {...defaultProps} documentTitle="Very Long Document Title That Should Truncate Gracefully In Responsive Viewports" />
    );

    expect(html).toContain('truncate');
    expect(html).toContain('Very Long Document Title');
  });

  it('renders overflow menu trigger with correct accessibility attributes', () => {
    const html = renderToString(<Header {...defaultProps} />);

    expect(html).toContain('aria-label="More actions"');
    expect(html).toContain('aria-haspopup="menu"');
  });

  it('renders injected __APP_VERSION__ next to brand title (Item B1)', () => {
    const html = renderToString(<Header {...defaultProps} />);
    expect(html).toContain(`v${__APP_VERSION__}`);
  });
});
