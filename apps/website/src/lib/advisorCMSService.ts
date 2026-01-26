import { supabase } from './supabase';

// ============================================================================
// Types
// ============================================================================

export interface AdvisorCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon: string;
  type: 'training' | 'sop' | 'content' | 'all';
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export type QuickLinkCategory = 'resources' | 'advisor_forms' | 'employer_forms' | 'member_forms' | 'bulletins';

export const QUICK_LINK_CATEGORIES: { value: QuickLinkCategory; label: string; icon: string }[] = [
  { value: 'resources', label: 'Resources', icon: 'FolderOpen' },
  { value: 'advisor_forms', label: 'Advisor Forms', icon: 'FileText' },
  { value: 'employer_forms', label: 'Employee Forms', icon: 'Building2' },
  { value: 'member_forms', label: 'Member Forms', icon: 'Users' },
  { value: 'bulletins', label: 'Bulletins', icon: 'Newspaper' },
];

export interface AdvisorQuickLink {
  id: string;
  label: string;
  url: string;
  icon: string;
  description?: string;
  category: QuickLinkCategory;
  order_index: number;
  is_external: boolean;
  is_active: boolean;
  requires_auth: boolean;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface AdvisorLearningPath {
  id: string;
  title: string;
  description?: string;
  category_slug?: string;
  icon: string;
  gradient: string;
  estimated_hours: number;
  is_required: boolean;
  unlock_requirements?: {
    category?: string;
    categories?: string[];
    min_completed?: number;
  };
  order_index: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  // Computed fields (populated by frontend)
  totalModules?: number;
  completedModules?: number;
  isLocked?: boolean;
}

export interface AdvisorDashboardWidget {
  id: string;
  widget_key: string;
  label: string;
  description?: string;
  order_index: number;
  is_visible: boolean;
  grid_column: 'full' | 'left' | 'right';
  config?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface AdvisorNavMenuItem {
  id: string;
  label: string;
  url?: string;
  icon: string;
  parent_id?: string;
  order_index: number;
  is_active: boolean;
  is_external: boolean;
  requires_auth: boolean;
  badge_text?: string;
  badge_color?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  children?: AdvisorNavMenuItem[];
}

export interface AdvisorAnnouncement {
  id: string;
  title: string;
  content?: string;
  content_html?: string;
  type: 'info' | 'warning' | 'success' | 'error';
  start_date: string;
  end_date?: string;
  is_dismissible: boolean;
  is_active: boolean;
  target_audience: 'all' | 'new_advisors' | 'certified';
  link_url?: string;
  link_text?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

// ============================================================================
// Advisor CMS Service Class
// ============================================================================

class AdvisorCMSService {
  // ==========================================================================
  // Categories
  // ==========================================================================

  async getCategories(type?: string): Promise<AdvisorCategory[]> {
    try {
      let query = supabase
        .from('advisor_categories')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (type) {
        query = query.or(`type.eq.${type},type.eq.all`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get categories:', error);
        return [];
      }

      return data as AdvisorCategory[];
    } catch (error) {
      console.error('Get categories error:', error);
      return [];
    }
  }

  async getAllCategories(): Promise<AdvisorCategory[]> {
    try {
      const { data, error } = await supabase
        .from('advisor_categories')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Failed to get all categories:', error);
        return [];
      }

      return data as AdvisorCategory[];
    } catch (error) {
      console.error('Get all categories error:', error);
      return [];
    }
  }

  async createCategory(category: Omit<AdvisorCategory, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('advisor_categories')
        .insert(category)
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, id: data?.id };
    } catch (error) {
      console.error('Create category error:', error);
      return { success: false, error: 'Failed to create category' };
    }
  }

  async updateCategory(id: string, updates: Partial<AdvisorCategory>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('advisor_categories')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update category error:', error);
      return { success: false, error: 'Failed to update category' };
    }
  }

