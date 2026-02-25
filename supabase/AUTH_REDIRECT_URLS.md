# Supabase Auth Redirect URLs

Password reset and magic link emails redirect users to the URL specified in `redirectTo`. If that URL is not in the allowed list, Supabase falls back to the Site URL (e.g. https://mpb.health), which can cause:
- Advisors landing on the wrong page
- `otp_expired` or `access_denied` errors

## Add These URLs in Supabase Dashboard

1. Go to **Supabase Dashboard** → your project → **Authentication** → **URL Configuration**
2. **Site URL**: Leave as your primary (e.g. `https://mpb.health` or `https://app.mpbhealth.com`)
3. **Redirect URLs** – add these (one per line):

```
https://advisor.mpbhealth.com/reset-password
https://advisor.mpbhealth.com/**
https://admin.mpb.health/reset-password
https://admin.mpb.health/**
https://crm.mpbhealth.com/reset-password
https://crm.mpbhealth.com/**
https://app.mpbhealth.com/reset-password
https://app.mpbhealth.com/**
https://mpb.health/reset-password
https://www.mpb.health/reset-password
```

4. **Save** the configuration.

## Wildcard vs Exact

- `https://advisor.mpbhealth.com/**` – allows any path on the advisor portal
- `https://advisor.mpbhealth.com/reset-password` – exact path only

Use both for full coverage. After adding, password reset links will redirect advisors to the correct portal.
