// Email is sent server-side via the send-website-email Supabase Edge Function.
// VITE_RESEND_API_KEY must NOT be used here — the key lives only in Supabase secrets.
import { supabase } from './supabase';

export interface EmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  /** Optional label forwarded to the edge function for Resend log tagging */
  emailType?: string;
}

export interface EmailResponse {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(options: EmailOptions): Promise<EmailResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('send-website-email', {
      body: {
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        emailType: options.emailType,
      },
    });

    if (error) {
      console.error('send-website-email edge function error:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }

    return { success: data?.success ?? true, id: data?.id };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendNewsletterWelcomeEmail(email: string): Promise<EmailResponse> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to MPB Health Newsletter</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center;">
                    <img src="https://mpb.health/assets/MPB-Health-No-background.png" alt="MPB Health" style="max-width: 200px; height: auto;">
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <h1 style="color: #1e3a8a; font-size: 28px; margin: 0 0 20px 0; text-align: center;">Welcome to Our Newsletter!</h1>
                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Thank you for subscribing to the MPB Health newsletter. You've taken an important step toward staying informed about affordable healthcare solutions and wellness insights.</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Here's what you can expect from us:</p>
                    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
                      <li>Expert healthcare tips and wellness advice</li>
                      <li>Updates on our health sharing programs</li>
                      <li>Money-saving insights for your healthcare needs</li>
                      <li>Community stories and member experiences</li>
                    </ul>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://mpb.health/blog" style="display: inline-block; background: linear-gradient(to right, #2563eb, #06b6d4); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">Read Our Latest Articles</a>
                    </div>
                    <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">Questions? Contact us at <a href="mailto:info@mympb.com" style="color: #2563eb;">info@mympb.com</a> or call <a href="tel:8558164650" style="color: #2563eb;">(855) 816-4650</a></p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="color: #999; font-size: 12px; margin: 0 0 10px 0;">You're receiving this email because you subscribed to the MPB Health newsletter.</p>
                    <p style="color: #999; font-size: 12px; margin: 0;">
                      <a href="https://mpb.health/unsubscribe?email=${encodeURIComponent(email)}" style="color: #666; text-decoration: underline;">Unsubscribe</a> |
                      <a href="https://mpb.health/privacy-policy" style="color: #666; text-decoration: underline;">Privacy Policy</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to MPB Health Newsletter!',
    html,
    text: `Welcome to MPB Health Newsletter!\n\nThank you for subscribing. You'll receive expert healthcare tips, wellness advice, and updates on our health sharing programs.\n\nVisit our blog: https://mpb.health/blog\n\nQuestions? Contact us at info@mympb.com or call (855) 816-4650`
  });
}

