# Lead Notification Sound Assets

This directory contains audio and image assets for the lead notification system.

## Required Files

### `new-lead.mp3`
A short notification chime (1-2 seconds) that plays when a high-priority or critical lead is received.

**Recommended specs:**
- Duration: 1-2 seconds
- Format: MP3, 128kbps or higher
- Style: Pleasant, professional chime or bell sound
- Volume: Moderate (the code sets volume to 0.4)

**Where to get sounds:**
1. [Mixkit](https://mixkit.co/free-sound-effects/notification/) - Free notification sounds
2. [Freesound](https://freesound.org/) - Creative Commons sounds
3. [Zapsplat](https://www.zapsplat.com/) - Free with attribution

### `lead-icon.svg` / `lead-icon.png`
The icon shown in desktop notifications.

**Specs:**
- Size: 64x64 pixels (PNG) or scalable (SVG)
- Style: Bell/notification icon with MPB brand colors
- The SVG version is included and ready to use

## Sound Behavior

- **Critical Priority Leads**: Sound always plays
- **High Priority Leads**: Sound always plays  
- **Normal Priority Leads**: No sound (toast only)
- **Volume**: Set to 40% in code

## Adding the Sound File

1. Download or create an appropriate notification sound
2. Name it `new-lead.mp3`
3. Place it in this directory (`/public/sounds/`)
4. The notification system will automatically use it

## Temporary Solution

Until you add a sound file, the notification will fail silently (no error shown to users).
You can test with any short MP3 file renamed to `new-lead.mp3`.

