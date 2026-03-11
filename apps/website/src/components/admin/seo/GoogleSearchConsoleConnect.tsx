import React, { useState, useEffect } from 'react';
import {
  Link2,
  Unlink,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  Clock,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/button';
import {
  type GoogleCredentials,
  getGoogleAuthUrl,
  getConnectedSites,
  disconnectSite,
  formatSiteUrl,
  isGoogleApiConfigured,
} from '../../../lib/googleSearchConsoleService';
import { fullSync } from '../../../lib/seoDataService';

interface GoogleSearchConsoleConnectProps {
  onSiteSelect?: (siteUrl: string) => void;
  selectedSite?: string;
}

export const GoogleSearchConsoleConnect: React.FC<GoogleSearchConsoleConnectProps> = ({
  onSiteSelect,
  selectedSite,
}) => {
  const [connectedSites, setConnectedSites] = useState<GoogleCredentials[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConnectedSites();
  }, []);

  const loadConnectedSites = async () => {
    setLoading(true);
    try {
      const sites = await getConnectedSites();
      setConnectedSites(sites);

      // Auto-select first site if none selected
      if (sites.length > 0 && !selectedSite && onSiteSelect) {
        onSiteSelect(sites[0].site_url);
      }
    } catch (err) {
      console.error('Error loading connected sites:', err);
      setError('Failed to load connected sites');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    const authUrl = getGoogleAuthUrl();
    window.location.href = authUrl;
  };

  const handleDisconnect = async (siteUrl: string) => {
    if (!confirm(`Are you sure you want to disconnect ${formatSiteUrl(siteUrl)}?`)) {
      return;
    }

    try {
      await disconnectSite(siteUrl);
      setConnectedSites((prev) => prev.filter((s) => s.site_url !== siteUrl));

      if (selectedSite === siteUrl && onSiteSelect) {
        const remaining = connectedSites.filter((s) => s.site_url !== siteUrl);
        onSiteSelect(remaining.length > 0 ? remaining[0].site_url : '');
      }
    } catch (err) {
      console.error('Error disconnecting site:', err);
      setError('Failed to disconnect site');
    }
  };

  const handleSync = async (credentials: GoogleCredentials) => {
    setSyncing(credentials.site_url);
    setError(null);

    try {
      await fullSync(credentials, 28);
      await loadConnectedSites();
    } catch (err: unknown) {
      console.error('Error syncing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync data');
    } finally {
      setSyncing(null);
    }
  };

  const formatLastSync = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const isConfigured = isGoogleApiConfigured();

  if (!isConfigured) {
    return (
      <Card className="p-6 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-1">
              Google API Not Configured
            </h3>
            <p className="text-sm text-amber-700 mb-3">
              To connect Google Search Console, configure the following:
            </p>
            <p className="text-xs text-amber-800 font-semibold mb-1">Vercel environment variable:</p>
            <code className="block text-xs bg-amber-100 p-3 rounded text-amber-800 font-mono mb-2">
              VITE_GOOGLE_CLIENT_ID=your_client_id
              <br />
              VITE_GOOGLE_REDIRECT_URI=your_redirect_uri
            </code>
            <p className="text-xs text-amber-800 font-semibold mb-1">Supabase Edge Function secret (never in Vercel env):</p>
            <code className="block text-xs bg-amber-100 p-3 rounded text-amber-800 font-mono">
              supabase secrets set GOOGLE_CLIENT_SECRET=your_client_secret
            </code>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-sm text-amber-700 hover:text-amber-900"
            >
              Get API credentials from Google Cloud Console
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-neutral-600">Loading connection status...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-600 hover:text-red-800 mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img
              src="https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png"
              alt="Google"
              className="h-6 w-6"
            />
            <h3 className="font-semibold text-neutral-900">Google Search Console</h3>
          </div>
          <Button
            onClick={handleConnect}
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2"
          >
            <Link2 className="h-4 w-4" />
            Connect Site
          </Button>
        </div>

        {connectedSites.length === 0 ? (
          <div className="text-center py-8 bg-neutral-50 rounded-lg">
            <Link2 className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
            <p className="text-neutral-600 mb-2">No sites connected</p>
            <p className="text-sm text-neutral-500">
              Connect your Google Search Console to view SEO insights
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {connectedSites.map((site) => {
              const isSelected = selectedSite === site.site_url;
              const isSyncing = syncing === site.site_url;

              return (
                <div
                  key={site.id}
                  onClick={() => onSiteSelect?.(site.site_url)}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-neutral-200 bg-white hover:border-blue-200 hover:bg-blue-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          site.is_connected ? 'bg-green-100' : 'bg-red-100'
                        }`}
                      >
                        {site.is_connected ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">
                          {site.site_name || formatSiteUrl(site.site_url)}
                        </div>
                        <div className="text-sm text-neutral-500">{site.site_url}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {/* Sync status */}
                      <div className="text-right mr-2">
                        <div className="flex items-center gap-1 text-xs text-neutral-500">
                          <Clock className="h-3 w-3" />
                          Last sync: {formatLastSync(site.last_sync_at)}
                        </div>
                        {site.sync_status === 'error' && site.sync_error && (
                          <div className="text-xs text-red-600 truncate max-w-[150px]">
                            {site.sync_error}
                          </div>
                        )}
                      </div>

                      {/* Sync button */}
                      <Button
                        onClick={() => handleSync(site)}
                        variant="ghost"
                        size="sm"
                        disabled={isSyncing}
                        className="p-2"
                        title="Sync data"
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
                        />
                      </Button>

                      {/* Disconnect button */}
                      <Button
                        onClick={() => handleDisconnect(site.site_url)}
                        variant="ghost"
                        size="sm"
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Disconnect"
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

