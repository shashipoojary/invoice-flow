'use client';

import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/lib/supabase';

export default function LoadTestPage() {
  const { refreshInvoices } = useData();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [count, setCount] = useState(50);
  const [email, setEmail] = useState('');
  const [sendImmediately, setSendImmediately] = useState(true);

  const runLoadTest = async () => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    if (count < 1 || count > 100) {
      alert('Count must be between 1 and 100');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in first');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/test/load-test-invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          count,
          email,
          sendImmediately,
          bypassLimits: true, // For testing
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
        // Refresh invoices list
        if (refreshInvoices) {
          setTimeout(() => refreshInvoices(), 2000);
        }
      } else {
        alert(`Error: ${data.error || 'Unknown error'}`);
        setResults(data);
      }
    } catch (error) {
      console.error('Load test error:', error);
      alert(`Failed to run load test: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🧪 Load Test - Invoice Generation
          </h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Invoices (1-100)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="sendImmediately"
                checked={sendImmediately}
                onChange={(e) => setSendImmediately(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="sendImmediately" className="ml-2 text-sm text-gray-700">
                Send invoices immediately (tests async queue)
              </label>
            </div>

            <button
              onClick={runLoadTest}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Running Load Test...' : `Create ${count} Invoices`}
            </button>
          </div>

          {results && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h2 className="text-lg font-semibold mb-3">Results</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Requested:</span> {results.summary?.requested}
                </div>
                <div>
                  <span className="font-medium">Created:</span>{' '}
                  <span className="text-green-600">{results.summary?.created}</span>
                </div>
                {sendImmediately && (
                  <div>
                    <span className="font-medium">Sent:</span>{' '}
                    <span className="text-blue-600">{results.summary?.sent}</span>
                  </div>
                )}
                {results.summary?.failed > 0 && (
                  <div>
                    <span className="font-medium">Failed:</span>{' '}
                    <span className="text-red-600">{results.summary?.failed}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium">Duration:</span> {results.summary?.duration}
                </div>
                <div>
                  <span className="font-medium">Queue Enabled:</span>{' '}
                  {results.summary?.queueEnabled ? (
                    <span className="text-green-600">✅ Yes</span>
                  ) : (
                    <span className="text-yellow-600">⚠️ No (using sync mode)</span>
                  )}
                </div>
                {results.errors && results.errors.length > 0 && (
                  <div className="mt-3">
                    <span className="font-medium text-red-600">Errors:</span>
                    <ul className="list-disc list-inside mt-1 text-xs text-gray-600">
                      {results.errors.slice(0, 10).map((error: string, idx: number) => (
                        <li key={idx}>{error}</li>
                      ))}
                      {results.errors.length > 10 && (
                        <li>... and {results.errors.length - 10} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Warning:</strong> This is a test route. It will create real invoices in your database.
              Make sure you're testing in a development environment or have proper backups.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

