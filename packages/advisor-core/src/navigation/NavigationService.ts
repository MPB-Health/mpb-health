import { supabase } from '@mpbhealth/database';

export interface NavMenuItem {
  id: string;
  label: string;
  url: string | null;
  icon: string;
  parent_id: string | null;
  order_index: number;
  is_active: boolean;
  is_external: boolean;
  requires_auth: boolean;
  badge_text: string | null;
  badge_color: string;
  created_at: string;
  updated_at: string;
  // For nested items
  children?: NavMenuItem[];
}

export interface QuickLink {
  id: string;
  label: string;
  url: string;
  icon: string;
  description: string | null;
  order_index: number;
  is_external: boolean;
  is_active: boolean;
  requires_auth: boolean;
  category: 'resources' | 'advisor_forms' | 'employer_forms' | 'member_forms' | 'bulletins' | 'dashboard_actions';
  created_at: string;
  updated_at: string;
}

export class NavigationService {
  // Get all navigation menu items
  async getNavMenuItems(): Promise<NavMenuItem[]> {
    const { data, error } = await supabase
      .from('advisor_nav_menu')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return this.buildNavigationTree(data || []);
  }

  // Get flat list of navigation items (no hierarchy)
  async getNavMenuItemsFlat(): Promise<NavMenuItem[]> {
    const { data, error } = await supabase
      .from('advisor_nav_menu')
      .select('*')
      .eq('is_active', true)
      .is('parent_id', null) // Only top-level items
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Build a tree structure from flat list
  private buildNavigationTree(items: NavMenuItem[]): NavMenuItem[] {
    const itemMap = new Map<string, NavMenuItem>();
    const rootItems: NavMenuItem[] = [];

    // First pass: create all items with empty children array
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Second pass: build the tree
    items.forEach(item => {
      const mappedItem = itemMap.get(item.id)!;
      if (item.parent_id && itemMap.has(item.parent_id)) {
        itemMap.get(item.parent_id)!.children!.push(mappedItem);
      } else {
        rootItems.push(mappedItem);
      }
    });

    // Sort children by order_index
    rootItems.forEach(item => {
      if (item.children) {
        item.children.sort((a, b) => a.order_index - b.order_index);
      }
    });

    return rootItems;
  }

  // Subscribe to navigation menu changes
  subscribeToNavMenuChanges(callback: (items: NavMenuItem[]) => void) {
    return supabase
      .channel('advisor-nav-menu-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'advisor_nav_menu',
        },
        async () => {
          // Refetch all items on any change
          const items = await this.getNavMenuItems();
          callback(items);
        }
      )
      .subscribe();
  }

  // ========== Quick Links ==========

  // Get all quick links
  async getQuickLinks(category?: string): Promise<QuickLink[]> {
    let query = supabase
      .from('advisor_quick_links')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Get quick links for dashboard (dashboard_actions category, or if not found, first 6 active links)
  async getDashboardQuickActions(): Promise<QuickLink[]> {
    // First try to get dashboard-specific actions
    const { data: dashboardActions, error: dashboardError } = await supabase
      .from('advisor_quick_links')
      .select('*')
      .eq('is_active', true)
      .eq('category', 'dashboard_actions')
      .order('order_index', { ascending: true })
      .limit(8);

    if (!dashboardError && dashboardActions && dashboardActions.length > 0) {
      return dashboardActions;
    }

    // Fallback: get first 6 active links regardless of category
    const { data: fallbackLinks, error: fallbackError } = await supabase
      .from('advisor_quick_links')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .limit(8);

    if (fallbackError) throw fallbackError;
    return fallbackLinks || [];
  }

  // Get quick links grouped by category
  async getQuickLinksByCategory(): Promise<Record<string, QuickLink[]>> {
    const links = await this.getQuickLinks();
    
    return links.reduce((acc, link) => {
      if (!acc[link.category]) {
        acc[link.category] = [];
      }
      acc[link.category].push(link);
      return acc;
    }, {} as Record<string, QuickLink[]>);
  }

  // Subscribe to quick link changes
  subscribeToQuickLinkChanges(callback: (links: QuickLink[]) => void) {
    return supabase
      .channel('advisor-quick-links-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'advisor_quick_links',
        },
        async () => {
          const links = await this.getQuickLinks();
          callback(links);
        }
      )
      .subscribe();
  }
}

export const navigationService = new NavigationService();
