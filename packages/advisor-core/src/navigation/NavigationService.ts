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
  category: string;
  image_url: string | null;
  is_popup: boolean;
  created_at: string;
  updated_at: string;
}

export class NavigationService {
  private sortQuickLinks(links: QuickLink[]): QuickLink[] {
    return [...links].sort((a, b) => a.order_index - b.order_index || a.label.localeCompare(b.label));
  }

  private selectPreferredQuickLinks(
    links: QuickLink[],
    preferredCategories: string[],
    limit?: number,
  ): QuickLink[] {
    const activeLinks = this.sortQuickLinks(links.filter((link) => link.is_active));
    const preferredLinks = preferredCategories.flatMap((category) =>
      activeLinks.filter((link) => link.category === category),
    );
    const selectedLinks = preferredLinks.length > 0 ? preferredLinks : activeLinks;

    const seen = new Set<string>();
    const deduped = selectedLinks.filter((link) => {
      const key = `${link.label}::${link.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return typeof limit === 'number'
      ? deduped.slice(0, limit)
      : deduped;
  }

  // Get all navigation menu items
  async getNavMenuItems(): Promise<NavMenuItem[]> {
    const { data, error } = await supabase
      .from('advisor_nav_menu')
      .select('id, label, url, icon, parent_id, order_index, is_active, is_external, requires_auth, badge_text, badge_color, created_at, updated_at')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return this.buildNavigationTree(data || []);
  }

  // Get flat list of navigation items (no hierarchy)
  async getNavMenuItemsFlat(): Promise<NavMenuItem[]> {
    const { data, error } = await supabase
      .from('advisor_nav_menu')
      .select('id, label, url, icon, parent_id, order_index, is_active, is_external, requires_auth, badge_text, badge_color, created_at, updated_at')
      .eq('is_active', true)
      .is('parent_id', null) // Only top-level items
      .order('order_index', { ascending: true });

    if (error) throw error;
    return (data || []) as any;
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
      .select('id, label, url, icon, description, order_index, is_external, is_active, requires_auth, category, image_url, is_popup, created_at, updated_at')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as any;
  }

  selectDashboardQuickLinks(links: QuickLink[], limit = 8): QuickLink[] {
    return this.selectPreferredQuickLinks(links, ['dashboard_actions', 'resource_center', 'resources'], limit);
  }

  selectResourceCenterQuickLinks(links: QuickLink[], limit?: number): QuickLink[] {
    return this.selectPreferredQuickLinks(links, ['resource_center', 'resources', 'dashboard_actions'], limit);
  }

  // Get quick links for dashboard (dashboard_actions category, or if not found, first 6 active links)
  async getDashboardQuickActions(): Promise<QuickLink[]> {
    const links = await this.getQuickLinks();
    return this.selectDashboardQuickLinks(links, 8);
  }

  async getResourceCenterQuickLinks(limit?: number): Promise<QuickLink[]> {
    const links = await this.getQuickLinks();
    return this.selectResourceCenterQuickLinks(links, limit);
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
