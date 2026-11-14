import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches dynamic chunk load errors (e.g. network disconnection during lazy component load)
 * and provides a retry mechanism to re-fetch the asset.
 */
export class ChunkLoadErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ChunkLoadErrorBoundary] Caught chunk loading error:', error, errorInfo);
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="p-6 rounded-lg bg-surface border border-status-danger/30 flex flex-col items-center justify-center text-center space-y-3 m-4"
        >
          <div className="h-10 w-10 rounded-full bg-status-danger/10 text-status-danger flex items-center justify-center">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-text-primary">
              {this.props.fallbackTitle || 'Failed to load component'}
            </h3>
            <p className="text-xs text-text-secondary max-w-sm">
              {this.state.error?.message?.includes('dynamically imported module')
                ? 'Network issue prevented loading this module chunk. Please retry.'
                : this.state.error?.message || 'An unexpected error occurred while loading this view.'}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={this.handleRetry}
          >
            Retry loading
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
