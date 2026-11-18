import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level root error boundary to catch unexpected rendering crashes
 * and provide a recovery mechanism (reload or clean session reset).
 */
export class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RootErrorBoundary] Caught unhandled error:', error, errorInfo);
  }

  public handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public handleClearAndReload = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // Ignore storage access errors
      }
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen w-full flex items-center justify-center p-4 bg-bg text-text"
        >
          <div className="max-w-md w-full p-6 rounded-card bg-surface-1 border border-border-default shadow-elevated flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-status-error-subtle text-status-error-text flex items-center justify-center">
              <AlertCircle className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-lg font-semibold text-text">
                {this.props.fallbackTitle || 'Something went wrong'}
              </h1>
              <p className="text-xs text-text-secondary leading-relaxed">
                An unexpected error occurred while rendering the application. You can reload the page or reset cached session state.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="w-full p-2.5 rounded bg-surface-2 border border-border-subtle text-left">
                <code className="text-2xs font-mono text-status-error-text block break-words">
                  {this.state.error.message}
                </code>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto flex-1"
                icon={<RotateCcw className="h-4 w-4" />}
                onClick={this.handleReload}
              >
                Reload page
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="w-full sm:w-auto flex-1"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={this.handleClearAndReload}
              >
                Reset session
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
