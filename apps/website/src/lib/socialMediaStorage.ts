// Social Media Posts Local Storage Service
// Provides CRUD operations for tracking social media posts and budgets

export type Platform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube' | 'pinterest';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'archived';
export type PostType = 'image' | 'video' | 'carousel' | 'story' | 'reel' | 'text';

export interface SocialMediaPost {
  id: string;
  platform: Platform;
  post_date: string;
  scheduled_time?: string;
  status: PostStatus;
  budget_spent: number;
  impressions: number;
  clicks: number;
  engagement: number;
  reach: number;
  link_clicks: number;
  post_type: PostType;
  content_description: string;
  utm_campaign?: string;
  target_audience?: string;
  ab_test_group?: string;
  created_at: string;
  updated_at: string;
}

export interface SocialMediaSummary {
  totalPosts: number;
  totalBudget: number;
  totalImpressions: number;
  totalClicks: number;
  totalEngagement: number;
  totalReach: number;
  avgEngagementRate: number;
  postsByPlatform: Record<Platform, number>;
  postsByStatus: Record<PostStatus, number>;
}

const STORAGE_KEY = 'mpb_social_media_posts';

const generateId = (): string => {
  return `sm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const socialMediaStorage = {
  // Get all posts
  getPosts(): SocialMediaPost[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading social media posts from localStorage:', error);
      return [];
    }
  },

  // Get a single post by ID
  getPost(id: string): SocialMediaPost | null {
    const posts = this.getPosts();
    return posts.find(post => post.id === id) || null;
  },

  // Create a new post
  createPost(post: Omit<SocialMediaPost, 'id' | 'created_at' | 'updated_at'>): SocialMediaPost {
    const posts = this.getPosts();
    const now = new Date().toISOString();
    
    const newPost: SocialMediaPost = {
      ...post,
      id: generateId(),
      created_at: now,
      updated_at: now,
    };

    posts.push(newPost);
    this.savePosts(posts);
    return newPost;
  },

  // Update an existing post
  updatePost(id: string, updates: Partial<Omit<SocialMediaPost, 'id' | 'created_at'>>): SocialMediaPost | null {
    const posts = this.getPosts();
    const index = posts.findIndex(post => post.id === id);
    
    if (index === -1) return null;

    posts[index] = {
      ...posts[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.savePosts(posts);
    return posts[index];
  },

  // Delete a post
  deletePost(id: string): boolean {
    const posts = this.getPosts();
    const index = posts.findIndex(post => post.id === id);
    
    if (index === -1) return false;

    posts.splice(index, 1);
    this.savePosts(posts);
    return true;
  },

  // Save posts to localStorage
  savePosts(posts: SocialMediaPost[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch (error) {
      console.error('Error saving social media posts to localStorage:', error);
      throw new Error('Failed to save data. Storage may be full.');
    }
  },

  // Get posts with filters
  getFilteredPosts(filters: {
    platform?: Platform;
    status?: PostStatus;
    postType?: PostType;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): SocialMediaPost[] {
    let posts = this.getPosts();

    if (filters.platform) {
      posts = posts.filter(p => p.platform === filters.platform);
    }

    if (filters.status) {
      posts = posts.filter(p => p.status === filters.status);
    }

    if (filters.postType) {
      posts = posts.filter(p => p.post_type === filters.postType);
    }

    if (filters.startDate) {
      posts = posts.filter(p => p.post_date >= filters.startDate!);
    }

    if (filters.endDate) {
      posts = posts.filter(p => p.post_date <= filters.endDate!);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      posts = posts.filter(p => 
        p.content_description.toLowerCase().includes(searchLower) ||
        p.utm_campaign?.toLowerCase().includes(searchLower) ||
        p.target_audience?.toLowerCase().includes(searchLower)
      );
    }

    return posts;
  },

  // Get summary statistics
  getSummary(): SocialMediaSummary {
    const posts = this.getPosts();
    
    const postsByPlatform: Record<Platform, number> = {
      facebook: 0,
      instagram: 0,
      twitter: 0,
      linkedin: 0,
      tiktok: 0,
      youtube: 0,
      pinterest: 0,
    };

    const postsByStatus: Record<PostStatus, number> = {
      draft: 0,
      scheduled: 0,
      published: 0,
      archived: 0,
    };

    let totalBudget = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalEngagement = 0;
    let totalReach = 0;

    posts.forEach(post => {
      postsByPlatform[post.platform]++;
      postsByStatus[post.status]++;
      totalBudget += post.budget_spent || 0;
      totalImpressions += post.impressions || 0;
      totalClicks += post.clicks || 0;
      totalEngagement += post.engagement || 0;
      totalReach += post.reach || 0;
    });

    const avgEngagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

    return {
      totalPosts: posts.length,
      totalBudget,
      totalImpressions,
      totalClicks,
      totalEngagement,
      totalReach,
      avgEngagementRate,
      postsByPlatform,
      postsByStatus,
    };
  },

  // Export to CSV
  exportToCSV(): string {
    const posts = this.getPosts();
    
    const headers = [
      'ID',
      'Platform',
      'Post Date',
      'Scheduled Time',
      'Status',
      'Budget Spent',
      'Impressions',
      'Clicks',
      'Engagement',
      'Reach',
      'Link Clicks',
      'Post Type',
      'Content Description',
      'UTM Campaign',
      'Target Audience',
      'A/B Test Group',
      'Created At',
      'Updated At',
    ];

    const rows = posts.map(post => [
      post.id,
      post.platform,
      post.post_date,
      post.scheduled_time || '',
      post.status,
      post.budget_spent,
      post.impressions,
      post.clicks,
      post.engagement,
      post.reach,
      post.link_clicks,
      post.post_type,
      `"${(post.content_description || '').replace(/"/g, '""')}"`,
      post.utm_campaign || '',
      post.target_audience || '',
      post.ab_test_group || '',
      post.created_at,
      post.updated_at,
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  },

  // Download CSV file
  downloadCSV(filename?: string): void {
    const csv = this.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `social-media-tracker-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  },

  // Import from CSV (basic implementation)
  importFromCSV(csvContent: string): { imported: number; errors: string[] } {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const errors: string[] = [];
    let imported = 0;

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',');
        if (values.length < 12) {
          errors.push(`Row ${i + 1}: Not enough columns`);
          continue;
        }

        this.createPost({
          platform: values[1] as Platform,
          post_date: values[2],
          scheduled_time: values[3] || undefined,
          status: values[4] as PostStatus,
          budget_spent: parseFloat(values[5]) || 0,
          impressions: parseInt(values[6]) || 0,
          clicks: parseInt(values[7]) || 0,
          engagement: parseInt(values[8]) || 0,
          reach: parseInt(values[9]) || 0,
          link_clicks: parseInt(values[10]) || 0,
          post_type: values[11] as PostType,
          content_description: values[12]?.replace(/^"|"$/g, '').replace(/""/g, '"') || '',
          utm_campaign: values[13] || undefined,
          target_audience: values[14] || undefined,
          ab_test_group: values[15] || undefined,
        });

        imported++;
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
      }
    }

    return { imported, errors };
  },

  // Clear all posts
  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};

// Platform display names and colors
export const platformConfig: Record<Platform, { name: string; color: string; bgColor: string }> = {
  facebook: { name: 'Facebook', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  instagram: { name: 'Instagram', color: 'text-pink-600', bgColor: 'bg-pink-100' },
  twitter: { name: 'Twitter/X', color: 'text-sky-600', bgColor: 'bg-sky-100' },
  linkedin: { name: 'LinkedIn', color: 'text-blue-800', bgColor: 'bg-blue-200' },
  tiktok: { name: 'TikTok', color: 'text-neutral-900', bgColor: 'bg-neutral-200' },
  youtube: { name: 'YouTube', color: 'text-red-600', bgColor: 'bg-red-100' },
  pinterest: { name: 'Pinterest', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const postTypeConfig: Record<PostType, string> = {
  image: 'Image',
  video: 'Video',
  carousel: 'Carousel',
  story: 'Story',
  reel: 'Reel',
  text: 'Text',
};

export const statusConfig: Record<PostStatus, { name: string; color: string; bgColor: string }> = {
  draft: { name: 'Draft', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
  scheduled: { name: 'Scheduled', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  published: { name: 'Published', color: 'text-green-700', bgColor: 'bg-green-100' },
  archived: { name: 'Archived', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

