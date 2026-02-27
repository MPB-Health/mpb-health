import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/security.ts';
const log = createLogger('ai-crm-agent');

interface ConversationSummaryRequest {
  action: 'summarize_conversation';
  lead: {
    name: string;
    stage: string;
    source: string | null;
  };
  activities: Array<{
    type: string;
    title: string;
    description: string | null;
    date: string;
  }>;
}

interface DraftGenerationRequest {
  action: 'generate_draft';
  draft_type: 'email' | 'sms';
  lead: {
    first_name: string;
    last_name: string;
    stage: string;
    primary_concern: string | null;
    coverage_preference: string | null;
    household_size: number | null;
  };
  insights: {
    score: number;
    urgency: string;
    interests: string[];
  } | null;
  context: string | null;
}

interface NextActionsRequest {
  action: 'suggest_next_actions';
  lead: {
    first_name: string;
    last_name: string;
    stage: string;
    days_since_contact: number;
    score: number;
  };
  recent_activities: Array<{
    type: string;
    title: string;
    date: string;
  }>;
}

type RequestBody = ConversationSummaryRequest | DraftGenerationRequest | NextActionsRequest;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  // Rate limit: AI/generation endpoint
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 20,
    windowSeconds: 60,
    keyPrefix: 'ai-crm-agent',
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();
    let result;

    switch (body.action) {
      case 'summarize_conversation':
        result = await summarizeConversation(body, geminiApiKey);
        break;
      case 'generate_draft':
        result = await generateDraft(body, geminiApiKey);
        break;
      case 'suggest_next_actions':
        result = await suggestNextActions(body, geminiApiKey);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    log.error('AI CRM Agent error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function summarizeConversation(
  request: ConversationSummaryRequest,
  apiKey: string
): Promise<{
  summary: string;
  keyPoints: string[];
  objections: string[];
  interests: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  nextSteps: string[];
}> {
  const activitiesText = request.activities
    .map(a => `[${a.date}] ${a.type}: ${a.title}${a.description ? ` - ${a.description}` : ''}`)
    .join('\n');

  const prompt = `You are a CRM assistant for MPB Health, a health sharing company. Analyze this lead's conversation history and provide a structured summary.

Lead: ${request.lead.name}
Current Stage: ${request.lead.stage}
Source: ${request.lead.source || 'Unknown'}

Activity History:
${activitiesText || 'No activities recorded yet.'}

Please provide a JSON response with the following structure:
{
  "summary": "A 2-3 sentence summary of all interactions with this lead",
  "keyPoints": ["Array of key information learned about the lead"],
  "objections": ["Any concerns or objections the lead has raised"],
  "interests": ["What the lead seems interested in"],
  "sentiment": "positive" | "neutral" | "negative",
  "nextSteps": ["Recommended next actions to take"]
}

Be concise and actionable. Focus on information useful for sales follow-up.`;

  try {
    const response = await callGemini(prompt, apiKey);
    
    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback if JSON parsing fails
    return {
      summary: response.slice(0, 500),
      keyPoints: [],
      objections: [],
      interests: [],
      sentiment: 'neutral',
      nextSteps: ['Follow up with lead'],
    };
  } catch (error) {
    log.error('Summarization error:', error);
    return {
      summary: `Lead ${request.lead.name} is in ${request.lead.stage} stage with ${request.activities.length} recorded activities.`,
      keyPoints: [],
      objections: [],
      interests: [],
      sentiment: 'neutral',
      nextSteps: ['Review lead history manually'],
    };
  }
}

async function generateDraft(
  request: DraftGenerationRequest,
  apiKey: string
): Promise<{
  emailSubject?: string;
  emailBody?: string;
  sms?: string;
}> {
  const leadContext = `
Lead Name: ${request.lead.first_name} ${request.lead.last_name}
Stage: ${request.lead.stage}
Primary Concern: ${request.lead.primary_concern || 'Not specified'}
Coverage Preference: ${request.lead.coverage_preference || 'Not specified'}
Household Size: ${request.lead.household_size || 'Not specified'}
${request.insights ? `AI Score: ${request.insights.score}
Urgency: ${request.insights.urgency}
Interests: ${request.insights.interests.join(', ') || 'None identified'}` : ''}
${request.context ? `Context: ${request.context}` : ''}
`;

  if (request.draft_type === 'sms') {
    const prompt = `You are a friendly health insurance advisor at MPB Health. Write a short, personalized SMS message (under 160 characters) to this lead.

${leadContext}

The SMS should:
- Be warm and personal
- Reference something specific about their situation if known
- Include a clear call to action
- End with your name placeholder {{advisor_name}}

Return ONLY the SMS text, nothing else.`;

    try {
      const sms = await callGemini(prompt, apiKey);
      return { sms: sms.trim().slice(0, 160) };
    } catch (error) {
      log.error('SMS generation error:', error);
      return {
        sms: `Hi ${request.lead.first_name}! Following up on your health plan inquiry. Have time for a quick call? -{{advisor_name}}`,
      };
    }
  } else {
    const prompt = `You are a friendly, professional health insurance advisor at MPB Health. Write a personalized follow-up email to this lead.

${leadContext}

The email should:
- Have an engaging subject line that's personalized
- Be warm and conversational, not salesy
- Reference their specific situation or concerns
- Highlight value (savings, coverage, flexibility)
- Include a clear call to action (schedule call, reply, etc.)
- Be 150-250 words
- Sign off with {{advisor_name}}

Return a JSON object:
{
  "emailSubject": "Subject line here",
  "emailBody": "Email body here"
}`;

    try {
      const response = await callGemini(prompt, apiKey);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        emailSubject: `${request.lead.first_name}, quick follow-up on your health plan options`,
        emailBody: response.slice(0, 1000),
      };
    } catch (error) {
      log.error('Email generation error:', error);
      return {
        emailSubject: `${request.lead.first_name}, let's find your perfect health plan`,
        emailBody: `Hi ${request.lead.first_name},

I wanted to follow up on your recent inquiry about health sharing programs.

Based on what you've shared, I think we have some excellent options that could save you money while providing great coverage for your ${request.lead.household_size ? `family of ${request.lead.household_size}` : 'needs'}.

Would you have a few minutes for a quick call? I'd love to answer any questions and walk you through the best options.

Just reply to this email or call me directly.

Best regards,
{{advisor_name}}
MPB Health Advisor`,
      };
    }
  }
}

