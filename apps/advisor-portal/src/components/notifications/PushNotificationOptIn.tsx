// ============================================================================
// Push Notification Opt-In — Subscribe/unsubscribe to browser push
// ============================================================================

import { useState } from 'react';
import {
  Bell,
  BellOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  Smartphone,
} from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export default function PushNotificationOptIn() {
  const {
    isSupported,
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <BellOff className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-th-text-primary">Push notifications not supported</p>
          <p className="text-xs text-th-text-muted mt-0.5">
            Your browser does not support push notifications. Try Chrome, Edge, or Firefox.
          </p>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-red-800">Push notifications blocked</p>
          <p className="text-xs text-red-600 mt-0.5">
            You have blocked notifications for this site. To enable them, update your browser&apos;s site permissions.
          </p>
        </div>
      </div>
    );
  }

  const handleToggle = async () => {
    setError(null);
    setActionLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update push subscription');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isSubscribed ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Smartphone className={`w-5 h-5 ${isSubscribed ? 'text-green-600' : 'text-gray-500'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-th-text-primary">
              {isSubscribed ? 'Push notifications enabled' : 'Enable push notifications'}
            </p>
            <p className="text-xs text-th-text-muted mt-0.5">
              {isSubscribed
                ? 'You will receive push notifications on this device'
                : 'Get notified about chat messages, tickets, and bulletins'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={actionLoading}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
            isSubscribed
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-th-accent-600 text-white hover:bg-th-accent-700'
          }`}
        >
          {actionLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isSubscribed ? (
            'Disable'
          ) : (
            'Enable'
          )}
        </button>
      </div>

      {isSubscribed && (
        <div className="flex items-center gap-2 text-xs text-green-600 pl-11">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>This device is registered for push notifications</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 pl-11">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
