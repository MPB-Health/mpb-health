import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/security.ts';
const log = createLogger('advisor-terminal-agent');

interface CommandRequest {
  command: string;
  session_id: string;
  context: {
    user_id: string;
    role: 'advisor' | 'admin';
    advisor_id?: string;
  };
}

interface _ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  // Rate limit: AI/generation endpoint
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 20,
    windowSeconds: 60,
    keyPrefix: 'advisor-terminal-agent',
  });
  if (rateLimitResponse) return rateLimitResponse;

  const startTime = Date.now();

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { command, session_id, context }: CommandRequest = await req.json();

    log.info('Processing command:', {
      command,
      user_id: context.user_id,
      role: context.role
    });

    let response = '';
    let toolsCalled: any[] = [];
    let success = true;
    let errorMessage: string | undefined;

    try {
      const result = await processCommand(command, context, supabase);
      response = result.response;
      toolsCalled = result.tools_called || [];
      success = result.success;
      errorMessage = result.error;
    } catch (error) {
      log.error('Error processing command:', error);
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      response = `Error: ${errorMessage}`;
    }

    const executionTime = Date.now() - startTime;

    const { data: logEntry, error: logError } = await supabase
      .from('advisor_terminal_commands')
      .insert({
        session_id,
        user_id: context.user_id,
        command_text: command,
        tools_called: toolsCalled,
        success,
        response_text: response,
        execution_time_ms: executionTime,
        error_message: errorMessage,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (logError) {
      log.error('Error logging command:', logError);
    }

    return new Response(
      JSON.stringify({
        success,
        response,
        tools_called: toolsCalled,
        execution_time_ms: executionTime,
        audit_log_id: logEntry?.id,
        error: errorMessage
      }),
      {
        headers: {
          ...getCorsHeaders(req),
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    log.error('Request error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        response: 'An error occurred processing your command'
      }),
      {
        status: 500,
        headers: {
          ...getCorsHeaders(req),
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function processCommand(
  command: string,
  context: CommandRequest['context'],
  supabase: any
): Promise<{
  response: string;
  success: boolean;
  tools_called?: any[];
  error?: string;
}> {
  const lowerCommand = command.toLowerCase().trim();

  if (lowerCommand.includes('link') || lowerCommand.includes('enrollment') || lowerCommand.includes('url')) {
    return await getApprovedLinksHandler(lowerCommand, context, supabase);
  }

  if (lowerCommand.includes('stat') || lowerCommand.includes('performance') || lowerCommand.includes('my numbers')) {
    return await getMyStatsHandler(context, supabase);
  }

  if (lowerCommand.includes('lookup') || lowerCommand.includes('find member') || lowerCommand.includes('search member')) {
    return await lookupMemberHandler(lowerCommand, context, supabase);
  }

  if (lowerCommand === '/tools') {
    return await listToolsHandler(context, supabase);
  }

  return {
    success: false,
    response: `I didn't understand that command. Available tools:
  - Get approved links: "show me enrollment links" or "get care plus link"
  - Lookup member: "lookup member john@example.com"
  - Get stats: "show my stats" or "get my performance numbers"
  - List tools: "/tools"

Type "/help" for more information.`,
    error: 'Unrecognized command'
  };
}

async function getApprovedLinksHandler(
  command: string,
  context: CommandRequest['context'],
  supabase: any
): Promise<{response: string; success: boolean; tools_called?: any[]}> {
  try {
    let category: string | undefined;

    if (command.includes('enrollment')) category = 'enrollment';
    else if (command.includes('plan')) category = 'plans';
    else if (command.includes('calculator')) category = 'calculators';
    else if (command.includes('resource')) category = 'resources';
    else if (command.includes('training')) category = 'training';

    let query = supabase
      .from('approved_links')
      .select('id, title, url, description, category, is_active, display_order')
      .eq('is_active', true)
      .order('display_order');

    if (category) {
      query = query.eq('category', category);
    }

    const { data: links, error } = await query;

    if (error) throw error;

    if (!links || links.length === 0) {
      return {
        success: true,
        response: 'No approved links found for that category.',
        tools_called: [{ tool: 'get_approved_links', params: { category } }]
      };
    }

    const grouped = links.reduce((acc: any, link: any) => {
      if (!acc[link.category]) acc[link.category] = [];
      acc[link.category].push(link);
      return acc;
    }, {});

    let response = '🔗 Approved Links:\n\n';

    for (const [cat, catLinks] of Object.entries(grouped)) {
      response += `\n${cat.toUpperCase()}:\n`;
      (catLinks as any[]).forEach((link: any, i: number) => {
        response += `  ${i + 1}. ${link.title}\n`;
        response += `     ${link.url}\n`;
        if (link.description) {
          response += `     ${link.description}\n`;
        }
      });
    }

    response += '\n💡 Tip: Copy these links to share with prospects and members';

    return {
      success: true,
      response,
      tools_called: [{ tool: 'get_approved_links', params: { category }, result: 'success' }]
    };
  } catch (error) {
    return {
      success: false,
      response: `Error fetching links: ${error instanceof Error ? error.message : 'Unknown error'}`,
      tools_called: [{ tool: 'get_approved_links', error: error instanceof Error ? error.message : 'Unknown error' }]
    };
  }
}

async function getMyStatsHandler(
  context: CommandRequest['context'],
  supabase: any
): Promise<{response: string; success: boolean; tools_called?: any[]}> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role')
      .eq('id', context.user_id)
      .single();

    if (profileError) throw profileError;

    const response = `📊 Your Performance Stats:\n\n`;

    return {
      success: true,
      response: response + `
Name: ${profile.first_name || ''} ${profile.last_name || ''}
Role: ${profile.role || 'advisor'}
Status: Active

📈 This Month:
  • Enrollments: Coming soon
  • Referrals: Coming soon
  • Completion Rate: Coming soon

🎯 All Time:
  • Total Enrollments: Coming soon
  • Success Rate: Coming soon

💡 Tip: Stats integration with CRM coming in next update`,
      tools_called: [{ tool: 'get_my_stats', result: 'success' }]
    };
  } catch (error) {
    return {
      success: false,
      response: `Error fetching stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
      tools_called: [{ tool: 'get_my_stats', error: error instanceof Error ? error.message : 'Unknown error' }]
    };
  }
}

async function lookupMemberHandler(
  command: string,
  context: CommandRequest['context'],
  supabase: any
): Promise<{response: string; success: boolean; tools_called?: any[]}> {
  try {
    const emailMatch = command.match(/[\w.-]+@[\w.-]+\.\w+/);
    const email = emailMatch ? emailMatch[0] : null;

    if (!email) {
      return {
        success: false,
        response: 'Please provide a valid email address. Example: "lookup member john@example.com"',
        tools_called: [{ tool: 'lookup_member', error: 'No email provided' }]
      };
    }

    const { data: member, error } = await supabase
      .from('member_profiles')
      .select('id, first_name, last_name, email, phone, membership_status, plan_type, enrollment_date')
      .eq('email', email)
      .single();

    if (error || !member) {
      return {
        success: true,
        response: `No member found with email: ${email}`,
        tools_called: [{ tool: 'lookup_member', params: { email }, result: 'not_found' }]
      };
    }

    const response = `👤 Member Profile:\n\n`;

    return {
      success: true,
      response: response + `
Name: ${member.first_name || ''} ${member.last_name || ''}
Email: ${member.email}
Phone: ${member.phone || 'N/A'}
Status: ${member.membership_status || 'Unknown'}
Plan: ${member.plan_type || 'N/A'}
Join Date: ${member.enrollment_date ? new Date(member.enrollment_date).toLocaleDateString() : 'N/A'}

💡 Tip: Use this information to provide personalized support`,
      tools_called: [{ tool: 'lookup_member', params: { email }, result: 'success' }]
    };
  } catch (error) {
    return {
      success: false,
      response: `Error looking up member: ${error instanceof Error ? error.message : 'Unknown error'}`,
      tools_called: [{ tool: 'lookup_member', error: error instanceof Error ? error.message : 'Unknown error' }]
    };
  }
}

async function listToolsHandler(
  context: CommandRequest['context'],
  supabase: any
): Promise<{response: string; success: boolean; tools_called?: any[]}> {
  try {
    const { data: tools, error } = await supabase
      .from('terminal_tool_permissions')
      .select('id, display_name, description, rate_limit_calls, rate_limit_period, allowed_roles, is_active')
      .eq('is_active', true)
      .order('display_name');

    if (error) throw error;

    const userTools = tools.filter((tool: any) => {
      const allowedRoles = tool.allowed_roles || [];
      return allowedRoles.includes(context.role);
    });

    let response = `🛠️  Available Tools (${userTools.length}):\n\n`;

    userTools.forEach((tool: any, i: number) => {
      response += `${i + 1}. ${tool.display_name}\n`;
      response += `   ${tool.description}\n`;
      response += `   Rate Limit: ${tool.rate_limit_calls}/${tool.rate_limit_period}\n\n`;
    });

    response += '\n💡 Use natural language to invoke these tools';

    return {
      success: true,
      response,
      tools_called: [{ tool: 'list_tools', result: 'success' }]
    };
  } catch (error) {
    return {
      success: false,
      response: `Error listing tools: ${error instanceof Error ? error.message : 'Unknown error'}`,
      tools_called: [{ tool: 'list_tools', error: error instanceof Error ? error.message : 'Unknown error' }]
    };
  }
}
