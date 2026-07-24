# MPB Staff Hub Chrome Extension

Thin MV3 companion for work computers. Opens the **live** Staff Hub site (`https://staff.mpb.health`). It does not reimplement clock-in or auth.

The side panel is a launcher (links), not an iframe. Staff Hub sets `frame-ancestors 'none'`, so embedding the full app in the extension is blocked on purpose.

## Load unpacked

1. Open `chrome://extensions`
2. Enable Developer mode
3. **Load unpacked** → this folder
4. Pin **MPB Staff Hub**

Click the toolbar icon to open Staff Hub in a new tab (and the side panel when available).

## Pack for IT

```bash
./scripts/pack.sh
```

Creates `dist/staff-hub-extension.zip`.

## Force-install

See [docs/staff-hub-chrome-rollout.md](../../docs/staff-hub-chrome-rollout.md).