export async function sendContactFormNotification(data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
  source: string;
  referralSource?: string;
}): Promise<EmailResponse> {
  // Map referral source values to human-readable labels
  const referralSourceLabels: Record<string, string> = {
    search_engine: 'Search Engine (e.g. Google, Bing)',
    word_of_mouth: 'Word of mouth',
    social_media: 'Social Media',
    referral_program: 'Referral program (Through a referral link or Healthcare Agent)',
    blog_or_article: 'Blog or online article',
    print_media: 'Print media',
    event_or_tradeshow: 'Event or tradeshow',
    other: 'Other'
  };
  const referralLabel = data.referralSource ? referralSourceLabels[data.referralSource] || data.referralSource : null;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Contact Form Submission</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e3a8a; margin-bottom: 20px;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 0; font-weight: bold; color: #333;">Name:</td>
              <td style="padding: 12px 0; color: #666;">${data.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 0; font-weight: bold; color: #333;">Email:</td>
              <td style="padding: 12px 0; color: #666;"><a href="mailto:${data.email}" style="color: #2563eb;">${data.email}</a></td>
            </tr>
            ${data.phone ? `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 0; font-weight: bold; color: #333;">Phone:</td>
              <td style="padding: 12px 0; color: #666;"><a href="tel:${data.phone}" style="color: #2563eb;">${data.phone}</a></td>
            </tr>` : ''}
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 0; font-weight: bold; color: #333;">Source:</td>
              <td style="padding: 12px 0; color: #666;">${data.source}</td>
            </tr>
            ${referralLabel ? `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 0; font-weight: bold; color: #333;">How they heard about us:</td>
              <td style="padding: 12px 0; color: #666;">${referralLabel}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 12px 0; font-weight: bold; color: #333; vertical-align: top;">Message:</td>
              <td style="padding: 12px 0; color: #666;">${data.message.replace(/\n/g, '<br>')}</td>
            </tr>
          </table>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #999; font-size: 12px;">
            This email was sent from the MPB Health website contact form.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: 'info@mympb.com',
    subject: `New Contact Form: ${data.name}`,
    html,
    replyTo: data.email,
    text: `New Contact Form Submission\n\nName: ${data.name}\nEmail: ${data.email}\n${data.phone ? `Phone: ${data.phone}\n` : ''}Source: ${data.source}\n${referralLabel ? `How they heard about us: ${referralLabel}\n` : ''}\nMessage:\n${data.message}`
  });
}

export async function sendLeadNotification(data: {
  name?: string;
  email: string;
  phone?: string;
  householdType?: string;
  estimatedCost?: number;
  source: string;
}): Promise<EmailResponse> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Lead Generated</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px;">
          <h2 style="color: #059669; margin-bottom: 20px;">🎯 New Lead Generated</h2>
          <table style="width: 100%; border-collapse: collapse;">
            ${data.name ? `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 0; font-weight: bold; color: #333;">Name:</td>
              <td style="padding: 12px 0; color: #666;">${data.name}</td>
            </tr>` : ''}
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 0; font-weight: bold; color: #333;">Email:</td>
              <td style="padding: 12px 0; color: #666;"><a href="mailto:${data.email}" style="color: #2563eb;">${data.email}</a></td>
            </tr>
            ${data.phone ? `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 0; font-weight: bold; color: #333;">Phone:</td>
              <td style="padding: 12px 0; color: #666;"><a href="tel:${data.phone}" style="color: #2563eb;">${data.phone}</a></td>
            </tr>` : ''}
            ${data.householdType ? `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 0; font-weight: bold; color: #333;">Household:</td>
              <td style="padding: 12px 0; color: #666;">${data.householdType}</td>
            </tr>` : ''}
            ${data.estimatedCost ? `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 0; font-weight: bold; color: #333;">Estimated Cost:</td>
              <td style="padding: 12px 0; color: #666;">$${data.estimatedCost}/month</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 12px 0; font-weight: bold; color: #333;">Source:</td>
              <td style="padding: 12px 0; color: #666;">${data.source}</td>
            </tr>
          </table>
          <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #059669; border-radius: 4px;">
            <p style="margin: 0; color: #065f46; font-weight: bold;">Follow up promptly for best conversion!</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: 'info@mympb.com',
    subject: `🎯 New Lead: ${data.name || data.email}`,
    html,
    replyTo: data.email,
    text: `New Lead Generated\n\n${data.name ? `Name: ${data.name}\n` : ''}Email: ${data.email}\n${data.phone ? `Phone: ${data.phone}\n` : ''}${data.householdType ? `Household: ${data.householdType}\n` : ''}${data.estimatedCost ? `Estimated Cost: $${data.estimatedCost}/month\n` : ''}Source: ${data.source}`
  });
}

const QUOTE_PHONE_TEL = 'tel:+18005192969,1';
const QUOTE_PHONE_DISPLAY = '1-800-519-2969';

function fmtMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export interface LeadWelcomeEmailPlanData {
  all_plan_rates?: Record<string, { planLabel: string; lowestPrice: number; highestPrice?: number; flatRate?: number }>;
  traditional_cost_estimate?: number;
  best_match_plan?: string | null;
  best_match_percentage?: number;
}

