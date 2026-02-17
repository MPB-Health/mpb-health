/**
 * Shared Svix webhook signature verification for Resend webhooks.
 *
 * Resend uses Svix to sign webhook payloads. Every request includes three
 * headers: svix-id, svix-timestamp, and svix-signature. This module verifies
 * those headers against a webhook signing secret (RESEND_WEBHOOK_SECRET).
 *
 * Usage:
 *   import { verifySvixSignature } from '../_shared/svix.ts';
 *   await verifySvixSignature(secret, svixId, svixTimestamp, svixSignature, rawBody);
 */

/** Maximum age of a webhook timestamp before it's rejected (5 minutes). */
const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

function base64Decode(input: string): Uint8Array {
  const binaryStr = atob(input);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

function base64Encode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

/**
 * Verify a Svix webhook signature.
 *
 * @param secret         The webhook signing secret (with or without "whsec_" prefix).
 * @param svixId         The `svix-id` request header.
 * @param svixTimestamp  The `svix-timestamp` request header.
 * @param svixSignature  The `svix-signature` request header.
 * @param body           The raw request body as a string.
 * @throws {Error}       If the signature is invalid or the timestamp is stale.
 */
export async function verifySvixSignature(
  secret: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  body: string,
): Promise<void> {
  // Validate timestamp to prevent replay attacks
  const timestampSeconds = parseInt(svixTimestamp, 10);
  if (isNaN(timestampSeconds)) {
    throw new Error('Invalid svix-timestamp header');
  }
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestampSeconds) > WEBHOOK_TOLERANCE_SECONDS) {
    throw new Error('Webhook timestamp is too old or too far in the future');
  }

  // Strip the "whsec_" prefix if present, then base64-decode the secret
  const secretBase64 = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  const secretBytes = base64Decode(secretBase64);

  // Construct the signed content: "{svix-id}.{svix-timestamp}.{body}"
  const signedContent = `${svixId}.${svixTimestamp}.${body}`;
  const encoder = new TextEncoder();

  // Import the secret as an HMAC-SHA256 key
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  // Compute the expected signature
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedContent));
  const expectedSignature = base64Encode(signatureBuffer);

  // The svix-signature header may contain multiple space-delimited signatures
  // Each is prefixed with a version (e.g. "v1,<base64>")
  const signatures = svixSignature.split(' ');
  for (const sig of signatures) {
    const [version, value] = sig.split(',', 2);
    if (version === 'v1' && value && timingSafeEqual(expectedSignature, value)) {
      return; // Signature is valid
    }
  }

  throw new Error('No matching webhook signature found');
}
