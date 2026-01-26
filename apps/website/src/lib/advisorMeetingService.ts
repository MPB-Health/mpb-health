/**
 * Advisor Meeting Service
 * Manages video conference meetings for advisors using Jitsi Meet
 */

import { supabase } from './supabase';

// ============================================================================
// Types
// ============================================================================

export interface AdvisorMeeting {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  room_name: string;
  room_password: string | null;
  host_id: string | null;
  host_name: string | null;
  is_recurring: boolean;
  recurrence_pattern: 'weekly' | 'biweekly' | 'monthly' | null;
  recurrence_day: number | null;
  recurrence_time: string | null;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  started_at: string | null;
  ended_at: string | null;
  recording_url: string | null;
  attendee_count: number;
  max_attendees: number | null;
  meeting_notes: string | null;
  agenda: string | null;
  resources: MeetingResource[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MeetingResource {
  type: 'playbook' | 'bulletin' | 'training' | 'document' | 'link';
  title: string;
  url: string;
}

export interface MeetingAttendee {
  id: string;
  meeting_id: string;
  advisor_id: string | null;
  user_id: string | null;
  email: string | null;
  name: string | null;
  joined_at: string;
  left_at: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface CreateMeetingInput {
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes?: number;
  room_password?: string;
  is_recurring?: boolean;
  recurrence_pattern?: 'weekly' | 'biweekly' | 'monthly';
  recurrence_day?: number;
  recurrence_time?: string;
  max_attendees?: number;
  agenda?: string;
  resources?: MeetingResource[];
  // New fields for enhanced meetings
  visibility?: 'all' | 'selected' | 'private';
  meeting_type?: 'all_hands' | 'group' | 'one_on_one' | 'training' | 'webinar';
  selected_advisors?: string[];
  auto_record?: boolean;
  reminder_minutes?: number;
  passcode?: string;
}

export interface MeetingTemplate {
  id: string;
  name: string;
  description: string | null;
  meeting_type: 'all_hands' | 'group' | 'one_on_one' | 'training' | 'webinar';
  default_duration: number;
  default_visibility: 'all' | 'selected' | 'private';
  default_agenda: string | null;
  require_registration: boolean;
  allow_guests: boolean;
  auto_record: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingInvitation {
  id: string;
  meeting_id: string;
  advisor_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'tentative' | 'no_response';
  invited_at: string;
  responded_at: string | null;
  reminder_sent: boolean;
  reminder_sent_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined advisor info
  advisor?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface MeetingWithInvitations extends AdvisorMeeting {
  invitations?: MeetingInvitation[];
  invitation_stats?: {
    total: number;
    accepted: number;
    declined: number;
    pending: number;
    tentative: number;
  };
}

export interface UpdateMeetingInput {
  title?: string;
  description?: string;
  scheduled_at?: string;
  duration_minutes?: number;
  room_password?: string;
  is_recurring?: boolean;
  recurrence_pattern?: 'weekly' | 'biweekly' | 'monthly' | null;
  recurrence_day?: number | null;
  recurrence_time?: string | null;
  status?: 'scheduled' | 'live' | 'completed' | 'cancelled';
  max_attendees?: number | null;
  meeting_notes?: string;
  agenda?: string;
  resources?: MeetingResource[];
  recording_url?: string;
}

// ============================================================================
// Meeting CRUD Operations
// ============================================================================

/**
 * Get all meetings (with optional filters)
 */
export async function getMeetings(options?: {
  status?: string;
  upcoming?: boolean;
  limit?: number;
}): Promise<AdvisorMeeting[]> {
  let query = supabase
    .from('advisor_meetings')
    .select('*')
    .order('scheduled_at', { ascending: true });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.upcoming) {
    query = query
      .gte('scheduled_at', new Date().toISOString())
      .in('status', ['scheduled', 'live']);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching meetings:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single meeting by ID
 */
export async function getMeetingById(id: string): Promise<AdvisorMeeting | null> {
  const { data, error } = await supabase
    .from('advisor_meetings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching meeting:', error);
    throw error;
  }

  return data;
}

/**
 * Get a meeting by room name
 */
export async function getMeetingByRoom(roomName: string): Promise<AdvisorMeeting | null> {
  const { data, error } = await supabase
    .from('advisor_meetings')
    .select('*')
    .eq('room_name', roomName)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching meeting by room:', error);
    throw error;
  }

  return data;
}

/**
 * Get the currently active (live) meeting
 */
export async function getActiveMeeting(): Promise<AdvisorMeeting | null> {
  const { data, error } = await supabase
    .from('advisor_meetings')
    .select('*')
    .eq('status', 'live')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching active meeting:', error);
    throw error;
  }

  return data;
}

/**
 * Get upcoming meetings
 */
export async function getUpcomingMeetings(limit: number = 5): Promise<AdvisorMeeting[]> {
  const { data, error } = await supabase
    .from('advisor_meetings')
    .select('*')
    .eq('status', 'scheduled')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching upcoming meetings:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get past meetings
 */
export async function getPastMeetings(limit: number = 10): Promise<AdvisorMeeting[]> {
  const { data, error } = await supabase
    .from('advisor_meetings')
    .select('*')
    .eq('status', 'completed')
    .order('ended_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching past meetings:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new meeting
 */
export async function createMeeting(input: CreateMeetingInput): Promise<AdvisorMeeting> {
  const { data: user } = await supabase.auth.getUser();

  // Generate unique room name
  const roomName = `mpb-advisor-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;

  const { data, error } = await supabase
    .from('advisor_meetings')
    .insert({
      ...input,
      room_name: roomName,
      host_id: user?.user?.id,
      status: 'scheduled',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating meeting:', error);
    throw error;
  }

  return data;
}

/**
 * Update a meeting
 */
export async function updateMeeting(id: string, input: UpdateMeetingInput): Promise<AdvisorMeeting> {
  const { data, error } = await supabase
    .from('advisor_meetings')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating meeting:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a meeting
 */
export async function deleteMeeting(id: string): Promise<void> {
  const { error } = await supabase
    .from('advisor_meetings')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting meeting:', error);
    throw error;
  }
}

/**
 * Start a meeting (set status to live)
 */
export async function startMeeting(id: string): Promise<AdvisorMeeting> {
  const { data, error } = await supabase
    .from('advisor_meetings')
    .update({
      status: 'live',
      started_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error starting meeting:', error);
    throw error;
  }

  return data;
}

/**
 * End a meeting (set status to completed)
 */
export async function endMeeting(id: string): Promise<AdvisorMeeting> {
  // First, close out any remaining attendees
  await supabase
    .from('advisor_meeting_attendees')
    .update({
      left_at: new Date().toISOString(),
    })
    .eq('meeting_id', id)
    .is('left_at', null);

  // Get attendee count
  const { count } = await supabase
    .from('advisor_meeting_attendees')
    .select('*', { count: 'exact', head: true })
    .eq('meeting_id', id);

  // Update meeting status
  const { data, error } = await supabase
    .from('advisor_meetings')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      attendee_count: count || 0,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error ending meeting:', error);
    throw error;
  }

  return data;
}

/**
 * Cancel a meeting
 */
export async function cancelMeeting(id: string): Promise<AdvisorMeeting> {
  const { data, error } = await supabase
    .from('advisor_meetings')
    .update({
      status: 'cancelled',
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error cancelling meeting:', error);
    throw error;
  }

  return data;
}

// ============================================================================
// Attendance Operations
// ============================================================================

/**
 * Record when an advisor joins a meeting
 */
export async function joinMeeting(meetingId: string, advisorInfo?: {
  advisorId?: string;
  email?: string;
  name?: string;
}): Promise<MeetingAttendee> {
  const { data: user } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('advisor_meeting_attendees')
    .insert({
      meeting_id: meetingId,
      user_id: user?.user?.id,
      advisor_id: advisorInfo?.advisorId,
      email: advisorInfo?.email || user?.user?.email,
      name: advisorInfo?.name,
      joined_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error recording meeting join:', error);
    throw error;
  }

  return data;
}

/**
 * Record when an advisor leaves a meeting
 */
export async function leaveMeeting(attendeeId: string): Promise<MeetingAttendee> {
  const joinedAt = await supabase
    .from('advisor_meeting_attendees')
    .select('joined_at')
    .eq('id', attendeeId)
    .single();

  const duration = joinedAt.data
    ? Math.floor((Date.now() - new Date(joinedAt.data.joined_at).getTime()) / 1000)
    : null;

  const { data, error } = await supabase
    .from('advisor_meeting_attendees')
    .update({
      left_at: new Date().toISOString(),
      duration_seconds: duration,
    })
    .eq('id', attendeeId)
    .select()
    .single();

  if (error) {
    console.error('Error recording meeting leave:', error);
    throw error;
  }

  return data;
}

/**
 * Get attendees for a meeting
 */
export async function getMeetingAttendees(meetingId: string): Promise<MeetingAttendee[]> {
  const { data, error } = await supabase
    .from('advisor_meeting_attendees')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('joined_at', { ascending: true });

  if (error) {
    console.error('Error fetching attendees:', error);
    throw error;
  }

  return data || [];
}

// ============================================================================
// Jitsi Configuration
// ============================================================================

export const JITSI_CONFIG = {
  domain: 'meet.jit.si',
  options: {
    roomName: '',
    width: '100%',
    height: '100%',
    parentNode: null as HTMLElement | null,
    configOverwrite: {
      startWithAudioMuted: true,
      startWithVideoMuted: false,
      prejoinPageEnabled: true,
      disableDeepLinking: true,
      enableWelcomePage: false,
      enableClosePage: false,
      disableInviteFunctions: true,
      toolbarButtons: [
        'camera',
        'chat',
        'closedcaptions',
        'desktop',
        'download',
        'embedmeeting',
        'etherpad',
        'feedback',
        'filmstrip',
        'fullscreen',
        'hangup',
        'help',
        'highlight',
        'linktosalesforce',
        'livestreaming',
        'microphone',
        'noisesuppression',
        'participants-pane',
        'profile',
        'raisehand',
        'recording',
        'security',
        'select-background',
        'settings',
        'shareaudio',
        'sharedvideo',
        'shortcuts',
        'stats',
        'tileview',
        'toggle-camera',
        'videoquality',
        'whiteboard',
      ],
    },
    interfaceConfigOverwrite: {
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      SHOW_BRAND_WATERMARK: false,
      BRAND_WATERMARK_LINK: '',
      SHOW_POWERED_BY: false,
      SHOW_PROMOTIONAL_CLOSE_PAGE: false,
      TOOLBAR_ALWAYS_VISIBLE: true,
      MOBILE_APP_PROMO: false,
      HIDE_INVITE_MORE_HEADER: true,
      DEFAULT_BACKGROUND: '#1e3a5f',
    },
    userInfo: {
      displayName: '',
      email: '',
    },
  },
};

/**
 * Generate Jitsi meeting URL
 */
export function getJitsiMeetingUrl(roomName: string, password?: string): string {
  let url = `https://${JITSI_CONFIG.domain}/${roomName}`;
  if (password) {
    url += `#config.lockRoomGuestEnabled=true`;
  }
  return url;
}

// ============================================================================
// Meeting Templates
// ============================================================================

/**
 * Get all meeting templates
 */
export async function getMeetingTemplates(): Promise<MeetingTemplate[]> {
  const { data, error } = await supabase
    .from('meeting_templates')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching meeting templates:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single template by ID
 */
export async function getMeetingTemplate(id: string): Promise<MeetingTemplate | null> {
  const { data, error } = await supabase
    .from('meeting_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

// ============================================================================
// Enhanced Meeting Creation
// ============================================================================

/**
 * Create a meeting with optional advisor invitations
 */
export async function createMeetingWithInvitations(
  input: CreateMeetingInput
): Promise<AdvisorMeeting> {
  const { data: user } = await supabase.auth.getUser();

  // Generate unique room name
  const roomName = `mpb-advisor-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;

  // Create meeting
  const { data: meeting, error: meetingError } = await supabase
    .from('advisor_meetings')
    .insert({
      title: input.title,
      description: input.description,
      scheduled_at: input.scheduled_at,
      duration_minutes: input.duration_minutes || 60,
      room_name: roomName,
      room_password: input.room_password || input.passcode,
      host_id: user?.user?.id,
      is_recurring: input.is_recurring || false,
      recurrence_pattern: input.recurrence_pattern,
      recurrence_day: input.recurrence_day,
      recurrence_time: input.recurrence_time,
      max_attendees: input.max_attendees,
      agenda: input.agenda,
      resources: input.resources || [],
      status: 'scheduled',
      visibility: input.visibility || 'all',
      meeting_type: input.meeting_type || 'group',
      auto_record: input.auto_record || false,
      reminder_minutes: input.reminder_minutes || 30,
      passcode: input.passcode,
    })
    .select()
    .single();

  if (meetingError) {
    console.error('Error creating meeting:', meetingError);
    throw meetingError;
  }

  // Invite advisors if specified
  if (input.selected_advisors && input.selected_advisors.length > 0) {
    await inviteAdvisorsToMeeting(meeting.id, input.selected_advisors);
  } else if (input.visibility === 'all') {
    // Invite all advisors for public meetings
    await inviteAllAdvisorsToMeeting(meeting.id);
  }

  return meeting;
}

/**
 * Create and immediately start an instant meeting
 */
export async function createInstantMeeting(
  title: string,
  options?: {
    visibility?: 'all' | 'selected' | 'private';
    selectedAdvisors?: string[];
    meetingType?: 'all_hands' | 'group' | 'one_on_one' | 'training' | 'webinar';
  }
): Promise<AdvisorMeeting> {
  const { data: user } = await supabase.auth.getUser();

  // Use database function for atomic creation
  const { data, error } = await supabase.rpc('create_instant_meeting', {
    p_title: title,
    p_host_id: user?.user?.id,
    p_visibility: options?.visibility || 'all',
    p_advisor_ids: options?.selectedAdvisors || null,
  });

  if (error) {
    // Fallback to manual creation if RPC doesn't exist
    console.warn('RPC not available, using fallback:', error);

    const roomName = `mpb-instant-${Date.now().toString(36).substring(0, 8)}`;

    const { data: meeting, error: meetingError } = await supabase
      .from('advisor_meetings')
      .insert({
        title,
        description: 'Instant meeting started by admin',
        scheduled_at: new Date().toISOString(),
        duration_minutes: 60,
        room_name: roomName,
        host_id: user?.user?.id,
        status: 'live',
        started_at: new Date().toISOString(),
        visibility: options?.visibility || 'all',
        meeting_type: options?.selectedAdvisors?.length === 1 ? 'one_on_one' : 'group',
      })
      .select()
      .single();

    if (meetingError) throw meetingError;

    // Invite advisors
    if (options?.selectedAdvisors && options.selectedAdvisors.length > 0) {
      await inviteAdvisorsToMeeting(meeting.id, options.selectedAdvisors);
    } else if (options?.visibility === 'all') {
      await inviteAllAdvisorsToMeeting(meeting.id);
    }

    return meeting;
  }

  return data;
}

// ============================================================================
// Meeting Invitations
// ============================================================================

/**
 * Invite specific advisors to a meeting
 */
export async function inviteAdvisorsToMeeting(
  meetingId: string,
  advisorIds: string[]
): Promise<number> {
  // Try using database function first
  const { data, error } = await supabase.rpc('invite_advisors_to_meeting', {
    p_meeting_id: meetingId,
    p_advisor_ids: advisorIds,
  });

  if (error) {
    // Fallback to manual insert
    console.warn('RPC not available, using fallback:', error);

    const invitations = advisorIds.map(advisorId => ({
      meeting_id: meetingId,
      advisor_id: advisorId,
      status: 'pending',
    }));

    const { error: insertError } = await supabase
      .from('meeting_invitations')
      .upsert(invitations, { onConflict: 'meeting_id,advisor_id' });

    if (insertError) {
      console.error('Error inviting advisors:', insertError);
      throw insertError;
    }

    return advisorIds.length;
  }

  return data;
}

/**
 * Invite all active advisors to a meeting
 */
export async function inviteAllAdvisorsToMeeting(meetingId: string): Promise<number> {
  // Try using database function first
  const { data, error } = await supabase.rpc('invite_all_advisors_to_meeting', {
    p_meeting_id: meetingId,
  });

  if (error) {
    // Fallback to manual insert
    console.warn('RPC not available, using fallback:', error);

    const { data: advisors } = await supabase
      .from('advisor_profiles')
      .select('id')
      .eq('status', 'active');

    if (advisors && advisors.length > 0) {
      return await inviteAdvisorsToMeeting(meetingId, advisors.map(a => a.id));
    }

    return 0;
  }

  return data;
}

/**
 * Get invitations for a meeting
 */
export async function getMeetingInvitations(meetingId: string): Promise<MeetingInvitation[]> {
  const { data, error } = await supabase
    .from('meeting_invitations')
    .select(`
      *,
      advisor:advisor_profiles(id, first_name, last_name, email)
    `)
    .eq('meeting_id', meetingId)
    .order('invited_at', { ascending: true });

  if (error) {
    console.error('Error fetching invitations:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get an advisor's pending meeting invitations
 */
export async function getAdvisorInvitations(advisorId: string): Promise<(MeetingInvitation & { meeting: AdvisorMeeting })[]> {
  const { data, error } = await supabase
    .from('meeting_invitations')
    .select(`
      *,
      meeting:advisor_meetings(*)
    `)
    .eq('advisor_id', advisorId)
    .eq('status', 'pending')
    .order('invited_at', { ascending: false });

  if (error) {
    console.error('Error fetching advisor invitations:', error);
    throw error;
  }

  return data || [];
}

/**
 * Respond to a meeting invitation
 */
export async function respondToInvitation(
  invitationId: string,
  response: 'accepted' | 'declined' | 'tentative',
  notes?: string
): Promise<MeetingInvitation> {
  // Try using database function first
  const { data: rpcData, error: rpcError } = await supabase.rpc('respond_to_meeting_invitation', {
    p_invitation_id: invitationId,
    p_response: response,
    p_notes: notes || null,
  });

  if (rpcError) {
    // Fallback to manual update
    const { data, error } = await supabase
      .from('meeting_invitations')
      .update({
        status: response,
        responded_at: new Date().toISOString(),
        notes: notes,
      })
      .eq('id', invitationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  return rpcData;
}

/**
 * Get meeting with invitation stats
 */
export async function getMeetingWithInvitations(meetingId: string): Promise<MeetingWithInvitations | null> {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) return null;

  const invitations = await getMeetingInvitations(meetingId);

  const stats = {
    total: invitations.length,
    accepted: invitations.filter(i => i.status === 'accepted').length,
    declined: invitations.filter(i => i.status === 'declined').length,
    pending: invitations.filter(i => i.status === 'pending').length,
    tentative: invitations.filter(i => i.status === 'tentative').length,
  };

  return {
    ...meeting,
    invitations,
    invitation_stats: stats,
  };
}

/**
 * Remove an invitation
 */
export async function removeInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase
    .from('meeting_invitations')
    .delete()
    .eq('id', invitationId);

  if (error) {
    console.error('Error removing invitation:', error);
    throw error;
  }
}

/**
 * Send reminder for a meeting
 */
export async function sendMeetingReminder(meetingId: string): Promise<void> {
  // This would integrate with email service
  // For now, just mark reminders as sent
  const { error } = await supabase
    .from('meeting_invitations')
    .update({
      reminder_sent: true,
      reminder_sent_at: new Date().toISOString(),
    })
    .eq('meeting_id', meetingId)
    .eq('reminder_sent', false);

  if (error) {
    console.error('Error marking reminders sent:', error);
    throw error;
  }

  // Mark meeting reminder as sent
  await supabase
    .from('advisor_meetings')
    .update({ reminder_sent: true })
    .eq('id', meetingId);
}

// ============================================================================
// Export service object
// ============================================================================

export const advisorMeetingService = {
  // CRUD
  getMeetings,
  getMeetingById,
  getMeetingByRoom,
  getActiveMeeting,
  getUpcomingMeetings,
  getPastMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  startMeeting,
  endMeeting,
  cancelMeeting,
  // Attendance
  joinMeeting,
  leaveMeeting,
  getMeetingAttendees,
  // Jitsi
  getJitsiMeetingUrl,
  JITSI_CONFIG,
  // Templates
  getMeetingTemplates,
  getMeetingTemplate,
  // Enhanced meetings
  createMeetingWithInvitations,
  createInstantMeeting,
  // Invitations
  inviteAdvisorsToMeeting,
  inviteAllAdvisorsToMeeting,
  getMeetingInvitations,
  getAdvisorInvitations,
  respondToInvitation,
  getMeetingWithInvitations,
  removeInvitation,
  sendMeetingReminder,
};

export default advisorMeetingService;
