import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import {
  checkRateLimit,
  getClientIdentifier,
  verifyAuth,
  isValidUUID,
  sanitizeInput,
  safeErrorResponse,
} from "../_shared/security.ts";

const log = createLogger("chat-service");

type ChatAction =
  | "list_conversations"
  | "list_messages"
  | "send_message"
  | "create_dm"
  | "create_channel"
  | "delete_message"
  | "search_messages"
  | "search_users"
  | "mark_read"
  | "list_members"
  | "ping";

const RATE_LIMIT = { maxRequests: 120, windowSeconds: 60, keyPrefix: "chat" };
const ORG_ID = "00000000-0000-4000-a000-000000000001"; // MPB Health org

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  const correlationId =
    req.headers.get("x-request-id") ||
    `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  // Rate limit
  const clientIp = getClientIdentifier(req);
  const rateLimited = checkRateLimit(clientIp, RATE_LIMIT);
  if (rateLimited) {
    Object.entries(corsHeaders).forEach(([k, v]) =>
      rateLimited.headers.set(k, v)
    );
    return rateLimited;
  }

  const respond = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify({ ...body, correlationId }), {
      status,
      headers: { "Content-Type": "application/json", "x-request-id": correlationId, ...corsHeaders },
    });

  const respondError = (msg: string, status: number) =>
    respond({ success: false, error: msg }, status);

  try {
    if (req.method !== "POST") {
      return respondError("Method not allowed", 405);
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.action) {
      return respondError("Missing action", 400);
    }

    const action = body.action as ChatAction;

    // Ping (no auth)
    if (action === "ping") {
      return respond({ success: true, message: "pong" });
    }

    // Auth required for all other actions
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const auth = await verifyAuth(req, supabaseAdmin);
    if (!auth.authenticated || !auth.userId) {
      return respondError("Unauthorized", 401);
    }

    const userId = auth.userId;
    log.info(`Action: ${action}`, { userId, correlationId });

    switch (action) {
      // ================================================================
      // LIST CONVERSATIONS
      // ================================================================
      case "list_conversations": {
        // Get conversations user is a member of
        const { data: memberships, error: memErr } = await supabaseAdmin
          .from("chat_members")
          .select("conversation_id, is_muted, role, last_read_at")
          .eq("user_id", userId);

        if (memErr) {
          log.error("Failed to fetch memberships", memErr);
          return respondError("Failed to fetch conversations", 500);
        }

        if (!memberships || memberships.length === 0) {
          return respond({ success: true, conversations: [] });
        }

        const convIds = memberships.map((m: { conversation_id: string }) => m.conversation_id);

        const { data: conversations, error: convErr } = await supabaseAdmin
          .from("chat_conversations")
          .select("*")
          .in("id", convIds)
          .eq("is_archived", false)
          .order("last_message_at", { ascending: false, nullsFirst: false });

        if (convErr) {
          log.error("Failed to fetch conversations", convErr);
          return respondError("Failed to fetch conversations", 500);
        }

        // Get unread counts
        const { data: unreadCounts } = await supabaseAdmin
          .rpc("get_chat_unread_counts", { p_user_id: userId });

        const unreadMap = new Map(
          (unreadCounts || []).map((u: { conversation_id: string; unread_count: number }) => [
            u.conversation_id,
            u.unread_count,
          ])
        );

        const memberMap = new Map(
          memberships.map((m: { conversation_id: string; is_muted: boolean; role: string }) => [
            m.conversation_id,
            { is_muted: m.is_muted, role: m.role },
          ])
        );

        // For DMs, get the other user's name
        const dmConvs = (conversations || []).filter((c: { type: string }) => c.type === "direct");
        const dmNames = new Map<string, string>();

        if (dmConvs.length > 0) {
          for (const dm of dmConvs) {
            const { data: members } = await supabaseAdmin
              .from("chat_members")
              .select("user_id")
              .eq("conversation_id", dm.id)
              .neq("user_id", userId)
              .limit(1);

            if (members && members.length > 0) {
              const otherUserId = members[0].user_id;
              const { data: profile } = await supabaseAdmin
                .from("advisor_profiles")
                .select("first_name, last_name, avatar_url")
                .eq("id", otherUserId)
                .single();

              if (profile) {
                dmNames.set(dm.id, `${profile.first_name} ${profile.last_name}`.trim());
              }
            }
          }
        }

        const enriched = (conversations || []).map((c: Record<string, unknown>) => ({
          ...c,
          unread_count: unreadMap.get(c.id as string) || 0,
          is_muted: memberMap.get(c.id as string)?.is_muted || false,
          my_role: memberMap.get(c.id as string)?.role || "member",
          display_name: c.type === "direct" ? dmNames.get(c.id as string) || "Direct Message" : c.name,
        }));

        return respond({ success: true, conversations: enriched });
      }

      // ================================================================
      // LIST MESSAGES
      // ================================================================
      case "list_messages": {
        const { conversation_id, limit = 50, before } = body;

        if (!conversation_id || !isValidUUID(conversation_id)) {
          return respondError("Invalid conversation_id", 400);
        }

        // Verify membership
        const { data: membership } = await supabaseAdmin
          .from("chat_members")
          .select("id, role")
          .eq("conversation_id", conversation_id)
          .eq("user_id", userId)
          .single();

        if (!membership) {
          return respondError("Not a member of this conversation", 403);
        }

        let query = supabaseAdmin
          .from("chat_messages")
          .select("*")
          .eq("conversation_id", conversation_id)
          .order("created_at", { ascending: false })
          .limit(Math.min(limit, 100));

        if (before) {
          query = query.lt("created_at", before);
        }

        const { data: messages, error: msgErr } = await query;

        if (msgErr) {
          log.error("Failed to fetch messages", msgErr);
          return respondError("Failed to fetch messages", 500);
        }

        // Enrich with sender names
        const senderIds = [...new Set((messages || []).map((m: { sender_id: string }) => m.sender_id))];
        const { data: profiles } = await supabaseAdmin
          .from("advisor_profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", senderIds);

        const profileMap = new Map(
          (profiles || []).map((p: { id: string; first_name: string; last_name: string; avatar_url: string }) => [
            p.id,
            { name: `${p.first_name} ${p.last_name}`.trim(), avatar_url: p.avatar_url },
          ])
        );

        const enriched = (messages || []).map((m: Record<string, unknown>) => ({
          ...m,
          sender_name: profileMap.get(m.sender_id as string)?.name || "Unknown",
          sender_avatar: profileMap.get(m.sender_id as string)?.avatar_url || null,
          content: m.is_deleted ? null : m.content,
        }));

        // Auto-mark as read
        await supabaseAdmin.rpc("mark_chat_conversation_read", {
          p_user_id: userId,
          p_conversation_id: conversation_id,
        });

        return respond({
          success: true,
          messages: enriched.reverse(),
          has_more: (messages || []).length === Math.min(limit, 100),
        });
      }

      // ================================================================
      // SEND MESSAGE
      // ================================================================
      case "send_message": {
        const { conversation_id, content, reply_to_id } = body;

        if (!conversation_id || !isValidUUID(conversation_id)) {
          return respondError("Invalid conversation_id", 400);
        }
        if (!content || typeof content !== "string" || content.trim().length === 0) {
          return respondError("Message content is required", 400);
        }
        if (content.length > 10000) {
          return respondError("Message too long (max 10,000 characters)", 400);
        }

        // Verify membership
        const { data: membership } = await supabaseAdmin
          .from("chat_members")
          .select("id, role")
          .eq("conversation_id", conversation_id)
          .eq("user_id", userId)
          .single();

        if (!membership) {
          return respondError("Not a member of this conversation", 403);
        }

        // Check announcement restriction
        const { data: conv } = await supabaseAdmin
          .from("chat_conversations")
          .select("is_admin_only_posting, org_id")
          .eq("id", conversation_id)
          .single();

        if (conv?.is_admin_only_posting) {
          // Check if user has admin role in org_memberships or chat_members
          const isAdminMember = membership.role === "admin" || membership.role === "owner";
          if (!isAdminMember) {
            const { data: orgMember } = await supabaseAdmin
              .from("org_memberships")
              .select("role")
              .eq("user_id", userId)
              .eq("org_id", conv.org_id)
              .single();

            if (!orgMember || !["owner", "admin"].includes(orgMember.role)) {
              return respondError("Only admins can post in this channel", 403);
            }
          }
        }

        const sanitizedContent = sanitizeInput(content.trim(), 10000);

        const insertData: Record<string, unknown> = {
          conversation_id,
          sender_id: userId,
          content: sanitizedContent,
        };

        if (reply_to_id && isValidUUID(reply_to_id)) {
          insertData.reply_to_id = reply_to_id;
        }

        const { data: message, error: insertErr } = await supabaseAdmin
          .from("chat_messages")
          .insert(insertData)
          .select()
          .single();

        if (insertErr) {
          log.error("Failed to send message", insertErr);
          return respondError("Failed to send message", 500);
        }

        // Mark own conversation as read
        await supabaseAdmin.rpc("mark_chat_conversation_read", {
          p_user_id: userId,
          p_conversation_id: conversation_id,
        });

        // Enrich with sender profile
        const { data: senderProfile } = await supabaseAdmin
          .from("advisor_profiles")
          .select("first_name, last_name, avatar_url")
          .eq("id", userId)
          .single();

        const enrichedMessage = {
          ...message,
          sender_name: senderProfile ? `${senderProfile.first_name} ${senderProfile.last_name}`.trim() : "Unknown",
          sender_avatar: senderProfile?.avatar_url || null,
        };

        // Update conversation preview
        await supabaseAdmin
          .from("chat_conversations")
          .update({
            last_message_at: message.created_at,
            last_message_preview: sanitizedContent.length > 100
              ? sanitizedContent.slice(0, 100) + "..."
              : sanitizedContent,
          })
          .eq("id", conversation_id);

        return respond({ success: true, message: enrichedMessage });
      }

      // ================================================================
      // CREATE DM
      // ================================================================
      case "create_dm": {
        const { other_user_id } = body;

        if (!other_user_id || !isValidUUID(other_user_id)) {
          return respondError("Invalid other_user_id", 400);
        }

        if (other_user_id === userId) {
          return respondError("Cannot create DM with yourself", 400);
        }

        // Check existing DM between these 2 users
        const { data: existingDm } = await supabaseAdmin.rpc("get_chat_unread_counts", { p_user_id: userId });
        // Actually, find existing DM by checking conversation memberships
        const { data: myDmConvs } = await supabaseAdmin
          .from("chat_members")
          .select("conversation_id")
          .eq("user_id", userId);

        const { data: theirDmConvs } = await supabaseAdmin
          .from("chat_members")
          .select("conversation_id")
          .eq("user_id", other_user_id);

        const myConvIds = new Set((myDmConvs || []).map((m: { conversation_id: string }) => m.conversation_id));
        const sharedConvIds = (theirDmConvs || [])
          .map((m: { conversation_id: string }) => m.conversation_id)
          .filter((id: string) => myConvIds.has(id));

        if (sharedConvIds.length > 0) {
          // Check if any of these are DMs
          const { data: existingDms } = await supabaseAdmin
            .from("chat_conversations")
            .select("id")
            .in("id", sharedConvIds)
            .eq("type", "direct")
            .limit(1);

          if (existingDms && existingDms.length > 0) {
            return respond({ success: true, conversation_id: existingDms[0].id, existing: true });
          }
        }

        // Create new DM
        const { data: newConv, error: convErr } = await supabaseAdmin
          .from("chat_conversations")
          .insert({
            org_id: ORG_ID,
            type: "direct",
            created_by: userId,
          })
          .select()
          .single();

        if (convErr || !newConv) {
          log.error("Failed to create DM conversation", convErr);
          return respondError("Failed to create DM", 500);
        }

        // Add both members
        const { error: memberErr } = await supabaseAdmin
          .from("chat_members")
          .insert([
            { conversation_id: newConv.id, user_id: userId, role: "owner" },
            { conversation_id: newConv.id, user_id: other_user_id, role: "member" },
          ]);

        if (memberErr) {
          log.error("Failed to add DM members", memberErr);
          // Cleanup
          await supabaseAdmin.from("chat_conversations").delete().eq("id", newConv.id);
          return respondError("Failed to create DM", 500);
        }

        return respond({ success: true, conversation_id: newConv.id, existing: false });
      }

      // ================================================================
      // CREATE CHANNEL
      // ================================================================
      case "create_channel": {
        const { name, description, is_admin_only_posting = false, slug } = body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
          return respondError("Channel name is required", 400);
        }

        // Check admin role
        const { data: orgMember } = await supabaseAdmin
          .from("org_memberships")
          .select("role")
          .eq("user_id", userId)
          .eq("org_id", ORG_ID)
          .single();

        const isAdmin = orgMember && ["owner", "admin"].includes(orgMember.role);

        // Also check user_roles for super_admin/admin
        if (!isAdmin) {
          const { data: userRoles } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", userId);

          const hasAdminRole = (userRoles || []).some(
            (r: { role: string }) => ["super_admin", "admin"].includes(r.role)
          );

          if (!hasAdminRole) {
            return respondError("Only admins can create channels", 403);
          }
        }

        const channelSlug = slug || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

        const { data: newChannel, error: chanErr } = await supabaseAdmin
          .from("chat_conversations")
          .insert({
            org_id: ORG_ID,
            type: "channel",
            name: sanitizeInput(name.trim(), 100),
            slug: channelSlug,
            description: description ? sanitizeInput(description, 500) : null,
            created_by: userId,
            is_admin_only_posting,
          })
          .select()
          .single();

        if (chanErr) {
          log.error("Failed to create channel", chanErr);
          if (chanErr.code === "23505") {
            return respondError("Channel slug already exists", 409);
          }
          return respondError("Failed to create channel", 500);
        }

        // Add creator as admin
        await supabaseAdmin
          .from("chat_members")
          .insert({ conversation_id: newChannel.id, user_id: userId, role: "admin" });

        // Auto-add all active advisors + org members
        const { data: advisors } = await supabaseAdmin
          .from("advisor_profiles")
          .select("id")
          .eq("status", "active");

        const { data: orgMembers } = await supabaseAdmin
          .from("org_memberships")
          .select("user_id, role")
          .eq("org_id", ORG_ID)
          .eq("status", "active");

        const memberInserts: { conversation_id: string; user_id: string; role: string }[] = [];
        const addedUserIds = new Set<string>([userId]);

        for (const om of orgMembers || []) {
          if (!addedUserIds.has(om.user_id)) {
            memberInserts.push({
              conversation_id: newChannel.id,
              user_id: om.user_id,
              role: ["owner", "admin"].includes(om.role) ? "admin" : "member",
            });
            addedUserIds.add(om.user_id);
          }
        }

        for (const adv of advisors || []) {
          if (!addedUserIds.has(adv.id)) {
            memberInserts.push({
              conversation_id: newChannel.id,
              user_id: adv.id,
              role: "member",
            });
            addedUserIds.add(adv.id);
          }
        }

        if (memberInserts.length > 0) {
          await supabaseAdmin.from("chat_members").insert(memberInserts);
        }

        return respond({ success: true, channel: newChannel, members_added: addedUserIds.size });
      }

      // ================================================================
      // DELETE MESSAGE (soft delete)
      // ================================================================
      case "delete_message": {
        const { message_id } = body;

        if (!message_id || !isValidUUID(message_id)) {
          return respondError("Invalid message_id", 400);
        }

        const { data: msg } = await supabaseAdmin
          .from("chat_messages")
          .select("id, sender_id, conversation_id")
          .eq("id", message_id)
          .single();

        if (!msg) {
          return respondError("Message not found", 404);
        }

        // Check if user is author or admin
        const isAuthor = msg.sender_id === userId;

        if (!isAuthor) {
          const { data: membership } = await supabaseAdmin
            .from("chat_members")
            .select("role")
            .eq("conversation_id", msg.conversation_id)
            .eq("user_id", userId)
            .single();

          const isConvAdmin = membership && ["admin", "owner"].includes(membership.role);

          if (!isConvAdmin) {
            const { data: orgMember } = await supabaseAdmin
              .from("org_memberships")
              .select("role")
              .eq("user_id", userId)
              .eq("org_id", ORG_ID)
              .single();

            if (!orgMember || !["owner", "admin"].includes(orgMember.role)) {
              return respondError("Only message author or admin can delete", 403);
            }
          }
        }

        const { error: delErr } = await supabaseAdmin
          .from("chat_messages")
          .update({ is_deleted: true, deleted_by: userId, deleted_at: new Date().toISOString() })
          .eq("id", message_id);

        if (delErr) {
          log.error("Failed to delete message", delErr);
          return respondError("Failed to delete message", 500);
        }

        return respond({ success: true });
      }

      // ================================================================
      // SEARCH MESSAGES
      // ================================================================
      case "search_messages": {
        const { query, limit = 20, offset = 0 } = body;

        if (!query || typeof query !== "string" || query.trim().length < 2) {
          return respondError("Search query must be at least 2 characters", 400);
        }

        const { data: results, error: searchErr } = await supabaseAdmin
          .rpc("search_chat_messages", {
            p_user_id: userId,
            p_query: sanitizeInput(query.trim(), 200),
            p_limit: Math.min(limit, 50),
            p_offset: offset,
          });

        if (searchErr) {
          log.error("Search failed", searchErr);
          return respondError("Search failed", 500);
        }

        return respond({ success: true, results: results || [] });
      }

      // ================================================================
      // MARK READ
      // ================================================================
      case "mark_read": {
        const { conversation_id } = body;

        if (!conversation_id || !isValidUUID(conversation_id)) {
          return respondError("Invalid conversation_id", 400);
        }

        await supabaseAdmin.rpc("mark_chat_conversation_read", {
          p_user_id: userId,
          p_conversation_id: conversation_id,
        });

        return respond({ success: true });
      }

      // ================================================================
      // LIST MEMBERS
      // ================================================================
      case "list_members": {
        const { conversation_id } = body;

        if (!conversation_id || !isValidUUID(conversation_id)) {
          return respondError("Invalid conversation_id", 400);
        }

        // Verify caller is a member
        const { data: callerMembership } = await supabaseAdmin
          .from("chat_members")
          .select("id")
          .eq("conversation_id", conversation_id)
          .eq("user_id", userId)
          .single();

        if (!callerMembership) {
          return respondError("Not a member of this conversation", 403);
        }

        const { data: members, error: memErr } = await supabaseAdmin
          .from("chat_members")
          .select("user_id, role, joined_at, last_read_at, is_muted")
          .eq("conversation_id", conversation_id);

        if (memErr) {
          return respondError("Failed to fetch members", 500);
        }

        // Enrich with profiles
        const memberUserIds = (members || []).map((m: { user_id: string }) => m.user_id);
        const { data: profiles } = await supabaseAdmin
          .from("advisor_profiles")
          .select("id, first_name, last_name, avatar_url, status")
          .in("id", memberUserIds);

        const profileMap = new Map(
          (profiles || []).map((p: { id: string; first_name: string; last_name: string; avatar_url: string; status: string }) => [p.id, p])
        );

        const enriched = (members || []).map((m: Record<string, unknown>) => {
          const p = profileMap.get(m.user_id as string);
          return {
            ...m,
            display_name: p ? `${p.first_name} ${p.last_name}`.trim() : "Unknown",
            avatar_url: p?.avatar_url || null,
            status: p?.status || "unknown",
          };
        });

        return respond({ success: true, members: enriched });
      }

      // ================================================================
      // SEARCH USERS (for DM creation)
      // ================================================================
      case "search_users": {
        const { query, limit = 20 } = body;

        if (!query || typeof query !== "string" || query.trim().length < 1) {
          return respondError("Search query is required", 400);
        }

        const searchTerm = `%${sanitizeInput(query.trim(), 100).toLowerCase()}%`;

        // Search advisor_profiles by name
        const { data: advisors, error: searchErr } = await supabaseAdmin
          .from("advisor_profiles")
          .select("id, first_name, last_name, avatar_url, status")
          .eq("status", "active")
          .neq("id", userId)
          .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
          .order("first_name")
          .limit(Math.min(limit, 50));

        if (searchErr) {
          log.error("User search failed", searchErr);
          return respondError("Search failed", 500);
        }

        // Also search org_memberships users
        const { data: orgUsers, error: orgErr } = await supabaseAdmin
          .from("org_memberships")
          .select("user_id")
          .eq("org_id", ORG_ID)
          .eq("status", "active")
          .neq("user_id", userId);

        const orgUserIds = new Set((orgUsers || []).map((u: { user_id: string }) => u.user_id));

        // Combine: advisors + org members profiles
        const advisorIds = new Set((advisors || []).map((a: { id: string }) => a.id));
        const missingOrgUserIds = [...orgUserIds].filter((id) => !advisorIds.has(id));

        let orgProfiles: Array<{ id: string; first_name: string; last_name: string; avatar_url: string | null; status: string }> = [];
        if (missingOrgUserIds.length > 0) {
          const { data: extraProfiles } = await supabaseAdmin
            .from("advisor_profiles")
            .select("id, first_name, last_name, avatar_url, status")
            .in("id", missingOrgUserIds)
            .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
            .eq("status", "active")
            .limit(20);
          orgProfiles = extraProfiles || [];
        }

        const allResults = [...(advisors || []), ...orgProfiles];
        const uniqueResults = Array.from(
          new Map(allResults.map((u) => [u.id, u])).values()
        ).slice(0, Math.min(limit, 50));

        const users = uniqueResults.map((u) => ({
          id: u.id,
          display_name: `${u.first_name} ${u.last_name}`.trim(),
          first_name: u.first_name,
          last_name: u.last_name,
          avatar_url: u.avatar_url,
          status: u.status,
        }));

        return respond({ success: true, users });
      }

      default:
        return respondError(`Unknown action: ${action}`, 400);
    }
  } catch (err) {
    log.error("Unhandled error", err);
    return respond({ success: false, error: "Internal server error" }, 500);
  }
});
