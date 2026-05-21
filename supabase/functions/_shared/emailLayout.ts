/**
 * Shared email layout for all MPB Health transactional emails.
 *
 * Every edge function that sends email should import `wrapEmailLayout` and
 * pass in the per-email body HTML. The layout provides a consistent header
 * (logo + app badge), footer (portal link, support, copyright), and modern
 * responsive design across all portals.
 */

const LOGO_URL = "https://mpb.health/assets/MPB-Health-No-background.png";
const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
const CURRENT_YEAR = new Date().getFullYear();

export interface EmailLayoutOptions {
  /** Display name shown as a badge beneath the logo, e.g. "Advisor Portal" */
  appName: string;
  /** Primary accent color for the badge and CTA buttons (hex). Default "#2563eb" */
  accentColor?: string;
  /** Main heading text displayed prominently below the header */
  heading: string;
  /** Hidden preheader text shown in inbox previews */
  preheader?: string;
  /** Absolute URL to the portal — used in the footer "Go to Portal" link */
  portalUrl: string;
  /** Support email shown in the footer. Default "support@mpb.health" */
  supportEmail?: string;
  /** If true, hide the logo (useful for minimal emails) */
  hideLogo?: boolean;
}

/**
 * Helper: generates an inline-styled CTA button for email bodies.
 * Import this in edge functions to avoid duplicating button markup.
 */
export function emailCta(
  href: string,
  label: string,
  color = "#2563eb",
): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px auto 0;">
  <tr>
    <td style="border-radius:8px;background-color:${color};">
      <a href="${href}" target="_blank" style="display:inline-block;padding:14px 36px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;letter-spacing:0.01em;border-radius:8px;">${label}</a>
    </td>
  </tr>
</table>`;
}

/**
 * Helper: generates a credentials info-card with a left accent border.
 */
export function emailInfoCard(
  rows: string,
  accentColor = "#2563eb",
): string {
  return `<div style="background-color:#f8fafc;border-left:4px solid ${accentColor};border-radius:0 8px 8px 0;padding:20px 24px;margin:24px 0;">
  ${rows}
</div>`;
}

/**
 * Helper: a single row inside an info card.
 */
export function emailInfoRow(label: string, value: string): string {
  return `<p style="margin:0 0 8px 0;color:#374151;font-size:14px;line-height:1.5;"><strong style="color:#111827;">${label}:</strong> ${value}</p>`;
}

/**
 * Helper: security / warning callout box.
 */
export function emailCallout(
  text: string,
  variant: "warning" | "success" | "info" = "warning",
): string {
  const styles = {
    warning: { bg: "#fefce8", border: "#fef08a", text: "#854d0e" },
    success: { bg: "#f0fdf4", border: "#86efac", text: "#166534" },
    info: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af" },
  };
  const s = styles[variant];
  return `<div style="background-color:${s.bg};border:1px solid ${s.border};padding:14px 16px;border-radius:8px;margin:20px 0;">
  <p style="margin:0;color:${s.text};font-size:13px;line-height:1.5;">${text}</p>
</div>`;
}

/**
 * Wraps per-email body HTML in the shared layout shell.
 */
export function wrapEmailLayout(
  options: EmailLayoutOptions,
  bodyHtml: string,
): string {
  const accent = options.accentColor || "#2563eb";
  const supportEmail = options.supportEmail || "support@mpb.health";
  const preheader = options.preheader || "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.heading}</title>
</head>
<body style="margin:0;padding:0;font-family:${FONT_STACK};background-color:#f4f5f7;-webkit-font-smoothing:antialiased;">
  ${preheader ? `<span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>` : ""}

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f5f7;padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

          <!-- Logo -->
          ${options.hideLogo ? "" : `<tr>
            <td style="padding:32px 40px 16px;text-align:center;">
              <img src="${LOGO_URL}" alt="MPB Health" width="140" style="display:block;margin:0 auto;max-width:140px;height:auto;" />
            </td>
          </tr>`}

          <!-- Divider + App Badge -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:#e5e7eb;"></div>
              <div style="text-align:center;padding:14px 0 4px;">
                <span style="display:inline-block;background-color:${accent}12;color:${accent};font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:5px 14px;border-radius:20px;border:1px solid ${accent}30;">${options.appName}</span>
              </div>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="padding:8px 40px 0;">
              <h1 style="color:#111827;font-size:22px;font-weight:600;margin:0;text-align:center;line-height:1.3;">${options.heading}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 40px 32px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:22px 40px;background-color:#f9fafb;border-top:1px solid #f3f4f6;border-radius:0 0 12px 12px;text-align:center;">
              <p style="color:#6b7280;margin:0 0 6px;font-size:12px;line-height:1.5;">
                MPB Health &middot; ${options.appName}
              </p>
              <p style="color:#9ca3af;margin:0 0 10px;font-size:11px;line-height:1.5;">
                <a href="${options.portalUrl}" style="color:#6b7280;text-decoration:underline;">Go to ${options.appName}</a>
                &nbsp;&bull;&nbsp;
                <a href="mailto:${supportEmail}" style="color:#6b7280;text-decoration:underline;">Contact Support</a>
              </p>
              <p style="color:#d1d5db;margin:0;font-size:11px;">
                &copy; ${CURRENT_YEAR} MPB Health, Inc. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
