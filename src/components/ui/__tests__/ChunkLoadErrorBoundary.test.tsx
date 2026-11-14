import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ChunkLoadErrorBoundary } from '../ChunkLoadErrorBoundary';
import { ModalLoadingFallback } from '../ModalLoadingFallback';

describe('ChunkLoadErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    const html = renderToString(
      <ChunkLoadErrorBoundary>
        <div data-testid="child">Valid child component</div>
      </ChunkLoadErrorBoundary>
    );

    expect(html).toContain('Valid child component');
    expect(html).not.toContain('role="alert"');
  });

  it('renders ModalLoadingFallback with accessible role status', () => {
    const html = renderToString(<ModalLoadingFallback label="Loading Export options..." />);
    expect(html).toContain('role="status"');
    expect(html).toContain('Loading Export options...');
  });
});
