# Supabase Auth Redirect URLs

Password reset and magic link emails redirect users to the URL specified in `redirectTo`. If that URL is not in the allowed list, Supabase falls back to the Site URL (e.g. https://mpb.health), which can cause:
- Advisors landing on the wrong page
- `otp_expired` or `access_denied` errors

## Add These URLs in Supabase Dashboard

1. Go to **Supabase Dashboard** → your project → **Authentication** → **URL Configuration**
2. **Site URL**: `https://mpb.health`
3. **Redirect URLs** – add these (one per line):

```
https://mpb.health/auth/confirm
https://mpb.health/reset-password
https://mpb.health/**
https://www.mpb.health/auth/confirm
https://www.mpb.health/reset-password
https://www.mpb.health/**
https://admin.mpb.health/reset-password
https://admin.mpb.health/**
https://advisor.mpb.health/**
https://crm.mpb.health/**
https://app.mpb.health/**
https://crm.mpbhealth.com/reset-password
https://crm.mpbhealth.com/**
https://app.mpbhealth.com/reset-password
https://app.mpbhealth.com/**
https://portal.mpb.health/**
```

4. **Save** the configuration.

## Email Template (CRITICAL)

To prevent email security scanners from consuming reset tokens, update the
password reset email template:

1. Go to **Authentication** → **Email Templates** → **Reset Password**
2. In the email body, find the reset button/link and change it from:

```html
<a href="{{ .ConfirmationURL }}">Reset Password</a>
```

To:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Reset Password</a>
```

### Why?

- `{{ .ConfirmationURL }}` points to Supabase's server endpoint. When an email
  scanner clicks this link, the single-use token is consumed before the member
  ever opens it → "Invalid Reset Link".
- The `token_hash` approach sends the user directly to our app. Scanners fetch
  the HTML but **do not execute JavaScript**. Only real browsers call
  `verifyOtp()`, so the token survives.

## How the Flow Works

```
Admin sends reset → Supabase sends email
  → Member clicks link → /auth/confirm?token_hash=...&type=recovery
  → JS executes verifyOtp() → session established
  → Redirect to /reset-password → member enters new password
```

## Wildcard vs Exact

- `https://mpb.health/**` – allows any path on the main site
- `https://mpb.health/auth/confirm` – exact path only

Use both for full coverage.