async function suggestNextActions(
  request: NextActionsRequest,
  apiKey: string
): Promise<{
  actions: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    channel?: 'call' | 'email' | 'sms' | 'meeting';
    reasoning: string;
  }>;
}> {
  const activitiesText = request.recent_activities
    .map(a => `[${a.date}] ${a.type}: ${a.title}`)
    .join('\n');

  const prompt = `You are a sales strategy AI for MPB Health, a health sharing company. Suggest the best next actions for this lead.

Lead: ${request.lead.first_name} ${request.lead.last_name}
Stage: ${request.lead.stage}
AI Score: ${request.lead.score}
Days Since Last Contact: ${request.lead.days_since_contact}

Recent Activities:
${activitiesText || 'No recent activities'}

Suggest 2-4 specific next actions. Return JSON:
{
  "actions": [
    {
      "action": "Specific action to take",
      "priority": "low" | "medium" | "high",
      "channel": "call" | "email" | "sms" | "meeting",
      "reasoning": "Why this action is recommended"
    }
  ]
}

Focus on actionable, specific recommendations that will move this lead forward.`;

  try {
    const response = await callGemini(prompt, apiKey);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return {
      actions: [
        {
          action: 'Follow up with lead',
          priority: request.lead.days_since_contact > 3 ? 'high' : 'medium',
          channel: 'call',
          reasoning: `${request.lead.days_since_contact} days since last contact`,
        },
      ],
    };
  } catch (error) {
    log.error('Next actions error:', error);
    return {
      actions: [
        {
          action: 'Review lead and follow up',
          priority: 'medium',
          channel: 'call',
          reasoning: 'AI suggestion unavailable, manual review recommended',
        },
      ],
    };
  }
}