export async function sendLeadWelcomeEmail(data: {
  firstName: string;
  email: string;
  planData?: LeadWelcomeEmailPlanData;
}): Promise<EmailResponse> {
  const welcomePageUrl = `https://mpb.health/welcome?name=${encodeURIComponent(data.firstName)}`;
  const resultsUrl = 'https://mpb.health/quote/results';
  const videoUrl = 'https://vimeo.com/1115561411';

  const planData = data.planData;
  const hasPlanData = planData?.all_plan_rates && Object.keys(planData.all_plan_rates).length > 0;

  // Build personalized pricing section
  let pricingHtml = '';
  let pricingText = '';
  if (hasPlanData && planData.all_plan_rates) {
    const plans = Object.entries(planData.all_plan_rates);
    const minPrice = Math.min(...plans.map(([, p]) => p.flatRate ?? p.lowestPrice));
    const maxPrice = Math.max(...plans.map(([, p]) => p.highestPrice ?? p.flatRate ?? p.lowestPrice));
    pricingHtml = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; margin: 0 0 24px 0;">
        <tr>
          <td style="padding: 20px 24px;">
            <p style="color: #0c4a6e; font-size: 15px; line-height: 1.6; margin: 0;">
              <strong style="color: #0f172a;">Your personalized rates</strong> — Plans start at <strong style="color: #0369a1;">${fmtMoney(minPrice)}/mo</strong>${maxPrice > minPrice ? ` and go up to <strong style="color: #0369a1;">${fmtMoney(maxPrice)}/mo</strong>` : ''} based on your household and preferences.
              ${planData.traditional_cost_estimate ? ` Traditional insurance averages <strong>${fmtMoney(planData.traditional_cost_estimate)}/mo</strong> for similar coverage.` : ''}
            </p>
          </td>
        </tr>
      </table>`;
    pricingText = `Your personalized rates: Plans start at ${fmtMoney(minPrice)}/mo${maxPrice > minPrice ? ` up to ${fmtMoney(maxPrice)}/mo` : ''}.${planData.traditional_cost_estimate ? ` Traditional insurance averages ${fmtMoney(planData.traditional_cost_estimate)}/mo.` : ''}`;
  } else {
    pricingHtml = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; margin: 0 0 24px 0;">
        <tr>
          <td style="padding: 20px 24px;">
            <p style="color: #0c4a6e; font-size: 15px; line-height: 1.6; margin: 0;">
              <strong style="color: #0f172a;">Individual programs</strong> typically range from <strong style="color: #0369a1;">$160 to $350 per month</strong>, while <strong>family plans</strong> range from <strong style="color: #0369a1;">$400 to $1,050 monthly</strong>, depending on your specific medical needs.
            </p>
          </td>
        </tr>
      </table>`;
    pricingText = 'Individual programs typically range from $160 to $350 per month, while family plans range from $400 to $1,050 monthly.';
  }

  // Build recommended plan + comparison table
  let planComparisonHtml = '';
  let planComparisonText = '';
  if (hasPlanData && planData.all_plan_rates) {
    const bestPlan = planData.best_match_plan ? planData.all_plan_rates[planData.best_match_plan] : null;
    const planRows = Object.entries(planData.all_plan_rates)
      .map(([id, p]) => {
        const price = p.flatRate ?? p.lowestPrice;
        const isBest = id === planData.best_match_plan;
        return `<tr style="background-color: ${isBest ? '#f0f9ff' : '#ffffff'}; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 14px 20px; color: #1e293b; font-size: 15px; font-weight: ${isBest ? '600' : '500'};">
            ${p.planLabel}${isBest && planData.best_match_percentage ? ` <span style="background-color: #0284c7; color: #ffffff; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px;">${planData.best_match_percentage}% match</span>` : ''}
          </td>
          <td style="padding: 14px 20px; text-align: right; color: #0369a1; font-size: 15px; font-weight: 600;">${fmtMoney(price)}/mo</td>
        </tr>`;
      })
      .join('');

    planComparisonHtml = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 28px 0;">
        <tr>
          <td>
            <h2 style="color: #0f172a; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">${bestPlan ? 'Your recommended plan' : 'Plan comparison'}</h2>
            ${bestPlan ? `<p style="color: #64748b; font-size: 14px; margin: 0 0 16px 0;"><strong style="color: #0f172a;">${bestPlan.planLabel}</strong> — Start at <strong style="color: #0369a1;">${fmtMoney(bestPlan.flatRate ?? bestPlan.lowestPrice)}/mo</strong></p>` : ''}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
              <thead>
                <tr style="background-color: #f1f5f9;">
                  <th style="padding: 14px 20px; text-align: left; font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Plan</th>
                  <th style="padding: 14px 20px; text-align: right; font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Start at</th>
                </tr>
              </thead>
              <tbody>
                ${planRows}
              </tbody>
            </table>
          </td>
        </tr>
      </table>`;

    planComparisonText = Object.entries(planData.all_plan_rates)
      .map(([id, p]) => {
        const price = p.flatRate ?? p.lowestPrice;
        const suffix = id === planData.best_match_plan && planData.best_match_percentage ? ` (${planData.best_match_percentage}% match)` : '';
        return `${p.planLabel}${suffix}: ${fmtMoney(price)}/mo`;
      })
      .join('\n');
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Your MPB Health Plan Comparison</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden;">
                <!-- Header: Logo on solid white so brand colors are visible -->
                <tr>
                  <td style="background-color: #ffffff; padding: 32px 40px 24px; text-align: center; border-bottom: 3px solid #0ea5e9;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <img src="https://mpb.health/assets/MPB-Health-No-background.png" alt="MPB Health" width="200" style="display: block; max-width: 200px; height: auto; margin: 0 auto;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Greeting -->
                <tr>
                  <td style="padding: 32px 40px 0;">
                    <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.02em;">Dear ${data.firstName},</h1>
                    <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0;">Your personalized plan comparison is ready.</p>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 0 40px 32px;">
                    <p style="color: #334155; font-size: 16px; line-height: 1.65; margin: 0 0 24px 0;">
                      Thank you for exploring MPB Health. Based on your household and preferences, we've prepared the following rates and plan options for you.
                    </p>
                    ${pricingHtml}
                    <p style="color: #334155; font-size: 16px; line-height: 1.65; margin: 0 0 28px 0;">
                      Health sharing offers a practical alternative to traditional insurance — community-based, transparent, and tailored to what you actually need.
                    </p>
                    ${planComparisonHtml}
                    <!-- CTA Section -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0 28px 0;">
                      <tr>
                        <td style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius: 8px; padding: 24px; text-align: center;">
                          <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">Get your exact rate and find the best plan for you</p>
                          <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 20px 0;">Call our Senior Advisor line — press 1 when prompted</p>
                          <a href="${QUOTE_PHONE_TEL}" style="display: inline-block; background-color: #ffffff; color: #0284c7; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 700; font-size: 16px;">${QUOTE_PHONE_DISPLAY} ext 1</a>
                        </td>
                      </tr>
                    </table>
                    <!-- Secondary links -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 16px 0; border-top: 1px solid #e2e8f0;">
                          <p style="margin: 0 0 8px 0;">
                            <a href="${videoUrl}" style="color: #0ea5e9; font-size: 14px; text-decoration: none; font-weight: 500;">Watch: How MPB Health Works</a>
                          </p>
                          <p style="margin: 0;">
                            <a href="${hasPlanData ? resultsUrl : welcomePageUrl}" style="color: #64748b; font-size: 14px; text-decoration: none;">View your comparison online →</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0; line-height: 1.5;">
                      You're receiving this because you requested a quote from MPB Health.
                    </p>
                    <p style="margin: 0;">
                      <a href="https://mpb.health/privacy-policy" style="color: #64748b; font-size: 12px; text-decoration: underline;">Privacy Policy</a>
                      <span style="color: #cbd5e1; margin: 0 8px;">|</span>
                      <a href="https://mpb.health" style="color: #64748b; font-size: 12px; text-decoration: underline;">mpb.health</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const textContent = `Dear ${data.firstName},

Thank you for visiting MPB Health to explore your health-share options.

${pricingText}

Health-share programs offer a great solution for unexpected medical bills.

${planComparisonText ? `Your plan comparison:\n${planComparisonText}\n\n` : ''}Call our Senior Advisor line to get your exact rate and find the best plan that fits you: ${QUOTE_PHONE_DISPLAY} ext 1

Watch how our programs work: ${videoUrl}

View your comparison: ${hasPlanData ? resultsUrl : welcomePageUrl}`;

  return sendEmail({
    to: data.email,
    subject: `${data.firstName}, Your MPB Health Plan Comparison`,
    html,
    text: textContent,
    replyTo: 'info@mympb.com'
  });
}

// ============================================================================
// CRM Notification Emails
// ============================================================================

export interface TaskReminderData {
  recipientEmail: string;
  recipientName: string;
  task: {
    id: string;
    title: string;
    description?: string;
    due_date: string;
    priority: string;
    lead_name: string;
    lead_id: string;
  };
  isOverdue?: boolean;
}

export async function sendTaskReminderEmail(data: TaskReminderData): Promise<EmailResponse> {
  const priorityColors: Record<string, string> = {
    high: '#dc2626',
    medium: '#f59e0b',
    low: '#10b981',
  };
  
  const priorityEmojis: Record<string, string> = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  };

  const headerColor = data.isOverdue ? '#dc2626' : '#f59e0b';
  const headerText = data.isOverdue ? '⚠️ Overdue Task Alert' : '⏰ Task Reminder';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${headerText}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background-color: ${headerColor}; padding: 30px 40px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 24px; margin: 0;">${headerText}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">Hi ${data.recipientName},</p>
                    
                    <div style="background-color: #f8fafc; border-left: 4px solid ${priorityColors[data.task.priority] || '#6b7280'}; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 25px;">
                      <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 10px 0;">
                        ${priorityEmojis[data.task.priority] || '📋'} ${data.task.title}
                      </h2>
                      ${data.task.description ? `<p style="color: #6b7280; font-size: 14px; margin: 0 0 15px 0;">${data.task.description}</p>` : ''}
                      <table style="width: 100%;">
                        <tr>
                          <td style="color: #6b7280; font-size: 14px; padding: 5px 0;"><strong>Lead:</strong></td>
                          <td style="color: #1f2937; font-size: 14px; padding: 5px 0;">${data.task.lead_name}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px; padding: 5px 0;"><strong>Due:</strong></td>
                          <td style="color: ${data.isOverdue ? '#dc2626' : '#1f2937'}; font-size: 14px; padding: 5px 0; font-weight: ${data.isOverdue ? 'bold' : 'normal'};">
                            ${new Date(data.task.due_date).toLocaleString()}
                            ${data.isOverdue ? ' (OVERDUE)' : ''}
                          </td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px; padding: 5px 0;"><strong>Priority:</strong></td>
                          <td style="color: #1f2937; font-size: 14px; padding: 5px 0;">${data.task.priority.toUpperCase()}</td>
                        </tr>
                      </table>
                    </div>
                    
                    <div style="text-align: center;">
                      <a href="https://mpb.health/admin/crm/leads/${data.task.lead_id}" style="display: inline-block; background: linear-gradient(to right, #2563eb, #06b6d4); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">View Task & Lead Details</a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                      This is an automated reminder from MPB Health CRM.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({
    to: data.recipientEmail,
    subject: `${data.isOverdue ? '⚠️ OVERDUE' : '⏰ Reminder'}: ${data.task.title} - ${data.task.lead_name}`,
    html,
    text: `${headerText}\n\nHi ${data.recipientName},\n\nTask: ${data.task.title}\nLead: ${data.task.lead_name}\nDue: ${new Date(data.task.due_date).toLocaleString()}${data.isOverdue ? ' (OVERDUE)' : ''}\nPriority: ${data.task.priority}\n\nView task: https://mpb.health/admin/crm/leads/${data.task.lead_id}`
  });
}

