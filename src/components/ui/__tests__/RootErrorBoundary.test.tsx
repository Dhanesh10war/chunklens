import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { RootErrorBoundary } from '../RootErrorBoundary';

describe('RootErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    const html = renderToString(
      <RootErrorBoundary>
        <div data-testid="child">Normal application content</div>
      </RootErrorBoundary>
    );

    expect(html).toContain('Normal application content');
    expect(html).not.toContain('role="alert"');
  });

  it('renders error UI with alert role when state has error', () => {
    // Suppress console.error output during intentional error test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const boundary = new RootErrorBoundary({ children: null });
    boundary.state = { hasError: true, error: new Error('Simulated runtime failure') };

    const rendered = boundary.render();
    const html = renderToString(rendered as any);

    expect(html).toContain('role="alert"');
    expect(html).toContain('Something went wrong');
    expect(html).toContain('Simulated runtime failure');
    expect(html).toContain('Reload page');
    expect(html).toContain('Reset session');

    consoleSpy.mockRestore();
  });
});
