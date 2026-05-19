import { supabase, getResolvedAuthHeader, isSessionDead } from '@mpbhealth/database';

const WARMUP_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes

const WARMUP_FUNCTIONS = ['ticket-proxy', 'chat-service'] as const;

let warmupTimer: ReturnType<typeof setInterval> | null = null;

async function pingFunction(fnName: string, authHeader: { Authorization: string }) {
  try {
    await supabase.functions.invoke(fnName, {
      method: 'POST',
      body: { action: 'ping' },
      headers: authHeader,
    });
  } catch {
    // Warmup pings are best-effort; failures are expected when unauthenticated
  }
}

async function runWarmup() {
  if (isSessionDead()) return;
  // Resolve auth ONCE per round so all warmup pings share a fresh token,
  // and skip entirely when no auth is available — invoking unauthenticated
  // is just expensive noise that always 401s.
  const authHeader = await getResolvedAuthHeader();
  if (!authHeader) return;
  for (const fn of WARMUP_FUNCTIONS) {
    void pingFunction(fn, authHeader);
  }
}

/**
 * Start periodic Edge Function warmup. Call once after the user has
 * authenticated so subsequent navigations to Tickets / Chat avoid cold starts.
 */
export function startEdgeFunctionWarmup() {
  if (warmupTimer) return;
  void runWarmup();
  warmupTimer = setInterval(() => void runWarmup(), WARMUP_INTERVAL_MS);
}

export function stopEdgeFunctionWarmup() {
  if (warmupTimer) {
    clearInterval(warmupTimer);
    warmupTimer = null;
  }
}
