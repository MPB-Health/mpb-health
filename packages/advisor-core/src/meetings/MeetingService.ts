import { supabase } from '@mpbhealth/database';
import type {
  AdvisorMeeting,
  MeetingAttendee,
  MeetingInvitation,
  MeetingTemplate,
} from '../types';
import { JITSI_CONFIG } from '../types';

export class MeetingService {
  // Get all meetings with optional filters
  async getMeetings(filters?: {
    status?: string;
    type?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<AdvisorMeeting[]> {
    let query = supabase
      .from('advisor_meetings')
      .select('id, title, description, scheduled_at, duration_minutes, room_name, room_password, host_id, status, meeting_type, max_participants, recording_url, resources, created_at, updated_at')
      .order('scheduled_at', { ascending: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.type) {
      query = query.eq('meeting_type', filters.type);
    }
    if (filters?.fromDate) {
      query = query.gte('scheduled_at', filters.fromDate);
    }
    if (filters?.toDate) {
      query = query.lte('scheduled_at', filters.toDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as any;
  }

  // Get upcoming meetings for an advisor
  async getUpcomingMeetings(advisorId: string, limit = 5): Promise<AdvisorMeeting[]> {
    const now = new Date().toISOString();

    // Get meetings the advisor is invited to
    const { data: invitations, error: invError } = await supabase
      .from('meeting_invitations')
      .select('meeting_id')
      .eq('advisor_id', advisorId)
      .in('status', ['accepted', 'pending']);

    if (invError) throw invError;

    const meetingIds = invitations?.map(i => i.meeting_id) || [];

    if (meetingIds.length === 0) return [];

    const { data, error } = await supabase
      .from('advisor_meetings')
      .select('id, title, description, scheduled_at, duration_minutes, room_name, room_password, host_id, status, meeting_type, max_participants, recording_url, resources, created_at, updated_at')
      .in('id', meetingIds)
      .gte('scheduled_at', now)
      .in('status', ['scheduled', 'live'])
      .order('scheduled_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data || []) as any;
  }

  // Get a single meeting by ID
  async getMeeting(meetingId: string): Promise<AdvisorMeeting | null> {
    const { data, error } = await supabase
      .from('advisor_meetings')
      .select('id, title, description, scheduled_at, duration_minutes, room_name, room_password, host_id, status, meeting_type, max_participants, recording_url, resources, created_at, updated_at')
      .eq('id', meetingId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  }

  // Get live meetings
  async getLiveMeetings(): Promise<AdvisorMeeting[]> {
    const { data, error } = await supabase
      .from('advisor_meetings')
      .select('id, title, description, scheduled_at, duration_minutes, room_name, room_password, host_id, status, meeting_type, max_participants, recording_url, resources, created_at, updated_at')
      .eq('status', 'live')
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return (data || []) as any;
  }

  // Create a new meeting
  async createMeeting(
    meeting: Omit<AdvisorMeeting, 'id' | 'created_at' | 'updated_at' | 'room_name'>
  ): Promise<AdvisorMeeting> {
    const roomName = this.generateRoomName();

    const { data, error } = await supabase
      .from('advisor_meetings')
      .insert({
        ...meeting,
        room_name: roomName,
      })
      .select('id, title, description, scheduled_at, duration_minutes, room_name, room_password, host_id, status, meeting_type, max_participants, recording_url, resources, created_at, updated_at')
      .single();

    if (error) throw error;
    return data as any;
  }

  // Update a meeting
  async updateMeeting(
    meetingId: string,
    updates: Partial<Omit<AdvisorMeeting, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<AdvisorMeeting> {
    const { data, error } = await supabase
      .from('advisor_meetings')
      .update(updates)
      .eq('id', meetingId)
      .select('id, title, description, scheduled_at, duration_minutes, room_name, room_password, host_id, status, meeting_type, max_participants, recording_url, resources, created_at, updated_at')
      .single();

    if (error) throw error;
    return data as any;
  }

  // Start a meeting (set to live)
  async startMeeting(meetingId: string): Promise<AdvisorMeeting> {
    return this.updateMeeting(meetingId, { status: 'live' });
  }

  // End a meeting
  async endMeeting(meetingId: string, recordingUrl?: string): Promise<AdvisorMeeting> {
    return this.updateMeeting(meetingId, {
      status: 'completed',
      recording_url: recordingUrl,
    });
  }

  // Cancel a meeting
  async cancelMeeting(meetingId: string): Promise<AdvisorMeeting> {
    return this.updateMeeting(meetingId, { status: 'cancelled' });
  }

  // Get meeting invitations for an advisor
  async getInvitations(advisorId: string): Promise<MeetingInvitation[]> {
    const { data, error } = await supabase
      .from('meeting_invitations')
      .select('id, meeting_id, advisor_id, status, responded_at, reminder_sent, created_at, meeting:advisor_meetings(id, title, description, scheduled_at, duration_minutes, room_name, room_password, host_id, status, meeting_type, max_participants, recording_url, resources, created_at, updated_at)')
      .eq('advisor_id', advisorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as any;
  }

  // Get invitations for a meeting
  async getMeetingInvitations(meetingId: string): Promise<MeetingInvitation[]> {
    const { data, error } = await supabase
      .from('meeting_invitations')
      .select('id, meeting_id, advisor_id, status, responded_at, reminder_sent, created_at, advisor:advisor_profiles(id, user_id, org_id, first_name, last_name, email, phone, specialization, bio, avatar_url, agent_id, company_name, must_change_password, status, training_completed, training_completed_at, onboarding_completed, onboarding_completed_at, created_at, updated_at)')
      .eq('meeting_id', meetingId);

    if (error) throw error;
    return (data || []) as any;
  }

  // Send invitations to multiple advisors
  async sendInvitations(
    meetingId: string,
    advisorIds: string[]
  ): Promise<MeetingInvitation[]> {
    const invitations = advisorIds.map(advisorId => ({
      meeting_id: meetingId,
      advisor_id: advisorId,
      status: 'pending' as const,
      reminder_sent: false,
    }));

    const { data, error } = await supabase
      .from('meeting_invitations')
      .insert(invitations)
      .select('id, meeting_id, advisor_id, status, responded_at, reminder_sent, created_at');

    if (error) throw error;
    return (data || []) as any;
  }

  // Respond to an invitation
  async respondToInvitation(
    invitationId: string,
    status: 'accepted' | 'declined' | 'tentative'
  ): Promise<MeetingInvitation> {
    const { data, error } = await supabase
      .from('meeting_invitations')
      .update({
        status,
        responded_at: new Date().toISOString(),
      })
      .eq('id', invitationId)
      .select('id, meeting_id, advisor_id, status, responded_at, reminder_sent, created_at')
      .single();

    if (error) throw error;
    return data as any;
  }

  // Record attendance
  async recordAttendance(
    meetingId: string,
    advisorId: string
  ): Promise<MeetingAttendee> {
    // Check if already recorded
    const { data: existing } = await supabase
      .from('meeting_attendees')
      .select('id, meeting_id, advisor_id, joined_at, left_at, duration_minutes')
      .eq('meeting_id', meetingId)
      .eq('advisor_id', advisorId)
      .single();

    if (existing) {
      return existing;
    }

    const { data, error } = await supabase
      .from('meeting_attendees')
      .insert({
        meeting_id: meetingId,
        advisor_id: advisorId,
        joined_at: new Date().toISOString(),
      })
      .select('id, meeting_id, advisor_id, joined_at, left_at, duration_minutes')
      .single();

    if (error) throw error;
    return data as any;
  }

  // Record leaving a meeting
  async recordLeave(
    meetingId: string,
    advisorId: string
  ): Promise<MeetingAttendee | null> {
    const { data: attendee } = await supabase
      .from('meeting_attendees')
      .select('id, meeting_id, advisor_id, joined_at, left_at, duration_minutes')
      .eq('meeting_id', meetingId)
      .eq('advisor_id', advisorId)
      .single();

    if (!attendee) return null;

    const joinedAt = new Date(attendee.joined_at);
    const leftAt = new Date();
    const durationMinutes = Math.round(
      (leftAt.getTime() - joinedAt.getTime()) / 60000
    );

    const { data, error } = await supabase
      .from('meeting_attendees')
      .update({
        left_at: leftAt.toISOString(),
        duration_minutes: durationMinutes,
      })
      .eq('id', attendee.id)
      .select('id, meeting_id, advisor_id, joined_at, left_at, duration_minutes')
      .single();

    if (error) throw error;
    return data as any;
  }

  // Get attendees for a meeting
  async getAttendees(meetingId: string): Promise<MeetingAttendee[]> {
    const { data, error } = await supabase
      .from('meeting_attendees')
      .select('id, meeting_id, advisor_id, joined_at, left_at, duration_minutes, advisor:advisor_profiles(id, user_id, org_id, first_name, last_name, email, phone, specialization, bio, avatar_url, agent_id, company_name, must_change_password, status, training_completed, training_completed_at, onboarding_completed, onboarding_completed_at, created_at, updated_at)')
      .eq('meeting_id', meetingId);

    if (error) throw error;
    return (data || []) as any;
  }

  // Get meeting templates
  async getTemplates(): Promise<MeetingTemplate[]> {
    const { data, error } = await supabase
      .from('meeting_templates')
      .select('id, name, description, default_duration, default_type, agenda_template, resources')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as any;
  }

  // Create meeting from template
  async createFromTemplate(
    templateId: string,
    overrides: Partial<AdvisorMeeting>
  ): Promise<AdvisorMeeting> {
    const { data: template, error: tError } = await supabase
      .from('meeting_templates')
      .select('id, name, description, default_duration, default_type, agenda_template, resources')
      .eq('id', templateId)
      .single();

    if (tError) throw tError;
    if (!template) throw new Error('Template not found');

    return this.createMeeting({
      title: overrides.title || template.name,
      description: overrides.description || template.description,
      scheduled_at: overrides.scheduled_at || new Date().toISOString(),
      duration_minutes: overrides.duration_minutes || template.default_duration,
      meeting_type: (overrides.meeting_type || template.default_type) as AdvisorMeeting['meeting_type'],
      status: 'scheduled',
      host_id: overrides.host_id || null,
      room_password: overrides.room_password || null,
      max_participants: overrides.max_participants || null,
      recording_url: null,
      resources: template.resources || [],
    });
  }

  // Generate Jitsi room URL
  getJitsiUrl(meeting: AdvisorMeeting): string {
    const baseUrl = `https://${JITSI_CONFIG.domain}/${meeting.room_name}`;
    const params = new URLSearchParams();

    if (meeting.room_password) {
      params.set('roomPassword', meeting.room_password);
    }

    return params.toString() ? `${baseUrl}?${params}` : baseUrl;
  }

  // Get Jitsi config for embedding
  getJitsiConfig(meeting: AdvisorMeeting, displayName: string) {
    return {
      ...JITSI_CONFIG,
      roomName: meeting.room_name,
      userInfo: {
        displayName,
      },
      ...(meeting.room_password && {
        password: meeting.room_password,
      }),
    };
  }

  // Generate unique room name
  private generateRoomName(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `mpb-${timestamp}-${random}`;
  }

  // Subscribe to meeting updates
  subscribeMeetingUpdates(
    meetingId: string,
    callback: (meeting: AdvisorMeeting) => void
  ) {
    return supabase
      .channel(`meeting:${meetingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'advisor_meetings',
          filter: `id=eq.${meetingId}`,
        },
        (payload) => {
          callback(payload.new as AdvisorMeeting);
        }
      )
      .subscribe();
  }

  // Subscribe to live meetings
  subscribeLiveMeetings(callback: (meetings: AdvisorMeeting[]) => void) {
    return supabase
      .channel('live-meetings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'advisor_meetings',
          filter: 'status=eq.live',
        },
        async () => {
          const meetings = await this.getLiveMeetings();
          callback(meetings);
        }
      )
      .subscribe();
  }
}

export const meetingService = new MeetingService();
