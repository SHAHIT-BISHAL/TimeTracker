import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * ErrorBoundary - Catches rendering errors and displays helpful information
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-12 h-12 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Application Error
                </h2>
                <p className="text-gray-600 mb-4">
                  Something went wrong. Please try the following:
                </p>
                <ol className="text-sm text-gray-700 space-y-2 mb-4 list-decimal list-inside">
                  <li>Refresh the page (F5 or Ctrl+R)</li>
                  <li>Clear browser cache (Ctrl+Shift+Delete)</li>
                  <li>Log in again</li>
                  <li>Check browser console (F12) for error details</li>
                </ol>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-4 text-xs bg-gray-100 p-3 rounded max-h-48 overflow-auto">
                    <summary className="font-mono cursor-pointer font-bold text-gray-800">
                      Error Details
                    </summary>
                    <pre className="mt-2 text-red-600 whitespace-pre-wrap break-words">
                      {this.state.error.toString()}
                      {'\n\n'}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}

                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