export interface HotLeadAlertData {
  recipientEmail: string;
  recipientName: string;
  lead: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    source: string;
    ai_score: number;
    household_size?: number;
    primary_concern?: string;
  };
  reasons: string[];
}

export async function sendHotLeadAlertEmail(data: HotLeadAlertData): Promise<EmailResponse> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🔥 Hot Lead Alert</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(to right, #dc2626, #ea580c); padding: 30px 40px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 28px; margin: 0;">🔥 Hot Lead Alert!</h1>
                    <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 10px 0 0 0;">AI Score: ${data.lead.ai_score}/100</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">Hi ${data.recipientName},</p>
                    <p style="color: #333; font-size: 16px; margin: 0 0 25px 0;">A high-priority lead just came in that requires immediate attention!</p>
                    
                    <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                      <h2 style="color: #991b1b; font-size: 20px; margin: 0 0 15px 0;">
                        ${data.lead.first_name} ${data.lead.last_name}
                      </h2>
                      <table style="width: 100%;">
                        <tr>
                          <td style="padding: 8px 0; vertical-align: top;">
                            <strong style="color: #6b7280;">📧 Email:</strong>
                          </td>
                          <td style="padding: 8px 0;">
                            <a href="mailto:${data.lead.email}" style="color: #2563eb;">${data.lead.email}</a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; vertical-align: top;">
                            <strong style="color: #6b7280;">📞 Phone:</strong>
                          </td>
                          <td style="padding: 8px 0;">
                            <a href="tel:${data.lead.phone}" style="color: #2563eb;">${data.lead.phone}</a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; vertical-align: top;">
                            <strong style="color: #6b7280;">🎯 Source:</strong>
                          </td>
                          <td style="padding: 8px 0; color: #1f2937;">${data.lead.source}</td>
                        </tr>
                        ${data.lead.household_size ? `
                        <tr>
                          <td style="padding: 8px 0; vertical-align: top;">
                            <strong style="color: #6b7280;">👥 Household:</strong>
                          </td>
                          <td style="padding: 8px 0; color: #1f2937;">${data.lead.household_size} people</td>
                        </tr>` : ''}
                        ${data.lead.primary_concern ? `
                        <tr>
                          <td style="padding: 8px 0; vertical-align: top;">
                            <strong style="color: #6b7280;">💭 Concern:</strong>
                          </td>
                          <td style="padding: 8px 0; color: #1f2937;">${data.lead.primary_concern}</td>
                        </tr>` : ''}
                      </table>
                    </div>
                    
                    ${data.reasons.length > 0 ? `
                    <div style="margin-bottom: 25px;">
                      <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 10px 0;">Why this lead is hot:</h3>
                      <ul style="color: #6b7280; font-size: 14px; margin: 0; padding-left: 20px;">
                        ${data.reasons.map(r => `<li style="margin: 5px 0;">${r}</li>`).join('')}
                      </ul>
                    </div>` : ''}
                    
                    <div style="text-align: center;">
                      <a href="https://mpb.health/admin/crm/leads/${data.lead.id}" style="display: inline-block; background: linear-gradient(to right, #dc2626, #ea580c); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; margin-right: 10px;">View Lead</a>
                      <a href="tel:${data.lead.phone}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">Call Now</a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px; background-color: #fef2f2; border-top: 1px solid #fecaca; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="color: #991b1b; font-size: 14px; font-weight: bold; margin: 0;">
                      ⚡ Contact this lead within 5 minutes for best conversion rates!
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({
    to: data.recipientEmail,
    subject: `🔥 HOT LEAD: ${data.lead.first_name} ${data.lead.last_name} (Score: ${data.lead.ai_score})`,
    html,
    text: `Hot Lead Alert!\n\nHi ${data.recipientName},\n\nA high-priority lead needs immediate attention:\n\nName: ${data.lead.first_name} ${data.lead.last_name}\nEmail: ${data.lead.email}\nPhone: ${data.lead.phone}\nAI Score: ${data.lead.ai_score}/100\n\nView lead: https://mpb.health/admin/crm/leads/${data.lead.id}`
  });
}

