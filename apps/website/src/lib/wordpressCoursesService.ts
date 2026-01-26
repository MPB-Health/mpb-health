import { supabase } from './supabase';

export interface WordPressCourse {
  id: string;
  wp_course_id: number;
  slug: string;
  title: string;
  description: string | null;
  summary_bullets: string[];
  category: string | null;
  level: string;
  status: string;
  language: string;
  is_password_protected: boolean;
  password: string | null;
  password_hint: string | null;
  thumbnail_url: string | null;
  duration_minutes: number;
  completions_count: number;
  start_timestamp: number | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CourseFilters {
  category?: string;
  level?: string;
  language?: string;
  search?: string;
}

export const wordpressCoursesService = {
  /**
   * Get all active published courses
   */
  async getCourses(filters?: CourseFilters): Promise<WordPressCourse[]> {
    try {
      let query = supabase
        .from('wordpress_courses')
        .select('*')
        .eq('is_active', true)
        .eq('status', 'publish')
        .order('completions_count', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.level) {
        query = query.eq('level', filters.level);
      }

      if (filters?.language) {
        query = query.eq('language', filters.language);
      }

      if (filters?.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('[WordPressCoursesService] Error fetching courses:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[WordPressCoursesService] Error in getCourses:', error);
      return [];
    }
  },

  /**
   * Get a single course by slug
   */
  async getCourseBySlug(slug: string): Promise<WordPressCourse | null> {
    try {
      const { data, error } = await supabase
        .from('wordpress_courses')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('[WordPressCoursesService] Error fetching course:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[WordPressCoursesService] Error in getCourseBySlug:', error);
      return null;
    }
  },

  /**
   * Get unique categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('wordpress_courses')
        .select('category')
        .eq('is_active', true)
        .eq('status', 'publish')
        .not('category', 'is', null);

      if (error) {
        console.error('[WordPressCoursesService] Error fetching categories:', error);
        return [];
      }

      const categories = [...new Set(data?.map(item => item.category).filter(Boolean) || [])];
      return categories.sort();
    } catch (error) {
      console.error('[WordPressCoursesService] Error in getCategories:', error);
      return [];
    }
  },

  /**
   * Check if course password is correct
   */
  validateCoursePassword(course: WordPressCourse, enteredPassword: string): boolean {
    if (!course.is_password_protected) {
      return true;
    }

    return course.password === enteredPassword;
  },

  /**
   * Check if course is unlocked in session storage
   */
  isCourseUnlocked(slug: string): boolean {
    if (typeof window === 'undefined') return false;

    const key = `mpb:course:${slug}:unlocked`;
    return sessionStorage.getItem(key) === 'true';
  },

  /**
   * Unlock course in session storage
   */
  unlockCourse(slug: string): void {
    if (typeof window === 'undefined') return;

    const key = `mpb:course:${slug}:unlocked`;
    sessionStorage.setItem(key, 'true');
  },

  /**
   * Get friendly level name
   */
  getLevelName(level: string): string {
    const levels: Record<string, string> = {
      'all_levels': 'All Levels',
      'beginner': 'Beginner',
      'intermediate': 'Intermediate',
      'advanced': 'Advanced',
    };

    return levels[level] || level;
  },

  /**
   * Get friendly language name
   */
  getLanguageName(language: string): string {
    const languages: Record<string, string> = {
      'en': 'English',
      'pt-BR': 'Português (Brasil)',
      'es': 'Español',
    };

    return languages[language] || language;
  },

  /**
   * Format category for display
   */
  formatCategory(category: string | null): string {
    if (!category) return 'Uncategorized';

    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },
};
