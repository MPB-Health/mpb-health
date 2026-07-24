# Staff Hub Chrome rollout (work computers)

Staff Hub stays a live web app at **https://staff.mpb.health** (also **https://portal.mpb.health**). Company machines should open that URL on Chrome start and can optionally get a thin companion extension. Do not rewrite the portal into an extension.

## 1. Managed Chrome startup (recommended)

Requires Chrome Browser Cloud Management (Google Admin) or equivalent MDM Chrome policies.

### Google Admin

1. Admin console → **Devices** → **Chrome** → **Settings** → **Users & browsers** (or **Managed browsers**).
2. Select the org unit for staff workstations.
3. Under **Startup**:
   - **On startup**: Open a specific page or set of pages
   - **URLs to open on startup**:  
     `https://staff.mpb.health`
4. Optional homepage:
   - **Homepage**: `https://staff.mpb.health`
   - **Show Home button**: Enable

### Equivalent policy names (JSON / Windows)

```json
{
  "RestoreOnStartup": 4,
  "RestoreOnStartupURLs": ["https://staff.mpb.health"],
  "HomepageLocation": "https://staff.mpb.health",
  "HomepageIsNewTabPage": false,
  "ShowHomeButton": true
}
```

`RestoreOnStartup = 4` means “Open a list of URLs.”

### Notes

- Enrolled / managed Chrome only. Personal unmanaged browsers are unaffected.
- Use `https://portal.mpb.health` instead (or in addition) if that is the primary staff hostname in your environment.
- SSO still happens in the normal Staff Hub login flow.

## 2. Installable app (PWA)

Staff can install Staff Hub as a standalone window:

- After login, Staff Hub shows an **Install Staff Hub** modal (dismissible for 14 days).
- Sidebar → **Install app** reopens the prompt.
- Chromium uses the native install dialog when available.
- Safari / iOS shows Add to Dock / Home Screen steps.

Install criteria (already shipped in the app):

- `manifest.json` with 192 / 512 PNG icons
- Service worker at `/sw.js` (production only)
- HTTPS

## 3. Thin Chrome extension (force-install companion)

Package: `apps/staff-hub-extension/`

What it does:

- Toolbar icon opens `https://staff.mpb.health` in a tab
- Side panel shows quick links (Open / Attendance / Time Off). The live site is **not** iframed (Staff Hub sets `frame-ancestors 'none'` for security).

What it does **not** do:

- Duplicate clock-in, auth, or HR UI
- Cache PHI offline

### Build a zip for IT

```bash
cd apps/staff-hub-extension
./scripts/pack.sh
# → dist/staff-hub-extension.zip
```

### Load unpacked (pilot)

1. `chrome://extensions` → Developer mode
2. Load unpacked → select `apps/staff-hub-extension`
3. Pin the extension; click to open Staff Hub

### Force-install (Google Admin)

1. Publish privately to Chrome Web Store (or host an update XML for enterprise self-hosting).
2. Note the extension ID.
3. Admin console → **Devices** → **Chrome** → **Apps & extensions**
4. Add the extension → **Force install** for the staff OU
5. Optional: pin to toolbar

Policy sketch:

```json
{
  "ExtensionSettings": {
    "EXTENSION_ID_HERE": {
      "installation_mode": "force_installed",
      "toolbar_pin": "force_pinned",
      "update_url": "https://clients2.google.com/service/update2/crx"
    }
  }
}
```

## 4. Suggested roll-out order

1. Enable managed startup URL for a pilot OU
2. Confirm Staff Hub PWA install modal on login
3. Pilot the extension with IT / HR
4. Force-install extension org-wide if desired

## Support

- App repo: `apps/staff-hub`
- Extension repo folder: `apps/staff-hub-extension`
- Product surface: clock-in, portals, time off, notes, tasks