export interface DailyDigestData {
  recipientEmail: string;
  recipientName: string;
  date: string;
  stats: {
    newLeads: number;
    hotLeads: number;
    tasksCompleted: number;
    tasksDue: number;
    tasksOverdue: number;
    conversions: number;
  };
  topLeads: Array<{
    id: string;
    name: string;
    score: number;
    stage: string;
  }>;
  upcomingTasks: Array<{
    id: string;
    title: string;
    lead_name: string;
    due_date: string;
  }>;
}

export async function sendDailyDigestEmail(data: DailyDigestData): Promise<EmailResponse> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily CRM Digest</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(to right, #2563eb, #06b6d4); padding: 30px 40px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 24px; margin: 0;">📊 Daily CRM Digest</h1>
                    <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 10px 0 0 0;">${data.date}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #333; font-size: 16px; margin: 0 0 25px 0;">Good morning ${data.recipientName}! Here's your daily CRM summary:</p>
                    
                    <!-- Stats Grid -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                      <tr>
                        <td width="33%" style="text-align: center; padding: 15px; background-color: #eff6ff; border-radius: 8px 0 0 8px;">
                          <div style="font-size: 32px; font-weight: bold; color: #2563eb;">${data.stats.newLeads}</div>
                          <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">New Leads</div>
                        </td>
                        <td width="34%" style="text-align: center; padding: 15px; background-color: #fef2f2;">
                          <div style="font-size: 32px; font-weight: bold; color: #dc2626;">🔥 ${data.stats.hotLeads}</div>
                          <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Hot Leads</div>
                        </td>
                        <td width="33%" style="text-align: center; padding: 15px; background-color: #f0fdf4; border-radius: 0 8px 8px 0;">
                          <div style="font-size: 32px; font-weight: bold; color: #16a34a;">🎉 ${data.stats.conversions}</div>
                          <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Conversions</div>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Tasks Summary -->
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                      <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 15px 0;">📋 Tasks Overview</h3>
                      <table width="100%">
                        <tr>
                          <td style="color: #16a34a; font-size: 14px; padding: 5px 0;">✅ Completed: ${data.stats.tasksCompleted}</td>
                          <td style="color: #f59e0b; font-size: 14px; padding: 5px 0;">⏰ Due Today: ${data.stats.tasksDue}</td>
                          <td style="color: #dc2626; font-size: 14px; padding: 5px 0;">⚠️ Overdue: ${data.stats.tasksOverdue}</td>
                        </tr>
                      </table>
                    </div>
                    
                    ${data.topLeads.length > 0 ? `
                    <!-- Top Leads -->
                    <div style="margin-bottom: 25px;">
                      <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 15px 0;">🌟 Top Leads to Focus On</h3>
                      <table width="100%" style="border-collapse: collapse;">
                        ${data.topLeads.map(lead => `
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 12px 0; color: #1f2937; font-weight: 500;">${lead.name}</td>
                          <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">${lead.stage}</td>
                          <td style="padding: 12px 0; text-align: right;">
                            <span style="background-color: ${lead.score >= 70 ? '#fef2f2' : '#f0fdf4'}; color: ${lead.score >= 70 ? '#dc2626' : '#16a34a'}; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                              ${lead.score}/100
                            </span>
                          </td>
                        </tr>`).join('')}
                      </table>
                    </div>` : ''}
                    
                    ${data.upcomingTasks.length > 0 ? `
                    <!-- Upcoming Tasks -->
                    <div style="margin-bottom: 25px;">
                      <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 15px 0;">⏰ Today's Tasks</h3>
                      ${data.upcomingTasks.map(task => `
                      <div style="background-color: #fffbeb; border-left: 3px solid #f59e0b; padding: 12px 15px; margin-bottom: 10px; border-radius: 0 4px 4px 0;">
                        <div style="color: #1f2937; font-weight: 500;">${task.title}</div>
                        <div style="color: #6b7280; font-size: 13px; margin-top: 4px;">${task.lead_name} • ${new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>`).join('')}
                    </div>` : ''}
                    
                    <div style="text-align: center;">
                      <a href="https://mpb.health/admin/crm" style="display: inline-block; background: linear-gradient(to right, #2563eb, #06b6d4); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">Open CRM Dashboard</a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                      You're receiving this daily digest from MPB Health CRM. <a href="https://mpb.health/admin/settings/notifications" style="color: #2563eb;">Manage preferences</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({
    to: data.recipientEmail,
    subject: `📊 Daily Digest: ${data.stats.newLeads} new leads, ${data.stats.tasksDue} tasks due - ${data.date}`,
    html,
    text: `Daily CRM Digest - ${data.date}\n\nHi ${data.recipientName},\n\nNew Leads: ${data.stats.newLeads}\nHot Leads: ${data.stats.hotLeads}\nConversions: ${data.stats.conversions}\nTasks Completed: ${data.stats.tasksCompleted}\nTasks Due: ${data.stats.tasksDue}\nOverdue: ${data.stats.tasksOverdue}\n\nView dashboard: https://mpb.health/admin/crm`
  });
}

