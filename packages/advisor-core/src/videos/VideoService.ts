import { supabase } from '@mpbhealth/database';

export interface AdvisorVideo {
  id: string;
  title: string;
  vimeo_id: string;
  vimeo_hash?: string | null;
  thumbnail_url?: string | null;
  description?: string | null;
  order_index: number;
  is_active: boolean;
  category: string;
  tags: string[];
  duration?: string | null;
  created_at: string;
  updated_at: string;
}

export class VideoService {
  async getVideos(): Promise<AdvisorVideo[]> {
    const { data, error } = await supabase
      .from('advisor_videos')
      .select('id, title, vimeo_id, vimeo_hash, thumbnail_url, description, order_index, is_active, category, tags, duration, created_at, updated_at')
      .eq('is_active', true)
      .order('order_index', { ascending: true });
    if (error) throw error;
    return (data || []) as unknown as AdvisorVideo[];
  }

  async getVideo(videoId: string): Promise<AdvisorVideo | null> {
    const { data, error } = await supabase
      .from('advisor_videos')
      .select('id, title, vimeo_id, vimeo_hash, thumbnail_url, description, order_index, is_active, category, tags, duration, created_at, updated_at')
      .eq('id', videoId)
      .single();
    if (error) throw error;
    return data as unknown as AdvisorVideo;
  }

  async createVideo(video: Omit<AdvisorVideo, 'id' | 'created_at' | 'updated_at'>): Promise<AdvisorVideo> {
    const { data, error } = await supabase
      .from('advisor_videos')
      .insert(video)
      .select('id, title, vimeo_id, vimeo_hash, thumbnail_url, description, order_index, is_active, category, tags, duration, created_at, updated_at')
      .single();
    if (error) throw error;
    return data as unknown as AdvisorVideo;
  }

  async updateVideo(videoId: string, updates: Partial<AdvisorVideo>): Promise<AdvisorVideo> {
    const { data, error } = await supabase
      .from('advisor_videos')
      .update(updates)
      .eq('id', videoId)
      .select('id, title, vimeo_id, vimeo_hash, thumbnail_url, description, order_index, is_active, category, tags, duration, created_at, updated_at')
      .single();
    if (error) throw error;
    return data as unknown as AdvisorVideo;
  }

  async deleteVideo(videoId: string): Promise<void> {
    const { error } = await supabase
      .from('advisor_videos')
      .delete()
      .eq('id', videoId);
    if (error) throw error;
  }

  async reorderVideos(videoIds: string[]): Promise<void> {
    const updates = videoIds.map((id, index) => 
      supabase.from('advisor_videos').update({ order_index: index }).eq('id', id)
    );
    await Promise.all(updates);
  }

  subscribeToVideoChanges(callback: (videos: AdvisorVideo[]) => void) {
    return supabase
      .channel('advisor-videos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'advisor_videos' }, async () => {
        const videos = await this.getVideos();
        callback(videos);
      })
      .subscribe();
  }
}

export const videoService = new VideoService();
