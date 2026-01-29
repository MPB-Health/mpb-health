import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useZohoSalesIQ } from '../lib/zohoSalesIQ';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/button';

interface ErrorLog {
  id: string;
  error_type: string;
  error_message: string;
  widget_code: string;
  user_agent: string;
  url: string;
  network_details: any;
  created_at: string;
}

interface HealthCheck {
  id: string;
  status: string;
  is_loaded: boolean;
  is_ready: boolean;
  response_time_ms: number | null;
  checked_at: string;
}

export default function ZohoSalesIQDashboard() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const { getStatus, getDiagnostics, exportDiagnostics } = useZohoSalesIQ();

  useEffect(() => {
    loadData();
    loadDiagnostics();

    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [errorsResult, healthResult] = await Promise.all([
        supabase
          .from('zoho_salesiq_errors')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('zoho_salesiq_health_checks')
          .select('*')
          .order('checked_at', { ascending: false })
          .limit(20),
      ]);

      if (errorsResult.data) setErrors(errorsResult.data);
      if (healthResult.data) setHealthChecks(healthResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDiagnostics = async () => {
    const diag = await getDiagnostics();
    setDiagnostics(diag);
  };

  const currentStatus = getStatus();

  const errorsByType = errors.reduce((acc, error) => {
    acc[error.error_type] = (acc[error.error_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getStatusBadge = (status: string) => {
    const colors = {
      ready: 'bg-green-100 text-green-800',
      loading: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Zoho SalesIQ Dashboard</h1>
          <p className="mt-2 text-gray-600">Monitor widget status and troubleshoot issues</p>
        </div>

        {currentStatus.isDevelopment && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Development Environment Detected</strong>
                  <br />
                  Current domain: <code className="bg-yellow-100 px-2 py-1 rounded">{diagnostics?.environment?.hostname}</code>
                  <br />
                  {currentStatus.recommendation}
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStatus.hasError && currentStatus.errorDetails?.error_type === 'READY_TIMEOUT' && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Widget Timeout - Domain Not Whitelisted</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p className="mb-2">{currentStatus.errorDetails.error_message}</p>
                  <div className="bg-red-100 border border-red-200 rounded p-3 mt-3">
                    <p className="font-semibold mb-2">Steps to Fix:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Log into your Zoho SalesIQ dashboard</li>
                      <li>Navigate to Settings → Brands → Installation</li>
                      <li>Add <code className="bg-red-200 px-2 py-1 rounded font-mono text-xs">{diagnostics?.environment?.hostname}</code> to allowed domains</li>
                      <li>Save settings and refresh this page</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Status</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {currentStatus.isReady ? 'Ready' : currentStatus.isLoaded ? 'Loading' : 'Not Loaded'}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full ${currentStatus.isReady ? 'bg-green-100' : 'bg-yellow-100'} flex items-center justify-center`}>
                {currentStatus.isReady ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-yellow-600 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Errors</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{errors.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Health Checks</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{healthChecks.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Has Errors</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {currentStatus.hasError ? 'Yes' : 'No'}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full ${currentStatus.hasError ? 'bg-red-100' : 'bg-green-100'} flex items-center justify-center`}>
                {currentStatus.hasError ? (
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Diagnostics</h2>
            {diagnostics ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Widget Status</h3>
                  <div className="bg-gray-50 rounded p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Script Exists:</span>
                      <span className={diagnostics.widget.scriptExists ? 'text-green-600' : 'text-red-600'}>
                        {diagnostics.widget.scriptExists ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">$zoho Object:</span>
                      <span className={diagnostics.widget.$zohoExists ? 'text-green-600' : 'text-red-600'}>
                        {diagnostics.widget.$zohoExists ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">SalesIQ Object:</span>
                      <span className={diagnostics.widget.salesiqExists ? 'text-green-600' : 'text-red-600'}>
                        {diagnostics.widget.salesiqExists ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Network Test</h3>
                  <div className="bg-gray-50 rounded p-3 space-y-1 text-sm">
                    {diagnostics.networkTest.success ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="text-green-600">{diagnostics.networkTest.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Response Time:</span>
                          <span className="text-gray-900">{diagnostics.networkTest.responseTime}ms</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-red-600">
                        Network test failed: {diagnostics.networkTest.error}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">CSP Configuration</h3>
                  <div className="bg-gray-50 rounded p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">CSP Exists:</span>
                      <span className={diagnostics.csp.exists ? 'text-green-600' : 'text-yellow-600'}>
                        {diagnostics.csp.exists ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {diagnostics.csp.exists && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Allows Zoho:</span>
                        <span className={diagnostics.csp.allowsZohoDomains ? 'text-green-600' : 'text-red-600'}>
                          {diagnostics.csp.allowsZohoDomains ? 'Yes' : 'No'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={exportDiagnostics}
                  className="w-full"
                >
                  Export Full Diagnostics Report
                </Button>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">Loading diagnostics...</div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Error Summary</h2>
            {Object.keys(errorsByType).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(errorsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-700">{type}</span>
                    <span className="px-3 py-1 text-sm font-semibold text-red-800 bg-red-100 rounded-full">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No errors recorded</p>
              </div>
            )}
          </Card>
        </div>

        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Errors</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {errors.slice(0, 10).map((error) => (
                  <tr key={error.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(error.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                        {error.error_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                      {error.error_message}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {error.url}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {errors.length === 0 && (
              <div className="text-center py-8 text-gray-500">No errors recorded</div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Health Checks</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ready
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {healthChecks.map((check) => (
                  <tr key={check.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(check.checked_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(check.status)}`}>
                        {check.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {check.is_loaded ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-red-600">✗</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {check.is_ready ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-red-600">✗</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {check.response_time_ms ? `${check.response_time_ms}ms` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {healthChecks.length === 0 && (
              <div className="text-center py-8 text-gray-500">No health checks recorded</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