export interface WeeklySummaryData {
  recipientEmail: string;
  recipientName: string;
  weekRange: string;
  stats: {
    totalLeads: number;
    leadsChange: number;
    conversions: number;
    conversionRate: number;
    avgResponseTime: string;
    topSource: string;
  };
  teamPerformance: Array<{
    name: string;
    leads: number;
    conversions: number;
    tasks: number;
  }>;
}

export async function sendWeeklySummaryEmail(data: WeeklySummaryData): Promise<EmailResponse> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Weekly Performance Summary</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(to right, #7c3aed, #2563eb); padding: 30px 40px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 24px; margin: 0;">📈 Weekly Performance Report</h1>
                    <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 10px 0 0 0;">${data.weekRange}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #333; font-size: 16px; margin: 0 0 25px 0;">Hi ${data.recipientName}, here's your weekly performance summary:</p>
                    
                    <!-- Key Metrics -->
                    <table width="100%" cellpadding="0" cellspacing="10" style="margin-bottom: 30px;">
                      <tr>
                        <td width="50%" style="background-color: #eff6ff; padding: 20px; border-radius: 8px; text-align: center;">
                          <div style="font-size: 36px; font-weight: bold; color: #2563eb;">${data.stats.totalLeads}</div>
                          <div style="font-size: 13px; color: #6b7280; margin-top: 5px;">Total Leads</div>
                          <div style="font-size: 12px; color: ${data.stats.leadsChange >= 0 ? '#16a34a' : '#dc2626'}; margin-top: 5px;">
                            ${data.stats.leadsChange >= 0 ? '↑' : '↓'} ${Math.abs(data.stats.leadsChange)}% vs last week
                          </div>
                        </td>
                        <td width="50%" style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center;">
                          <div style="font-size: 36px; font-weight: bold; color: #16a34a;">${data.stats.conversionRate}%</div>
                          <div style="font-size: 13px; color: #6b7280; margin-top: 5px;">Conversion Rate</div>
                          <div style="font-size: 12px; color: #16a34a; margin-top: 5px;">
                            ${data.stats.conversions} conversions
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Additional Stats -->
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                      <table width="100%">
                        <tr>
                          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                            <span style="color: #6b7280;">⏱️ Avg Response Time:</span>
                            <span style="color: #1f2937; font-weight: 500; float: right;">${data.stats.avgResponseTime}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0;">
                            <span style="color: #6b7280;">🎯 Top Lead Source:</span>
                            <span style="color: #1f2937; font-weight: 500; float: right;">${data.stats.topSource}</span>
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    ${data.teamPerformance.length > 0 ? `
                    <!-- Team Leaderboard -->
                    <div style="margin-bottom: 25px;">
                      <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 15px 0;">🏆 Team Leaderboard</h3>
                      <table width="100%" style="border-collapse: collapse;">
                        <tr style="background-color: #f8fafc;">
                          <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600;">Team Member</th>
                          <th style="padding: 12px; text-align: center; font-size: 12px; color: #6b7280; font-weight: 600;">Leads</th>
                          <th style="padding: 12px; text-align: center; font-size: 12px; color: #6b7280; font-weight: 600;">Conversions</th>
                          <th style="padding: 12px; text-align: center; font-size: 12px; color: #6b7280; font-weight: 600;">Tasks</th>
                        </tr>
                        ${data.teamPerformance.map((member, i) => `
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 12px; color: #1f2937;">
                            ${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''} ${member.name}
                          </td>
                          <td style="padding: 12px; text-align: center; color: #2563eb; font-weight: 500;">${member.leads}</td>
                          <td style="padding: 12px; text-align: center; color: #16a34a; font-weight: 500;">${member.conversions}</td>
                          <td style="padding: 12px; text-align: center; color: #6b7280;">${member.tasks}</td>
                        </tr>`).join('')}
                      </table>
                    </div>` : ''}
                    
                    <div style="text-align: center;">
                      <a href="https://mpb.health/admin/crm/reports" style="display: inline-block; background: linear-gradient(to right, #7c3aed, #2563eb); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">View Full Report</a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                      Weekly summary from MPB Health CRM. <a href="https://mpb.health/admin/settings/notifications" style="color: #2563eb;">Manage preferences</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({
    to: data.recipientEmail,
    subject: `📈 Weekly Report: ${data.stats.conversions} conversions, ${data.stats.conversionRate}% conversion rate - ${data.weekRange}`,
    html,
    text: `Weekly Performance Report - ${data.weekRange}\n\nHi ${data.recipientName},\n\nTotal Leads: ${data.stats.totalLeads} (${data.stats.leadsChange >= 0 ? '+' : ''}${data.stats.leadsChange}%)\nConversions: ${data.stats.conversions}\nConversion Rate: ${data.stats.conversionRate}%\nAvg Response Time: ${data.stats.avgResponseTime}\nTop Source: ${data.stats.topSource}\n\nView full report: https://mpb.health/admin/crm/reports`
  });
}

