import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary - Catches rendering errors and displays helpful information
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState(prev => ({
      error,
      errorInfo,
      errorCount: prev.errorCount + 1
    }));
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleHardReset = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <AlertCircle className="w-12 h-12 text-red-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Application Error
                </h2>
                <p className="text-gray-600 text-sm">
                  Something went wrong. Try the options below:
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-semibold"
              >
                Refresh Page
              </button>

              <button
                onClick={this.handleHardReset}
                className="w-full px-4 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors font-semibold text-sm"
              >
                Clear Cache & Go to Login
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-xs bg-gray-100 p-3 rounded max-h-48 overflow-auto border border-gray-300">
                <summary className="font-mono cursor-pointer font-bold text-gray-800 mb-2">
                  🐛 Dev: Error Details (Click to expand)
                </summary>
                <div className="space-y-2">
                  <div>
                    <strong className="text-red-600">Error:</strong>
                    <pre className="mt-1 text-red-600 whitespace-pre-wrap break-words bg-white p-2 rounded overflow-auto max-h-20">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  <div>
                    <strong className="text-gray-700">Stack:</strong>
                    <pre className="mt-1 text-gray-700 whitespace-pre-wrap break-words bg-white p-2 rounded overflow-auto max-h-20 font-mono text-xs">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </div>
              </details>
            )}

            <p className="text-xs text-gray-500 mt-4">
              Error count: {this.state.errorCount}
              {this.state.errorCount > 3 && ' — Multiple errors detected. Try clearing cache.'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
