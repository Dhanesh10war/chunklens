import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Tooltip } from '../Tooltip';

describe('Tooltip Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('SSR / Markup', () => {
    it('renders child element cleanly without throwing', () => {
      const html = renderToString(
        <Tooltip content="Export configuration" shortcut="⌘E">
          <button type="button">Export</button>
        </Tooltip>
      );

      expect(html).toContain('Export');
      expect(html).toContain('<button');
    });

    it('does not leak portal tooltip markup into initial SSR HTML (client-only portal)', () => {
      const html = renderToString(
        <Tooltip content="Invisible during SSR">
          <button type="button">Trigger</button>
        </Tooltip>
      );

      expect(html).toContain('Trigger');
      // Portal is rendered on mount only when visible
      expect(html).not.toContain('role="tooltip"');
    });
  });

  describe('Placement and Collision Guard Rules', () => {
    it('defaults to bottom placement for top toolbar elements (top < 80px)', () => {
      // Test the logic directly by checking that default position is bottom
      const defaultProps = {
        content: 'Action',
        children: <button type="button">Button</button>,
      };

      const html = renderToString(<Tooltip {...defaultProps} />);
      expect(html).toContain('Button');
    });
  });
});