// ============================================================================
// User Invitation Emails
// ============================================================================

export interface UserInvitationData {
  email: string;
  inviterName: string;
  orgName: string;
  role: string;
  inviteToken: string;
}

export async function sendUserInvitationEmail(data: UserInvitationData): Promise<EmailResponse> {
  const acceptUrl = `https://admin.mpb.health/accept-invite?token=${data.inviteToken}`;

  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    manager: 'Manager',
    advisor: 'Advisor',
    staff: 'Staff',
    member: 'Member',
  };

  const roleLabel = roleLabels[data.role] || data.role;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You've Been Invited to Join ${data.orgName}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(to right, #2563eb, #06b6d4); padding: 30px 40px; border-radius: 12px 12px 0 0; text-align: center;">
                    <img src="https://mpb.health/assets/MPB-Health-No-background.png" alt="MPB Health" style="max-width: 180px; height: auto; margin-bottom: 15px;">
                    <h1 style="color: #ffffff; font-size: 24px; margin: 0;">You're Invited!</h1>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #333; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
                      Hello,
                    </p>

                    <p style="color: #333; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
                      <strong>${data.inviterName}</strong> has invited you to join <strong>${data.orgName}</strong> on MPB Health as a <strong>${roleLabel}</strong>.
                    </p>

                    <!-- Role Info Box -->
                    <div style="background: linear-gradient(to right, #eff6ff, #ecfeff); border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 25px 0;">
                      <p style="color: #1e40af; font-size: 14px; margin: 0;">
                        <strong>Your Role:</strong> ${roleLabel}<br>
                        <strong>Organization:</strong> ${data.orgName}
                      </p>
                    </div>

                    <p style="color: #333; font-size: 16px; line-height: 1.7; margin: 0 0 25px 0;">
                      Click the button below to accept this invitation and set up your account:
                    </p>

                    <!-- Accept Button -->
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${acceptUrl}" style="display: inline-block; background: linear-gradient(to right, #2563eb, #06b6d4); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        Accept Invitation
                      </a>
                    </div>

                    <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
                      This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
                    </p>

                    <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 20px 0 0 0;">
                      If the button above doesn't work, copy and paste this link into your browser:<br>
                      <a href="${acceptUrl}" style="color: #2563eb; word-break: break-all;">${acceptUrl}</a>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 12px 12px;">
                    <p style="color: #999; font-size: 12px; margin: 0 0 10px 0;">
                      This invitation was sent by MPB Health on behalf of ${data.inviterName}.
                    </p>
                    <p style="color: #999; font-size: 12px; margin: 0;">
                      <a href="https://mpb.health/privacy-policy" style="color: #666; text-decoration: underline;">Privacy Policy</a> |
                      <a href="https://mpb.health" style="color: #666; text-decoration: underline;">Visit Our Website</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const textContent = `You've Been Invited to Join ${data.orgName}

Hello,

${data.inviterName} has invited you to join ${data.orgName} on MPB Health as a ${roleLabel}.

Your Role: ${roleLabel}
Organization: ${data.orgName}

Click the link below to accept this invitation and set up your account:
${acceptUrl}

This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.`;

  return sendEmail({
    to: data.email,
    subject: `You've been invited to join ${data.orgName} on MPB Health`,
    html,
    text: textContent,
  });
}