  async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('advisor_categories')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete category error:', error);
      return { success: false, error: 'Failed to delete category' };
    }
  }

  // ==========================================================================
  // Quick Links
  // ==========================================================================

  async getQuickLinks(): Promise<AdvisorQuickLink[]> {
    try {
      const { data, error } = await supabase
        .from('advisor_quick_links')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Failed to get quick links:', error);
        return [];
      }

      return data as AdvisorQuickLink[];
    } catch (error) {
      console.error('Get quick links error:', error);
      return [];
    }
  }

  async getAllQuickLinks(): Promise<AdvisorQuickLink[]> {
    try {
      const { data, error } = await supabase
        .from('advisor_quick_links')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Failed to get all quick links:', error);
        return [];
      }

      return data as AdvisorQuickLink[];
    } catch (error) {
      console.error('Get all quick links error:', error);
      return [];
    }
  }

  async createQuickLink(link: Omit<AdvisorQuickLink, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('advisor_quick_links')
        .insert({ ...link, created_by: user?.id })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, id: data?.id };
    } catch (error) {
      console.error('Create quick link error:', error);
      return { success: false, error: 'Failed to create quick link' };
    }
  }

  async updateQuickLink(id: string, updates: Partial<AdvisorQuickLink>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('advisor_quick_links')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update quick link error:', error);
      return { success: false, error: 'Failed to update quick link' };
    }
  }

  async deleteQuickLink(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('advisor_quick_links')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete quick link error:', error);
      return { success: false, error: 'Failed to delete quick link' };
    }
  }

  async reorderQuickLinks(orderedIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const updates = orderedIds.map((id, index) => ({
        id,
        order_index: index + 1,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('advisor_quick_links')
          .update({ order_index: update.order_index })
          .eq('id', update.id);

        if (error) {
          return { success: false, error: error.message };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Reorder quick links error:', error);
      return { success: false, error: 'Failed to reorder quick links' };
    }
  }

  async getQuickLinksByCategory(): Promise<Record<QuickLinkCategory, AdvisorQuickLink[]>> {
    try {
      const links = await this.getQuickLinks();

      const grouped: Record<QuickLinkCategory, AdvisorQuickLink[]> = {
        resources: [],
        advisor_forms: [],
        employer_forms: [],
        member_forms: [],
        bulletins: [],
      };

      for (const link of links) {
        const category = link.category || 'resources';
        if (grouped[category]) {
          grouped[category].push(link);
        } else {
          grouped.resources.push(link);
        }
      }

      return grouped;
    } catch (error) {
      console.error('Get quick links by category error:', error);
      return { resources: [], advisor_forms: [], employer_forms: [], member_forms: [], bulletins: [] };
    }
  }

  // ==========================================================================
  // Learning Paths
  // ==========================================================================

  async getLearningPaths(): Promise<AdvisorLearningPath[]> {
    try {
      const { data, error } = await supabase
        .from('advisor_learning_paths')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Failed to get learning paths:', error);
        return [];
      }

      return data as AdvisorLearningPath[];
    } catch (error) {
      console.error('Get learning paths error:', error);
      return [];
    }
  }

  async getAllLearningPaths(): Promise<AdvisorLearningPath[]> {
    try {
      const { data, error } = await supabase
        .from('advisor_learning_paths')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Failed to get all learning paths:', error);
        return [];
      }

      return data as AdvisorLearningPath[];
    } catch (error) {
      console.error('Get all learning paths error:', error);
      return [];
    }
  }

  async createLearningPath(path: Omit<AdvisorLearningPath, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('advisor_learning_paths')
        .insert({ ...path, created_by: user?.id })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, id: data?.id };
    } catch (error) {
      console.error('Create learning path error:', error);
      return { success: false, error: 'Failed to create learning path' };
    }
  }

  async updateLearningPath(id: string, updates: Partial<AdvisorLearningPath>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('advisor_learning_paths')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update learning path error:', error);
      return { success: false, error: 'Failed to update learning path' };
    }
  }

  async deleteLearningPath(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('advisor_learning_paths')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete learning path error:', error);
      return { success: false, error: 'Failed to delete learning path' };
    }
  }

  async reorderLearningPaths(orderedIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const updates = orderedIds.map((id, index) => ({
        id,
        order_index: index + 1,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('advisor_learning_paths')
          .update({ order_index: update.order_index })
          .eq('id', update.id);

        if (error) {
          return { success: false, error: error.message };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Reorder learning paths error:', error);
      return { success: false, error: 'Failed to reorder learning paths' };
    }
  }

  // ==========================================================================
  // Dashboard Widgets
  // ==========================================================================

  async getDashboardWidgets(): Promise<AdvisorDashboardWidget[]> {
    try {
      const { data, error } = await supabase
        .from('advisor_dashboard_widgets')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Failed to get dashboard widgets:', error);
        return [];
      }

      return data as AdvisorDashboardWidget[];
    } catch (error) {
      console.error('Get dashboard widgets error:', error);
      return [];
    }
  }

  async getVisibleDashboardWidgets(): Promise<AdvisorDashboardWidget[]> {
    try {
      const { data, error } = await supabase
        .from('advisor_dashboard_widgets')
        .select('*')
        .eq('is_visible', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Failed to get visible dashboard widgets:', error);
        return [];
      }

      return data as AdvisorDashboardWidget[];
    } catch (error) {
      console.error('Get visible dashboard widgets error:', error);
      return [];
    }
  }

  async updateDashboardWidget(id: string, updates: Partial<AdvisorDashboardWidget>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('advisor_dashboard_widgets')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update dashboard widget error:', error);
      return { success: false, error: 'Failed to update dashboard widget' };
    }
  }

  async reorderDashboardWidgets(orderedIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const updates = orderedIds.map((id, index) => ({
        id,
        order_index: index + 1,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('advisor_dashboard_widgets')
          .update({ order_index: update.order_index })
          .eq('id', update.id);

        if (error) {
          return { success: false, error: error.message };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Reorder dashboard widgets error:', error);
      return { success: false, error: 'Failed to reorder dashboard widgets' };
    }
  }

  // ==========================================================================
  // Navigation Menu
  // ==========================================================================

  async getNavMenu(): Promise<AdvisorNavMenuItem[]> {
    try {
      const { data, error } = await supabase
        .from('advisor_nav_menu')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Failed to get nav menu:', error);
        return [];
      }

      // Build hierarchy
      const items = data as AdvisorNavMenuItem[];
      const rootItems = items.filter(item => !item.parent_id);
      
      rootItems.forEach(item => {
        item.children = items.filter(child => child.parent_id === item.id);
      });

      return rootItems;
    } catch (error) {
      console.error('Get nav menu error:', error);
      return [];
    }
  }

  async getAllNavMenuItems(): Promise<AdvisorNavMenuItem[]> {
    try {
      const { data, error } = await supabase
        .from('advisor_nav_menu')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Failed to get all nav menu items:', error);
        return [];
      }

      return data as AdvisorNavMenuItem[];
    } catch (error) {
      console.error('Get all nav menu items error:', error);
      return [];
    }
  }

  async createNavMenuItem(item: Omit<AdvisorNavMenuItem, 'id' | 'created_at' | 'updated_at' | 'children'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('advisor_nav_menu')
        .insert({ ...item, created_by: user?.id })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, id: data?.id };
    } catch (error) {
      console.error('Create nav menu item error:', error);
      return { success: false, error: 'Failed to create nav menu item' };
    }
  }

  async updateNavMenuItem(id: string, updates: Partial<AdvisorNavMenuItem>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('advisor_nav_menu')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update nav menu item error:', error);
      return { success: false, error: 'Failed to update nav menu item' };
    }
  }

  async deleteNavMenuItem(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('advisor_nav_menu')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete nav menu item error:', error);
      return { success: false, error: 'Failed to delete nav menu item' };
    }
  }

  async reorderNavMenu(orderedIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const updates = orderedIds.map((id, index) => ({
        id,
        order_index: index + 1,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('advisor_nav_menu')
          .update({ order_index: update.order_index })
          .eq('id', update.id);

        if (error) {
          return { success: false, error: error.message };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Reorder nav menu error:', error);
      return { success: false, error: 'Failed to reorder nav menu' };
    }
  }

  // ==========================================================================
  // Announcements
  // ==========================================================================

  async getActiveAnnouncements(): Promise<AdvisorAnnouncement[]> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('advisor_announcements')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Failed to get active announcements:', error);
        return [];
      }

      return data as AdvisorAnnouncement[];
    } catch (error) {
      console.error('Get active announcements error:', error);
      return [];
    }
  }

  async getAllAnnouncements(): Promise<AdvisorAnnouncement[]> {
    try {
      const { data, error } = await supabase
        .from('advisor_announcements')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Failed to get all announcements:', error);
        return [];
      }

      return data as AdvisorAnnouncement[];
    } catch (error) {
      console.error('Get all announcements error:', error);
      return [];
    }
  }

  async createAnnouncement(announcement: Omit<AdvisorAnnouncement, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('advisor_announcements')
        .insert({ ...announcement, created_by: user?.id })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, id: data?.id };
    } catch (error) {
      console.error('Create announcement error:', error);
      return { success: false, error: 'Failed to create announcement' };
    }
  }

  async updateAnnouncement(id: string, updates: Partial<AdvisorAnnouncement>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('advisor_announcements')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update announcement error:', error);
      return { success: false, error: 'Failed to update announcement' };
    }
  }

  async deleteAnnouncement(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('advisor_announcements')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete announcement error:', error);
      return { success: false, error: 'Failed to delete announcement' };
    }
  }

  // ==========================================================================
  // Training Modules (Courses)
  // ==========================================================================

  async getTrainingModules(): Promise<TrainingModule[]> {
    try {
      const { data, error } = await supabase
        .from('training_modules')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Failed to get training modules:', error);
        return [];
      }

      return data as TrainingModule[];
    } catch (error) {
      console.error('Get training modules error:', error);
      return [];
    }
  }

  async getAllTrainingModules(): Promise<TrainingModule[]> {
    try {
      const { data, error } = await supabase
        .from('training_modules')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Failed to get all training modules:', error);
        return [];
      }

      return data as TrainingModule[];
    } catch (error) {
      console.error('Get all training modules error:', error);
      return [];
    }
  }

  async createTrainingModule(module: Omit<TrainingModule, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('training_modules')
        .insert(module)
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, id: data?.id };
    } catch (error) {
      console.error('Create training module error:', error);
      return { success: false, error: 'Failed to create training module' };
    }
  }

  async updateTrainingModule(id: string, updates: Partial<TrainingModule>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('training_modules')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update training module error:', error);
      return { success: false, error: 'Failed to update training module' };
    }
  }

  async deleteTrainingModule(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('training_modules')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete training module error:', error);
      return { success: false, error: 'Failed to delete training module' };
    }
  }

  async reorderTrainingModules(orderedIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const updates = orderedIds.map((id, index) => ({
        id,
        order_index: index + 1,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('training_modules')
          .update({ order_index: update.order_index })
          .eq('id', update.id);

        if (error) {
          return { success: false, error: error.message };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Reorder training modules error:', error);
      return { success: false, error: 'Failed to reorder training modules' };
    }
  }
}

// Training Module Type (matches database schema)
export interface TrainingModule {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content_type: 'video' | 'document' | 'interactive' | 'quiz' | 'external_link';
  content_url: string | null;
  content_html?: string | null;
  thumbnail_url?: string | null;
  duration_minutes: number;
  order_index: number;
  is_required: boolean;
  prerequisites: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const advisorCMSService = new AdvisorCMSService();

