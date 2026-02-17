import { useEffect, useState } from 'react';
import { createClientLogger } from '@mpbhealth/utils';
import { zohoSalesIQManager, ZohoSalesIQStatus, ZohoSalesIQError } from '../lib/zohoSalesIQ';

const log = createClientLogger('ZohoSalesIQ');

export function ZohoSalesIQMonitor() {
  const [status, setStatus] = useState<ZohoSalesIQStatus | null>(null);
  const [, setErrors] = useState<ZohoSalesIQError[]>([]);

  // Hide monitor UI in production - only show in development
  const isDevelopment = import.meta.env.DEV;

  useEffect(() => {
    // Skip all monitoring in production
    if (!isDevelopment) return;

    const updateStatus = () => {
      const currentStatus = zohoSalesIQManager.getStatus();
      setStatus(currentStatus);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);

    zohoSalesIQManager.onError((error) => {
      setErrors((prev) => [...prev, error]);
    });

    return () => clearInterval(interval);
  }, [isDevelopment]);

  // Never render anything in production
  if (!isDevelopment) return null;
  if (!status) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-md">
      {status.hasError && status.errorDetails?.error_type === 'READY_TIMEOUT' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Chat Widget Blocked - Domain Not Whitelisted
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p className="mb-2">
                  {status.isDevelopment
                    ? 'The chat widget cannot initialize on development domains unless whitelisted in Zoho SalesIQ.'
                    : 'This domain is not whitelisted in your Zoho SalesIQ settings.'
                  }
                </p>
                {status.recommendation && (
                  <p className="text-xs bg-red-100 p-2 rounded mt-2">
                    {status.recommendation}
                  </p>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={async () => {
                    const diagnostics = await zohoSalesIQManager.exportDiagnosticsReport();
                    log.info('Diagnostics:', diagnostics);
                  }}
                  className="text-xs font-medium text-red-800 hover:text-red-900 underline"
                >
                  Export Report
                </button>
                <a
                  href="/admin/zoho-salesiq"
                  className="text-xs font-medium text-red-800 hover:text-red-900 underline"
                >
                  View Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {status.hasError && status.errorDetails?.error_type !== 'READY_TIMEOUT' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Zoho SalesIQ Widget Issue
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{status.errorDetails?.error_message}</p>
                <p className="mt-1 text-xs text-red-600">
                  Error Type: {status.errorDetails?.error_type}
                </p>
              </div>
              <div className="mt-3">
                <button
                  onClick={async () => {
                    const diagnostics = await zohoSalesIQManager.exportDiagnosticsReport();
                    log.info('Diagnostics:', diagnostics);
                  }}
                  className="text-sm font-medium text-red-800 hover:text-red-900 underline"
                >
                  Export Diagnostics Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!status.hasError && !status.isReady && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Loading Zoho SalesIQ Widget...
              </h3>
              <p className="mt-1 text-xs text-yellow-700">
                Chat support will be available shortly
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
