'use client';

import { useState } from 'react';

export default function TestDbPage() {
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    hasReminderColumn?: boolean;
    error?: string;
    details?: string;
    testData?: any[];
    columnError?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const testDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ success: false, message: 'Failed to test database', error: 'Failed to test database', details: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Database Test
        </h1>

        <button
          onClick={testDatabase}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-8"
        >
          {loading ? 'Testing...' : 'Test Database Connection'}
        </button>

        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Test Results
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Response:</h3>
                <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>

              {result.success && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Database Connection:</strong> ✅ Working</p>
                     <p><strong>Reminder Columns:</strong> {result.hasReminderColumn ? '✅ Exist' : '❌ Missing'}</p>
                  </div>
                  <div>
                    <p><strong>Test Data:</strong> {result.testData?.length || 0} records</p>
                    <p><strong>Column Error:</strong> {result.columnError}</p>
                  </div>
                </div>
              )}

              {result.error && (
                <div className="p-4 bg-red-100 border border-red-400 rounded-lg">
                  <p className="text-red-800"><strong>Error:</strong> {result.error}</p>
                  {result.details && <p className="text-red-700"><strong>Details:</strong> {result.details}</p>}
                  {result.code && <p className="text-red-700"><strong>Code:</strong> {result.code}</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
