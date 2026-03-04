import { supabase } from '@mpbhealth/database';

export interface EdgeFunctionStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  lastPing: string | null;
  latencyMs: number | null;
}

export interface SystemHealthSummary {
  edgeFunctions: EdgeFunctionStatus[];
  database: {
    connected: boolean;
    activeConnections: number | null;
  };
  storage: {
    bucketCount: number;
  };
  recentErrors: { message: string; timestamp: string; source: string }[];
}

const EDGE_FUNCTIONS_TO_MONITOR = [
  'ticket-proxy',
  'chat-service',
  'push-service',
  'notification-service',
  'send-crm-email-v2',
  'portal-sso',
  'admin-update-password',
  'create-user',
];

export class SystemHealthService {
  async getHealthSummary(): Promise<SystemHealthSummary> {
    const [edgeFunctions, database, storage] = await Promise.all([
      this.pingEdgeFunctions(),
      this.checkDatabase(),
      this.checkStorage(),
    ]);

    return {
      edgeFunctions,
      database,
      storage,
      recentErrors: [],
    };
  }

  private async pingEdgeFunctions(): Promise<EdgeFunctionStatus[]> {
    const results = await Promise.allSettled(
      EDGE_FUNCTIONS_TO_MONITOR.map(async (name) => {
        const start = performance.now();
        try {
          const { error } = await supabase.functions.invoke(name, {
            body: { action: 'ping' },
          });
          const latencyMs = Math.round(performance.now() - start);
          return {
            name,
            status: error ? ('degraded' as const) : ('healthy' as const),
            lastPing: new Date().toISOString(),
            latencyMs,
          };
        } catch {
          return {
            name,
            status: 'down' as const,
            lastPing: new Date().toISOString(),
            latencyMs: Math.round(performance.now() - start),
          };
        }
      })
    );

    return results.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : { name: EDGE_FUNCTIONS_TO_MONITOR[i], status: 'unknown' as const, lastPing: null, latencyMs: null }
    );
  }

  private async checkDatabase(): Promise<{ connected: boolean; activeConnections: number | null }> {
    try {
      const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
      return { connected: !error, activeConnections: null };
    } catch {
      return { connected: false, activeConnections: null };
    }
  }

  private async checkStorage(): Promise<{ bucketCount: number }> {
    try {
      const { data } = await supabase.storage.listBuckets();
      return { bucketCount: data?.length || 0 };
    } catch {
      return { bucketCount: 0 };
    }
  }
}

export const systemHealthService = new SystemHealthService();
