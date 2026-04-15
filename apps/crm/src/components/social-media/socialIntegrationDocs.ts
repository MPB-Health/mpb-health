/** Official entry points for wiring OAuth and Marketing APIs (no secrets in the repo). */

export const SOCIAL_API_DOC_URLS: Record<
  'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok',
  { title: string; docsUrl: string; oauthNotes: string }
> = {
  linkedin: {
    title: 'LinkedIn Marketing / Community',
    docsUrl: 'https://learn.microsoft.com/en-us/linkedin/marketing/',
    oauthNotes:
      'Use Marketing API + OAuth 2.0 (three-legged). Store client id/secret in Supabase secrets; exchange codes in an Edge Function; persist tokens server-side only.',
  },
  facebook: {
    title: 'Meta Marketing API (Facebook)',
    docsUrl: 'https://developers.facebook.com/docs/marketing-apis',
    oauthNotes:
      'Use Meta Business portfolio + System User or Marketing API with OAuth. Map ad account IDs into connection metadata from this screen.',
  },
  instagram: {
    title: 'Instagram Marketing API',
    docsUrl: 'https://developers.facebook.com/docs/instagram-api/',
    oauthNotes: 'IG User is linked to a Facebook Page. Reuses Meta OAuth; store IG business account id in metadata.',
  },
  twitter: {
    title: 'X Ads API',
    docsUrl: 'https://developer.x.com/en/docs/x-ads-api',
    oauthNotes: 'Use X developer project with Ads API access; OAuth 2.0 PKCE recommended for user context.',
  },
  tiktok: {
    title: 'TikTok Marketing API',
    docsUrl: 'https://business-api.tiktok.com/portal/docs',
    oauthNotes: 'Register a TikTok for Business developer app; use Marketing API auth flow in a secure Edge Function.',
  },
};
