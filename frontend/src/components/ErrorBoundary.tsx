import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-navy-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg-premium border border-navy-200 p-8 max-w-2xl w-full">
            <h1 className="text-2xl font-bold text-danger-600 mb-4">Something went wrong</h1>
            <p className="text-sm text-navy-600 mb-4">An unexpected error occurred. You can reload the application to continue.</p>
            <details className="mb-4">
              <summary className="cursor-pointer text-sm font-medium text-navy-700 mb-2">Technical details</summary>
              <pre className="bg-navy-50 p-4 rounded-lg text-xs overflow-auto text-navy-800 border border-navy-200">
                {this.state.error?.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Reload application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
