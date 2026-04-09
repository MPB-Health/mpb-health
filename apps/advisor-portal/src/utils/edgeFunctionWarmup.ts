import { supabase } from '@mpbhealth/database';

const WARMUP_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes
const WARMUP_FUNCTIONS = ['ticket-proxy', 'chat-service'] as const;

let warmupTimer: ReturnType<typeof setInterval> | null = null;

async function pingFunction(fnName: string) {
  try {
    await supabase.functions.invoke(fnName, {
      method: 'POST',
      body: { action: 'ping' },
    });
  } catch {
    // Warmup pings are best-effort; failures are expected when unauthenticated
  }
}

function runWarmup() {
  for (const fn of WARMUP_FUNCTIONS) {
    pingFunction(fn);
  }
}

/**
 * Start periodic Edge Function warmup. Call once after the user has
 * authenticated so subsequent navigations to Tickets / Chat avoid cold starts.
 */
export function startEdgeFunctionWarmup() {
  if (warmupTimer) return;
  runWarmup();
  warmupTimer = setInterval(runWarmup, WARMUP_INTERVAL_MS);
}

export function stopEdgeFunctionWarmup() {
  if (warmupTimer) {
    clearInterval(warmupTimer);
    warmupTimer = null;
  }
}
