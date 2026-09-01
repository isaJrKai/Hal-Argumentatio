import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare props: Props;
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bg-base border border-red-500/20 rounded-xl m-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2 font-mono">PANEL RENDER FAILURE</h2>
          <p className="text-sm text-text-secondary mb-6 max-w-md text-center font-mono">
            A runtime exception occurred within this intelligence panel. The error has been isolated to prevent systemic collapse.
          </p>
          
          <div className="bg-bg-raised border border-border-dim rounded p-3 mb-6 max-w-lg w-full overflow-auto">
            <pre className="text-[10px] text-red-400 font-mono whitespace-pre-wrap">
              {this.state.error?.message || 'Unknown error'}
            </pre>
          </div>

          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded font-bold font-mono transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> RECOVERY (RESET PANEL)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
