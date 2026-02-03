import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { getApiUrl } from '../utils/apiUrl.js';

/**
 * API Diagnostic Page
 * Tests all API endpoints to verify backend connectivity
 */
export default function ApiDiagnostic() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    const url = getApiUrl();
    setApiUrl(url);
    runDiagnostics(url);
  }, []);

  const runDiagnostics = async (apiBaseUrl) => {
    const tests = {
      apiUrl: { status: 'checking', message: 'Testing API URL resolution...' },
      healthCheck: { status: 'checking', message: 'Checking /api/health...' },
      companiesAuth: { status: 'checking', message: 'Checking /api/companies with auth...' },
      companiesNoAuth: { status: 'checking', message: 'Checking /api/companies without auth...' },
      cors: { status: 'checking', message: 'Checking CORS headers...' },
    };

    setResults(tests);

    try {
      // Test 1: API URL
      const resolvedUrl = apiBaseUrl;
      tests.apiUrl = {
        status: 'success',
        message: `API URL resolved to: ${resolvedUrl}`,
        data: resolvedUrl
      };

      // Test 2: Health check
      try {
        const healthResponse = await Promise.race([
          fetch(`${resolvedUrl}/health`, { method: 'GET' }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        
        tests.healthCheck = {
          status: healthResponse.ok ? 'success' : 'warning',
          message: `Health check returned ${healthResponse.status}`,
          data: { status: healthResponse.status, url: `${resolvedUrl}/health` }
        };
      } catch (err) {
        tests.healthCheck = {
          status: 'error',
          message: `Health check failed: ${err.message}`,
          data: err.message
        };
      }

      // Test 3: Companies endpoint with auth
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const companiesResponse = await Promise.race([
            fetch(`${resolvedUrl}/companies`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
          ]);

          if (companiesResponse.ok) {
            const responseText = await companiesResponse.text();
            try {
              const data = JSON.parse(responseText);
              tests.companiesAuth = {
                status: 'success',
                message: `Companies endpoint returned ${data.length || 0} companies`,
                data: { status: companiesResponse.status, count: data.length, headers: Object.fromEntries(companiesResponse.headers.entries()) }
              };
            } catch (parseErr) {
              tests.companiesAuth = {
                status: 'error',
                message: `Got 200 but response is not JSON. Likely reverse proxy is serving index.html instead of proxying to backend.`,
                data: { 
                  status: companiesResponse.status, 
                  responsePreview: responseText.substring(0, 200),
                  contentType: companiesResponse.headers.get('content-type')
                }
              };
            }
          } else {
            const responseText = await companiesResponse.text();
            tests.companiesAuth = {
              status: 'error',
              message: `Companies endpoint returned ${companiesResponse.status}`,
              data: { 
                status: companiesResponse.status,
                responsePreview: responseText.substring(0, 200),
                contentType: companiesResponse.headers.get('content-type')
              }
            };
          }
        } catch (err) {
          tests.companiesAuth = {
            status: 'error',
            message: `Companies request failed: ${err.message}`,
            data: err.message
          };
        }
      } else {
        tests.companiesAuth = {
          status: 'warning',
          message: 'No token found - skipping authenticated test',
          data: 'No token'
        };
      }

      // Test 4: Companies without auth (should fail with 401)
      try {
        const companiesResponse = await Promise.race([
          fetch(`${resolvedUrl}/companies`),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);

        tests.companiesNoAuth = {
          status: companiesResponse.status === 401 ? 'success' : 'warning',
          message: `Companies without auth returned ${companiesResponse.status} (expected 401)`,
          data: { status: companiesResponse.status }
        };
      } catch (err) {
        tests.companiesNoAuth = {
          status: 'error',
          message: `Request failed: ${err.message}`,
          data: err.message
        };
      }

      // Test 5: CORS headers
      try {
        const corsResponse = await Promise.race([
          fetch(`${resolvedUrl}/health`),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);

        const corsHeaders = {
          'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin') || 'Not set',
          'Access-Control-Allow-Credentials': corsResponse.headers.get('Access-Control-Allow-Credentials') || 'Not set',
          'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods') || 'Not set',
        };

        tests.cors = {
          status: corsResponse.headers.has('Access-Control-Allow-Origin') ? 'success' : 'warning',
          message: 'CORS headers checked',
          data: corsHeaders
        };
      } catch (err) {
        tests.cors = {
          status: 'error',
          message: `CORS check failed: ${err.message}`,
          data: err.message
        };
      }
    } catch (err) {
      console.error('Diagnostic error:', err);
    }

    setResults(tests);
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'border-l-4 border-green-500 bg-green-50';
      case 'error':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'warning':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      default:
        return 'border-l-4 border-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="min-h-screen gradient-bg p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-2xl p-6 sm:p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              🔍 API Diagnostic
            </h1>
            <button
              onClick={() => runDiagnostics(apiUrl)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>API URL:</strong> <code className="bg-white px-2 py-1 rounded font-mono text-xs">{apiUrl}</code>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Token:</strong> {localStorage.getItem('token') ? '✅ Found' : '❌ Not found'}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Domain:</strong> {window.location.hostname}
            </p>
          </div>

          <div className="space-y-3">
            {Object.entries(results).map(([key, result]) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-lg ${getStatusColor(result.status)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getStatusIcon(result.status)}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </h3>
                    <p className="text-sm text-gray-700 mt-1">{result.message}</p>
                    {result.data && (
                      <details className="mt-2 text-xs">
                        <summary className="cursor-pointer font-mono text-gray-600 hover:text-gray-900">
                          View Details
                        </summary>
                        <pre className="mt-2 bg-white p-2 rounded overflow-auto max-h-32 border border-gray-200 text-gray-700">
                          {typeof result.data === 'string' 
                            ? result.data 
                            : JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Troubleshooting</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li><strong>companiesAuth error:</strong> Check if backend is running and reverse proxy is configured</li>
              <li><strong>All requests failing:</strong> Verify backend is accessible at the API URL shown above</li>
              <li><strong>401 errors:</strong> Token might be expired - try logging in again</li>
              <li><strong>CORS warnings:</strong> Backend needs proper CORS headers configured</li>
            </ul>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              Clear & Login
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
