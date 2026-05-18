export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      _deprecated_leads: {
        Row: {
          address: Json | null
          assigned_advisor_id: string | null
          assigned_to: string | null
          company: string | null
          created_at: string
          custom_fields: Json | null
          email: string | null
          first_name: string | null
          id: string
          job_title: string | null
          last_contacted_at: string | null
          last_name: string | null
          metadata: Json | null
          next_follow_up_at: string | null
          org_id: string
          phone: string | null
          score: number | null
          source: string | null
          source_campaign: string | null
          source_medium: string | null
          status: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          assigned_advisor_id?: string | null
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          metadata?: Json | null
          next_follow_up_at?: string | null
          org_id: string
          phone?: string | null
          score?: number | null
          source?: string | null
          source_campaign?: string | null
          source_medium?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          assigned_advisor_id?: string | null
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          metadata?: Json | null
          next_follow_up_at?: string | null
          org_id?: string
          phone?: string | null
          score?: number | null
          source?: string | null
          source_campaign?: string | null
          source_medium?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          actor_id: string | null
          actor_type: string
          contact_id: string | null
          conversation_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          lead_id: string | null
          metadata: Json | null
          org_id: string
          task_id: string | null
          title: string
          visible_to: string[] | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          actor_id?: string | null
          actor_type?: string
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          lead_id?: string | null
          metadata?: Json | null
          org_id: string
          task_id?: string | null
          title: string
          visible_to?: string[] | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          actor_id?: string | null
          actor_type?: string
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          lead_id?: string | null
          metadata?: Json | null
          org_id?: string
          task_id?: string | null
          title?: string
          visible_to?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "_deprecated_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_resources: {
        Row: {
          access_roles: Json | null
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          download_count: number | null
          external_url: string | null
          file_path: string | null
          file_size_bytes: number | null
          file_type: string | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          last_downloaded_at: string | null
          metadata: Json | null
          name: string
          org_id: string | null
          tags: Json | null
          updated_at: string | null
        }
        Insert: {
          access_roles?: Json | null
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          download_count?: number | null
          external_url?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          last_downloaded_at?: string | null
          metadata?: Json | null
          name: string
          org_id?: string | null
          tags?: Json | null
          updated_at?: string | null
        }
        Update: {
          access_roles?: Json | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          download_count?: number | null
          external_url?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          last_downloaded_at?: string | null
          metadata?: Json | null
          name?: string
          org_id?: string | null
          tags?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_resources_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string
          first_name: string
          id: string
          last_login_at: string | null
          last_name: string
          permissions: string[]
          phone: string | null
          role: string
          status: string
          timezone: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email: string
          first_name?: string
          id: string
          last_login_at?: string | null
          last_name?: string
          permissions?: string[]
          phone?: string | null
          role?: string
          status?: string
          timezone?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string
          first_name?: string
          id?: string
          last_login_at?: string | null
          last_name?: string
          permissions?: string[]
          phone?: string | null
          role?: string
          status?: string
          timezone?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      advisor_access: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          has_advisor_page_access: boolean
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          has_advisor_page_access?: boolean
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          has_advisor_page_access?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      advisor_announcements: {
        Row: {
          content: string | null
          content_html: string | null
          created_at: string | null
          created_by: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          is_dismissible: boolean | null
          link_text: string | null
          link_url: string | null
          start_date: string | null
          target_audience: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          content_html?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_dismissible?: boolean | null
          link_text?: string | null
          link_url?: string | null
          start_date?: string | null
          target_audience?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          content_html?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_dismissible?: boolean | null
          link_text?: string | null
          link_url?: string | null
          start_date?: string | null
          target_audience?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      advisor_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
          slug: string
          type: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
          slug: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          slug?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      advisor_contact_directory: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          department: string | null
          display_order: number
          email: string | null
          extension: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          display_order?: number
          email?: string | null
          extension?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          display_order?: number
          email?: string | null
          extension?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      advisor_content: {
        Row: {
          category_id: string | null
          content: string
          content_type: string
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          metadata: Json | null
          notification_count: number | null
          notification_sent_at: string | null
          published_date: string | null
          slug: string
          title: string
          updated_at: string | null
          view_count: number | null
          wordpress_id: number | null
        }
        Insert: {
          category_id?: string | null
          content: string
          content_type?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          metadata?: Json | null
          notification_count?: number | null
          notification_sent_at?: string | null
          published_date?: string | null
          slug: string
          title: string
          updated_at?: string | null
          view_count?: number | null
          wordpress_id?: number | null
        }
        Update: {
          category_id?: string | null
          content?: string
          content_type?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          metadata?: Json | null
          notification_count?: number | null
          notification_sent_at?: string | null
          published_date?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
          view_count?: number | null
          wordpress_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "advisor_content_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "advisor_content_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_content_bookmarks: {
        Row: {
          advisor_id: string
          content_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          advisor_id: string
          content_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          advisor_id?: string
          content_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advisor_content_bookmarks_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_content_bookmarks_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "advisor_content"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_content_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      advisor_content_views: {
        Row: {
          advisor_id: string
          content_id: string
          id: string
          viewed_at: string | null
        }
        Insert: {
          advisor_id: string
          content_id: string
          id?: string
          viewed_at?: string | null
        }
        Update: {
          advisor_id?: string
          content_id?: string
          id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advisor_content_views_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_content_views_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "advisor_content"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_dashboard_widgets: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          grid_column: string | null
          id: string
          is_visible: boolean | null
          label: string
          order_index: number | null
          updated_at: string | null
          widget_key: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          grid_column?: string | null
          id?: string
          is_visible?: boolean | null
          label: string
          order_index?: number | null
          updated_at?: string | null
          widget_key: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          grid_column?: string | null
          id?: string
          is_visible?: boolean | null
          label?: string
          order_index?: number | null
          updated_at?: string | null
          widget_key?: string
        }
        Relationships: []
      }
      advisor_enrollment_links: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          label: string
          order_index: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label: string
          order_index?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          order_index?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      advisor_external_training_progress: {
        Row: {
          advisor_id: string
          certificate_url: string | null
          completed_at: string | null
          created_at: string | null
          external_course_id: string | null
          external_lesson_id: string | null
          external_progress_percent: number | null
          external_score: number | null
          id: string
          lms_provider: string
          module_id: string | null
          notes: string | null
          started_at: string | null
          status: string
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          advisor_id: string
          certificate_url?: string | null
          completed_at?: string | null
          created_at?: string | null
          external_course_id?: string | null
          external_lesson_id?: string | null
          external_progress_percent?: number | null
          external_score?: number | null
          id?: string
          lms_provider?: string
          module_id?: string | null
          notes?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          advisor_id?: string
          certificate_url?: string | null
          completed_at?: string | null
          created_at?: string | null
          external_course_id?: string | null
          external_lesson_id?: string | null
          external_progress_percent?: number | null
          external_score?: number | null
          id?: string
          lms_provider?: string
          module_id?: string | null
          notes?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advisor_external_training_progress_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_external_training_progress_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisor_training_completion"
            referencedColumns: ["advisor_id"]
          },
          {
            foreignKeyName: "advisor_external_training_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_learning_paths: {
        Row: {
          category_slug: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          estimated_hours: number | null
          gradient: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          order_index: number | null
          title: string
          unlock_requirements: Json | null
          updated_at: string | null
        }
        Insert: {
          category_slug?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_hours?: number | null
          gradient?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          order_index?: number | null
          title: string
          unlock_requirements?: Json | null
          updated_at?: string | null
        }
        Update: {
          category_slug?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_hours?: number | null
          gradient?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          order_index?: number | null
          title?: string
          unlock_requirements?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      advisor_lesson_completions: {
        Row: {
          advisor_id: string
          completed_at: string | null
          created_at: string | null
          enrollment_id: string
          id: string
          lesson_id: string
          quiz_passed: boolean | null
          quiz_score: number | null
          started_at: string | null
          status: string
          time_spent_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          advisor_id: string
          completed_at?: string | null
          created_at?: string | null
          enrollment_id: string
          id?: string
          lesson_id: string
          quiz_passed?: boolean | null
          quiz_score?: number | null
          started_at?: string | null
          status?: string
          time_spent_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          advisor_id?: string
          completed_at?: string | null
          created_at?: string | null
          enrollment_id?: string
          id?: string
          lesson_id?: string
          quiz_passed?: boolean | null
          quiz_score?: number | null
          started_at?: string | null
          status?: string
          time_spent_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advisor_lesson_completions_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_lesson_completions_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisor_training_completion"
            referencedColumns: ["advisor_id"]
          },
          {
            foreignKeyName: "advisor_lesson_completions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "advisor_lms_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "external_lms_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_lms_enrollments: {
        Row: {
          advisor_id: string
          certificate_earned: boolean | null
          certificate_url: string | null
          completed_at: string | null
          course_id: string
          created_at: string | null
          enrolled_at: string | null
          id: string
          lessons_completed: number | null
          progress_percent: number | null
          started_at: string | null
          status: string
          total_lessons: number | null
          updated_at: string | null
        }
        Insert: {
          advisor_id: string
          certificate_earned?: boolean | null
          certificate_url?: string | null
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          enrolled_at?: string | null
          id?: string
          lessons_completed?: number | null
          progress_percent?: number | null
          started_at?: string | null
          status?: string
          total_lessons?: number | null
          updated_at?: string | null
        }
        Update: {
          advisor_id?: string
          certificate_earned?: boolean | null
          certificate_url?: string | null
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          enrolled_at?: string | null
          id?: string
          lessons_completed?: number | null
          progress_percent?: number | null
          started_at?: string | null
          status?: string
          total_lessons?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advisor_lms_enrollments_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_lms_enrollments_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisor_training_completion"
            referencedColumns: ["advisor_id"]
          },
          {
            foreignKeyName: "advisor_lms_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "external_lms_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_meeting_attendees: {
        Row: {
          advisor_id: string | null
          created_at: string | null
          duration_seconds: number | null
          email: string | null
          id: string
          joined_at: string | null
          left_at: string | null
          meeting_id: string
          name: string | null
          user_id: string | null
        }
        Insert: {
          advisor_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          email?: string | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          meeting_id: string
          name?: string | null
          user_id?: string | null
        }
        Update: {
          advisor_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          email?: string | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          meeting_id?: string
          name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advisor_meeting_attendees_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_meeting_attendees_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisor_training_completion"
            referencedColumns: ["advisor_id"]
          },
          {
            foreignKeyName: "advisor_meeting_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "advisor_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_meeting_reminders: {
        Row: {
          created_at: string | null
          id: string
          meeting_id: string
          reminder_type: string
          send_at: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          meeting_id: string
          reminder_type: string
          send_at: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          meeting_id?: string
          reminder_type?: string
          send_at?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advisor_meeting_reminders_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "advisor_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_meetings: {
        Row: {
          agenda: string | null
          allow_guests: boolean | null
          attendee_count: number | null
          auto_record: boolean | null
          co_host_ids: string[] | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          ended_at: string | null
          host_id: string | null
          host_name: string | null
          id: string
          is_recurring: boolean | null
          max_attendees: number | null
          max_participants: number | null
          meeting_link: string | null
          meeting_notes: string | null
          meeting_type: string | null
          metadata: Json | null
          notes: string | null
          org_id: string | null
          passcode: string | null
          recording_url: string | null
          recurrence_day: number | null
          recurrence_pattern: string | null
          recurrence_time: string | null
          reminder_minutes: number | null
          reminder_sent: boolean | null
          require_registration: boolean | null
          resources: Json | null
          room_name: string
          room_password: string | null
          scheduled_at: string
          started_at: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          agenda?: string | null
          allow_guests?: boolean | null
          attendee_count?: number | null
          auto_record?: boolean | null
          co_host_ids?: string[] | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          host_id?: string | null
          host_name?: string | null
          id?: string
          is_recurring?: boolean | null
          max_attendees?: number | null
          max_participants?: number | null
          meeting_link?: string | null
          meeting_notes?: string | null
          meeting_type?: string | null
          metadata?: Json | null
          notes?: string | null
          org_id?: string | null
          passcode?: string | null
          recording_url?: string | null
          recurrence_day?: number | null
          recurrence_pattern?: string | null
          recurrence_time?: string | null
          reminder_minutes?: number | null
          reminder_sent?: boolean | null
          require_registration?: boolean | null
          resources?: Json | null
          room_name: string
          room_password?: string | null
          scheduled_at: string
          started_at?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          agenda?: string | null
          allow_guests?: boolean | null
          attendee_count?: number | null
          auto_record?: boolean | null
          co_host_ids?: string[] | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          host_id?: string | null
          host_name?: string | null
          id?: string
          is_recurring?: boolean | null
          max_attendees?: number | null
          max_participants?: number | null
          meeting_link?: string | null
          meeting_notes?: string | null
          meeting_type?: string | null
          metadata?: Json | null
          notes?: string | null
          org_id?: string | null
          passcode?: string | null
          recording_url?: string | null
          recurrence_day?: number | null
          recurrence_pattern?: string | null
          recurrence_time?: string | null
          reminder_minutes?: number | null
          reminder_sent?: boolean | null
          require_registration?: boolean | null
          resources?: Json | null
          room_name?: string
          room_password?: string | null
          scheduled_at?: string
          started_at?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advisor_meetings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_nav_menu: {
        Row: {
          badge_color: string | null
          badge_text: string | null
          created_at: string | null
          created_by: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_external: boolean | null
          label: string
          order_index: number | null
          parent_id: string | null
          requires_auth: boolean | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          badge_color?: string | null
          badge_text?: string | null
          created_at?: string | null
          created_by?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_external?: boolean | null
          label: string
          order_index?: number | null
          parent_id?: string | null
          requires_auth?: boolean | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          badge_color?: string | null
          badge_text?: string | null
          created_at?: string | null
          created_by?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_external?: boolean | null
          label?: string
          order_index?: number | null
          parent_id?: string | null
          requires_auth?: boolean | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      advisor_plan_resources: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          flyer_title: string | null
          flyer_url: string | null
          handbook_title: string | null
          handbook_url: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          overview_content: string | null
          plan_name: string
          plan_slug: string
          pricing_content: string | null
          qrg_title: string | null
          qrg_url: string | null
          state_guidelines: Json | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          flyer_title?: string | null
          flyer_url?: string | null
          handbook_title?: string | null
          handbook_url?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          overview_content?: string | null
          plan_name: string
          plan_slug: string
          pricing_content?: string | null
          qrg_title?: string | null
          qrg_url?: string | null
          state_guidelines?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          flyer_title?: string | null
          flyer_url?: string | null
          handbook_title?: string | null
          handbook_url?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          overview_content?: string | null
          plan_name?: string
          plan_slug?: string
          pricing_content?: string | null
          qrg_title?: string | null
          qrg_url?: string | null
          state_guidelines?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      advisor_portal_settings: {
        Row: {
          category: string
          description: string | null
          id: string
          key: string
          label: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          category?: string
          description?: string | null
          id?: string
          key: string
          label: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Update: {
          category?: string
          description?: string | null
          id?: string
          key?: string
          label?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      advisor_profiles: {
        Row: {
          agent_id: string | null
          avatar_url: string | null
          company_name: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          metadata: Json | null
          must_change_password: boolean
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          org_id: string | null
          phone: string | null
          specialization: string | null
          status: string | null
          training_completed: boolean
          training_completed_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          agent_id?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          metadata?: Json | null
          must_change_password?: boolean
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          org_id?: string | null
          phone?: string | null
          specialization?: string | null
          status?: string | null
          training_completed?: boolean
          training_completed_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          metadata?: Json | null
          must_change_password?: boolean
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          org_id?: string | null
          phone?: string | null
          specialization?: string | null
          status?: string | null
          training_completed?: boolean
          training_completed_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advisor_profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_quick_links: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_external: boolean | null
          is_popup: boolean | null
          label: string
          order_index: number | null
          requires_auth: boolean | null
          updated_at: string | null
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_external?: boolean | null
          is_popup?: boolean | null
          label: string
          order_index?: number | null
          requires_auth?: boolean | null
          updated_at?: string | null
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_external?: boolean | null
          is_popup?: boolean | null
          label?: string
          order_index?: number | null
          requires_auth?: boolean | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      advisor_terminal_commands: {
        Row: {
          command_intent: string | null
          command_text: string
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          metadata: Json | null
          response_text: string | null
          session_id: string
          success: boolean
          tokens_used: number | null
          tools_called: Json | null
          user_id: string
        }
        Insert: {
          command_intent?: string | null
          command_text: string
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          response_text?: string | null
          session_id: string
          success?: boolean
          tokens_used?: number | null
          tools_called?: Json | null
          user_id: string
        }
        Update: {
          command_intent?: string | null
          command_text?: string
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          response_text?: string | null
          session_id?: string
          success?: boolean
          tokens_used?: number | null
          tools_called?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      advisor_terminal_sessions: {
        Row: {
          created_at: string | null
          id: string
          last_activity_at: string | null
          metadata: Json | null
          role: string
          session_id: string
          started_at: string | null
          total_commands: number | null
          total_tools_executed: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_activity_at?: string | null
          metadata?: Json | null
          role: string
          session_id: string
          started_at?: string | null
          total_commands?: number | null
          total_tools_executed?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_activity_at?: string | null
          metadata?: Json | null
          role?: string
          session_id?: string
          started_at?: string | null
          total_commands?: number | null
          total_tools_executed?: number | null
          user_id?: string
        }
        Relationships: []
      }
      advisor_videos: {
        Row: {
          category: string
          created_at: string
          description: string | null
          duration: string | null
          id: string
          is_active: boolean
          order_index: number
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          vimeo_hash: string | null
          vimeo_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          vimeo_hash?: string | null
          vimeo_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          vimeo_hash?: string | null
          vimeo_id?: string
        }
        Relationships: []
      }
      advisors: {
        Row: {
          active_date: string | null
          address_1: string | null
          address_2: string | null
          advisor_id: string | null
          agent_id: string | null
          agent_label: string | null
          agent_type: string | null
          agent_type_2: string | null
          agent_type_3: string | null
          city: string | null
          company: string | null
          county: string | null
          created_at: string | null
          display_name: string | null
          domain_name: string | null
          email: string | null
          email_2: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          landing_url: string
          last_name: string | null
          license_states: string | null
          order_index: number | null
          parent_id: string | null
          parent_label: string | null
          phone: string
          phone_1: string | null
          phone_2: string | null
          state: string | null
          status: string | null
          updated_at: string | null
          website_link: string | null
          zipcode: string | null
        }
        Insert: {
          active_date?: string | null
          address_1?: string | null
          address_2?: string | null
          advisor_id?: string | null
          agent_id?: string | null
          agent_label?: string | null
          agent_type?: string | null
          agent_type_2?: string | null
          agent_type_3?: string | null
          city?: string | null
          company?: string | null
          county?: string | null
          created_at?: string | null
          display_name?: string | null
          domain_name?: string | null
          email?: string | null
          email_2?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          landing_url?: string
          last_name?: string | null
          license_states?: string | null
          order_index?: number | null
          parent_id?: string | null
          parent_label?: string | null
          phone?: string
          phone_1?: string | null
          phone_2?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          website_link?: string | null
          zipcode?: string | null
        }
        Update: {
          active_date?: string | null
          address_1?: string | null
          address_2?: string | null
          advisor_id?: string | null
          agent_id?: string | null
          agent_label?: string | null
          agent_type?: string | null
          agent_type_2?: string | null
          agent_type_3?: string | null
          city?: string | null
          company?: string | null
          county?: string | null
          created_at?: string | null
          display_name?: string | null
          domain_name?: string | null
          email?: string | null
          email_2?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          landing_url?: string
          last_name?: string | null
          license_states?: string | null
          order_index?: number | null
          parent_id?: string | null
          parent_label?: string | null
          phone?: string
          phone_1?: string | null
          phone_2?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          website_link?: string | null
          zipcode?: string | null
        }
        Relationships: []
      }
      ai_automation_rules: {
        Row: {
          action_config: Json | null
          action_type: string
          created_at: string | null
          created_by: string | null
          delay_minutes: number | null
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          name: string
          trigger_conditions: Json | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          created_at?: string | null
          created_by?: string | null
          delay_minutes?: number | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name: string
          trigger_conditions?: Json | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          created_at?: string | null
          created_by?: string | null
          delay_minutes?: number | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name?: string
          trigger_conditions?: Json | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_lead_insights: {
        Row: {
          ai_score: number | null
          analysis_version: string | null
          conversation_summary: string | null
          conversion_probability: number | null
          created_at: string | null
          draft_email_body: string | null
          draft_email_subject: string | null
          draft_sms: string | null
          engagement_level: string | null
          follow_up_urgency: string | null
          id: string
          interests: Json | null
          key_points: Json | null
          last_analyzed_at: string | null
          lead_id: string
          next_actions: Json | null
          objections: Json | null
          recommended_action: string | null
          recommended_channel: string | null
          recommended_timing: string | null
          response_likelihood: string | null
          score_factors: Json | null
          updated_at: string | null
        }
        Insert: {
          ai_score?: number | null
          analysis_version?: string | null
          conversation_summary?: string | null
          conversion_probability?: number | null
          created_at?: string | null
          draft_email_body?: string | null
          draft_email_subject?: string | null
          draft_sms?: string | null
          engagement_level?: string | null
          follow_up_urgency?: string | null
          id?: string
          interests?: Json | null
          key_points?: Json | null
          last_analyzed_at?: string | null
          lead_id: string
          next_actions?: Json | null
          objections?: Json | null
          recommended_action?: string | null
          recommended_channel?: string | null
          recommended_timing?: string | null
          response_likelihood?: string | null
          score_factors?: Json | null
          updated_at?: string | null
        }
        Update: {
          ai_score?: number | null
          analysis_version?: string | null
          conversation_summary?: string | null
          conversion_probability?: number | null
          created_at?: string | null
          draft_email_body?: string | null
          draft_email_subject?: string | null
          draft_sms?: string | null
          engagement_level?: string | null
          follow_up_urgency?: string | null
          id?: string
          interests?: Json | null
          key_points?: Json | null
          last_analyzed_at?: string | null
          lead_id?: string
          next_actions?: Json | null
          objections?: Json | null
          recommended_action?: string | null
          recommended_channel?: string | null
          recommended_timing?: string | null
          response_likelihood?: string | null
          score_factors?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_lead_insights_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string | null
          element_class: string | null
          element_id: string | null
          element_text: string | null
          event_category: string | null
          event_label: string | null
          event_type: string
          event_value: number | null
          id: string
          metadata: Json | null
          page_path: string
          page_title: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          element_class?: string | null
          element_id?: string | null
          element_text?: string | null
          event_category?: string | null
          event_label?: string | null
          event_type: string
          event_value?: number | null
          id?: string
          metadata?: Json | null
          page_path: string
          page_title?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          element_class?: string | null
          element_id?: string | null
          element_text?: string | null
          event_category?: string | null
          event_label?: string | null
          event_type?: string
          event_value?: number | null
          id?: string
          metadata?: Json | null
          page_path?: string
          page_title?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_experiments: {
        Row: {
          baseline_value: number | null
          conversions_count: number | null
          created_at: string | null
          created_by: string | null
          end_date: string | null
          experiment_description: string | null
          experiment_name: string
          experiment_type: string | null
          hypothesis: string | null
          id: string
          participants_count: number | null
          results_data: Json | null
          start_date: string
          statistical_significance: number | null
          status: string | null
          success_metric: string
          target_value: number | null
          traffic_allocation: number | null
          updated_at: string | null
          variants: Json
          winner_variant: string | null
        }
        Insert: {
          baseline_value?: number | null
          conversions_count?: number | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          experiment_description?: string | null
          experiment_name: string
          experiment_type?: string | null
          hypothesis?: string | null
          id?: string
          participants_count?: number | null
          results_data?: Json | null
          start_date: string
          statistical_significance?: number | null
          status?: string | null
          success_metric: string
          target_value?: number | null
          traffic_allocation?: number | null
          updated_at?: string | null
          variants: Json
          winner_variant?: string | null
        }
        Update: {
          baseline_value?: number | null
          conversions_count?: number | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          experiment_description?: string | null
          experiment_name?: string
          experiment_type?: string | null
          hypothesis?: string | null
          id?: string
          participants_count?: number | null
          results_data?: Json | null
          start_date?: string
          statistical_significance?: number | null
          status?: string | null
          success_metric?: string
          target_value?: number | null
          traffic_allocation?: number | null
          updated_at?: string | null
          variants?: Json
          winner_variant?: string | null
        }
        Relationships: []
      }
      analytics_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          duration_seconds: number | null
          ended_at: string | null
          entry_page: string
          exit_page: string | null
          id: string
          is_bounce: boolean | null
          is_new_visitor: boolean | null
          os: string | null
          page_count: number | null
          referrer: string | null
          referrer_source: string | null
          region: string | null
          session_id: string
          started_at: string | null
          updated_at: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          entry_page: string
          exit_page?: string | null
          id?: string
          is_bounce?: boolean | null
          is_new_visitor?: boolean | null
          os?: string | null
          page_count?: number | null
          referrer?: string | null
          referrer_source?: string | null
          region?: string | null
          session_id: string
          started_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          entry_page?: string
          exit_page?: string | null
          id?: string
          is_bounce?: boolean | null
          is_new_visitor?: boolean | null
          os?: string | null
          page_count?: number | null
          referrer?: string | null
          referrer_source?: string | null
          region?: string | null
          session_id?: string
          started_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      approved_links: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          title: string
          url: string
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          title: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          title?: string
          url?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          assignee_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          project_id: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          actor_user_id: string | null
          after_json: Json | null
          before_json: Json | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          meta_json: Json | null
          org_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          meta_json?: Json | null
          org_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          meta_json?: Json | null
          org_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_login_attempts: {
        Row: {
          email: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          success: boolean
          timestamp: string
          user_agent: string | null
        }
        Insert: {
          email: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          timestamp?: string
          user_agent?: string | null
        }
        Update: {
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          timestamp?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      auth_rate_limits: {
        Row: {
          attempt_count: number
          block_type: string | null
          blocked_until: string | null
          id: string
          identifier: string
          identifier_type: string
          reason: string | null
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          block_type?: string | null
          blocked_until?: string | null
          id?: string
          identifier: string
          identifier_type: string
          reason?: string | null
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          block_type?: string | null
          blocked_until?: string | null
          id?: string
          identifier?: string
          identifier_type?: string
          reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      auth_security_events: {
        Row: {
          event_data: Json
          event_severity: string
          event_type: string
          hash_chain: string | null
          id: string
          ip_address: string | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          event_data?: Json
          event_severity: string
          event_type: string
          hash_chain?: string | null
          id?: string
          ip_address?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          event_data?: Json
          event_severity?: string
          event_type?: string
          hash_chain?: string | null
          id?: string
          ip_address?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automation_execution_log: {
        Row: {
          action_type: string
          executed_at: string | null
          id: string
          lead_id: string | null
          result_message: string | null
          rule_id: string | null
          rule_name: string
          status: string
          trigger_type: string
        }
        Insert: {
          action_type: string
          executed_at?: string | null
          id?: string
          lead_id?: string | null
          result_message?: string | null
          rule_id?: string | null
          rule_name: string
          status: string
          trigger_type: string
        }
        Update: {
          action_type?: string
          executed_at?: string | null
          id?: string
          lead_id?: string | null
          result_message?: string | null
          rule_id?: string | null
          rule_name?: string
          status?: string
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_execution_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_execution_log_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "ai_automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_templates: {
        Row: {
          actions: Json | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_popular: boolean | null
          name: string
          trigger_type: string
          updated_at: string | null
          use_count: number | null
        }
        Insert: {
          actions?: Json | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_popular?: boolean | null
          name: string
          trigger_type: string
          updated_at?: string | null
          use_count?: number | null
        }
        Update: {
          actions?: Json | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_popular?: boolean | null
          name?: string
          trigger_type?: string
          updated_at?: string | null
          use_count?: number | null
        }
        Relationships: []
      }
      benefit_usage: {
        Row: {
          amount_limit: number | null
          amount_used: number | null
          benefit_category: string
          coverage_id: string
          id: string
          last_updated: string
          member_id: string
          visits_limit: number | null
          visits_used: number | null
          year: number
        }
        Insert: {
          amount_limit?: number | null
          amount_used?: number | null
          benefit_category: string
          coverage_id: string
          id?: string
          last_updated?: string
          member_id: string
          visits_limit?: number | null
          visits_used?: number | null
          year: number
        }
        Update: {
          amount_limit?: number | null
          amount_used?: number | null
          benefit_category?: string
          coverage_id?: string
          id?: string
          last_updated?: string
          member_id?: string
          visits_limit?: number | null
          visits_used?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "benefit_usage_coverage_id_fkey"
            columns: ["coverage_id"]
            isOneToOne: false
            referencedRelation: "member_coverage"
            referencedColumns: ["id"]
          },
        ]
      }
      benefits: {
        Row: {
          angle: number | null
          benefit_key: string
          created_at: string | null
          description: string
          icon: string
          id: string
          is_active: boolean | null
          order_index: number | null
          title: string
        }
        Insert: {
          angle?: number | null
          benefit_key: string
          created_at?: string | null
          description: string
          icon?: string
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          title: string
        }
        Update: {
          angle?: number | null
          benefit_key?: string
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          title?: string
        }
        Relationships: []
      }
      blog_articles: {
        Row: {
          author: string | null
          author_id: string | null
          category: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          is_published: boolean | null
          published_date: string | null
          read_time: number | null
          scheduled_publish_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author?: string | null
          author_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_published?: boolean | null
          published_date?: string | null
          read_time?: number | null
          scheduled_publish_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author?: string | null
          author_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_published?: boolean | null
          published_date?: string | null
          read_time?: number | null
          scheduled_publish_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "blog_authors"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          role: string | null
          slug: string | null
          social_linkedin: string | null
          social_twitter: string | null
          social_website: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          role?: string | null
          slug?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_website?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          role?: string | null
          slug?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_website?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_generation_logs: {
        Row: {
          content_generated: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          generation_time_ms: number | null
          id: string
          metadata: Json | null
          prompt_id: string | null
          prompt_used: string
          success: boolean | null
          tokens_used: number | null
        }
        Insert: {
          content_generated?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          generation_time_ms?: number | null
          id?: string
          metadata?: Json | null
          prompt_id?: string | null
          prompt_used: string
          success?: boolean | null
          tokens_used?: number | null
        }
        Update: {
          content_generated?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          generation_time_ms?: number | null
          id?: string
          metadata?: Json | null
          prompt_id?: string | null
          prompt_used?: string
          success?: boolean | null
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_generation_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_generation_logs_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "gemini_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      bulletin_email_notifications: {
        Row: {
          bulletin_id: string
          created_at: string | null
          error_message: string | null
          failed_sends: number | null
          id: string
          metadata: Json | null
          resend_batch_id: string | null
          sent_at: string | null
          sent_by: string | null
          status: string | null
          successful_sends: number | null
          total_recipients: number | null
          updated_at: string | null
        }
        Insert: {
          bulletin_id: string
          created_at?: string | null
          error_message?: string | null
          failed_sends?: number | null
          id?: string
          metadata?: Json | null
          resend_batch_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          successful_sends?: number | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Update: {
          bulletin_id?: string
          created_at?: string | null
          error_message?: string | null
          failed_sends?: number | null
          id?: string
          metadata?: Json | null
          resend_batch_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          successful_sends?: number | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulletin_email_notifications_bulletin_id_fkey"
            columns: ["bulletin_id"]
            isOneToOne: false
            referencedRelation: "advisor_content"
            referencedColumns: ["id"]
          },
        ]
      }
      bulletin_email_recipients: {
        Row: {
          advisor_id: string | null
          created_at: string | null
          email: string
          error_message: string | null
          id: string
          notification_id: string
          resend_message_id: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          advisor_id?: string | null
          created_at?: string | null
          email: string
          error_message?: string | null
          id?: string
          notification_id: string
          resend_message_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          advisor_id?: string | null
          created_at?: string | null
          email?: string
          error_message?: string | null
          id?: string
          notification_id?: string
          resend_message_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulletin_email_recipients_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulletin_email_recipients_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisor_training_completion"
            referencedColumns: ["advisor_id"]
          },
          {
            foreignKeyName: "bulletin_email_recipients_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "bulletin_email_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          assigned_to: string | null
          attendees: Json | null
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string
          event_type: string | null
          external_calendar_id: string | null
          external_event_id: string | null
          id: string
          last_synced_at: string | null
          lead_id: string | null
          location: string | null
          meeting_link: string | null
          notes: string | null
          org_id: string | null
          original_event_id: string | null
          outcome: string | null
          recurrence_end: string | null
          recurrence_rule: string | null
          reminder_minutes: number | null
          reminder_sent: boolean | null
          reminders: Json | null
          start_time: string
          status: string | null
          timezone: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          all_day?: boolean | null
          assigned_to?: string | null
          attendees?: Json | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time: string
          event_type?: string | null
          external_calendar_id?: string | null
          external_event_id?: string | null
          id?: string
          last_synced_at?: string | null
          lead_id?: string | null
          location?: string | null
          meeting_link?: string | null
          notes?: string | null
          org_id?: string | null
          original_event_id?: string | null
          outcome?: string | null
          recurrence_end?: string | null
          recurrence_rule?: string | null
          reminder_minutes?: number | null
          reminder_sent?: boolean | null
          reminders?: Json | null
          start_time: string
          status?: string | null
          timezone?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          all_day?: boolean | null
          assigned_to?: string | null
          attendees?: Json | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string
          event_type?: string | null
          external_calendar_id?: string | null
          external_event_id?: string | null
          id?: string
          last_synced_at?: string | null
          lead_id?: string | null
          location?: string | null
          meeting_link?: string | null
          notes?: string | null
          org_id?: string | null
          original_event_id?: string | null
          outcome?: string | null
          recurrence_end?: string | null
          recurrence_rule?: string | null
          reminder_minutes?: number | null
          reminder_sent?: boolean | null
          reminders?: Json | null
          start_time?: string
          status?: string | null
          timezone?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_original_event_id_fkey"
            columns: ["original_event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          advisor_id: string
          badge_url: string | null
          certificate_url: string | null
          certification_type: string
          created_at: string | null
          credential_id: string | null
          description: string | null
          earned_at: string | null
          expires_at: string | null
          id: string
          issued_at: string | null
          issuer: string | null
          name: string | null
          org_id: string | null
        }
        Insert: {
          advisor_id: string
          badge_url?: string | null
          certificate_url?: string | null
          certification_type: string
          created_at?: string | null
          credential_id?: string | null
          description?: string | null
          earned_at?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          issuer?: string | null
          name?: string | null
          org_id?: string | null
        }
        Update: {
          advisor_id?: string
          badge_url?: string | null
          certificate_url?: string | null
          certification_type?: string
          created_at?: string | null
          credential_id?: string | null
          description?: string | null
          earned_at?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          issuer?: string | null
          name?: string | null
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certifications_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisor_training_completion"
            referencedColumns: ["advisor_id"]
          },
          {
            foreignKeyName: "certifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_admin_only_posting: boolean | null
          is_archived: boolean | null
          last_message_at: string | null
          last_message_preview: string | null
          metadata: Json | null
          name: string | null
          org_id: string
          slug: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_admin_only_posting?: boolean | null
          is_archived?: boolean | null
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json | null
          name?: string | null
          org_id: string
          slug?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_admin_only_posting?: boolean | null
          is_archived?: boolean | null
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json | null
          name?: string | null
          org_id?: string
          slug?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_members: {
        Row: {
          conversation_id: string
          id: string
          is_muted: boolean | null
          joined_at: string | null
          last_read_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean | null
          metadata: Json | null
          reply_to_id: string | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          reply_to_id?: string | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          reply_to_id?: string | null
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_items: {
        Row: {
          approved_amount: number | null
          claim_id: string
          created_at: string
          description: string
          eligible_amount: number | null
          id: string
          notes: string | null
          procedure_code: string | null
          quantity: number | null
          total_amount: number
          unit_price: number
        }
        Insert: {
          approved_amount?: number | null
          claim_id: string
          created_at?: string
          description: string
          eligible_amount?: number | null
          id?: string
          notes?: string | null
          procedure_code?: string | null
          quantity?: number | null
          total_amount: number
          unit_price: number
        }
        Update: {
          approved_amount?: number | null
          claim_id?: string
          created_at?: string
          description?: string
          eligible_amount?: number | null
          id?: string
          notes?: string | null
          procedure_code?: string | null
          quantity?: number | null
          total_amount?: number
          unit_price?: number
        }
        Relationships: []
      }
      claims: {
        Row: {
          approved_amount: number | null
          approved_date: string | null
          claim_number: string
          claim_type: string
          created_at: string
          denial_reason: string | null
          dependent_id: string | null
          diagnosis_codes: string[] | null
          eligible_amount: number | null
          id: string
          member_id: string
          metadata: Json | null
          paid_amount: number | null
          paid_date: string | null
          patient_name: string
          patient_type: string | null
          processing_notes: string | null
          provider_id: string | null
          provider_name: string
          reviewed_by: string | null
          reviewed_date: string | null
          service_date: string
          status: string | null
          submitted_date: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          approved_amount?: number | null
          approved_date?: string | null
          claim_number: string
          claim_type: string
          created_at?: string
          denial_reason?: string | null
          dependent_id?: string | null
          diagnosis_codes?: string[] | null
          eligible_amount?: number | null
          id?: string
          member_id: string
          metadata?: Json | null
          paid_amount?: number | null
          paid_date?: string | null
          patient_name: string
          patient_type?: string | null
          processing_notes?: string | null
          provider_id?: string | null
          provider_name: string
          reviewed_by?: string | null
          reviewed_date?: string | null
          service_date: string
          status?: string | null
          submitted_date?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          approved_amount?: number | null
          approved_date?: string | null
          claim_number?: string
          claim_type?: string
          created_at?: string
          denial_reason?: string | null
          dependent_id?: string | null
          diagnosis_codes?: string[] | null
          eligible_amount?: number | null
          id?: string
          member_id?: string
          metadata?: Json | null
          paid_amount?: number | null
          paid_date?: string | null
          patient_name?: string
          patient_type?: string | null
          processing_notes?: string | null
          provider_id?: string | null
          provider_name?: string
          reviewed_by?: string | null
          reviewed_date?: string | null
          service_date?: string
          status?: string | null
          submitted_date?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_dependent_id_fkey"
            columns: ["dependent_id"]
            isOneToOne: false
            referencedRelation: "member_dependents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_events: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          event_date: string | null
          event_end_date: string | null
          event_type: string | null
          excerpt: string | null
          featured_image_url: string | null
          gallery_images: string[] | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          location: string | null
          location_type: string | null
          max_attendees: number | null
          organizer: string | null
          registration_url: string | null
          slug: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          event_date?: string | null
          event_end_date?: string | null
          event_type?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          gallery_images?: string[] | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          location?: string | null
          location_type?: string | null
          max_attendees?: number | null
          organizer?: string | null
          registration_url?: string | null
          slug?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          event_date?: string | null
          event_end_date?: string | null
          event_type?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          gallery_images?: string[] | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          location?: string | null
          location_type?: string | null
          max_attendees?: number | null
          organizer?: string | null
          registration_url?: string | null
          slug?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      cms_pages: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_published: boolean
          meta: Json
          path: string
          sections: Json
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          meta?: Json
          path: string
          sections?: Json
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          meta?: Json
          path?: string
          sections?: Json
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cms_resources: {
        Row: {
          content: string | null
          created_at: string | null
          description: string | null
          featured_image_url: string | null
          file_url: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          resource_type: string | null
          slug: string | null
          target_audience: string | null
          title: string
          topics: string[] | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          featured_image_url?: string | null
          file_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          resource_type?: string | null
          slug?: string | null
          target_audience?: string | null
          title: string
          topics?: string[] | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          featured_image_url?: string | null
          file_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          resource_type?: string | null
          slug?: string | null
          target_audience?: string | null
          title?: string
          topics?: string[] | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      code_batches: {
        Row: {
          code_type: string
          codes_used: number | null
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          name: string
          org_id: string | null
          prefix: string | null
          total_codes: number
          value_per_code: number | null
        }
        Insert: {
          code_type: string
          codes_used?: number | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          name: string
          org_id?: string | null
          prefix?: string | null
          total_codes: number
          value_per_code?: number | null
        }
        Update: {
          code_type?: string
          codes_used?: number | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          name?: string
          org_id?: string | null
          prefix?: string | null
          total_codes?: number
          value_per_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "code_batches_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      code_inventory: {
        Row: {
          assigned_at: string | null
          assigned_to_member: string | null
          assigned_to_user: string | null
          batch_id: string | null
          code: string
          code_type: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          status: string | null
          used_at: string | null
          value: number | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to_member?: string | null
          assigned_to_user?: string | null
          batch_id?: string | null
          code: string
          code_type: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          status?: string | null
          used_at?: string | null
          value?: number | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to_member?: string | null
          assigned_to_user?: string | null
          batch_id?: string | null
          code?: string
          code_type?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          status?: string | null
          used_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "code_inventory_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      cognito_forms: {
        Row: {
          category: string
          cognito_embed: string | null
          created_at: string | null
          description: string | null
          estimated_minutes: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          label: string
          menu_order: number | null
          menu_section: string | null
          requires_auth: boolean | null
          show_in_menu: boolean | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          cognito_embed?: string | null
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          menu_order?: number | null
          menu_section?: string | null
          requires_auth?: boolean | null
          show_in_menu?: boolean | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          cognito_embed?: string | null
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          menu_order?: number | null
          menu_section?: string | null
          requires_auth?: boolean | null
          show_in_menu?: boolean | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      commission_payouts: {
        Row: {
          advisor_id: string
          created_at: string
          id: string
          notes: string | null
          org_id: string
          payment_method: string | null
          payout_date: string
          record_count: number
          reference_number: string | null
          total_amount: number
        }
        Insert: {
          advisor_id: string
          created_at?: string
          id?: string
          notes?: string | null
          org_id: string
          payment_method?: string | null
          payout_date: string
          record_count?: number
          reference_number?: string | null
          total_amount: number
        }
        Update: {
          advisor_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string
          payment_method?: string | null
          payout_date?: string
          record_count?: number
          reference_number?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_payouts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_records: {
        Row: {
          advisor_id: string
          carrier_id: string | null
          commission_amount: number
          commission_rate: number | null
          contact_id: string | null
          created_at: string
          id: string
          lead_id: string | null
          member_responsibility: number | null
          notes: string | null
          org_id: string
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          plan_type: string | null
          premium_amount: number | null
          schedule_id: string | null
          status: string
          subsidy_amount: number | null
          updated_at: string
        }
        Insert: {
          advisor_id: string
          carrier_id?: string | null
          commission_amount: number
          commission_rate?: number | null
          contact_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          member_responsibility?: number | null
          notes?: string | null
          org_id: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          plan_type?: string | null
          premium_amount?: number | null
          schedule_id?: string | null
          status?: string
          subsidy_amount?: number | null
          updated_at?: string
        }
        Update: {
          advisor_id?: string
          carrier_id?: string | null
          commission_amount?: number
          commission_rate?: number | null
          contact_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          member_responsibility?: number | null
          notes?: string | null
          org_id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          plan_type?: string | null
          premium_amount?: number | null
          schedule_id?: string | null
          status?: string
          subsidy_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_records_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "insurance_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_records_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_records_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_records_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "commission_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_schedules: {
        Row: {
          advisor_tier: string | null
          carrier_id: string | null
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          org_id: string
          plan_id: string | null
          rate_type: string
          rate_value: number
          updated_at: string
        }
        Insert: {
          advisor_tier?: string | null
          carrier_id?: string | null
          created_at?: string
          effective_from: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          org_id: string
          plan_id?: string | null
          rate_type?: string
          rate_value: number
          updated_at?: string
        }
        Update: {
          advisor_tier?: string | null
          carrier_id?: string | null
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          org_id?: string
          plan_id?: string | null
          rate_type?: string
          rate_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_schedules_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "insurance_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_schedules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_schedules_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_acknowledgments: {
        Row: {
          acknowledged_at: string | null
          completed_at: string | null
          created_at: string | null
          document_id: string
          due_date: string | null
          expires_at: string | null
          id: string
          ip_address: string | null
          org_id: string | null
          quiz_answers: Json | null
          quiz_attempts: number | null
          quiz_score: number | null
          signature_data: string | null
          signed_name: string | null
          status: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          document_id: string
          due_date?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          org_id?: string | null
          quiz_answers?: Json | null
          quiz_attempts?: number | null
          quiz_score?: number | null
          signature_data?: string | null
          signed_name?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          document_id?: string
          due_date?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          org_id?: string | null
          quiz_answers?: Json | null
          quiz_attempts?: number | null
          quiz_score?: number | null
          signature_data?: string | null
          signed_name?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_acknowledgments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "compliance_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_documents: {
        Row: {
          category: string | null
          content: string | null
          content_html: string | null
          content_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          document_type: string
          due_date: string | null
          due_within_days: number | null
          effective_date: string | null
          expiration_date: string | null
          file_url: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          org_id: string | null
          passing_score: number | null
          quiz_questions: Json | null
          renewal_period_days: number | null
          required_for_roles: string[] | null
          title: string
          total_completed: number | null
          total_required: number | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          content_html?: string | null
          content_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_type: string
          due_date?: string | null
          due_within_days?: number | null
          effective_date?: string | null
          expiration_date?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          org_id?: string | null
          passing_score?: number | null
          quiz_questions?: Json | null
          renewal_period_days?: number | null
          required_for_roles?: string[] | null
          title: string
          total_completed?: number | null
          total_required?: number | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          content_html?: string | null
          content_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_type?: string
          due_date?: string | null
          due_within_days?: number | null
          effective_date?: string | null
          expiration_date?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          org_id?: string | null
          passing_score?: number | null
          quiz_questions?: Json | null
          renewal_period_days?: number | null
          required_for_roles?: string[] | null
          title?: string
          total_completed?: number | null
          total_required?: number | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      concierge_daily_log_entries: {
        Row: {
          additional_notes: string
          channel: string
          created_at: string
          created_by: string | null
          crm_notes: boolean
          escalated_issue: boolean
          follow_up: boolean
          id: string
          log_date: string
          member_name: string
          other_notes: string
          reason: string
          review_link: boolean
          special_project_description: string
          special_project_duration_minutes: number
          team_member_id: string | null
          team_member_name: string
          times_spoke_with_member: number
          touch_override: boolean | null
          updated_at: string
        }
        Insert: {
          additional_notes?: string
          channel: string
          created_at?: string
          created_by?: string | null
          crm_notes?: boolean
          escalated_issue?: boolean
          follow_up?: boolean
          id?: string
          log_date: string
          member_name: string
          other_notes?: string
          reason: string
          review_link?: boolean
          special_project_description?: string
          special_project_duration_minutes?: number
          team_member_id?: string | null
          team_member_name: string
          times_spoke_with_member?: number
          touch_override?: boolean | null
          updated_at?: string
        }
        Update: {
          additional_notes?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          crm_notes?: boolean
          escalated_issue?: boolean
          follow_up?: boolean
          id?: string
          log_date?: string
          member_name?: string
          other_notes?: string
          reason?: string
          review_link?: boolean
          special_project_description?: string
          special_project_duration_minutes?: number
          team_member_id?: string | null
          team_member_name?: string
          times_spoke_with_member?: number
          touch_override?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "concierge_daily_log_entries_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "concierge_team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      concierge_escalations: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          log_entry_id: string | null
          member_name: string
          opened_at: string
          status: string
          summary: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          log_entry_id?: string | null
          member_name: string
          opened_at: string
          status: string
          summary: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          log_entry_id?: string | null
          member_name?: string
          opened_at?: string
          status?: string
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "concierge_escalations_log_entry_id_fkey"
            columns: ["log_entry_id"]
            isOneToOne: false
            referencedRelation: "concierge_daily_log_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      concierge_member_off_days: {
        Row: {
          created_at: string
          id: string
          off_date: string
          team_member_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          off_date: string
          team_member_id: string
        }
        Update: {
          created_at?: string
          id?: string
          off_date?: string
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concierge_member_off_days_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "concierge_team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      concierge_team_members: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          part_time: boolean
          role: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          part_time?: boolean
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          part_time?: boolean
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      concierge_weekly_report_extras: {
        Row: {
          call_times_by_member_id: Json
          report_key: string
          team_members_helped: string
          updated_at: string
        }
        Insert: {
          call_times_by_member_id?: Json
          report_key: string
          team_members_helped?: string
          updated_at?: string
        }
        Update: {
          call_times_by_member_id?: Json
          report_key?: string
          team_members_helped?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          address: Json | null
          company: string | null
          created_at: string | null
          custom_fields: Json | null
          email: string | null
          first_name: string | null
          id: string
          job_title: string | null
          last_name: string | null
          metadata: Json | null
          org_id: string
          owner_id: string | null
          phone: string | null
          source: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          company?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string | null
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          metadata?: Json | null
          org_id: string
          owner_id?: string | null
          phone?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          company?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string | null
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          metadata?: Json | null
          org_id?: string
          owner_id?: string | null
          phone?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_analytics: {
        Row: {
          avg_time_on_page: number | null
          bounce_rate: number | null
          content_id: string
          content_type: string
          created_at: string | null
          cta_clicks: number | null
          date: string
          engagement_score: number | null
          id: string
          scroll_depth_avg: number | null
          shares: number | null
          traffic_sources: Json | null
          unique_views: number | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          avg_time_on_page?: number | null
          bounce_rate?: number | null
          content_id: string
          content_type: string
          created_at?: string | null
          cta_clicks?: number | null
          date: string
          engagement_score?: number | null
          id?: string
          scroll_depth_avg?: number | null
          shares?: number | null
          traffic_sources?: Json | null
          unique_views?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          avg_time_on_page?: number | null
          bounce_rate?: number | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          cta_clicks?: number | null
          date?: string
          engagement_score?: number | null
          id?: string
          scroll_depth_avg?: number | null
          shares?: number | null
          traffic_sources?: Json | null
          unique_views?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          assigned_to: string | null
          channel: string | null
          created_at: string | null
          id: string
          last_message_at: string | null
          lead_id: string | null
          message_count: number | null
          metadata: Json | null
          org_id: string | null
          status: string | null
          subject: string | null
          unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          channel?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          message_count?: number | null
          metadata?: Json | null
          org_id?: string | null
          status?: string | null
          subject?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          channel?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          message_count?: number | null
          metadata?: Json | null
          org_id?: string | null
          status?: string | null
          subject?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          custom_properties: Json | null
          event_category: string
          event_description: string | null
          event_display_name: string
          event_name: string
          funnel_step: number | null
          id: string
          is_active: boolean | null
          platform_mappings: Json | null
          track_currency: boolean | null
          track_value: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          custom_properties?: Json | null
          event_category: string
          event_description?: string | null
          event_display_name: string
          event_name: string
          funnel_step?: number | null
          id?: string
          is_active?: boolean | null
          platform_mappings?: Json | null
          track_currency?: boolean | null
          track_value?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          custom_properties?: Json | null
          event_category?: string
          event_description?: string | null
          event_display_name?: string
          event_name?: string
          funnel_step?: number | null
          id?: string
          is_active?: boolean | null
          platform_mappings?: Json | null
          track_currency?: boolean | null
          track_value?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      coverage_documents: {
        Row: {
          coverage_id: string
          created_at: string
          document_type: string
          effective_date: string | null
          file_url: string
          id: string
          title: string
        }
        Insert: {
          coverage_id: string
          created_at?: string
          document_type: string
          effective_date?: string | null
          file_url: string
          id?: string
          title: string
        }
        Update: {
          coverage_id?: string
          created_at?: string
          document_type?: string
          effective_date?: string | null
          file_url?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "coverage_documents_coverage_id_fkey"
            columns: ["coverage_id"]
            isOneToOne: false
            referencedRelation: "member_coverage"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_accounts: {
        Row: {
          account_type: string
          address: Json | null
          annual_revenue: number | null
          billing_address: Json | null
          created_at: string
          created_by: string
          description: string | null
          employee_count: number | null
          fax: string | null
          id: string
          industry: string | null
          linkedin_url: string | null
          name: string
          org_id: string
          owner_id: string | null
          parent_account_id: string | null
          phone: string | null
          rating: string | null
          search_vector: unknown
          shipping_address: Json | null
          tags: string[] | null
          twitter_handle: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          account_type?: string
          address?: Json | null
          annual_revenue?: number | null
          billing_address?: Json | null
          created_at?: string
          created_by: string
          description?: string | null
          employee_count?: number | null
          fax?: string | null
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          name: string
          org_id: string
          owner_id?: string | null
          parent_account_id?: string | null
          phone?: string | null
          rating?: string | null
          search_vector?: unknown
          shipping_address?: Json | null
          tags?: string[] | null
          twitter_handle?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          account_type?: string
          address?: Json | null
          annual_revenue?: number | null
          billing_address?: Json | null
          created_at?: string
          created_by?: string
          description?: string | null
          employee_count?: number | null
          fax?: string | null
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          name?: string
          org_id?: string
          owner_id?: string | null
          parent_account_id?: string | null
          phone?: string | null
          rating?: string | null
          search_vector?: unknown
          shipping_address?: Json | null
          tags?: string[] | null
          twitter_handle?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_achievements: {
        Row: {
          category: string
          created_at: string
          criteria_threshold: number
          criteria_type: string
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          org_id: string | null
          rarity: string
          sort_order: number
          xp_reward: number
        }
        Insert: {
          category?: string
          created_at?: string
          criteria_threshold?: number
          criteria_type: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          org_id?: string | null
          rarity?: string
          sort_order?: number
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          criteria_threshold?: number
          criteria_type?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string | null
          rarity?: string
          sort_order?: number
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_achievements_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          account_id: string | null
          activity_type: string
          assigned_to: string | null
          call_duration_seconds: number | null
          call_outcome: string | null
          call_type: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          deal_id: string | null
          description: string | null
          due_at: string | null
          duration_minutes: number | null
          email_status: string | null
          id: string
          lead_id: string | null
          location: string | null
          meeting_link: string | null
          org_id: string
          owner_id: string | null
          priority: string | null
          related_to_id: string | null
          related_to_type: string | null
          reminder_at: string | null
          reminder_sent: boolean | null
          scheduled_at: string | null
          status: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          activity_type: string
          assigned_to?: string | null
          call_duration_seconds?: number | null
          call_outcome?: string | null
          call_type?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by: string
          deal_id?: string | null
          description?: string | null
          due_at?: string | null
          duration_minutes?: number | null
          email_status?: string | null
          id?: string
          lead_id?: string | null
          location?: string | null
          meeting_link?: string | null
          org_id: string
          owner_id?: string | null
          priority?: string | null
          related_to_id?: string | null
          related_to_type?: string | null
          reminder_at?: string | null
          reminder_sent?: boolean | null
          scheduled_at?: string | null
          status?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          activity_type?: string
          assigned_to?: string | null
          call_duration_seconds?: number | null
          call_outcome?: string | null
          call_type?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string
          deal_id?: string | null
          description?: string | null
          due_at?: string | null
          duration_minutes?: number | null
          email_status?: string | null
          id?: string
          lead_id?: string | null
          location?: string | null
          meeting_link?: string | null
          org_id?: string
          owner_id?: string | null
          priority?: string | null
          related_to_id?: string | null
          related_to_type?: string | null
          reminder_at?: string | null
          reminder_sent?: boolean | null
          scheduled_at?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activity_targets: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          org_id: string
          period_end: string
          period_start: string
          rep_id: string | null
          target_type: string
          targets: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          org_id: string
          period_end: string
          period_start: string
          rep_id?: string | null
          target_type: string
          targets?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          org_id?: string
          period_end?: string
          period_start?: string
          rep_id?: string | null
          target_type?: string
          targets?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activity_targets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_approval_actions: {
        Row: {
          acted_at: string
          action: string
          approver_id: string
          comments: string | null
          id: string
          request_id: string
          step_id: string
        }
        Insert: {
          acted_at?: string
          action: string
          approver_id: string
          comments?: string | null
          id?: string
          request_id: string
          step_id: string
        }
        Update: {
          acted_at?: string
          action?: string
          approver_id?: string
          comments?: string | null
          id?: string
          request_id?: string
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_approval_actions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "crm_approval_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_approval_actions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "crm_approval_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_approval_processes: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          entity_type: string
          id: string
          is_active: boolean
          name: string
          org_id: string
          trigger_conditions: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_type: string
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          trigger_conditions?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_type?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          trigger_conditions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      crm_approval_requests: {
        Row: {
          completed_at: string | null
          current_step: number
          entity_id: string
          entity_type: string
          id: string
          notes: string | null
          org_id: string
          process_id: string
          requested_by: string
          status: string
          submitted_at: string
        }
        Insert: {
          completed_at?: string | null
          current_step?: number
          entity_id: string
          entity_type: string
          id?: string
          notes?: string | null
          org_id: string
          process_id: string
          requested_by: string
          status?: string
          submitted_at?: string
        }
        Update: {
          completed_at?: string | null
          current_step?: number
          entity_id?: string
          entity_type?: string
          id?: string
          notes?: string | null
          org_id?: string
          process_id?: string
          requested_by?: string
          status?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_approval_requests_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "crm_approval_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_approval_steps: {
        Row: {
          action_on_reject: string
          approver_id: string | null
          approver_type: string
          auto_approve_after_hours: number | null
          created_at: string
          id: string
          process_id: string
          role_name: string | null
          step_order: number
        }
        Insert: {
          action_on_reject?: string
          approver_id?: string | null
          approver_type: string
          auto_approve_after_hours?: number | null
          created_at?: string
          id?: string
          process_id: string
          role_name?: string | null
          step_order?: number
        }
        Update: {
          action_on_reject?: string
          approver_id?: string | null
          approver_type?: string
          auto_approve_after_hours?: number | null
          created_at?: string
          id?: string
          process_id?: string
          role_name?: string | null
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_approval_steps_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "crm_approval_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_attachments: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          metadata: Json | null
          mime_type: string
          org_id: string
          updated_at: string | null
          uploaded_by: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size?: number
          id?: string
          metadata?: Json | null
          mime_type?: string
          org_id: string
          updated_at?: string | null
          uploaded_by: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          metadata?: Json | null
          mime_type?: string
          org_id?: string
          updated_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_attachments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_audit_log: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          org_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          org_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          org_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_calendar_booking_log: {
        Row: {
          activity_id: string | null
          created_at: string
          engagement_signal_fired: boolean
          event_type_name: string | null
          external_uri: string
          id: string
          invitee_email: string | null
          invitee_name: string | null
          lead_id: string | null
          org_id: string | null
          provider: string
          raw_payload: Json
          recruit_id: string | null
          scheduled_end: string | null
          scheduled_start: string | null
        }
        Insert: {
          activity_id?: string | null
          created_at?: string
          engagement_signal_fired?: boolean
          event_type_name?: string | null
          external_uri: string
          id?: string
          invitee_email?: string | null
          invitee_name?: string | null
          lead_id?: string | null
          org_id?: string | null
          provider: string
          raw_payload?: Json
          recruit_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
        }
        Update: {
          activity_id?: string | null
          created_at?: string
          engagement_signal_fired?: boolean
          event_type_name?: string | null
          external_uri?: string
          id?: string
          invitee_email?: string | null
          invitee_name?: string | null
          lead_id?: string | null
          org_id?: string | null
          provider?: string
          raw_payload?: Json
          recruit_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_calendar_booking_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_calendar_booking_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_calendar_booking_log_recruit_id_fkey"
            columns: ["recruit_id"]
            isOneToOne: false
            referencedRelation: "crm_recruiting_records"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_calendar_integrations: {
        Row: {
          access_token_encrypted: string | null
          calendar_id: string | null
          created_at: string | null
          id: string
          last_sync_at: string | null
          org_id: string
          provider: string
          refresh_token_encrypted: string | null
          sync_enabled: boolean | null
          sync_status: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          org_id: string
          provider: string
          refresh_token_encrypted?: string | null
          sync_enabled?: boolean | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          org_id?: string
          provider?: string
          refresh_token_encrypted?: string | null
          sync_enabled?: boolean | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      crm_campaign_members: {
        Row: {
          added_by: string | null
          campaign_id: string
          contact_id: string | null
          converted_at: string | null
          created_at: string
          first_responded_at: string | null
          id: string
          lead_id: string | null
          notes: string | null
          status: string
        }
        Insert: {
          added_by?: string | null
          campaign_id: string
          contact_id?: string | null
          converted_at?: string | null
          created_at?: string
          first_responded_at?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          status?: string
        }
        Update: {
          added_by?: string | null
          campaign_id?: string
          contact_id?: string | null
          converted_at?: string | null
          created_at?: string
          first_responded_at?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_campaign_members_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_campaign_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_campaigns: {
        Row: {
          actual_cost: number | null
          actual_response: number | null
          actual_revenue: number | null
          budget: number | null
          created_at: string
          created_by: string
          deals_generated: number | null
          deals_won: number | null
          description: string | null
          end_date: string | null
          expected_response: number | null
          expected_revenue: number | null
          id: string
          leads_generated: number | null
          name: string
          num_sent: number | null
          org_id: string
          owner_id: string | null
          parent_campaign_id: string | null
          start_date: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          actual_response?: number | null
          actual_revenue?: number | null
          budget?: number | null
          created_at?: string
          created_by: string
          deals_generated?: number | null
          deals_won?: number | null
          description?: string | null
          end_date?: string | null
          expected_response?: number | null
          expected_revenue?: number | null
          id?: string
          leads_generated?: number | null
          name: string
          num_sent?: number | null
          org_id: string
          owner_id?: string | null
          parent_campaign_id?: string | null
          start_date?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          actual_response?: number | null
          actual_revenue?: number | null
          budget?: number | null
          created_at?: string
          created_by?: string
          deals_generated?: number | null
          deals_won?: number | null
          description?: string | null
          end_date?: string | null
          expected_response?: number | null
          expected_revenue?: number | null
          id?: string
          leads_generated?: number | null
          name?: string
          num_sent?: number | null
          org_id?: string
          owner_id?: string | null
          parent_campaign_id?: string | null
          start_date?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_campaigns_parent_campaign_id_fkey"
            columns: ["parent_campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_case_comments: {
        Row: {
          author_id: string
          body: string
          case_id: string
          created_at: string
          id: string
          is_internal: boolean | null
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          case_id: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          case_id?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_case_comments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "crm_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_cases: {
        Row: {
          account_id: string | null
          assigned_to: string | null
          case_number: string
          category: string | null
          closed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          escalated_at: string | null
          escalated_to: string | null
          first_response_at: string | null
          id: string
          metadata: Json | null
          org_id: string
          origin: Database["public"]["Enums"]["case_origin"] | null
          owner_id: string | null
          priority: Database["public"]["Enums"]["case_priority"]
          resolution: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["case_status"]
          subcategory: string | null
          subject: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          assigned_to?: string | null
          case_number?: string
          category?: string | null
          closed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          first_response_at?: string | null
          id?: string
          metadata?: Json | null
          org_id: string
          origin?: Database["public"]["Enums"]["case_origin"] | null
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["case_priority"]
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          subcategory?: string | null
          subject: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          assigned_to?: string | null
          case_number?: string
          category?: string | null
          closed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          first_response_at?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string
          origin?: Database["public"]["Enums"]["case_origin"] | null
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["case_priority"]
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          subcategory?: string | null
          subject?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_cases_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_cases_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_cases_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_challenge_entries: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          id: string
          org_id: string
          progress: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          org_id: string
          progress?: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          org_id?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_challenge_entries_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "crm_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_challenge_entries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          id: string
          is_active: boolean
          metric: string
          org_id: string
          period: string
          starts_at: string
          target: number
          title: string
          xp_reward: number
        }
        Insert: {
          challenge_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at: string
          id?: string
          is_active?: boolean
          metric: string
          org_id: string
          period?: string
          starts_at: string
          target: number
          title: string
          xp_reward?: number
        }
        Update: {
          challenge_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean
          metric?: string
          org_id?: string
          period?: string
          starts_at?: string
          target?: number
          title?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_challenges_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_community_events: {
        Row: {
          contacts_captured: number
          created_at: string
          created_by: string | null
          event_date: string
          event_type: string
          id: string
          leads_generated: number
          location: string | null
          name: string
          notes: string | null
          org_id: string
          rep_id: string | null
          updated_at: string
        }
        Insert: {
          contacts_captured?: number
          created_at?: string
          created_by?: string | null
          event_date: string
          event_type?: string
          id?: string
          leads_generated?: number
          location?: string | null
          name: string
          notes?: string | null
          org_id: string
          rep_id?: string | null
          updated_at?: string
        }
        Update: {
          contacts_captured?: number
          created_at?: string
          created_by?: string | null
          event_date?: string
          event_type?: string
          id?: string
          leads_generated?: number
          location?: string | null
          name?: string
          notes?: string | null
          org_id?: string
          rep_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_community_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_concierge_handoff_log: {
        Row: {
          handoff_at: string
          id: string
          lead_id: string
          notes: string | null
          org_id: string
          payload: Json
          received_at: string | null
          received_by: string | null
        }
        Insert: {
          handoff_at?: string
          id?: string
          lead_id: string
          notes?: string | null
          org_id: string
          payload?: Json
          received_at?: string | null
          received_by?: string | null
        }
        Update: {
          handoff_at?: string
          id?: string
          lead_id?: string
          notes?: string | null
          org_id?: string
          payload?: Json
          received_at?: string | null
          received_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_concierge_handoff_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_concierge_handoff_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          account_id: string | null
          carrier_id: string | null
          city: string | null
          converted_at: string | null
          converted_from_lead_id: string | null
          created_at: string
          created_by: string
          date_of_birth: string | null
          department: string | null
          description: string | null
          do_not_call: boolean | null
          do_not_email: boolean | null
          email: string | null
          email_opt_out: boolean | null
          fax: string | null
          first_name: string
          id: string
          last_name: string
          lead_source: string | null
          linkedin_url: string | null
          mailing_address: Json | null
          member_responsibility: number | null
          mobile: string | null
          org_id: string
          original_effective_date: string | null
          other_address: Json | null
          owner_id: string | null
          phone: string | null
          plan_type: string | null
          premium_amount: number | null
          reports_to: string | null
          salutation: string | null
          search_vector: unknown
          state: string | null
          subsidy_amount: number | null
          tags: string[] | null
          title: string | null
          tobacco_status: string | null
          twitter_handle: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          carrier_id?: string | null
          city?: string | null
          converted_at?: string | null
          converted_from_lead_id?: string | null
          created_at?: string
          created_by: string
          date_of_birth?: string | null
          department?: string | null
          description?: string | null
          do_not_call?: boolean | null
          do_not_email?: boolean | null
          email?: string | null
          email_opt_out?: boolean | null
          fax?: string | null
          first_name: string
          id?: string
          last_name: string
          lead_source?: string | null
          linkedin_url?: string | null
          mailing_address?: Json | null
          member_responsibility?: number | null
          mobile?: string | null
          org_id: string
          original_effective_date?: string | null
          other_address?: Json | null
          owner_id?: string | null
          phone?: string | null
          plan_type?: string | null
          premium_amount?: number | null
          reports_to?: string | null
          salutation?: string | null
          search_vector?: unknown
          state?: string | null
          subsidy_amount?: number | null
          tags?: string[] | null
          title?: string | null
          tobacco_status?: string | null
          twitter_handle?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          carrier_id?: string | null
          city?: string | null
          converted_at?: string | null
          converted_from_lead_id?: string | null
          created_at?: string
          created_by?: string
          date_of_birth?: string | null
          department?: string | null
          description?: string | null
          do_not_call?: boolean | null
          do_not_email?: boolean | null
          email?: string | null
          email_opt_out?: boolean | null
          fax?: string | null
          first_name?: string
          id?: string
          last_name?: string
          lead_source?: string | null
          linkedin_url?: string | null
          mailing_address?: Json | null
          member_responsibility?: number | null
          mobile?: string | null
          org_id?: string
          original_effective_date?: string | null
          other_address?: Json | null
          owner_id?: string | null
          phone?: string | null
          plan_type?: string | null
          premium_amount?: number | null
          reports_to?: string | null
          salutation?: string | null
          search_vector?: unknown
          state?: string | null
          subsidy_amount?: number | null
          tags?: string[] | null
          title?: string | null
          tobacco_status?: string | null
          twitter_handle?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "insurance_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_reports_to_fkey"
            columns: ["reports_to"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_daily_log_corrections: {
        Row: {
          after_image: Json | null
          before_image: Json
          corrected_at: string
          corrected_by: string
          correction_type: string
          event_id: string
          id: string
          org_id: string
          original_user_id: string | null
          reason: string
        }
        Insert: {
          after_image?: Json | null
          before_image: Json
          corrected_at?: string
          corrected_by: string
          correction_type: string
          event_id: string
          id?: string
          org_id: string
          original_user_id?: string | null
          reason: string
        }
        Update: {
          after_image?: Json | null
          before_image?: Json
          corrected_at?: string
          corrected_by?: string
          correction_type?: string
          event_id?: string
          id?: string
          org_id?: string
          original_user_id?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_daily_log_corrections_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_daily_log_events: {
        Row: {
          activity_subtype: string | null
          activity_type: string
          created_at: string
          description: string | null
          id: string
          log_date: string
          manual: boolean
          metadata: Json
          occurred_at: string
          org_id: string
          section: string
          source: string
          source_id: string | null
          user_id: string
        }
        Insert: {
          activity_subtype?: string | null
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          log_date: string
          manual?: boolean
          metadata?: Json
          occurred_at?: string
          org_id: string
          section: string
          source: string
          source_id?: string | null
          user_id: string
        }
        Update: {
          activity_subtype?: string | null
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          log_date?: string
          manual?: boolean
          metadata?: Json
          occurred_at?: string
          org_id?: string
          section?: string
          source?: string
          source_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_daily_log_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_daily_log_ui_config: {
        Row: {
          accordion_mode: string
          created_at: string
          default_collapsed: boolean
          org_id: string
          spec_locked: boolean
          updated_at: string
        }
        Insert: {
          accordion_mode?: string
          created_at?: string
          default_collapsed?: boolean
          org_id: string
          spec_locked?: boolean
          updated_at?: string
        }
        Update: {
          accordion_mode?: string
          created_at?: string
          default_collapsed?: boolean
          org_id?: string
          spec_locked?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_daily_log_ui_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_dashboard_layouts: {
        Row: {
          created_at: string | null
          description: string | null
          grid_columns: number | null
          id: string
          is_default: boolean | null
          name: string
          org_id: string
          row_height: number | null
          theme: Json | null
          updated_at: string | null
          user_id: string
          widgets: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          grid_columns?: number | null
          id?: string
          is_default?: boolean | null
          name?: string
          org_id: string
          row_height?: number | null
          theme?: Json | null
          updated_at?: string | null
          user_id: string
          widgets?: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          grid_columns?: number | null
          id?: string
          is_default?: boolean | null
          name?: string
          org_id?: string
          row_height?: number | null
          theme?: Json | null
          updated_at?: string | null
          user_id?: string
          widgets?: Json
        }
        Relationships: []
      }
      crm_dashboard_notes: {
        Row: {
          color: string | null
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          linked_entity_id: string | null
          linked_entity_type: string | null
          org_id: string
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          org_id: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          org_id?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      crm_deal_contacts: {
        Row: {
          contact_id: string
          created_at: string
          deal_id: string
          id: string
          is_primary: boolean | null
          role: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string
          deal_id: string
          id?: string
          is_primary?: boolean | null
          role?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string
          deal_id?: string
          id?: string
          is_primary?: boolean | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deal_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deal_contacts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deal_predictions: {
        Row: {
          calculated_at: string
          confidence: string
          deal_health_score: number
          deal_id: string
          factors: Json
          id: string
          model_version: string
          org_id: string
          predicted_close_date: string | null
          recommended_actions: Json
          risk_signals: Json
          win_probability: number
        }
        Insert: {
          calculated_at?: string
          confidence?: string
          deal_health_score?: number
          deal_id: string
          factors?: Json
          id?: string
          model_version?: string
          org_id: string
          predicted_close_date?: string | null
          recommended_actions?: Json
          risk_signals?: Json
          win_probability?: number
        }
        Update: {
          calculated_at?: string
          confidence?: string
          deal_health_score?: number
          deal_id?: string
          factors?: Json
          id?: string
          model_version?: string
          org_id?: string
          predicted_close_date?: string | null
          recommended_actions?: Json
          risk_signals?: Json
          win_probability?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_deal_predictions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: true
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deal_predictions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deal_products: {
        Row: {
          created_at: string
          deal_id: string
          discount_percent: number | null
          id: string
          product_id: string
          quantity: number | null
          total: number | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          discount_percent?: number | null
          id?: string
          product_id: string
          quantity?: number | null
          total?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          discount_percent?: number | null
          id?: string
          product_id?: string
          quantity?: number | null
          total?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_deal_products_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deal_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "crm_products"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deal_room_messages: {
        Row: {
          content: string
          created_at: string
          edited_at: string | null
          id: string
          mentions: Json
          message_type: string
          metadata: Json
          org_id: string
          reactions: Json
          room_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          mentions?: Json
          message_type?: string
          metadata?: Json
          org_id: string
          reactions?: Json
          room_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          mentions?: Json
          message_type?: string
          metadata?: Json
          org_id?: string
          reactions?: Json
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_deal_room_messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deal_room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "crm_deal_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deal_room_participants: {
        Row: {
          created_at: string
          id: string
          is_online: boolean
          last_seen_at: string
          role: string
          room_id: string
          user_avatar_url: string | null
          user_email: string
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_online?: boolean
          last_seen_at?: string
          role?: string
          room_id: string
          user_avatar_url?: string | null
          user_email: string
          user_id: string
          user_name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_online?: boolean
          last_seen_at?: string
          role?: string
          room_id?: string
          user_avatar_url?: string | null
          user_email?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_deal_room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "crm_deal_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deal_room_pinned_items: {
        Row: {
          entity_id: string | null
          id: string
          item_type: string
          pinned_at: string
          pinned_by: string
          room_id: string
          title: string
          url: string | null
        }
        Insert: {
          entity_id?: string | null
          id?: string
          item_type: string
          pinned_at?: string
          pinned_by: string
          room_id: string
          title: string
          url?: string | null
        }
        Update: {
          entity_id?: string | null
          id?: string
          item_type?: string
          pinned_at?: string
          pinned_by?: string
          room_id?: string
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deal_room_pinned_items_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "crm_deal_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deal_rooms: {
        Row: {
          created_at: string
          created_by: string | null
          deal_id: string
          description: string | null
          id: string
          name: string
          org_id: string
          participants: Json
          pinned_items: Json
          settings: Json
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deal_id: string
          description?: string | null
          id?: string
          name: string
          org_id: string
          participants?: Json
          pinned_items?: Json
          settings?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deal_id?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          participants?: Json
          pinned_items?: Json
          settings?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_deal_rooms_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: true
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deal_rooms_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deal_stage_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          deal_id: string
          from_stage_id: string | null
          id: string
          notes: string | null
          to_stage_id: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          deal_id: string
          from_stage_id?: string | null
          id?: string
          notes?: string | null
          to_stage_id: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          deal_id?: string
          from_stage_id?: string | null
          id?: string
          notes?: string | null
          to_stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_deal_stage_history_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deal_stage_history_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "crm_deal_stage_metrics"
            referencedColumns: ["stage_id"]
          },
          {
            foreignKeyName: "crm_deal_stage_history_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "crm_deal_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deal_stage_history_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "crm_deal_stage_metrics"
            referencedColumns: ["stage_id"]
          },
          {
            foreignKeyName: "crm_deal_stage_history_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "crm_deal_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deal_stages: {
        Row: {
          color: string | null
          created_at: string
          display_name: string
          icon: string | null
          id: string
          is_active: boolean | null
          is_lost_stage: boolean | null
          is_won_stage: boolean | null
          name: string
          org_id: string
          probability: number | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_lost_stage?: boolean | null
          is_won_stage?: boolean | null
          name: string
          org_id: string
          probability?: number | null
          sort_order: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_lost_stage?: boolean | null
          is_won_stage?: boolean | null
          name?: string
          org_id?: string
          probability?: number | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_deal_stages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals: {
        Row: {
          account_id: string | null
          actual_close_date: string | null
          amount: number | null
          campaign_id: string | null
          contact_id: string | null
          converted_from_lead_id: string | null
          created_at: string
          created_by: string
          currency: string | null
          deal_type: string | null
          description: string | null
          expected_close_date: string | null
          id: string
          lead_source: string | null
          lost_at: string | null
          lost_reason: string | null
          name: string
          next_step: string | null
          org_id: string
          owner_id: string | null
          probability: number | null
          product_line: string | null
          search_vector: unknown
          stage_id: string
          tags: string[] | null
          updated_at: string
          won_at: string | null
        }
        Insert: {
          account_id?: string | null
          actual_close_date?: string | null
          amount?: number | null
          campaign_id?: string | null
          contact_id?: string | null
          converted_from_lead_id?: string | null
          created_at?: string
          created_by: string
          currency?: string | null
          deal_type?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lead_source?: string | null
          lost_at?: string | null
          lost_reason?: string | null
          name: string
          next_step?: string | null
          org_id: string
          owner_id?: string | null
          probability?: number | null
          product_line?: string | null
          search_vector?: unknown
          stage_id: string
          tags?: string[] | null
          updated_at?: string
          won_at?: string | null
        }
        Update: {
          account_id?: string | null
          actual_close_date?: string | null
          amount?: number | null
          campaign_id?: string | null
          contact_id?: string | null
          converted_from_lead_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string | null
          deal_type?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lead_source?: string | null
          lost_at?: string | null
          lost_reason?: string | null
          name?: string
          next_step?: string | null
          org_id?: string
          owner_id?: string | null
          probability?: number | null
          product_line?: string | null
          search_vector?: unknown
          stage_id?: string
          tags?: string[] | null
          updated_at?: string
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_deal_stage_metrics"
            referencedColumns: ["stage_id"]
          },
          {
            foreignKeyName: "crm_deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_deal_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_default_layout_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          grid_columns: number | null
          id: string
          is_active: boolean | null
          name: string
          org_id: string | null
          row_height: number | null
          updated_at: string | null
          widgets: Json
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          grid_columns?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          org_id?: string | null
          row_height?: number | null
          updated_at?: string | null
          widgets?: Json
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          grid_columns?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          org_id?: string | null
          row_height?: number | null
          updated_at?: string | null
          widgets?: Json
        }
        Relationships: []
      }
      crm_documents: {
        Row: {
          category: string
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          file_name: string
          file_path: string
          file_size: number
          folder: string | null
          id: string
          is_public: boolean | null
          metadata: Json | null
          mime_type: string
          name: string
          org_id: string
          tags: string[] | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          file_name: string
          file_path: string
          file_size?: number
          folder?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          mime_type?: string
          name: string
          org_id: string
          tags?: string[] | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          folder?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          mime_type?: string
          name?: string
          org_id?: string
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_email_ab_tests: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          metric: string
          name: string
          org_id: string
          sample_size: number
          started_at: string | null
          status: string
          template_id: string | null
          updated_at: string
          variant_a: Json
          variant_a_sent: number
          variant_a_success: number
          variant_b: Json
          variant_b_sent: number
          variant_b_success: number
          winner: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          metric?: string
          name: string
          org_id: string
          sample_size?: number
          started_at?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          variant_a?: Json
          variant_a_sent?: number
          variant_a_success?: number
          variant_b?: Json
          variant_b_sent?: number
          variant_b_success?: number
          winner?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          metric?: string
          name?: string
          org_id?: string
          sample_size?: number
          started_at?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          variant_a?: Json
          variant_a_sent?: number
          variant_a_success?: number
          variant_b?: Json
          variant_b_sent?: number
          variant_b_success?: number
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_email_ab_tests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_email_attachments: {
        Row: {
          checksum: string | null
          draft_id: string | null
          email_id: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          public_url: string | null
          storage_bucket: string | null
          storage_path: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          checksum?: string | null
          draft_id?: string | null
          email_id?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          public_url?: string | null
          storage_bucket?: string | null
          storage_path: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          checksum?: string | null
          draft_id?: string | null
          email_id?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          public_url?: string | null
          storage_bucket?: string | null
          storage_path?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_email_attachments_draft"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "crm_email_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_email_attachments_email"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "crm_email_log"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_email_drafts: {
        Row: {
          account_id: string | null
          auto_saved: boolean | null
          bcc_addresses: string[] | null
          body_html: string | null
          body_plain: string | null
          cc_addresses: string[] | null
          contact_id: string | null
          created_at: string | null
          forward_from_email_id: string | null
          id: string
          include_signature: boolean | null
          last_edited_at: string | null
          lead_id: string | null
          org_id: string
          reply_to_email_id: string | null
          scheduled_send_at: string | null
          signature_id: string | null
          subject: string | null
          template_id: string | null
          thread_id: string | null
          to_addresses: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          auto_saved?: boolean | null
          bcc_addresses?: string[] | null
          body_html?: string | null
          body_plain?: string | null
          cc_addresses?: string[] | null
          contact_id?: string | null
          created_at?: string | null
          forward_from_email_id?: string | null
          id?: string
          include_signature?: boolean | null
          last_edited_at?: string | null
          lead_id?: string | null
          org_id: string
          reply_to_email_id?: string | null
          scheduled_send_at?: string | null
          signature_id?: string | null
          subject?: string | null
          template_id?: string | null
          thread_id?: string | null
          to_addresses?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          auto_saved?: boolean | null
          bcc_addresses?: string[] | null
          body_html?: string | null
          body_plain?: string | null
          cc_addresses?: string[] | null
          contact_id?: string | null
          created_at?: string | null
          forward_from_email_id?: string | null
          id?: string
          include_signature?: boolean | null
          last_edited_at?: string | null
          lead_id?: string | null
          org_id?: string
          reply_to_email_id?: string | null
          scheduled_send_at?: string | null
          signature_id?: string | null
          subject?: string | null
          template_id?: string | null
          thread_id?: string | null
          to_addresses?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_email_drafts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_email_drafts_signature_id_fkey"
            columns: ["signature_id"]
            isOneToOne: false
            referencedRelation: "crm_email_signatures"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_email_log: {
        Row: {
          ab_test_id: string | null
          ab_variant: string | null
          attachment_count: number | null
          bcc_addresses: string[] | null
          body_html: string | null
          body_preview: string | null
          cc_addresses: string[] | null
          click_count: number | null
          created_at: string | null
          direction: string | null
          first_opened_at: string | null
          from_address: string | null
          from_name: string | null
          has_attachments: boolean | null
          id: string
          in_reply_to: string | null
          inbound_address: string | null
          is_archived: boolean | null
          is_read: boolean | null
          is_starred: boolean | null
          labels: string[] | null
          last_opened_at: string | null
          lead_id: string | null
          master_template_id: string | null
          message_id: string | null
          metadata: Json | null
          open_count: number | null
          org_id: string | null
          recruit_id: string | null
          references_header: string | null
          reply_to_id: string | null
          resend_email_id: string | null
          sent_at: string | null
          sent_by: string | null
          signature_id: string | null
          status: string | null
          subject: string | null
          template_id: string | null
          thread_id: string | null
          to_addresses: string[] | null
          to_email: string
          tracking_id: string | null
        }
        Insert: {
          ab_test_id?: string | null
          ab_variant?: string | null
          attachment_count?: number | null
          bcc_addresses?: string[] | null
          body_html?: string | null
          body_preview?: string | null
          cc_addresses?: string[] | null
          click_count?: number | null
          created_at?: string | null
          direction?: string | null
          first_opened_at?: string | null
          from_address?: string | null
          from_name?: string | null
          has_attachments?: boolean | null
          id?: string
          in_reply_to?: string | null
          inbound_address?: string | null
          is_archived?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          labels?: string[] | null
          last_opened_at?: string | null
          lead_id?: string | null
          master_template_id?: string | null
          message_id?: string | null
          metadata?: Json | null
          open_count?: number | null
          org_id?: string | null
          recruit_id?: string | null
          references_header?: string | null
          reply_to_id?: string | null
          resend_email_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          signature_id?: string | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
          thread_id?: string | null
          to_addresses?: string[] | null
          to_email: string
          tracking_id?: string | null
        }
        Update: {
          ab_test_id?: string | null
          ab_variant?: string | null
          attachment_count?: number | null
          bcc_addresses?: string[] | null
          body_html?: string | null
          body_preview?: string | null
          cc_addresses?: string[] | null
          click_count?: number | null
          created_at?: string | null
          direction?: string | null
          first_opened_at?: string | null
          from_address?: string | null
          from_name?: string | null
          has_attachments?: boolean | null
          id?: string
          in_reply_to?: string | null
          inbound_address?: string | null
          is_archived?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          labels?: string[] | null
          last_opened_at?: string | null
          lead_id?: string | null
          master_template_id?: string | null
          message_id?: string | null
          metadata?: Json | null
          open_count?: number | null
          org_id?: string | null
          recruit_id?: string | null
          references_header?: string | null
          reply_to_id?: string | null
          resend_email_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          signature_id?: string | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
          thread_id?: string | null
          to_addresses?: string[] | null
          to_email?: string
          tracking_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_email_log_ab_test_id_fkey"
            columns: ["ab_test_id"]
            isOneToOne: false
            referencedRelation: "crm_email_ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_email_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_email_log_master_template_id_fkey"
            columns: ["master_template_id"]
            isOneToOne: false
            referencedRelation: "crm_master_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_email_log_recruit_id_fkey"
            columns: ["recruit_id"]
            isOneToOne: false
            referencedRelation: "crm_recruiting_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_email_log_signature_id_fkey"
            columns: ["signature_id"]
            isOneToOne: false
            referencedRelation: "crm_email_signatures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_email_log_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "crm_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_email_log_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "crm_email_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_email_routing_rules: {
        Row: {
          action: string
          action_config: Json | null
          created_at: string | null
          id: string
          inbound_address: string
          is_active: boolean | null
          name: string
          org_id: string
          priority: number | null
          updated_at: string | null
        }
        Insert: {
          action?: string
          action_config?: Json | null
          created_at?: string | null
          id?: string
          inbound_address: string
          is_active?: boolean | null
          name: string
          org_id: string
          priority?: number | null
          updated_at?: string | null
        }
        Update: {
          action?: string
          action_config?: Json | null
          created_at?: string | null
          id?: string
          inbound_address?: string
          is_active?: boolean | null
          name?: string
          org_id?: string
          priority?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_email_sequence_enrollments: {
        Row: {
          completed_at: string | null
          contact_id: string | null
          current_step: number | null
          enrolled_at: string | null
          enrolled_by: string | null
          id: string
          last_activity_at: string | null
          lead_id: string | null
          metadata: Json | null
          next_action_at: string | null
          sequence_id: string
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          contact_id?: string | null
          current_step?: number | null
          enrolled_at?: string | null
          enrolled_by?: string | null
          id?: string
          last_activity_at?: string | null
          lead_id?: string | null
          metadata?: Json | null
          next_action_at?: string | null
          sequence_id: string
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          contact_id?: string | null
          current_step?: number | null
          enrolled_at?: string | null
          enrolled_by?: string | null
          id?: string
          last_activity_at?: string | null
          lead_id?: string | null
          metadata?: Json | null
          next_action_at?: string | null
          sequence_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_email_sequence_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "crm_email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_email_sequence_steps: {
        Row: {
          body_override: string | null
          condition_config: Json | null
          created_at: string | null
          delay_days: number | null
          delay_hours: number | null
          id: string
          is_active: boolean | null
          sequence_id: string
          step_number: number
          step_type: string | null
          subject_override: string | null
          task_config: Json | null
          template_id: string | null
          total_clicked: number | null
          total_opened: number | null
          total_replied: number | null
          total_sent: number | null
        }
        Insert: {
          body_override?: string | null
          condition_config?: Json | null
          created_at?: string | null
          delay_days?: number | null
          delay_hours?: number | null
          id?: string
          is_active?: boolean | null
          sequence_id: string
          step_number: number
          step_type?: string | null
          subject_override?: string | null
          task_config?: Json | null
          template_id?: string | null
          total_clicked?: number | null
          total_opened?: number | null
          total_replied?: number | null
          total_sent?: number | null
        }
        Update: {
          body_override?: string | null
          condition_config?: Json | null
          created_at?: string | null
          delay_days?: number | null
          delay_hours?: number | null
          id?: string
          is_active?: boolean | null
          sequence_id?: string
          step_number?: number
          step_type?: string | null
          subject_override?: string | null
          task_config?: Json | null
          template_id?: string | null
          total_clicked?: number | null
          total_opened?: number | null
          total_replied?: number | null
          total_sent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_email_sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "crm_email_sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_email_sequence_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "crm_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_email_sequences: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          exit_conditions: Json | null
          id: string
          name: string
          org_id: string
          settings: Json | null
          status: string | null
          total_bounced: number | null
          total_completed: number | null
          total_enrolled: number | null
          total_replied: number | null
          trigger_config: Json | null
          trigger_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          exit_conditions?: Json | null
          id?: string
          name: string
          org_id: string
          settings?: Json | null
          status?: string | null
          total_bounced?: number | null
          total_completed?: number | null
          total_enrolled?: number | null
          total_replied?: number | null
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          exit_conditions?: Json | null
          id?: string
          name?: string
          org_id?: string
          settings?: Json | null
          status?: string | null
          total_bounced?: number | null
          total_completed?: number | null
          total_enrolled?: number | null
          total_replied?: number | null
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_email_signatures: {
        Row: {
          banner_storage_path: string | null
          banner_url: string | null
          content: string
          created_at: string | null
          font_family: string | null
          id: string
          is_default: boolean | null
          logo_storage_path: string | null
          logo_url: string | null
          name: string
          org_id: string
          primary_color: string | null
          social_links: Json | null
          updated_at: string | null
          user_id: string
          variables: Json | null
        }
        Insert: {
          banner_storage_path?: string | null
          banner_url?: string | null
          content: string
          created_at?: string | null
          font_family?: string | null
          id?: string
          is_default?: boolean | null
          logo_storage_path?: string | null
          logo_url?: string | null
          name: string
          org_id: string
          primary_color?: string | null
          social_links?: Json | null
          updated_at?: string | null
          user_id: string
          variables?: Json | null
        }
        Update: {
          banner_storage_path?: string | null
          banner_url?: string | null
          content?: string
          created_at?: string | null
          font_family?: string | null
          id?: string
          is_default?: boolean | null
          logo_storage_path?: string | null
          logo_url?: string | null
          name?: string
          org_id?: string
          primary_color?: string | null
          social_links?: Json | null
          updated_at?: string | null
          user_id?: string
          variables?: Json | null
        }
        Relationships: []
      }
      crm_email_threads: {
        Row: {
          account_id: string | null
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          has_unread: boolean | null
          id: string
          is_archived: boolean | null
          is_starred: boolean | null
          labels: string[] | null
          last_message_at: string | null
          last_message_preview: string | null
          lead_id: string | null
          message_count: number | null
          org_id: string
          participants: string[] | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          has_unread?: boolean | null
          id?: string
          is_archived?: boolean | null
          is_starred?: boolean | null
          labels?: string[] | null
          last_message_at?: string | null
          last_message_preview?: string | null
          lead_id?: string | null
          message_count?: number | null
          org_id: string
          participants?: string[] | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          has_unread?: boolean | null
          id?: string
          is_archived?: boolean | null
          is_starred?: boolean | null
          labels?: string[] | null
          last_message_at?: string | null
          last_message_preview?: string | null
          lead_id?: string | null
          message_count?: number | null
          org_id?: string
          participants?: string[] | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_email_threads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_email_tracking: {
        Row: {
          device_type: string | null
          email_log_id: string
          id: string
          ip_address: string | null
          link_url: string | null
          location_city: string | null
          location_country: string | null
          tracked_at: string | null
          tracking_type: string
          user_agent: string | null
        }
        Insert: {
          device_type?: string | null
          email_log_id: string
          id?: string
          ip_address?: string | null
          link_url?: string | null
          location_city?: string | null
          location_country?: string | null
          tracked_at?: string | null
          tracking_type: string
          user_agent?: string | null
        }
        Update: {
          device_type?: string | null
          email_log_id?: string
          id?: string
          ip_address?: string | null
          link_url?: string | null
          location_city?: string | null
          location_country?: string | null
          tracked_at?: string | null
          tracking_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_email_tracking_email_log_id_fkey"
            columns: ["email_log_id"]
            isOneToOne: false
            referencedRelation: "crm_email_log"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_family_members: {
        Row: {
          contact_id: string | null
          coverage_end_date: string | null
          coverage_start_date: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string
          gender: string | null
          id: string
          is_covered: boolean | null
          last_name: string
          lead_id: string | null
          notes: string | null
          org_id: string
          relationship: string
          search_vector: unknown
          sort_order: number | null
          ssn_last_four: string | null
          tobacco_user: boolean | null
          updated_at: string
        }
        Insert: {
          contact_id?: string | null
          coverage_end_date?: string | null
          coverage_start_date?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          id?: string
          is_covered?: boolean | null
          last_name: string
          lead_id?: string | null
          notes?: string | null
          org_id: string
          relationship: string
          search_vector?: unknown
          sort_order?: number | null
          ssn_last_four?: string | null
          tobacco_user?: boolean | null
          updated_at?: string
        }
        Update: {
          contact_id?: string | null
          coverage_end_date?: string | null
          coverage_start_date?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          is_covered?: boolean | null
          last_name?: string
          lead_id?: string | null
          notes?: string | null
          org_id?: string
          relationship?: string
          search_vector?: unknown
          sort_order?: number | null
          ssn_last_four?: string | null
          tobacco_user?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_family_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_family_members_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_family_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_focus_items: {
        Row: {
          completed_at: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          notes: string | null
          org_id: string
          pinned_at: string | null
          priority: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          notes?: string | null
          org_id: string
          pinned_at?: string | null
          priority?: number | null
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          notes?: string | null
          org_id?: string
          pinned_at?: string | null
          priority?: number | null
          user_id?: string
        }
        Relationships: []
      }
      crm_follow_up_cadences: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          halt_on_engagement: boolean
          halt_on_optout: boolean
          id: string
          is_active: boolean
          is_default: boolean
          module_scope: string
          name: string
          org_id: string
          pipeline_stage_id: string | null
          schema_version: number
          steps: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          halt_on_engagement?: boolean
          halt_on_optout?: boolean
          id?: string
          is_active?: boolean
          is_default?: boolean
          module_scope?: string
          name: string
          org_id: string
          pipeline_stage_id?: string | null
          schema_version?: number
          steps?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          halt_on_engagement?: boolean
          halt_on_optout?: boolean
          id?: string
          is_active?: boolean
          is_default?: boolean
          module_scope?: string
          name?: string
          org_id?: string
          pipeline_stage_id?: string | null
          schema_version?: number
          steps?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_follow_up_cadences_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_follow_up_cadences_pipeline_stage_id_fkey"
            columns: ["pipeline_stage_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_forecast_entries: {
        Row: {
          amount: number
          close_date: string | null
          created_at: string
          deal_id: string
          forecast_category: Database["public"]["Enums"]["forecast_category"]
          forecast_id: string
          id: string
          notes: string | null
          probability: number
          stage: string | null
          updated_at: string
          user_id: string | null
          weighted_amount: number
        }
        Insert: {
          amount?: number
          close_date?: string | null
          created_at?: string
          deal_id: string
          forecast_category?: Database["public"]["Enums"]["forecast_category"]
          forecast_id: string
          id?: string
          notes?: string | null
          probability?: number
          stage?: string | null
          updated_at?: string
          user_id?: string | null
          weighted_amount?: number
        }
        Update: {
          amount?: number
          close_date?: string | null
          created_at?: string
          deal_id?: string
          forecast_category?: Database["public"]["Enums"]["forecast_category"]
          forecast_id?: string
          id?: string
          notes?: string | null
          probability?: number
          stage?: string | null
          updated_at?: string
          user_id?: string | null
          weighted_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_forecast_entries_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_forecast_entries_forecast_id_fkey"
            columns: ["forecast_id"]
            isOneToOne: false
            referencedRelation: "crm_forecasts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_forecasts: {
        Row: {
          created_at: string
          created_by: string
          forecast_type: Database["public"]["Enums"]["forecast_type"]
          id: string
          name: string
          org_id: string
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["forecast_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          forecast_type?: Database["public"]["Enums"]["forecast_type"]
          id?: string
          name: string
          org_id: string
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["forecast_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          forecast_type?: Database["public"]["Enums"]["forecast_type"]
          id?: string
          name?: string
          org_id?: string
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["forecast_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_forecasts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_integration_accounts: {
        Row: {
          created_at: string
          external_user_id: string | null
          id: string
          metadata: Json | null
          org_id: string
          provider: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          external_user_id?: string | null
          id?: string
          metadata?: Json | null
          org_id: string
          provider: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          external_user_id?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_integration_accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_invoice_line_items: {
        Row: {
          created_at: string
          description: string | null
          discount_amount: number | null
          discount_percent: number | null
          id: string
          invoice_id: string
          line_total: number
          name: string
          product_id: string | null
          quantity: number
          sort_order: number | null
          tax_amount: number | null
          tax_rate: number | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          invoice_id: string
          line_total: number
          name: string
          product_id?: string | null
          quantity?: number
          sort_order?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          invoice_id?: string
          line_total?: number
          name?: string
          product_id?: string | null
          quantity?: number
          sort_order?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "crm_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_invoice_line_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "crm_products"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_invoice_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          recorded_by: string | null
          reference_number: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          recorded_by?: string | null
          reference_number?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          recorded_by?: string | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "crm_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_invoices: {
        Row: {
          account_id: string | null
          adjustment: number | null
          amount_paid: number | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          balance_due: number | null
          billing_address: Json | null
          contact_id: string | null
          created_at: string
          created_by: string
          currency: string | null
          deal_id: string | null
          description: string | null
          discount_amount: number | null
          discount_type: string | null
          discount_value: number | null
          due_date: string | null
          id: string
          invoice_date: string | null
          invoice_number: string
          notes: string | null
          org_id: string
          owner_id: string | null
          paid_date: string | null
          payment_terms: string | null
          quote_id: string | null
          rejection_reason: string | null
          sent_at: string | null
          shipping_address: Json | null
          shipping_amount: number | null
          status: string
          subject: string | null
          subtotal: number | null
          tax_amount: number | null
          terms_and_conditions: string | null
          total: number | null
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          account_id?: string | null
          adjustment?: number | null
          amount_paid?: number | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          balance_due?: number | null
          billing_address?: Json | null
          contact_id?: string | null
          created_at?: string
          created_by: string
          currency?: string | null
          deal_id?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number: string
          notes?: string | null
          org_id: string
          owner_id?: string | null
          paid_date?: string | null
          payment_terms?: string | null
          quote_id?: string | null
          rejection_reason?: string | null
          sent_at?: string | null
          shipping_address?: Json | null
          shipping_amount?: number | null
          status?: string
          subject?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          terms_and_conditions?: string | null
          total?: number | null
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          account_id?: string | null
          adjustment?: number | null
          amount_paid?: number | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          balance_due?: number | null
          billing_address?: Json | null
          contact_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string | null
          deal_id?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string
          notes?: string | null
          org_id?: string
          owner_id?: string | null
          paid_date?: string | null
          payment_terms?: string | null
          quote_id?: string | null
          rejection_reason?: string | null
          sent_at?: string | null
          shipping_address?: Json | null
          shipping_amount?: number | null
          status?: string
          subject?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          terms_and_conditions?: string | null
          total?: number | null
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_invoices_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_invoices_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "crm_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_cadence_state: {
        Row: {
          cadence_id: string
          completed_at: string | null
          created_at: string
          current_step: number
          id: string
          lead_id: string
          next_action_at: string | null
          org_id: string
          paused: boolean
          paused_reason: string | null
          updated_at: string
        }
        Insert: {
          cadence_id: string
          completed_at?: string | null
          created_at?: string
          current_step?: number
          id?: string
          lead_id: string
          next_action_at?: string | null
          org_id: string
          paused?: boolean
          paused_reason?: string | null
          updated_at?: string
        }
        Update: {
          cadence_id?: string
          completed_at?: string | null
          created_at?: string
          current_step?: number
          id?: string
          lead_id?: string
          next_action_at?: string | null
          org_id?: string
          paused?: boolean
          paused_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_cadence_state_cadence_id_fkey"
            columns: ["cadence_id"]
            isOneToOne: false
            referencedRelation: "crm_follow_up_cadences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_cadence_state_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_health_quotes: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          created_by: string | null
          decline_reason: string | null
          declined_at: string | null
          dependent_ages: number[] | null
          household_type: string
          id: string
          lead_id: string
          member_count: number | null
          notes: string | null
          org_id: string | null
          primary_age: number
          quote_lines: Json
          quote_number: string
          sent_at: string | null
          source: string | null
          spouse_age: number | null
          state: string | null
          status: string | null
          tobacco_user: boolean | null
          total_annual: number | null
          total_monthly: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
          viewed_at: string | null
          website_submission_id: string | null
          zip_code: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          dependent_ages?: number[] | null
          household_type: string
          id?: string
          lead_id: string
          member_count?: number | null
          notes?: string | null
          org_id?: string | null
          primary_age: number
          quote_lines?: Json
          quote_number: string
          sent_at?: string | null
          source?: string | null
          spouse_age?: number | null
          state?: string | null
          status?: string | null
          tobacco_user?: boolean | null
          total_annual?: number | null
          total_monthly?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          viewed_at?: string | null
          website_submission_id?: string | null
          zip_code?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          dependent_ages?: number[] | null
          household_type?: string
          id?: string
          lead_id?: string
          member_count?: number | null
          notes?: string | null
          org_id?: string | null
          primary_age?: number
          quote_lines?: Json
          quote_number?: string
          sent_at?: string | null
          source?: string | null
          spouse_age?: number | null
          state?: string | null
          status?: string | null
          tobacco_user?: boolean | null
          total_annual?: number | null
          total_monthly?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          viewed_at?: string | null
          website_submission_id?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_health_quotes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_plan_interests: {
        Row: {
          created_at: string | null
          created_by: string | null
          dependent_ages: number[] | null
          family_size: string
          id: string
          interest_level: string | null
          lead_id: string
          notes: string | null
          plan_code: string | null
          plan_id: string | null
          plan_name: string
          primary_age: number | null
          quote_valid_until: string | null
          quoted_at: string | null
          quoted_monthly_rate: number | null
          source: string | null
          source_quote_id: string | null
          spouse_age: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          dependent_ages?: number[] | null
          family_size?: string
          id?: string
          interest_level?: string | null
          lead_id: string
          notes?: string | null
          plan_code?: string | null
          plan_id?: string | null
          plan_name: string
          primary_age?: number | null
          quote_valid_until?: string | null
          quoted_at?: string | null
          quoted_monthly_rate?: number | null
          source?: string | null
          source_quote_id?: string | null
          spouse_age?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          dependent_ages?: number[] | null
          family_size?: string
          id?: string
          interest_level?: string | null
          lead_id?: string
          notes?: string | null
          plan_code?: string | null
          plan_id?: string | null
          plan_name?: string
          primary_age?: number | null
          quote_valid_until?: string | null
          quoted_at?: string | null
          quoted_monthly_rate?: number | null
          source?: string | null
          source_quote_id?: string | null
          spouse_age?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_plan_interests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_plan_interests_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_quote_history: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
          monthly_price: number | null
          notes: string | null
          org_id: string
          plan_name: string
          plan_structure: string | null
          quote_date: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
          monthly_price?: number | null
          notes?: string | null
          org_id: string
          plan_name: string
          plan_structure?: string | null
          quote_date?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
          monthly_price?: number | null
          notes?: string | null
          org_id?: string
          plan_name?: string
          plan_structure?: string | null
          quote_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_quote_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_quote_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_source_types: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_self_generated: boolean
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_self_generated?: boolean
          label: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_self_generated?: boolean
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      crm_lead_time_entries: {
        Row: {
          created_at: string
          description: string | null
          duration_seconds: number
          id: string
          lead_id: string
          occurred_at: string
          org_id: string
          source: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_seconds: number
          id?: string
          lead_id: string
          occurred_at?: string
          org_id: string
          source: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_seconds?: number
          id?: string
          lead_id?: string
          occurred_at?: string
          org_id?: string
          source?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_time_entries_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_time_entries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_linkedin_config: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          org_id: string
          updated_at: string
          weekly_content_target: Json
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          org_id: string
          updated_at?: string
          weekly_content_target?: Json
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          org_id?: string
          updated_at?: string
          weekly_content_target?: Json
        }
        Relationships: [
          {
            foreignKeyName: "crm_linkedin_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_master_templates: {
        Row: {
          archived_at: string | null
          body: string
          channel: string
          created_at: string
          created_by: string | null
          id: string
          last_used_at: string | null
          name: string
          org_id: string
          parent_template_id: string | null
          subject: string | null
          tags: string[]
          updated_at: string
          usage_count: number
          version: number
        }
        Insert: {
          archived_at?: string | null
          body: string
          channel: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_used_at?: string | null
          name: string
          org_id: string
          parent_template_id?: string | null
          subject?: string | null
          tags?: string[]
          updated_at?: string
          usage_count?: number
          version?: number
        }
        Update: {
          archived_at?: string | null
          body?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_used_at?: string | null
          name?: string
          org_id?: string
          parent_template_id?: string | null
          subject?: string | null
          tags?: string[]
          updated_at?: string
          usage_count?: number
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_master_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_master_templates_parent_template_id_fkey"
            columns: ["parent_template_id"]
            isOneToOne: false
            referencedRelation: "crm_master_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_meeting_bookings: {
        Row: {
          booker_email: string
          booker_name: string
          booker_phone: string | null
          calendar_event_id: string | null
          cancellation_reason: string | null
          contact_id: string | null
          created_at: string | null
          end_time: string
          id: string
          lead_id: string | null
          notes: string | null
          schedule_id: string
          start_time: string
          status: string | null
        }
        Insert: {
          booker_email: string
          booker_name: string
          booker_phone?: string | null
          calendar_event_id?: string | null
          cancellation_reason?: string | null
          contact_id?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          schedule_id: string
          start_time: string
          status?: string | null
        }
        Update: {
          booker_email?: string
          booker_name?: string
          booker_phone?: string | null
          calendar_event_id?: string | null
          cancellation_reason?: string | null
          contact_id?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          schedule_id?: string
          start_time?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_meeting_bookings_calendar_event_id_fkey"
            columns: ["calendar_event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_meeting_bookings_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "crm_meeting_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_meeting_schedules: {
        Row: {
          available_hours: Json | null
          booking_window_days: number | null
          buffer_minutes: number | null
          confirmation_template_id: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          location_config: Json | null
          location_type: string | null
          name: string
          org_id: string
          reminder_template_id: string | null
          slug: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available_hours?: Json | null
          booking_window_days?: number | null
          buffer_minutes?: number | null
          confirmation_template_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          location_config?: Json | null
          location_type?: string | null
          name: string
          org_id: string
          reminder_template_id?: string | null
          slug: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available_hours?: Json | null
          booking_window_days?: number | null
          buffer_minutes?: number | null
          confirmation_template_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          location_config?: Json | null
          location_type?: string | null
          name?: string
          org_id?: string
          reminder_template_id?: string | null
          slug?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_meeting_schedules_confirmation_template_id_fkey"
            columns: ["confirmation_template_id"]
            isOneToOne: false
            referencedRelation: "crm_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_meeting_schedules_reminder_template_id_fkey"
            columns: ["reminder_template_id"]
            isOneToOne: false
            referencedRelation: "crm_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_mentions: {
        Row: {
          created_at: string
          deal_id: string | null
          entity_id: string
          entity_type: string
          id: string
          lead_id: string | null
          mentioned_by: string
          mentioned_user_id: string
          org_id: string
          read: boolean
          read_at: string | null
        }
        Insert: {
          created_at?: string
          deal_id?: string | null
          entity_id: string
          entity_type: string
          id?: string
          lead_id?: string | null
          mentioned_by: string
          mentioned_user_id: string
          org_id: string
          read?: boolean
          read_at?: string | null
        }
        Update: {
          created_at?: string
          deal_id?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          lead_id?: string | null
          mentioned_by?: string
          mentioned_user_id?: string
          org_id?: string
          read?: boolean
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_mentions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_oe_reactivation_runs: {
        Row: {
          cadence_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          leads_targeted: number | null
          org_id: string
          run_year: number
          scheduled_for: string
          started_at: string | null
        }
        Insert: {
          cadence_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          leads_targeted?: number | null
          org_id: string
          run_year: number
          scheduled_for: string
          started_at?: string | null
        }
        Update: {
          cadence_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          leads_targeted?: number | null
          org_id?: string
          run_year?: number
          scheduled_for?: string
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_oe_reactivation_runs_cadence_id_fkey"
            columns: ["cadence_id"]
            isOneToOne: false
            referencedRelation: "crm_follow_up_cadences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_oe_reactivation_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_optout_keywords: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          org_id: string | null
          phrase: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          org_id?: string | null
          phrase: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          org_id?: string | null
          phrase?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_optout_keywords_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_outside_advisors: {
        Row: {
          company: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          org_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          org_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_outside_advisors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_performance_alert_log: {
        Row: {
          fired_at: string
          id: string
          notification_dispatched_at: string | null
          org_id: string
          payload: Json
          quiet_until: string
          rep_count: number
          team_avg: number
          top_performer_count: number
          user_id: string
          window_end: string
          window_start: string
        }
        Insert: {
          fired_at?: string
          id?: string
          notification_dispatched_at?: string | null
          org_id: string
          payload?: Json
          quiet_until: string
          rep_count: number
          team_avg: number
          top_performer_count: number
          user_id: string
          window_end: string
          window_start: string
        }
        Update: {
          fired_at?: string
          id?: string
          notification_dispatched_at?: string | null
          org_id?: string
          payload?: Json
          quiet_until?: string
          rep_count?: number
          team_avg?: number
          top_performer_count?: number
          user_id?: string
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_performance_alert_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_performance_lag_config: {
        Row: {
          baseline_kind: string
          business_days_only: boolean
          cadence: string
          created_at: string
          email_channel: boolean
          exclude_special_projects: boolean
          inapp_channel: boolean
          is_enabled: boolean
          metric_kind: string
          min_business_days_in_system: number
          notify_admins: boolean
          notify_rep: boolean
          org_id: string
          quiet_period_days: number
          spec_locked: boolean
          threshold_pct: number
          top_performer_pct_target: number
          updated_at: string
          window_days: number
          window_kind: string
        }
        Insert: {
          baseline_kind?: string
          business_days_only?: boolean
          cadence?: string
          created_at?: string
          email_channel?: boolean
          exclude_special_projects?: boolean
          inapp_channel?: boolean
          is_enabled?: boolean
          metric_kind?: string
          min_business_days_in_system?: number
          notify_admins?: boolean
          notify_rep?: boolean
          org_id: string
          quiet_period_days?: number
          spec_locked?: boolean
          threshold_pct?: number
          top_performer_pct_target?: number
          updated_at?: string
          window_days?: number
          window_kind?: string
        }
        Update: {
          baseline_kind?: string
          business_days_only?: boolean
          cadence?: string
          created_at?: string
          email_channel?: boolean
          exclude_special_projects?: boolean
          inapp_channel?: boolean
          is_enabled?: boolean
          metric_kind?: string
          min_business_days_in_system?: number
          notify_admins?: boolean
          notify_rep?: boolean
          org_id?: string
          quiet_period_days?: number
          spec_locked?: boolean
          threshold_pct?: number
          top_performer_pct_target?: number
          updated_at?: string
          window_days?: number
          window_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_performance_lag_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_phone_numbers: {
        Row: {
          created_at: string
          do_not_call: boolean
          id: string
          is_primary: boolean
          label: string | null
          org_id: string
          owner_id: string
          owner_type: string
          phone_number: string
          phone_type: string
        }
        Insert: {
          created_at?: string
          do_not_call?: boolean
          id?: string
          is_primary?: boolean
          label?: string | null
          org_id: string
          owner_id: string
          owner_type: string
          phone_number: string
          phone_type?: string
        }
        Update: {
          created_at?: string
          do_not_call?: boolean
          id?: string
          is_primary?: boolean
          label?: string | null
          org_id?: string
          owner_id?: string
          owner_type?: string
          phone_number?: string
          phone_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_phone_numbers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipeline_stages: {
        Row: {
          color: string | null
          created_at: string | null
          display_name: string
          icon: string | null
          id: string
          is_active: boolean | null
          is_lost_stage: boolean | null
          is_terminal: boolean
          is_won_stage: boolean | null
          name: string
          order_index: number | null
          org_id: string | null
          routes_to_subsection: string | null
          slug: string | null
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_lost_stage?: boolean | null
          is_terminal?: boolean
          is_won_stage?: boolean | null
          name: string
          order_index?: number | null
          org_id?: string | null
          routes_to_subsection?: string | null
          slug?: string | null
          sort_order: number
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_lost_stage?: boolean | null
          is_terminal?: boolean
          is_won_stage?: boolean | null
          name?: string
          order_index?: number | null
          org_id?: string | null
          routes_to_subsection?: string | null
          slug?: string | null
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipeline_stages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_price_book_items: {
        Row: {
          created_at: string
          discount_percent: number | null
          id: string
          list_price: number
          price_book_id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          list_price: number
          price_book_id: string
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          list_price?: number
          price_book_id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_price_book_items_price_book_id_fkey"
            columns: ["price_book_id"]
            isOneToOne: false
            referencedRelation: "crm_price_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_price_book_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "crm_products"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_price_books: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          org_id: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          org_id: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          org_id?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_price_books_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_product_form_fields: {
        Row: {
          created_at: string
          field_type: string
          id: string
          is_active: boolean
          label: string
          options: Json | null
          org_id: string
          placeholder: string | null
          product_id: string
          required: boolean
          sort_order: number
          updated_at: string
          validation: Json | null
        }
        Insert: {
          created_at?: string
          field_type: string
          id?: string
          is_active?: boolean
          label: string
          options?: Json | null
          org_id: string
          placeholder?: string | null
          product_id: string
          required?: boolean
          sort_order?: number
          updated_at?: string
          validation?: Json | null
        }
        Update: {
          created_at?: string
          field_type?: string
          id?: string
          is_active?: boolean
          label?: string
          options?: Json | null
          org_id?: string
          placeholder?: string | null
          product_id?: string
          required?: boolean
          sort_order?: number
          updated_at?: string
          validation?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_product_form_fields_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_product_form_fields_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "crm_products"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_product_lines: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          label: string
          org_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label: string
          org_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          org_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_product_lines_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_products: {
        Row: {
          category: string | null
          code: string | null
          cost_price: number | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          org_id: string
          product_family: string | null
          qty_in_stock: number | null
          reorder_level: number | null
          search_vector: unknown
          tax_rate: number | null
          unit: string | null
          unit_price: number
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          category?: string | null
          code?: string | null
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          org_id: string
          product_family?: string | null
          qty_in_stock?: number | null
          reorder_level?: number | null
          search_vector?: unknown
          tax_rate?: number | null
          unit?: string | null
          unit_price?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          category?: string | null
          code?: string | null
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          org_id?: string
          product_family?: string | null
          qty_in_stock?: number | null
          reorder_level?: number | null
          search_vector?: unknown
          tax_rate?: number | null
          unit?: string | null
          unit_price?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_products_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_purchase_order_line_items: {
        Row: {
          created_at: string | null
          description: string | null
          discount_amount: number | null
          discount_percent: number | null
          id: string
          name: string
          product_id: string | null
          purchase_order_id: string
          quantity: number
          quantity_received: number | null
          sku: string | null
          sort_order: number | null
          subtotal: number | null
          tax_rate: number | null
          total: number | null
          unit: string | null
          unit_cost: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          name: string
          product_id?: string | null
          purchase_order_id: string
          quantity?: number
          quantity_received?: number | null
          sku?: string | null
          sort_order?: number | null
          subtotal?: number | null
          tax_rate?: number | null
          total?: number | null
          unit?: string | null
          unit_cost?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          name?: string
          product_id?: string | null
          purchase_order_id?: string
          quantity?: number
          quantity_received?: number | null
          sku?: string | null
          sort_order?: number | null
          subtotal?: number | null
          tax_rate?: number | null
          total?: number | null
          unit?: string | null
          unit_cost?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_purchase_order_line_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "crm_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_purchase_order_line_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "crm_purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_purchase_orders: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          discount_amount: number | null
          discount_percent: number | null
          expected_date: string | null
          id: string
          name: string
          notes: string | null
          order_date: string | null
          org_id: string
          owner_id: string | null
          payment_terms: string | null
          po_number: string
          received_date: string | null
          rejection_reason: string | null
          sent_at: string | null
          ship_to_address: Json | null
          shipping_amount: number | null
          shipping_method: string | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          terms_and_conditions: string | null
          total: number | null
          tracking_number: string | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          expected_date?: string | null
          id?: string
          name: string
          notes?: string | null
          order_date?: string | null
          org_id: string
          owner_id?: string | null
          payment_terms?: string | null
          po_number: string
          received_date?: string | null
          rejection_reason?: string | null
          sent_at?: string | null
          ship_to_address?: Json | null
          shipping_amount?: number | null
          shipping_method?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          terms_and_conditions?: string | null
          total?: number | null
          tracking_number?: string | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          expected_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          order_date?: string | null
          org_id?: string
          owner_id?: string | null
          payment_terms?: string | null
          po_number?: string
          received_date?: string | null
          rejection_reason?: string | null
          sent_at?: string | null
          ship_to_address?: Json | null
          shipping_amount?: number | null
          shipping_method?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          terms_and_conditions?: string | null
          total?: number | null
          tracking_number?: string | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_purchase_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "crm_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_quarterly_milestones: {
        Row: {
          actuals: Json
          community_event_target: number
          created_at: string
          created_by: string | null
          id: string
          lead_target: number
          linkedin_follower_target: number
          org_id: string
          phase_name: string
          quarter: number
          referral_partner_target: number
          revenue_target: number
          sales_target: number
          updated_at: string
          year: number
        }
        Insert: {
          actuals?: Json
          community_event_target?: number
          created_at?: string
          created_by?: string | null
          id?: string
          lead_target?: number
          linkedin_follower_target?: number
          org_id: string
          phase_name: string
          quarter: number
          referral_partner_target?: number
          revenue_target?: number
          sales_target?: number
          updated_at?: string
          year: number
        }
        Update: {
          actuals?: Json
          community_event_target?: number
          created_at?: string
          created_by?: string | null
          id?: string
          lead_target?: number
          linkedin_follower_target?: number
          org_id?: string
          phase_name?: string
          quarter?: number
          referral_partner_target?: number
          revenue_target?: number
          sales_target?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_quarterly_milestones_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_quote_line_item_answers: {
        Row: {
          created_at: string
          field_id: string
          id: string
          line_item_id: string
          value: Json
        }
        Insert: {
          created_at?: string
          field_id: string
          id?: string
          line_item_id: string
          value?: Json
        }
        Update: {
          created_at?: string
          field_id?: string
          id?: string
          line_item_id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "crm_quote_line_item_answers_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "crm_product_form_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quote_line_item_answers_line_item_id_fkey"
            columns: ["line_item_id"]
            isOneToOne: false
            referencedRelation: "crm_quote_line_items"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_quote_line_items: {
        Row: {
          created_at: string
          description: string | null
          discount_amount: number | null
          discount_percent: number | null
          id: string
          line_total: number
          name: string
          product_id: string | null
          quantity: number
          quote_id: string
          sort_order: number | null
          tax_amount: number | null
          tax_rate: number | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          line_total: number
          name: string
          product_id?: string | null
          quantity?: number
          quote_id: string
          sort_order?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          line_total?: number
          name?: string
          product_id?: string | null
          quantity?: number
          quote_id?: string
          sort_order?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_quote_line_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "crm_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "crm_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_quote_templates: {
        Row: {
          branding: Json
          content_blocks: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          layout: Json
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          branding?: Json
          content_blocks?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          layout?: Json
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          branding?: Json
          content_blocks?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          layout?: Json
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_quote_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_quotes: {
        Row: {
          accepted_at: string | null
          account_id: string | null
          adjustment: number | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          billing_address: Json | null
          contact_id: string | null
          created_at: string
          created_by: string
          currency: string | null
          deal_id: string | null
          description: string | null
          discount_amount: number | null
          discount_type: string | null
          discount_value: number | null
          id: string
          notes: string | null
          org_id: string
          owner_id: string | null
          quote_number: string
          rejected_at: string | null
          rejection_reason: string | null
          sent_at: string | null
          shipping_address: Json | null
          shipping_amount: number | null
          status: string
          subject: string | null
          subtotal: number | null
          tax_amount: number | null
          template_id: string | null
          terms_and_conditions: string | null
          total: number | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          accepted_at?: string | null
          account_id?: string | null
          adjustment?: number | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          billing_address?: Json | null
          contact_id?: string | null
          created_at?: string
          created_by: string
          currency?: string | null
          deal_id?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          notes?: string | null
          org_id: string
          owner_id?: string | null
          quote_number: string
          rejected_at?: string | null
          rejection_reason?: string | null
          sent_at?: string | null
          shipping_address?: Json | null
          shipping_amount?: number | null
          status?: string
          subject?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          template_id?: string | null
          terms_and_conditions?: string | null
          total?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          accepted_at?: string | null
          account_id?: string | null
          adjustment?: number | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          billing_address?: Json | null
          contact_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string | null
          deal_id?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          notes?: string | null
          org_id?: string
          owner_id?: string | null
          quote_number?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          sent_at?: string | null
          shipping_address?: Json | null
          shipping_amount?: number | null
          status?: string
          subject?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          template_id?: string | null
          terms_and_conditions?: string | null
          total?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_quotes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quotes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quotes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quotes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quotes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "crm_quote_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_recruit_cadence_state: {
        Row: {
          cadence_id: string
          completed_at: string | null
          created_at: string
          current_step: number
          id: string
          next_action_at: string | null
          org_id: string
          paused: boolean
          paused_reason: string | null
          recruit_id: string
          updated_at: string
        }
        Insert: {
          cadence_id: string
          completed_at?: string | null
          created_at?: string
          current_step?: number
          id?: string
          next_action_at?: string | null
          org_id: string
          paused?: boolean
          paused_reason?: string | null
          recruit_id: string
          updated_at?: string
        }
        Update: {
          cadence_id?: string
          completed_at?: string | null
          created_at?: string
          current_step?: number
          id?: string
          next_action_at?: string | null
          org_id?: string
          paused?: boolean
          paused_reason?: string | null
          recruit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_recruit_cadence_state_cadence_id_fkey"
            columns: ["cadence_id"]
            isOneToOne: false
            referencedRelation: "crm_follow_up_cadences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_recruit_cadence_state_recruit_id_fkey"
            columns: ["recruit_id"]
            isOneToOne: false
            referencedRelation: "crm_recruiting_records"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_recruiting_pipeline_stages: {
        Row: {
          color: string
          created_at: string
          display_name: string
          icon: string | null
          id: string
          is_active: boolean
          is_terminal: boolean
          name: string
          org_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_terminal?: boolean
          name: string
          org_id: string
          sort_order: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_terminal?: boolean
          name?: string
          org_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_recruiting_pipeline_stages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_recruiting_records: {
        Row: {
          agency_affiliation: string | null
          appointed_carriers: string[]
          assigned_to: string | null
          city: string | null
          created_at: string
          created_by: string | null
          do_not_contact: boolean
          email: string | null
          first_name: string
          id: string
          last_contacted_at: string | null
          last_name: string
          last_touched_at: string | null
          license_number: string | null
          linkedin_workflow_status: string | null
          notes: string | null
          npn: string | null
          org_id: string
          phone: string | null
          pipeline_stage: string
          priority: string
          stage_changed_at: string | null
          state: string | null
          tags: string[]
          updated_at: string
          workflow_subsection: string
        }
        Insert: {
          agency_affiliation?: string | null
          appointed_carriers?: string[]
          assigned_to?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          do_not_contact?: boolean
          email?: string | null
          first_name: string
          id?: string
          last_contacted_at?: string | null
          last_name: string
          last_touched_at?: string | null
          license_number?: string | null
          linkedin_workflow_status?: string | null
          notes?: string | null
          npn?: string | null
          org_id: string
          phone?: string | null
          pipeline_stage?: string
          priority?: string
          stage_changed_at?: string | null
          state?: string | null
          tags?: string[]
          updated_at?: string
          workflow_subsection?: string
        }
        Update: {
          agency_affiliation?: string | null
          appointed_carriers?: string[]
          assigned_to?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          do_not_contact?: boolean
          email?: string | null
          first_name?: string
          id?: string
          last_contacted_at?: string | null
          last_name?: string
          last_touched_at?: string | null
          license_number?: string | null
          linkedin_workflow_status?: string | null
          notes?: string | null
          npn?: string | null
          org_id?: string
          phone?: string | null
          pipeline_stage?: string
          priority?: string
          stage_changed_at?: string | null
          state?: string | null
          tags?: string[]
          updated_at?: string
          workflow_subsection?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_recruiting_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_referral_partners: {
        Row: {
          company: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          org_id: string
          partner_type: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          org_id: string
          partner_type?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          org_id?: string
          partner_type?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_referral_partners_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_referrals: {
        Row: {
          contact_id: string | null
          created_at: string
          direction: string
          id: string
          lead_id: string | null
          notes: string | null
          org_id: string
          partner_id: string
          referred_by: string
          status: string
          updated_at: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          direction: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          org_id: string
          partner_id: string
          referred_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          direction?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          org_id?: string
          partner_id?: string
          referred_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_referrals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_referrals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_referrals_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "crm_referral_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_rep_daily_log_entries: {
        Row: {
          activities_other: number
          calls_made: number | null
          cancellation_calls: number
          content_creation: number
          created_at: string
          deals_closed: number
          emails_sent: number | null
          id: string
          leads_worked: number | null
          linkedin_touches: number | null
          log_date: string
          manual_flag: boolean
          meetings_held: number | null
          notes: string | null
          org_id: string
          pipeline_actions: number
          section_open_state: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          activities_other?: number
          calls_made?: number | null
          cancellation_calls?: number
          content_creation?: number
          created_at?: string
          deals_closed?: number
          emails_sent?: number | null
          id?: string
          leads_worked?: number | null
          linkedin_touches?: number | null
          log_date: string
          manual_flag?: boolean
          meetings_held?: number | null
          notes?: string | null
          org_id: string
          pipeline_actions?: number
          section_open_state?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          activities_other?: number
          calls_made?: number | null
          cancellation_calls?: number
          content_creation?: number
          created_at?: string
          deals_closed?: number
          emails_sent?: number | null
          id?: string
          leads_worked?: number | null
          linkedin_touches?: number | null
          log_date?: string
          manual_flag?: boolean
          meetings_held?: number | null
          notes?: string | null
          org_id?: string
          pipeline_actions?: number
          section_open_state?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_rep_daily_log_entries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_rep_message_templates: {
        Row: {
          body: string
          channel: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          org_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          channel: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_rep_message_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_round_robin_audit: {
        Row: {
          assigned_to: string
          created_at: string
          id: string
          lead_id: string
          org_id: string
          override_by: string | null
          position_at_assignment: number
          skip_reason: string | null
          was_skip: boolean
        }
        Insert: {
          assigned_to: string
          created_at?: string
          id?: string
          lead_id: string
          org_id: string
          override_by?: string | null
          position_at_assignment?: number
          skip_reason?: string | null
          was_skip?: boolean
        }
        Update: {
          assigned_to?: string
          created_at?: string
          id?: string
          lead_id?: string
          org_id?: string
          override_by?: string | null
          position_at_assignment?: number
          skip_reason?: string | null
          was_skip?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "crm_round_robin_audit_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_round_robin_config: {
        Row: {
          created_at: string
          current_position: number
          id: string
          is_active: boolean
          org_id: string
          pool_members: Json
          skip_unavailable: boolean
          tie_breaking_rule: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          current_position?: number
          id?: string
          is_active?: boolean
          org_id: string
          pool_members?: Json
          skip_unavailable?: boolean
          tie_breaking_rule?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          current_position?: number
          id?: string
          is_active?: boolean
          org_id?: string
          pool_members?: Json
          skip_unavailable?: boolean
          tie_breaking_rule?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_round_robin_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sales_order_line_items: {
        Row: {
          created_at: string | null
          description: string | null
          discount_amount: number | null
          discount_percent: number | null
          id: string
          name: string
          product_id: string | null
          quantity: number
          quantity_delivered: number | null
          quantity_shipped: number | null
          sales_order_id: string
          sku: string | null
          sort_order: number | null
          subtotal: number | null
          tax_rate: number | null
          total: number | null
          unit: string | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          name: string
          product_id?: string | null
          quantity?: number
          quantity_delivered?: number | null
          quantity_shipped?: number | null
          sales_order_id: string
          sku?: string | null
          sort_order?: number | null
          subtotal?: number | null
          tax_rate?: number | null
          total?: number | null
          unit?: string | null
          unit_price?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          name?: string
          product_id?: string | null
          quantity?: number
          quantity_delivered?: number | null
          quantity_shipped?: number | null
          sales_order_id?: string
          sku?: string | null
          sort_order?: number | null
          subtotal?: number | null
          tax_rate?: number | null
          total?: number | null
          unit?: string | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_sales_order_line_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "crm_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_sales_order_line_items_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "crm_sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sales_orders: {
        Row: {
          account_id: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          billing_address: Json | null
          carrier: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          deal_id: string | null
          delivered_date: string | null
          description: string | null
          discount_amount: number | null
          discount_percent: number | null
          id: string
          name: string
          notes: string | null
          order_date: string | null
          org_id: string
          owner_id: string | null
          payment_terms: string | null
          promised_date: string | null
          quote_id: string | null
          rejection_reason: string | null
          requested_date: string | null
          shipped_date: string | null
          shipping_address: Json | null
          shipping_amount: number | null
          shipping_method: string | null
          so_number: string
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          terms_and_conditions: string | null
          total: number | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          billing_address?: Json | null
          carrier?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deal_id?: string | null
          delivered_date?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          name: string
          notes?: string | null
          order_date?: string | null
          org_id: string
          owner_id?: string | null
          payment_terms?: string | null
          promised_date?: string | null
          quote_id?: string | null
          rejection_reason?: string | null
          requested_date?: string | null
          shipped_date?: string | null
          shipping_address?: Json | null
          shipping_amount?: number | null
          shipping_method?: string | null
          so_number: string
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          terms_and_conditions?: string | null
          total?: number | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          billing_address?: Json | null
          carrier?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deal_id?: string | null
          delivered_date?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          name?: string
          notes?: string | null
          order_date?: string | null
          org_id?: string
          owner_id?: string | null
          payment_terms?: string | null
          promised_date?: string | null
          quote_id?: string | null
          rejection_reason?: string | null
          requested_date?: string | null
          shipped_date?: string | null
          shipping_address?: Json | null
          shipping_amount?: number | null
          shipping_method?: string | null
          so_number?: string
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          terms_and_conditions?: string | null
          total?: number | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_sales_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_sales_orders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_sales_orders_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_sales_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_sales_orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "crm_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_saved_views: {
        Row: {
          color: string | null
          columns: Json | null
          created_at: string
          filters: Json
          icon: string | null
          id: string
          is_default: boolean | null
          is_shared: boolean | null
          module: string
          name: string
          org_id: string
          owner_id: string
          pinned: boolean | null
          sort_direction: string | null
          sort_field: string | null
          updated_at: string
          view_type: string | null
          workspace_id: string | null
        }
        Insert: {
          color?: string | null
          columns?: Json | null
          created_at?: string
          filters?: Json
          icon?: string | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          module: string
          name: string
          org_id: string
          owner_id: string
          pinned?: boolean | null
          sort_direction?: string | null
          sort_field?: string | null
          updated_at?: string
          view_type?: string | null
          workspace_id?: string | null
        }
        Update: {
          color?: string | null
          columns?: Json | null
          created_at?: string
          filters?: Json
          icon?: string | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          module?: string
          name?: string
          org_id?: string
          owner_id?: string
          pinned?: boolean | null
          sort_direction?: string | null
          sort_field?: string | null
          updated_at?: string
          view_type?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_saved_views_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_saved_views_workspace"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "crm_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sequence_triggers: {
        Row: {
          created_at: string
          created_by: string | null
          enrollment_count: number
          id: string
          is_active: boolean
          last_triggered_at: string | null
          org_id: string
          sequence_id: string
          trigger_conditions: Json
          trigger_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          enrollment_count?: number
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          org_id: string
          sequence_id: string
          trigger_conditions?: Json
          trigger_type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          enrollment_count?: number
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          org_id?: string
          sequence_id?: string
          trigger_conditions?: Json
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_sequence_triggers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_sequence_triggers_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "crm_email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sla_config: {
        Row: {
          business_days: number[]
          business_hours_end: string
          business_hours_start: string
          created_at: string
          escalation_email: boolean
          escalation_to: string[] | null
          id: string
          is_active: boolean
          org_id: string
          sla_hours: number
          timezone: string
          updated_at: string
        }
        Insert: {
          business_days?: number[]
          business_hours_end?: string
          business_hours_start?: string
          created_at?: string
          escalation_email?: boolean
          escalation_to?: string[] | null
          id?: string
          is_active?: boolean
          org_id: string
          sla_hours?: number
          timezone?: string
          updated_at?: string
        }
        Update: {
          business_days?: number[]
          business_hours_end?: string
          business_hours_start?: string
          created_at?: string
          escalation_email?: boolean
          escalation_to?: string[] | null
          id?: string
          is_active?: boolean
          org_id?: string
          sla_hours?: number
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_sla_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_social_platform_connections: {
        Row: {
          access_token_encrypted: string | null
          connected_by: string | null
          connection_status: string
          created_at: string
          display_name: string | null
          id: string
          last_synced_at: string | null
          metadata: Json
          oauth_scope: string | null
          org_id: string
          provider: string
          refresh_token_encrypted: string | null
          sync_error: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token_encrypted?: string | null
          connected_by?: string | null
          connection_status?: string
          created_at?: string
          display_name?: string | null
          id?: string
          last_synced_at?: string | null
          metadata?: Json
          oauth_scope?: string | null
          org_id: string
          provider: string
          refresh_token_encrypted?: string | null
          sync_error?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token_encrypted?: string | null
          connected_by?: string | null
          connection_status?: string
          created_at?: string
          display_name?: string | null
          id?: string
          last_synced_at?: string | null
          metadata?: Json
          oauth_scope?: string | null
          org_id?: string
          provider?: string
          refresh_token_encrypted?: string | null
          sync_error?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_social_platform_connections_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_social_posts: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          linked_campaign_id: string | null
          notes: string | null
          org_id: string
          platform: string
          post_date: string
          status: string
          title: string
          updated_at: string
          utm_campaign: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          linked_campaign_id?: string | null
          notes?: string | null
          org_id: string
          platform: string
          post_date?: string
          status?: string
          title: string
          updated_at?: string
          utm_campaign?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          linked_campaign_id?: string | null
          notes?: string | null
          org_id?: string
          platform?: string
          post_date?: string
          status?: string
          title?: string
          updated_at?: string
          utm_campaign?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_social_posts_linked_campaign_id_fkey"
            columns: ["linked_campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_social_posts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_special_project_types: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          org_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_special_project_types_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_special_projects: {
        Row: {
          created_at: string
          id: string
          log_date: string
          notes: string
          org_id: string
          project_name: string
          project_type_id: string | null
          time_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          log_date: string
          notes?: string
          org_id: string
          project_name: string
          project_type_id?: string | null
          time_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          log_date?: string
          notes?: string
          org_id?: string
          project_name?: string
          project_type_id?: string | null
          time_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_special_projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_special_projects_project_type_id_fkey"
            columns: ["project_type_id"]
            isOneToOne: false
            referencedRelation: "crm_special_project_types"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_studio_fields: {
        Row: {
          api_name: string
          config: Json | null
          created_at: string | null
          created_by: string | null
          default_value: string | null
          field_type: string
          help_text: string | null
          id: string
          is_filterable: boolean | null
          is_name_field: boolean | null
          is_required: boolean | null
          is_searchable: boolean | null
          is_system: boolean | null
          is_unique: boolean | null
          label: string
          module_id: string
          org_id: string
          placeholder: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          api_name: string
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          default_value?: string | null
          field_type: string
          help_text?: string | null
          id?: string
          is_filterable?: boolean | null
          is_name_field?: boolean | null
          is_required?: boolean | null
          is_searchable?: boolean | null
          is_system?: boolean | null
          is_unique?: boolean | null
          label: string
          module_id: string
          org_id: string
          placeholder?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          api_name?: string
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          default_value?: string | null
          field_type?: string
          help_text?: string | null
          id?: string
          is_filterable?: boolean | null
          is_name_field?: boolean | null
          is_required?: boolean | null
          is_searchable?: boolean | null
          is_system?: boolean | null
          is_unique?: boolean | null
          label?: string
          module_id?: string
          org_id?: string
          placeholder?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_studio_fields_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "crm_studio_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_studio_fields_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_studio_layouts: {
        Row: {
          api_name: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          layout_type: string
          module_id: string
          name: string
          org_id: string
          sections: Json
          updated_at: string | null
        }
        Insert: {
          api_name: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          layout_type: string
          module_id: string
          name: string
          org_id: string
          sections?: Json
          updated_at?: string | null
        }
        Update: {
          api_name?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          layout_type?: string
          module_id?: string
          name?: string
          org_id?: string
          sections?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_studio_layouts_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "crm_studio_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_studio_layouts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_studio_modules: {
        Row: {
          allow_activities: boolean | null
          allow_attachments: boolean | null
          allow_notes: boolean | null
          api_name: string
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          org_id: string
          plural_name: string
          singular_name: string
          updated_at: string | null
        }
        Insert: {
          allow_activities?: boolean | null
          allow_attachments?: boolean | null
          allow_notes?: boolean | null
          api_name: string
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          org_id: string
          plural_name: string
          singular_name: string
          updated_at?: string | null
        }
        Update: {
          allow_activities?: boolean | null
          allow_attachments?: boolean | null
          allow_notes?: boolean | null
          api_name?: string
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          org_id?: string
          plural_name?: string
          singular_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_studio_modules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_studio_validation_rules: {
        Row: {
          condition_logic: string | null
          conditions: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          error_field_id: string | null
          error_message: string
          id: string
          is_active: boolean | null
          module_id: string
          name: string
          org_id: string
          run_on_create: boolean | null
          run_on_update: boolean | null
          updated_at: string | null
        }
        Insert: {
          condition_logic?: string | null
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          error_field_id?: string | null
          error_message: string
          id?: string
          is_active?: boolean | null
          module_id: string
          name: string
          org_id: string
          run_on_create?: boolean | null
          run_on_update?: boolean | null
          updated_at?: string | null
        }
        Update: {
          condition_logic?: string | null
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          error_field_id?: string | null
          error_message?: string
          id?: string
          is_active?: boolean | null
          module_id?: string
          name?: string
          org_id?: string
          run_on_create?: boolean | null
          run_on_update?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_studio_validation_rules_error_field_id_fkey"
            columns: ["error_field_id"]
            isOneToOne: false
            referencedRelation: "crm_studio_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_studio_validation_rules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "crm_studio_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_studio_validation_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_studio_views: {
        Row: {
          columns: Json
          created_at: string | null
          created_by: string | null
          filters: Json | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          module_id: string
          name: string
          org_id: string
          owner_id: string | null
          sort_direction: string | null
          sort_field_id: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          columns?: Json
          created_at?: string | null
          created_by?: string | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          module_id: string
          name: string
          org_id: string
          owner_id?: string | null
          sort_direction?: string | null
          sort_field_id?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          columns?: Json
          created_at?: string | null
          created_by?: string | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          module_id?: string
          name?: string
          org_id?: string
          owner_id?: string | null
          sort_direction?: string | null
          sort_field_id?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_studio_views_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "crm_studio_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_studio_views_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_studio_views_sort_field_id_fkey"
            columns: ["sort_field_id"]
            isOneToOne: false
            referencedRelation: "crm_studio_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_template_folders: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          org_id: string
          parent_folder_id: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          org_id: string
          parent_folder_id?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          parent_folder_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_template_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "crm_template_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_templates: {
        Row: {
          ai_performance_score: number | null
          body: string
          category: string | null
          click_rate: number | null
          created_at: string | null
          created_by: string | null
          default_signature_id: string | null
          description: string | null
          folder_id: string | null
          id: string
          is_active: boolean | null
          is_ai_generated: boolean | null
          is_default: boolean | null
          is_shared: boolean | null
          last_used_at: string | null
          name: string
          open_rate: number | null
          parent_version_id: string | null
          performance_score: number | null
          preview_text: string | null
          reply_count: number | null
          subject: string | null
          tags: string[] | null
          template_type: string
          total_sent: number | null
          updated_at: string | null
          usage_count: number | null
          variables: Json | null
          version: number | null
        }
        Insert: {
          ai_performance_score?: number | null
          body: string
          category?: string | null
          click_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          default_signature_id?: string | null
          description?: string | null
          folder_id?: string | null
          id?: string
          is_active?: boolean | null
          is_ai_generated?: boolean | null
          is_default?: boolean | null
          is_shared?: boolean | null
          last_used_at?: string | null
          name: string
          open_rate?: number | null
          parent_version_id?: string | null
          performance_score?: number | null
          preview_text?: string | null
          reply_count?: number | null
          subject?: string | null
          tags?: string[] | null
          template_type: string
          total_sent?: number | null
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
          version?: number | null
        }
        Update: {
          ai_performance_score?: number | null
          body?: string
          category?: string | null
          click_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          default_signature_id?: string | null
          description?: string | null
          folder_id?: string | null
          id?: string
          is_active?: boolean | null
          is_ai_generated?: boolean | null
          is_default?: boolean | null
          is_shared?: boolean | null
          last_used_at?: string | null
          name?: string
          open_rate?: number | null
          parent_version_id?: string | null
          performance_score?: number | null
          preview_text?: string | null
          reply_count?: number | null
          subject?: string | null
          tags?: string[] | null
          template_type?: string
          total_sent?: number | null
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_templates_default_signature_id_fkey"
            columns: ["default_signature_id"]
            isOneToOne: false
            referencedRelation: "crm_email_signatures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_templates_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "crm_template_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_templates_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "crm_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          notified: boolean
          org_id: string
          progress: number
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          notified?: boolean
          org_id: string
          progress?: number
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          notified?: boolean
          org_id?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "crm_achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_user_achievements_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_user_goals: {
        Row: {
          assigned_by: string | null
          color: string | null
          completed_at: string | null
          created_at: string | null
          current_value: number | null
          description: string | null
          end_date: string
          icon: string | null
          id: string
          is_personal: boolean | null
          metric_type: string
          name: string
          org_id: string
          period: string
          start_date: string
          status: string | null
          target_value: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          color?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          end_date: string
          icon?: string | null
          id?: string
          is_personal?: boolean | null
          metric_type: string
          name: string
          org_id: string
          period: string
          start_date: string
          status?: string | null
          target_value: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          color?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          end_date?: string
          icon?: string | null
          id?: string
          is_personal?: boolean | null
          metric_type?: string
          name?: string
          org_id?: string
          period?: string
          start_date?: string
          status?: string | null
          target_value?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      crm_user_xp: {
        Row: {
          calls_today: number
          created_at: string
          daily_target_calls: number
          daily_target_emails: number
          daily_target_tasks: number
          daily_xp: number
          deals_closed_today: number
          emails_today: number
          id: string
          last_active_date: string | null
          level: number
          level_name: string
          monthly_xp: number
          org_id: string
          streak_days: number
          streak_start: string | null
          tasks_completed_today: number
          total_xp: number
          updated_at: string
          user_id: string
          weekly_xp: number
        }
        Insert: {
          calls_today?: number
          created_at?: string
          daily_target_calls?: number
          daily_target_emails?: number
          daily_target_tasks?: number
          daily_xp?: number
          deals_closed_today?: number
          emails_today?: number
          id?: string
          last_active_date?: string | null
          level?: number
          level_name?: string
          monthly_xp?: number
          org_id: string
          streak_days?: number
          streak_start?: string | null
          tasks_completed_today?: number
          total_xp?: number
          updated_at?: string
          user_id: string
          weekly_xp?: number
        }
        Update: {
          calls_today?: number
          created_at?: string
          daily_target_calls?: number
          daily_target_emails?: number
          daily_target_tasks?: number
          daily_xp?: number
          deals_closed_today?: number
          emails_today?: number
          id?: string
          last_active_date?: string | null
          level?: number
          level_name?: string
          monthly_xp?: number
          org_id?: string
          streak_days?: number
          streak_start?: string | null
          tasks_completed_today?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
          weekly_xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_user_xp_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_vendors: {
        Row: {
          address: Json | null
          code: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          org_id: string
          owner_id: string | null
          payment_terms: string | null
          phone: string | null
          primary_contact_id: string | null
          rating: number | null
          tags: string[] | null
          tax_id: string | null
          updated_at: string | null
          vendor_type: string | null
          website: string | null
        }
        Insert: {
          address?: Json | null
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          org_id: string
          owner_id?: string | null
          payment_terms?: string | null
          phone?: string | null
          primary_contact_id?: string | null
          rating?: number | null
          tags?: string[] | null
          tax_id?: string | null
          updated_at?: string | null
          vendor_type?: string | null
          website?: string | null
        }
        Update: {
          address?: Json | null
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          org_id?: string
          owner_id?: string | null
          payment_terms?: string | null
          phone?: string | null
          primary_contact_id?: string | null
          rating?: number | null
          tags?: string[] | null
          tax_id?: string | null
          updated_at?: string | null
          vendor_type?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_vendors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_vendors_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_web_form_submissions: {
        Row: {
          created_at: string
          data: Json
          form_id: string
          id: string
          ip_address: string | null
          lead_id: string | null
          source_url: string | null
          status: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          form_id: string
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          source_url?: string | null
          status?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          form_id?: string
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          source_url?: string | null
          status?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_web_form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "crm_web_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_web_forms: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          entity_type: string
          fields: Json
          id: string
          last_submission_at: string | null
          name: string
          org_id: string
          settings: Json
          slug: string
          status: string
          styling: Json
          submit_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_type?: string
          fields?: Json
          id?: string
          last_submission_at?: string | null
          name: string
          org_id: string
          settings?: Json
          slug: string
          status?: string
          styling?: Json
          submit_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_type?: string
          fields?: Json
          id?: string
          last_submission_at?: string | null
          name?: string
          org_id?: string
          settings?: Json
          slug?: string
          status?: string
          styling?: Json
          submit_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_web_forms_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_website_quote_sync: {
        Row: {
          created_at: string | null
          crm_lead_id: string | null
          crm_quote_id: string | null
          extracted_data: Json | null
          id: string
          last_sync_attempt: string | null
          sync_attempts: number | null
          sync_error: string | null
          sync_status: string | null
          synced_at: string | null
          website_submission_id: string
        }
        Insert: {
          created_at?: string | null
          crm_lead_id?: string | null
          crm_quote_id?: string | null
          extracted_data?: Json | null
          id?: string
          last_sync_attempt?: string | null
          sync_attempts?: number | null
          sync_error?: string | null
          sync_status?: string | null
          synced_at?: string | null
          website_submission_id: string
        }
        Update: {
          created_at?: string | null
          crm_lead_id?: string | null
          crm_quote_id?: string | null
          extracted_data?: Json | null
          id?: string
          last_sync_attempt?: string | null
          sync_attempts?: number | null
          sync_error?: string | null
          sync_status?: string | null
          synced_at?: string | null
          website_submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_website_quote_sync_crm_lead_id_fkey"
            columns: ["crm_lead_id"]
            isOneToOne: false
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_website_quote_sync_crm_quote_id_fkey"
            columns: ["crm_quote_id"]
            isOneToOne: false
            referencedRelation: "crm_lead_health_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_website_quote_sync_website_submission_id_fkey"
            columns: ["website_submission_id"]
            isOneToOne: true
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_win_feed: {
        Row: {
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          org_id: string
          reactions: Json
          title: string
          user_id: string
          value: number | null
          win_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          org_id: string
          reactions?: Json
          title: string
          user_id: string
          value?: number | null
          win_type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          org_id?: string
          reactions?: Json
          title?: string
          user_id?: string
          value?: number | null
          win_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_win_feed_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_workspaces: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          module: string
          name: string
          org_id: string
          owner_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          module?: string
          name: string
          org_id: string
          owner_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          module?: string
          name?: string
          org_id?: string
          owner_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_xp_events: {
        Row: {
          action: string
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          org_id: string
          user_id: string
          xp_amount: number
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          org_id: string
          user_id: string
          xp_amount: number
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          org_id?: string
          user_id?: string
          xp_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_xp_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_analytics_summary: {
        Row: {
          avg_session_duration: number | null
          bounce_rate: number | null
          created_at: string | null
          date: string
          desktop_sessions: number | null
          id: string
          mobile_sessions: number | null
          new_users: number | null
          pages_per_session: number | null
          returning_users: number | null
          tablet_sessions: number | null
          top_countries: Json | null
          top_pages: Json | null
          top_sources: Json | null
          total_page_views: number | null
          total_sessions: number | null
          total_users: number | null
          updated_at: string | null
        }
        Insert: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          created_at?: string | null
          date: string
          desktop_sessions?: number | null
          id?: string
          mobile_sessions?: number | null
          new_users?: number | null
          pages_per_session?: number | null
          returning_users?: number | null
          tablet_sessions?: number | null
          top_countries?: Json | null
          top_pages?: Json | null
          top_sources?: Json | null
          total_page_views?: number | null
          total_sessions?: number | null
          total_users?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          created_at?: string | null
          date?: string
          desktop_sessions?: number | null
          id?: string
          mobile_sessions?: number | null
          new_users?: number | null
          pages_per_session?: number | null
          returning_users?: number | null
          tablet_sessions?: number | null
          top_countries?: Json | null
          top_pages?: Json | null
          top_sources?: Json | null
          total_page_views?: number | null
          total_sessions?: number | null
          total_users?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      device_push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          last_used_at: string | null
          p256dh: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          p256dh: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          p256dh?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      document_access_log: {
        Row: {
          access_type: string
          accessed_at: string
          accessed_by: string
          document_id: string
          id: string
          ip_address: unknown
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string
          accessed_by: string
          document_id: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string
          accessed_by?: string
          document_id?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_access_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "member_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      educational_content: {
        Row: {
          content_data: Json | null
          content_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          slug: string
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content_data?: Json | null
          content_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          slug: string
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content_data?: Json | null
          content_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          slug?: string
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_log: {
        Row: {
          body_preview: string | null
          click_count: number | null
          created_at: string | null
          first_opened_at: string | null
          id: string
          lead_id: string | null
          open_count: number | null
          org_id: string
          resend_email_id: string | null
          sent_at: string | null
          sent_by: string | null
          status: string | null
          subject: string | null
          template_id: string | null
          to_email: string
        }
        Insert: {
          body_preview?: string | null
          click_count?: number | null
          created_at?: string | null
          first_opened_at?: string | null
          id?: string
          lead_id?: string | null
          open_count?: number | null
          org_id: string
          resend_email_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
          to_email: string
        }
        Update: {
          body_preview?: string | null
          click_count?: number | null
          created_at?: string | null
          first_opened_at?: string | null
          id?: string
          lead_id?: string | null
          open_count?: number | null
          org_id?: string
          resend_email_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_schedules: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          last_run_at: string | null
          name: string
          next_run_at: string | null
          org_id: string | null
          recipient_filter: Json | null
          recipient_list: Json | null
          recipient_type: string
          schedule_config: Json
          schedule_type: string
          status: string | null
          template_id: string | null
          total_clicked: number | null
          total_opened: number | null
          total_sent: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          org_id?: string | null
          recipient_filter?: Json | null
          recipient_list?: Json | null
          recipient_type: string
          schedule_config: Json
          schedule_type: string
          status?: string | null
          template_id?: string | null
          total_clicked?: number | null
          total_opened?: number | null
          total_sent?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          org_id?: string | null
          recipient_filter?: Json | null
          recipient_list?: Json | null
          recipient_type?: string
          schedule_config?: Json
          schedule_type?: string
          status?: string | null
          template_id?: string | null
          total_clicked?: number | null
          total_opened?: number | null
          total_sent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_schedules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_schedules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "crm_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          html_template: string
          id: string
          is_active: boolean | null
          name: string
          subject_template: string
          text_template: string
          updated_at: string | null
          usage_count: number | null
          variables: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          html_template: string
          id?: string
          is_active?: boolean | null
          name: string
          subject_template: string
          text_template: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          html_template?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject_template?: string
          text_template?: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Relationships: []
      }
      email_tracking: {
        Row: {
          device_type: string | null
          email_log_id: string | null
          id: string
          ip_address: unknown
          link_url: string | null
          location_city: string | null
          location_country: string | null
          tracked_at: string | null
          tracking_type: string
          user_agent: string | null
        }
        Insert: {
          device_type?: string | null
          email_log_id?: string | null
          id?: string
          ip_address?: unknown
          link_url?: string | null
          location_city?: string | null
          location_country?: string | null
          tracked_at?: string | null
          tracking_type: string
          user_agent?: string | null
        }
        Update: {
          device_type?: string | null
          email_log_id?: string | null
          id?: string
          ip_address?: unknown
          link_url?: string | null
          location_city?: string | null
          location_country?: string | null
          tracked_at?: string | null
          tracking_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_tracking_email_log_id_fkey"
            columns: ["email_log_id"]
            isOneToOne: false
            referencedRelation: "crm_email_log"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_intent: {
        Row: {
          age_band: string | null
          created_at: string | null
          estimated_rate: number | null
          has_tobacco: boolean | null
          household_size: number | null
          id: string
          iua: number | null
          plan_type: string
          session_id: string
          start_date: string | null
        }
        Insert: {
          age_band?: string | null
          created_at?: string | null
          estimated_rate?: number | null
          has_tobacco?: boolean | null
          household_size?: number | null
          id?: string
          iua?: number | null
          plan_type: string
          session_id: string
          start_date?: string | null
        }
        Update: {
          age_band?: string | null
          created_at?: string | null
          estimated_rate?: number | null
          has_tobacco?: boolean | null
          household_size?: number | null
          id?: string
          iua?: number | null
          plan_type?: string
          session_id?: string
          start_date?: string | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          applicant_email: string
          applicant_name: string
          applicant_phone: string | null
          application_type: string
          created_at: string
          documents: Json
          id: string
          metadata: Json
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          applicant_email: string
          applicant_name: string
          applicant_phone?: string | null
          application_type?: string
          created_at?: string
          documents?: Json
          id?: string
          metadata?: Json
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          applicant_email?: string
          applicant_name?: string
          applicant_phone?: string | null
          application_type?: string
          created_at?: string
          documents?: Json
          id?: string
          metadata?: Json
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      esignature_documents: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          document_type: string | null
          expires_at: string | null
          external_document_id: string | null
          id: string
          name: string
          org_id: string | null
          provider_id: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          sent_at: string | null
          signed_document_url: string | null
          signers: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          document_type?: string | null
          expires_at?: string | null
          external_document_id?: string | null
          id?: string
          name: string
          org_id?: string | null
          provider_id?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sent_at?: string | null
          signed_document_url?: string | null
          signers?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          document_type?: string | null
          expires_at?: string | null
          external_document_id?: string | null
          id?: string
          name?: string
          org_id?: string | null
          provider_id?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sent_at?: string | null
          signed_document_url?: string | null
          signers?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "esignature_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "esignature_documents_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "esignature_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      esignature_providers: {
        Row: {
          config: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          last_sync_at: string | null
          name: string
          org_id: string | null
          provider: string
          templates_synced: number | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_sync_at?: string | null
          name: string
          org_id?: string | null
          provider: string
          templates_synced?: number | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_sync_at?: string | null
          name?: string
          org_id?: string | null
          provider?: string
          templates_synced?: number | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "esignature_providers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          event_date: string
          event_end_date: string | null
          event_type: string
          excerpt: string
          featured_image_url: string
          gallery_images: string[] | null
          id: string
          is_featured: boolean
          is_published: boolean
          location: string
          location_type: string
          max_attendees: number | null
          organizer: string
          registration_url: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          event_date: string
          event_end_date?: string | null
          event_type?: string
          excerpt?: string
          featured_image_url?: string
          gallery_images?: string[] | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          location?: string
          location_type?: string
          max_attendees?: number | null
          organizer?: string
          registration_url?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          event_date?: string
          event_end_date?: string | null
          event_type?: string
          excerpt?: string
          featured_image_url?: string
          gallery_images?: string[] | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          location?: string
          location_type?: string
          max_attendees?: number | null
          organizer?: string
          registration_url?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      external_lms_courses: {
        Row: {
          category: string | null
          course_url: string
          created_at: string | null
          description: string | null
          estimated_hours: number | null
          external_id: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          lms_provider: string
          order_index: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          course_url: string
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          external_id: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          lms_provider?: string
          order_index?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          course_url?: string
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          external_id?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          lms_provider?: string
          order_index?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      external_lms_lessons: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          external_id: string | null
          has_quiz: boolean | null
          has_video: boolean | null
          id: string
          is_required: boolean | null
          lesson_url: string
          order_index: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          external_id?: string | null
          has_quiz?: boolean | null
          has_video?: boolean | null
          id?: string
          is_required?: boolean | null
          lesson_url: string
          order_index?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          external_id?: string | null
          has_quiz?: boolean | null
          has_video?: boolean | null
          id?: string
          is_required?: boolean | null
          lesson_url?: string
          order_index?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_lms_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "external_lms_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_items: {
        Row: {
          category: string | null
          content_html: string
          created_at: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content_html: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content_html?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          enabled_by_default: boolean
          id: string
          is_beta: boolean
          min_plan_tier: string | null
          module_id: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          enabled_by_default?: boolean
          id?: string
          is_beta?: boolean
          min_plan_tier?: string | null
          module_id?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          enabled_by_default?: boolean
          id?: string
          is_beta?: boolean
          min_plan_tier?: string | null
          module_id?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "product_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          advisor_id: string | null
          cognito_entry_id: string | null
          created_at: string | null
          data: Json | null
          form_id: string | null
          form_name: string | null
          id: string
          org_id: string | null
          processed_at: string | null
          status: string | null
          submitted_at: string | null
        }
        Insert: {
          advisor_id?: string | null
          cognito_entry_id?: string | null
          created_at?: string | null
          data?: Json | null
          form_id?: string | null
          form_name?: string | null
          id?: string
          org_id?: string | null
          processed_at?: string | null
          status?: string | null
          submitted_at?: string | null
        }
        Update: {
          advisor_id?: string | null
          cognito_entry_id?: string | null
          created_at?: string | null
          data?: Json | null
          form_id?: string | null
          form_name?: string | null
          id?: string
          org_id?: string | null
          processed_at?: string | null
          status?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gemini_prompts: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          template: string
          updated_at: string | null
          usage_count: number | null
          variables: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template?: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Relationships: []
      }
      geo_state_settings: {
        Row: {
          created_at: string | null
          is_restricted: boolean | null
          is_supported: boolean | null
          not_supported_message: string | null
          notes: string | null
          restriction_message: string | null
          state_code: string
          state_name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          is_restricted?: boolean | null
          is_supported?: boolean | null
          not_supported_message?: string | null
          notes?: string | null
          restriction_message?: string | null
          state_code: string
          state_name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          is_restricted?: boolean | null
          is_supported?: boolean | null
          not_supported_message?: string | null
          notes?: string | null
          restriction_message?: string | null
          state_code?: string
          state_name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      handbooks: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          features: Json | null
          flipbook_url: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          pdf_path: string
          plan_type: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          flipbook_url?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          pdf_path: string
          plan_type: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          flipbook_url?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          pdf_path?: string
          plan_type?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      health_history: {
        Row: {
          condition_name: string
          condition_type: string | null
          created_at: string
          diagnosed_date: string | null
          id: string
          is_active: boolean | null
          member_id: string
          notes: string | null
          resolved_date: string | null
          severity: string | null
          updated_at: string
        }
        Insert: {
          condition_name: string
          condition_type?: string | null
          created_at?: string
          diagnosed_date?: string | null
          id?: string
          is_active?: boolean | null
          member_id: string
          notes?: string | null
          resolved_date?: string | null
          severity?: string | null
          updated_at?: string
        }
        Update: {
          condition_name?: string
          condition_type?: string | null
          created_at?: string
          diagnosed_date?: string | null
          id?: string
          is_active?: boolean | null
          member_id?: string
          notes?: string | null
          resolved_date?: string | null
          severity?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      healthcare_plan_categories: {
        Row: {
          best_for: string
          created_at: string | null
          description: string
          gradient: string
          icon: string
          icon_bg: string
          id: string
          image_alt: string
          image_url: string
          is_active: boolean | null
          order_index: number | null
          recommendations: string
          slug: string
          subtitle: string
          title: string
          updated_at: string | null
        }
        Insert: {
          best_for?: string
          created_at?: string | null
          description?: string
          gradient?: string
          icon?: string
          icon_bg?: string
          id?: string
          image_alt?: string
          image_url?: string
          is_active?: boolean | null
          order_index?: number | null
          recommendations?: string
          slug: string
          subtitle?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          best_for?: string
          created_at?: string | null
          description?: string
          gradient?: string
          icon?: string
          icon_bg?: string
          id?: string
          image_alt?: string
          image_url?: string
          is_active?: boolean | null
          order_index?: number | null
          recommendations?: string
          slug?: string
          subtitle?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      immunizations: {
        Row: {
          administering_provider: string | null
          administration_date: string
          created_at: string
          dose_number: number | null
          id: string
          lot_number: string | null
          member_id: string
          next_dose_due: string | null
          notes: string | null
          route: string | null
          site: string | null
          vaccine_code: string | null
          vaccine_name: string
        }
        Insert: {
          administering_provider?: string | null
          administration_date: string
          created_at?: string
          dose_number?: number | null
          id?: string
          lot_number?: string | null
          member_id: string
          next_dose_due?: string | null
          notes?: string | null
          route?: string | null
          site?: string | null
          vaccine_code?: string | null
          vaccine_name: string
        }
        Update: {
          administering_provider?: string | null
          administration_date?: string
          created_at?: string
          dose_number?: number | null
          id?: string
          lot_number?: string | null
          member_id?: string
          next_dose_due?: string | null
          notes?: string | null
          route?: string | null
          site?: string | null
          vaccine_code?: string | null
          vaccine_name?: string
        }
        Relationships: []
      }
      impersonation_log: {
        Row: {
          admin_id: string
          created_at: string | null
          id: string
          ip_address: string | null
          mode: string
          target_user_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          mode: string
          target_user_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          mode?: string
          target_user_id?: string
        }
        Relationships: []
      }
      insurance_carriers: {
        Row: {
          carrier_type: string
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          notes: string | null
          org_id: string | null
          phone: string | null
          slug: string
          sort_order: number | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          carrier_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          notes?: string | null
          org_id?: string | null
          phone?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          carrier_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          notes?: string | null
          org_id?: string | null
          phone?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_carriers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_health: {
        Row: {
          alerts_enabled: boolean | null
          avg_response_time: number | null
          created_at: string | null
          error_count: number | null
          id: string
          last_checked_at: string | null
          last_error_at: string | null
          last_error_message: string | null
          last_success_at: string | null
          platform_id: string | null
          status: string | null
          success_count: number | null
          updated_at: string | null
          uptime_percentage: number | null
        }
        Insert: {
          alerts_enabled?: boolean | null
          avg_response_time?: number | null
          created_at?: string | null
          error_count?: number | null
          id?: string
          last_checked_at?: string | null
          last_error_at?: string | null
          last_error_message?: string | null
          last_success_at?: string | null
          platform_id?: string | null
          status?: string | null
          success_count?: number | null
          updated_at?: string | null
          uptime_percentage?: number | null
        }
        Update: {
          alerts_enabled?: boolean | null
          avg_response_time?: number | null
          created_at?: string | null
          error_count?: number | null
          id?: string
          last_checked_at?: string | null
          last_error_at?: string | null
          last_error_message?: string | null
          last_success_at?: string | null
          platform_id?: string | null
          status?: string | null
          success_count?: number | null
          updated_at?: string | null
          uptime_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_health_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "tracking_platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json
          created_at: string
          error_message: string | null
          id: string
          last_sync_at: string | null
          name: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          name: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          name?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      interaction_logs: {
        Row: {
          agent_id: string | null
          created_at: string | null
          direction: string | null
          duration_seconds: number | null
          id: string
          interaction_type: string
          member_id: string | null
          metadata: Json | null
          org_id: string | null
          outcome: string | null
          sentiment: string | null
          subject: string | null
          summary: string | null
          tags: Json | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          direction?: string | null
          duration_seconds?: number | null
          id?: string
          interaction_type: string
          member_id?: string | null
          metadata?: Json | null
          org_id?: string | null
          outcome?: string | null
          sentiment?: string | null
          subject?: string | null
          summary?: string | null
          tags?: Json | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          direction?: string | null
          duration_seconds?: number | null
          id?: string
          interaction_type?: string
          member_id?: string | null
          metadata?: Json | null
          org_id?: string | null
          outcome?: string | null
          sentiment?: string | null
          subject?: string | null
          summary?: string | null
          tags?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "interaction_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number
          amount_paid: number | null
          billing_period_end: string
          billing_period_start: string
          created_at: string
          due_date: string
          id: string
          invoice_number: string
          invoice_url: string | null
          member_id: string
          status: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount_due: number
          amount_paid?: number | null
          billing_period_end: string
          billing_period_start: string
          created_at?: string
          due_date: string
          id?: string
          invoice_number: string
          invoice_url?: string | null
          member_id: string
          status?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number | null
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string
          due_date?: string
          id?: string
          invoice_number?: string
          invoice_url?: string | null
          member_id?: string
          status?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      lab_results: {
        Row: {
          created_at: string
          document_url: string | null
          id: string
          is_abnormal: boolean | null
          lab_facility: string | null
          member_id: string
          notes: string | null
          ordering_provider: string | null
          reference_range: string | null
          result_unit: string | null
          result_value: string
          test_category: string | null
          test_date: string
          test_name: string
        }
        Insert: {
          created_at?: string
          document_url?: string | null
          id?: string
          is_abnormal?: boolean | null
          lab_facility?: string | null
          member_id: string
          notes?: string | null
          ordering_provider?: string | null
          reference_range?: string | null
          result_unit?: string | null
          result_value: string
          test_category?: string | null
          test_date: string
          test_name: string
        }
        Update: {
          created_at?: string
          document_url?: string | null
          id?: string
          is_abnormal?: boolean | null
          lab_facility?: string | null
          member_id?: string
          notes?: string | null
          ordering_provider?: string | null
          reference_range?: string | null
          result_unit?: string | null
          result_value?: string
          test_category?: string | null
          test_date?: string
          test_name?: string
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          account_id: string | null
          activity_type: string
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          description: string | null
          id: string
          lead_id: string | null
          mentions: Json
          metadata: Json | null
          org_id: string | null
          subject: string | null
          title: string
        }
        Insert: {
          account_id?: string | null
          activity_type: string
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          mentions?: Json
          metadata?: Json | null
          org_id?: string | null
          subject?: string | null
          title: string
        }
        Update: {
          account_id?: string | null
          activity_type?: string
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          mentions?: Json
          metadata?: Json | null
          org_id?: string | null
          subject?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notifications: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string | null
          desktop_notification_clicked: boolean | null
          desktop_notification_sent: boolean | null
          id: string
          is_repeat_lead: boolean | null
          lead_id: string | null
          message: string | null
          notification_type: string | null
          notified_at: string | null
          org_id: string | null
          priority: string
          repeat_count: number | null
          time_to_acknowledge_seconds: number | null
          user_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string | null
          desktop_notification_clicked?: boolean | null
          desktop_notification_sent?: boolean | null
          id?: string
          is_repeat_lead?: boolean | null
          lead_id?: string | null
          message?: string | null
          notification_type?: string | null
          notified_at?: string | null
          org_id?: string | null
          priority?: string
          repeat_count?: number | null
          time_to_acknowledge_seconds?: number | null
          user_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string | null
          desktop_notification_clicked?: boolean | null
          desktop_notification_sent?: boolean | null
          id?: string
          is_repeat_lead?: boolean | null
          lead_id?: string | null
          message?: string | null
          notification_type?: string | null
          notified_at?: string | null
          org_id?: string | null
          priority?: string
          repeat_count?: number | null
          time_to_acknowledge_seconds?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_notifications_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_routing_logs: {
        Row: {
          clicked_at: string | null
          cta_location: string | null
          cta_text: string | null
          cta_type: string | null
          estimated_premium: number | null
          household_size: number | null
          id: string
          page_path: string
          plan_type: string | null
          referrer: string | null
          session_id: string
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          clicked_at?: string | null
          cta_location?: string | null
          cta_text?: string | null
          cta_type?: string | null
          estimated_premium?: number | null
          household_size?: number | null
          id?: string
          page_path: string
          plan_type?: string | null
          referrer?: string | null
          session_id: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          clicked_at?: string | null
          cta_location?: string | null
          cta_text?: string | null
          cta_type?: string | null
          estimated_premium?: number | null
          household_size?: number | null
          id?: string
          page_path?: string
          plan_type?: string | null
          referrer?: string | null
          session_id?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      lead_scoring_config: {
        Row: {
          created_at: string | null
          description: string | null
          factor_key: string
          factor_label: string
          id: string
          is_enabled: boolean | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          factor_key: string
          factor_label: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          factor_key?: string
          factor_label?: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      lead_submissions: {
        Row: {
          application_started_at: string | null
          assigned_to: string | null
          carrier_id: string | null
          city: string | null
          community_event_id: string | null
          concierge_handoff_at: string | null
          contact_preference: string | null
          converted_at: string | null
          coverage_preference: string | null
          created_at: string | null
          current_insurance: string | null
          dependent_count: number | null
          do_not_contact: boolean | null
          email: string
          engagement_detected_at: string | null
          enrollment_approved_at: string | null
          first_name: string
          form_data: Json | null
          group_type: string | null
          household_size: number | null
          household_type: string | null
          id: string
          interested_plans: string[] | null
          ip_address: unknown
          is_self_generated: boolean | null
          last_activity_at: string | null
          last_contacted_at: string | null
          last_name: string
          last_opt_out_signal_at: string | null
          last_touched_at: string | null
          lead_score: number | null
          lead_source: string | null
          linkedin_workflow_status: string | null
          lost_reason: string | null
          member_responsibility: number | null
          monthly_premium: string | null
          next_followup_at: string | null
          opt_out_detected_at: string | null
          opt_out_phrase: string | null
          opt_out_reason: string | null
          org_id: string | null
          original_effective_date: string | null
          outside_advisor_id: string | null
          phone: string
          pipeline_stage: string | null
          pipeline_stage_id: string | null
          plan_type: string | null
          preliminary_quote_sent_at: string | null
          premium_amount: number | null
          primary_age: number | null
          primary_concern: string | null
          priority: string | null
          quote_cadence_started_at: string | null
          quoted_plans: string[] | null
          reactivation_source_lead_id: string | null
          referral_partner_id: string | null
          referrer: string | null
          source_cta: string | null
          source_page: string | null
          spouse_age: number | null
          stage_changed_at: string | null
          state: string | null
          subsidy_amount: number | null
          tags: string[] | null
          tobacco_status: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          workflow_subsection: string | null
          zip_code: string | null
        }
        Insert: {
          application_started_at?: string | null
          assigned_to?: string | null
          carrier_id?: string | null
          city?: string | null
          community_event_id?: string | null
          concierge_handoff_at?: string | null
          contact_preference?: string | null
          converted_at?: string | null
          coverage_preference?: string | null
          created_at?: string | null
          current_insurance?: string | null
          dependent_count?: number | null
          do_not_contact?: boolean | null
          email: string
          engagement_detected_at?: string | null
          enrollment_approved_at?: string | null
          first_name: string
          form_data?: Json | null
          group_type?: string | null
          household_size?: number | null
          household_type?: string | null
          id?: string
          interested_plans?: string[] | null
          ip_address?: unknown
          is_self_generated?: boolean | null
          last_activity_at?: string | null
          last_contacted_at?: string | null
          last_name: string
          last_opt_out_signal_at?: string | null
          last_touched_at?: string | null
          lead_score?: number | null
          lead_source?: string | null
          linkedin_workflow_status?: string | null
          lost_reason?: string | null
          member_responsibility?: number | null
          monthly_premium?: string | null
          next_followup_at?: string | null
          opt_out_detected_at?: string | null
          opt_out_phrase?: string | null
          opt_out_reason?: string | null
          org_id?: string | null
          original_effective_date?: string | null
          outside_advisor_id?: string | null
          phone: string
          pipeline_stage?: string | null
          pipeline_stage_id?: string | null
          plan_type?: string | null
          preliminary_quote_sent_at?: string | null
          premium_amount?: number | null
          primary_age?: number | null
          primary_concern?: string | null
          priority?: string | null
          quote_cadence_started_at?: string | null
          quoted_plans?: string[] | null
          reactivation_source_lead_id?: string | null
          referral_partner_id?: string | null
          referrer?: string | null
          source_cta?: string | null
          source_page?: string | null
          spouse_age?: number | null
          stage_changed_at?: string | null
          state?: string | null
          subsidy_amount?: number | null
          tags?: string[] | null
          tobacco_status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          workflow_subsection?: string | null
          zip_code?: string | null
        }
        Update: {
          application_started_at?: string | null
          assigned_to?: string | null
          carrier_id?: string | null
          city?: string | null
          community_event_id?: string | null
          concierge_handoff_at?: string | null
          contact_preference?: string | null
          converted_at?: string | null
          coverage_preference?: string | null
          created_at?: string | null
          current_insurance?: string | null
          dependent_count?: number | null
          do_not_contact?: boolean | null
          email?: string
          engagement_detected_at?: string | null
          enrollment_approved_at?: string | null
          first_name?: string
          form_data?: Json | null
          group_type?: string | null
          household_size?: number | null
          household_type?: string | null
          id?: string
          interested_plans?: string[] | null
          ip_address?: unknown
          is_self_generated?: boolean | null
          last_activity_at?: string | null
          last_contacted_at?: string | null
          last_name?: string
          last_opt_out_signal_at?: string | null
          last_touched_at?: string | null
          lead_score?: number | null
          lead_source?: string | null
          linkedin_workflow_status?: string | null
          lost_reason?: string | null
          member_responsibility?: number | null
          monthly_premium?: string | null
          next_followup_at?: string | null
          opt_out_detected_at?: string | null
          opt_out_phrase?: string | null
          opt_out_reason?: string | null
          org_id?: string | null
          original_effective_date?: string | null
          outside_advisor_id?: string | null
          phone?: string
          pipeline_stage?: string | null
          pipeline_stage_id?: string | null
          plan_type?: string | null
          preliminary_quote_sent_at?: string | null
          premium_amount?: number | null
          primary_age?: number | null
          primary_concern?: string | null
          priority?: string | null
          quote_cadence_started_at?: string | null
          quoted_plans?: string[] | null
          reactivation_source_lead_id?: string | null
          referral_partner_id?: string | null
          referrer?: string | null
          source_cta?: string | null
          source_page?: string | null
          spouse_age?: number | null
          stage_changed_at?: string | null
          state?: string | null
          subsidy_amount?: number | null
          tags?: string[] | null
          tobacco_status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          workflow_subsection?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_submissions_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "insurance_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_submissions_community_event_id_fkey"
            columns: ["community_event_id"]
            isOneToOne: false
            referencedRelation: "crm_community_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_submissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_submissions_outside_advisor_id_fkey"
            columns: ["outside_advisor_id"]
            isOneToOne: false
            referencedRelation: "crm_outside_advisors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_submissions_referral_partner_id_fkey"
            columns: ["referral_partner_id"]
            isOneToOne: false
            referencedRelation: "crm_referral_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tasks: {
        Row: {
          assigned_to: string | null
          completed: boolean | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string
          due_time: string | null
          id: string
          lead_id: string
          org_id: string | null
          priority: string | null
          task_type: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date: string
          due_time?: string | null
          id?: string
          lead_id: string
          org_id?: string | null
          priority?: string | null
          task_type?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string
          due_time?: string | null
          id?: string
          lead_id?: string
          org_id?: string | null
          priority?: string | null
          task_type?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_accounts: {
        Row: {
          access_token_encrypted: string | null
          auto_sync: boolean | null
          avatar_url: string | null
          created_at: string | null
          delta_token: string | null
          display_name: string | null
          email_address: string
          id: string
          imap_host: string | null
          imap_port: number | null
          imap_use_ssl: boolean | null
          is_active: boolean | null
          is_default: boolean | null
          is_primary_shared_inbox: boolean
          last_sync_at: string | null
          org_id: string
          provider: Database["public"]["Enums"]["mail_provider"]
          provider_account_id: string | null
          refresh_token_encrypted: string | null
          scopes: string[] | null
          smtp_host: string | null
          smtp_port: number | null
          sync_error: string | null
          sync_interval_minutes: number | null
          sync_status: Database["public"]["Enums"]["mail_sync_status"] | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          auto_sync?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          delta_token?: string | null
          display_name?: string | null
          email_address: string
          id?: string
          imap_host?: string | null
          imap_port?: number | null
          imap_use_ssl?: boolean | null
          is_active?: boolean | null
          is_default?: boolean | null
          is_primary_shared_inbox?: boolean
          last_sync_at?: string | null
          org_id: string
          provider: Database["public"]["Enums"]["mail_provider"]
          provider_account_id?: string | null
          refresh_token_encrypted?: string | null
          scopes?: string[] | null
          smtp_host?: string | null
          smtp_port?: number | null
          sync_error?: string | null
          sync_interval_minutes?: number | null
          sync_status?: Database["public"]["Enums"]["mail_sync_status"] | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          auto_sync?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          delta_token?: string | null
          display_name?: string | null
          email_address?: string
          id?: string
          imap_host?: string | null
          imap_port?: number | null
          imap_use_ssl?: boolean | null
          is_active?: boolean | null
          is_default?: boolean | null
          is_primary_shared_inbox?: boolean
          last_sync_at?: string | null
          org_id?: string
          provider?: Database["public"]["Enums"]["mail_provider"]
          provider_account_id?: string | null
          refresh_token_encrypted?: string | null
          scopes?: string[] | null
          smtp_host?: string | null
          smtp_port?: number | null
          sync_error?: string | null
          sync_interval_minutes?: number | null
          sync_status?: Database["public"]["Enums"]["mail_sync_status"] | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_audit_log: {
        Row: {
          account_id: string | null
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          org_id: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          org_id?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          org_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mail_audit_log_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "mail_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_domains: {
        Row: {
          compliance_footer: string | null
          created_at: string | null
          created_by: string | null
          dkim_record: string | null
          dkim_selector: string | null
          dkim_status:
            | Database["public"]["Enums"]["domain_verification_status"]
            | null
          dkim_verified_at: string | null
          dmarc_record: string | null
          dmarc_status:
            | Database["public"]["Enums"]["domain_verification_status"]
            | null
          dmarc_verified_at: string | null
          domain: string
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          last_check_at: string | null
          mx_status:
            | Database["public"]["Enums"]["domain_verification_status"]
            | null
          mx_verified_at: string | null
          next_check_at: string | null
          org_id: string
          spf_record: string | null
          spf_status:
            | Database["public"]["Enums"]["domain_verification_status"]
            | null
          spf_verified_at: string | null
          updated_at: string | null
          verification_token: string | null
        }
        Insert: {
          compliance_footer?: string | null
          created_at?: string | null
          created_by?: string | null
          dkim_record?: string | null
          dkim_selector?: string | null
          dkim_status?:
            | Database["public"]["Enums"]["domain_verification_status"]
            | null
          dkim_verified_at?: string | null
          dmarc_record?: string | null
          dmarc_status?:
            | Database["public"]["Enums"]["domain_verification_status"]
            | null
          dmarc_verified_at?: string | null
          domain: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_check_at?: string | null
          mx_status?:
            | Database["public"]["Enums"]["domain_verification_status"]
            | null
          mx_verified_at?: string | null
          next_check_at?: string | null
          org_id: string
          spf_record?: string | null
          spf_status?:
            | Database["public"]["Enums"]["domain_verification_status"]
            | null
          spf_verified_at?: string | null
          updated_at?: string | null
          verification_token?: string | null
        }
        Update: {
          compliance_footer?: string | null
          created_at?: string | null
          created_by?: string | null
          dkim_record?: string | null
          dkim_selector?: string | null
          dkim_status?:
            | Database["public"]["Enums"]["domain_verification_status"]
            | null
          dkim_verified_at?: string | null
          dmarc_record?: string | null
          dmarc_status?:
            | Database["public"]["Enums"]["domain_verification_status"]
            | null
          dmarc_verified_at?: string | null
          domain?: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_check_at?: string | null
          mx_status?:
            | Database["public"]["Enums"]["domain_verification_status"]
            | null
          mx_verified_at?: string | null
          next_check_at?: string | null
          org_id?: string
          spf_record?: string | null
          spf_status?:
            | Database["public"]["Enums"]["domain_verification_status"]
            | null
          spf_verified_at?: string | null
          updated_at?: string | null
          verification_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mail_domains_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_folders: {
        Row: {
          account_id: string
          created_at: string | null
          delta_token: string | null
          display_name: string | null
          folder_type: string | null
          id: string
          is_hidden: boolean | null
          label_color: string | null
          last_sync_at: string | null
          name: string
          parent_folder_id: string | null
          provider_folder_id: string
          sort_order: number | null
          total_count: number | null
          unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          created_at?: string | null
          delta_token?: string | null
          display_name?: string | null
          folder_type?: string | null
          id?: string
          is_hidden?: boolean | null
          label_color?: string | null
          last_sync_at?: string | null
          name: string
          parent_folder_id?: string | null
          provider_folder_id: string
          sort_order?: number | null
          total_count?: number | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string | null
          delta_token?: string | null
          display_name?: string | null
          folder_type?: string | null
          id?: string
          is_hidden?: boolean | null
          label_color?: string | null
          last_sync_at?: string | null
          name?: string
          parent_folder_id?: string | null
          provider_folder_id?: string
          sort_order?: number | null
          total_count?: number | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mail_folders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "mail_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mail_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "mail_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_message_attachments: {
        Row: {
          cached_at: string | null
          content_id: string | null
          content_type: string | null
          created_at: string | null
          file_name: string
          file_size: number | null
          id: string
          is_inline: boolean | null
          message_id: string
          provider_attachment_id: string
          storage_path: string | null
        }
        Insert: {
          cached_at?: string | null
          content_id?: string | null
          content_type?: string | null
          created_at?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          is_inline?: boolean | null
          message_id: string
          provider_attachment_id: string
          storage_path?: string | null
        }
        Update: {
          cached_at?: string | null
          content_id?: string | null
          content_type?: string | null
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          is_inline?: boolean | null
          message_id?: string
          provider_attachment_id?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mail_message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "mail_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_messages: {
        Row: {
          account_id: string
          bcc_addresses: Json | null
          body_fetched: boolean | null
          body_html: string | null
          body_text: string | null
          categories: string[] | null
          cc_addresses: Json | null
          created_at: string | null
          crm_email_log_id: string | null
          folder_id: string | null
          from_address: string | null
          from_name: string | null
          has_attachments: boolean | null
          id: string
          importance: string | null
          in_reply_to: string | null
          internet_message_id: string | null
          is_draft: boolean | null
          is_flagged: boolean | null
          is_read: boolean | null
          provider_message_id: string
          provider_metadata: Json | null
          provider_thread_id: string | null
          received_at: string | null
          reply_to_address: string | null
          sent_at: string | null
          snippet: string | null
          subject: string | null
          to_addresses: Json | null
          tracking_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          bcc_addresses?: Json | null
          body_fetched?: boolean | null
          body_html?: string | null
          body_text?: string | null
          categories?: string[] | null
          cc_addresses?: Json | null
          created_at?: string | null
          crm_email_log_id?: string | null
          folder_id?: string | null
          from_address?: string | null
          from_name?: string | null
          has_attachments?: boolean | null
          id?: string
          importance?: string | null
          in_reply_to?: string | null
          internet_message_id?: string | null
          is_draft?: boolean | null
          is_flagged?: boolean | null
          is_read?: boolean | null
          provider_message_id: string
          provider_metadata?: Json | null
          provider_thread_id?: string | null
          received_at?: string | null
          reply_to_address?: string | null
          sent_at?: string | null
          snippet?: string | null
          subject?: string | null
          to_addresses?: Json | null
          tracking_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          bcc_addresses?: Json | null
          body_fetched?: boolean | null
          body_html?: string | null
          body_text?: string | null
          categories?: string[] | null
          cc_addresses?: Json | null
          created_at?: string | null
          crm_email_log_id?: string | null
          folder_id?: string | null
          from_address?: string | null
          from_name?: string | null
          has_attachments?: boolean | null
          id?: string
          importance?: string | null
          in_reply_to?: string | null
          internet_message_id?: string | null
          is_draft?: boolean | null
          is_flagged?: boolean | null
          is_read?: boolean | null
          provider_message_id?: string
          provider_metadata?: Json | null
          provider_thread_id?: string | null
          received_at?: string | null
          reply_to_address?: string | null
          sent_at?: string | null
          snippet?: string | null
          subject?: string | null
          to_addresses?: Json | null
          tracking_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mail_messages_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "mail_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mail_messages_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "mail_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_rules: {
        Row: {
          account_id: string
          actions: Json
          conditions: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          last_applied_at: string | null
          name: string
          priority: number | null
          stop_processing: boolean | null
          times_applied: number | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          actions?: Json
          conditions?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_applied_at?: string | null
          name: string
          priority?: number | null
          stop_processing?: boolean | null
          times_applied?: number | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          actions?: Json
          conditions?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_applied_at?: string | null
          name?: string
          priority?: number | null
          stop_processing?: boolean | null
          times_applied?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mail_rules_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "mail_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_sender_identities: {
        Row: {
          created_at: string | null
          created_by: string | null
          display_name: string | null
          domain_id: string
          email_address: string
          id: string
          is_default: boolean | null
          org_id: string
          signature_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          display_name?: string | null
          domain_id: string
          email_address: string
          id?: string
          is_default?: boolean | null
          org_id: string
          signature_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          display_name?: string | null
          domain_id?: string
          email_address?: string
          id?: string
          is_default?: boolean | null
          org_id?: string
          signature_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mail_sender_identities_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "mail_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mail_sender_identities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_shared_access: {
        Row: {
          account_id: string
          created_at: string | null
          granted_by: string | null
          grantee_user_id: string
          id: string
          is_active: boolean | null
          permission: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          granted_by?: string | null
          grantee_user_id: string
          id?: string
          is_active?: boolean | null
          permission?: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          granted_by?: string | null
          grantee_user_id?: string
          id?: string
          is_active?: boolean | null
          permission?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_shared_access_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "mail_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_sync_jobs: {
        Row: {
          account_id: string
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          error: string | null
          id: string
          job_type: Database["public"]["Enums"]["mail_job_type"]
          max_attempts: number | null
          payload: Json | null
          priority: number | null
          result: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["mail_job_status"] | null
        }
        Insert: {
          account_id: string
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          job_type: Database["public"]["Enums"]["mail_job_type"]
          max_attempts?: number | null
          payload?: Json | null
          priority?: number | null
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["mail_job_status"] | null
        }
        Update: {
          account_id?: string
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          job_type?: Database["public"]["Enums"]["mail_job_type"]
          max_attempts?: number | null
          payload?: Json | null
          priority?: number | null
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["mail_job_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "mail_sync_jobs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "mail_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          budget: number | null
          channel: string
          clicks: number | null
          conversions: number | null
          cpc: number | null
          created_at: string | null
          ctr: number | null
          end_date: string | null
          id: string
          impressions: number | null
          name: string
          revenue: number | null
          roas: number | null
          spent: number | null
          start_date: string
          status: string | null
          target_audience: Json | null
          updated_at: string | null
          utm_params: Json | null
        }
        Insert: {
          budget?: number | null
          channel: string
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          name: string
          revenue?: number | null
          roas?: number | null
          spent?: number | null
          start_date: string
          status?: string | null
          target_audience?: Json | null
          updated_at?: string | null
          utm_params?: Json | null
        }
        Update: {
          budget?: number | null
          channel?: string
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          name?: string
          revenue?: number | null
          roas?: number | null
          spent?: number | null
          start_date?: string
          status?: string | null
          target_audience?: Json | null
          updated_at?: string | null
          utm_params?: Json | null
        }
        Relationships: []
      }
      maternity_coverage: {
        Row: {
          additional_benefits: string[] | null
          created_at: string | null
          delivery_hospital: string
          description: string
          eligible_plans: string[] | null
          headline: string
          highlights: string[] | null
          id: string
          postnatal_care: string
          prenatal_care: string
          updated_at: string | null
          waiting_period: string
        }
        Insert: {
          additional_benefits?: string[] | null
          created_at?: string | null
          delivery_hospital?: string
          description: string
          eligible_plans?: string[] | null
          headline: string
          highlights?: string[] | null
          id?: string
          postnatal_care?: string
          prenatal_care?: string
          updated_at?: string | null
          waiting_period: string
        }
        Update: {
          additional_benefits?: string[] | null
          created_at?: string | null
          delivery_hospital?: string
          description?: string
          eligible_plans?: string[] | null
          headline?: string
          highlights?: string[] | null
          id?: string
          postnatal_care?: string
          prenatal_care?: string
          updated_at?: string | null
          waiting_period?: string
        }
        Relationships: []
      }
      maternity_coverage_stages: {
        Row: {
          created_at: string | null
          description: string
          details: string[] | null
          icon: string
          id: string
          maternity_coverage_id: string
          order_index: number | null
          stage_key: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description: string
          details?: string[] | null
          icon?: string
          id?: string
          maternity_coverage_id: string
          order_index?: number | null
          stage_key: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string
          details?: string[] | null
          icon?: string
          id?: string
          maternity_coverage_id?: string
          order_index?: number | null
          stage_key?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "maternity_coverage_stages_maternity_coverage_id_fkey"
            columns: ["maternity_coverage_id"]
            isOneToOne: false
            referencedRelation: "maternity_coverage"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_invitations: {
        Row: {
          advisor_id: string
          created_at: string | null
          id: string
          invited_at: string | null
          meeting_id: string
          notes: string | null
          org_id: string | null
          reminder_sent: boolean | null
          reminder_sent_at: string | null
          responded_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          advisor_id: string
          created_at?: string | null
          id?: string
          invited_at?: string | null
          meeting_id: string
          notes?: string | null
          org_id?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          responded_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          advisor_id?: string
          created_at?: string | null
          id?: string
          invited_at?: string | null
          meeting_id?: string
          notes?: string | null
          org_id?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          responded_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_invitations_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_invitations_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisor_training_completion"
            referencedColumns: ["advisor_id"]
          },
          {
            foreignKeyName: "meeting_invitations_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "advisor_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_templates: {
        Row: {
          allow_guests: boolean | null
          auto_record: boolean | null
          created_at: string | null
          created_by: string | null
          default_agenda: string | null
          default_duration: number | null
          default_visibility: string | null
          description: string | null
          id: string
          is_active: boolean | null
          meeting_type: string | null
          name: string
          require_registration: boolean | null
          updated_at: string | null
        }
        Insert: {
          allow_guests?: boolean | null
          auto_record?: boolean | null
          created_at?: string | null
          created_by?: string | null
          default_agenda?: string | null
          default_duration?: number | null
          default_visibility?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          meeting_type?: string | null
          name: string
          require_registration?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allow_guests?: boolean | null
          auto_record?: boolean | null
          created_at?: string | null
          created_by?: string | null
          default_agenda?: string | null
          default_duration?: number | null
          default_visibility?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          meeting_type?: string | null
          name?: string
          require_registration?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      member_account_events: {
        Row: {
          actor_department: string
          actor_user_id: string
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          member_id: string
          member_notification_id: string | null
          notification_generated: boolean | null
          payload_summary: Json | null
          should_notify_member: boolean | null
        }
        Insert: {
          actor_department: string
          actor_user_id: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          member_id: string
          member_notification_id?: string | null
          notification_generated?: boolean | null
          payload_summary?: Json | null
          should_notify_member?: boolean | null
        }
        Update: {
          actor_department?: string
          actor_user_id?: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          member_id?: string
          member_notification_id?: string | null
          notification_generated?: boolean | null
          payload_summary?: Json | null
          should_notify_member?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "member_account_events_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_account_events_member_notification_id_fkey"
            columns: ["member_notification_id"]
            isOneToOne: false
            referencedRelation: "member_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      member_coverage: {
        Row: {
          annual_unshared_amount: number | null
          benefits: Json | null
          coverage_end_date: string | null
          coverage_start_date: string
          created_at: string
          id: string
          is_active: boolean | null
          lifetime_maximum: number | null
          lifetime_used: number | null
          member_id: string
          monthly_share_amount: number
          network_info: Json | null
          plan_name: string
          plan_type: string
          remaining_unshared: number | null
          updated_at: string
        }
        Insert: {
          annual_unshared_amount?: number | null
          benefits?: Json | null
          coverage_end_date?: string | null
          coverage_start_date: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          lifetime_maximum?: number | null
          lifetime_used?: number | null
          member_id: string
          monthly_share_amount: number
          network_info?: Json | null
          plan_name: string
          plan_type: string
          remaining_unshared?: number | null
          updated_at?: string
        }
        Update: {
          annual_unshared_amount?: number | null
          benefits?: Json | null
          coverage_end_date?: string | null
          coverage_start_date?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          lifetime_maximum?: number | null
          lifetime_used?: number | null
          member_id?: string
          monthly_share_amount?: number
          network_info?: Json | null
          plan_name?: string
          plan_type?: string
          remaining_unshared?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      member_dependents: {
        Row: {
          allergies: string[] | null
          coverage_end_date: string | null
          coverage_start_date: string | null
          created_at: string
          date_of_birth: string
          first_name: string
          gender: string | null
          id: string
          is_covered: boolean | null
          last_name: string
          medical_conditions: string[] | null
          member_id: string
          metadata: Json | null
          relationship: string
          ssn_last_four: string | null
          updated_at: string
        }
        Insert: {
          allergies?: string[] | null
          coverage_end_date?: string | null
          coverage_start_date?: string | null
          created_at?: string
          date_of_birth: string
          first_name: string
          gender?: string | null
          id?: string
          is_covered?: boolean | null
          last_name: string
          medical_conditions?: string[] | null
          member_id: string
          metadata?: Json | null
          relationship: string
          ssn_last_four?: string | null
          updated_at?: string
        }
        Update: {
          allergies?: string[] | null
          coverage_end_date?: string | null
          coverage_start_date?: string | null
          created_at?: string
          date_of_birth?: string
          first_name?: string
          gender?: string | null
          id?: string
          is_covered?: boolean | null
          last_name?: string
          medical_conditions?: string[] | null
          member_id?: string
          metadata?: Json | null
          relationship?: string
          ssn_last_four?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_dependents_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_documents: {
        Row: {
          created_at: string
          description: string | null
          document_category: string
          expires_at: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          is_current: boolean | null
          member_id: string
          mime_type: string | null
          tags: string[] | null
          title: string
          updated_at: string
          uploaded_by: string | null
          version: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_category: string
          expires_at?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          is_current?: boolean | null
          member_id: string
          mime_type?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          document_category?: string
          expires_at?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          is_current?: boolean | null
          member_id?: string
          mime_type?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          version?: number | null
        }
        Relationships: []
      }
      member_notification_rules: {
        Row: {
          category: string | null
          created_at: string
          department: string
          event_type: string
          id: string
          is_enabled: boolean | null
          message_template: string
          notification_type: string
          priority: string | null
          title_template: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          department?: string
          event_type: string
          id?: string
          is_enabled?: boolean | null
          message_template: string
          notification_type: string
          priority?: string | null
          title_template: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          department?: string
          event_type?: string
          id?: string
          is_enabled?: boolean | null
          message_template?: string
          notification_type?: string
          priority?: string | null
          title_template?: string
          updated_at?: string
        }
        Relationships: []
      }
      member_notifications: {
        Row: {
          action_url: string | null
          actor_department: string | null
          category: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean | null
          member_id: string
          message: string
          metadata: Json | null
          notification_type: string
          priority: string | null
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          source_event_id: string | null
          title: string
        }
        Insert: {
          action_url?: string | null
          actor_department?: string | null
          category?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          member_id: string
          message: string
          metadata?: Json | null
          notification_type: string
          priority?: string | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          source_event_id?: string | null
          title: string
        }
        Update: {
          action_url?: string | null
          actor_department?: string | null
          category?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          member_id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          priority?: string | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          source_event_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_notifications_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          allergies: string[] | null
          assigned_advisor_id: string | null
          city: string | null
          communication_preferences: Json | null
          consent_date: string | null
          country: string | null
          created_at: string
          date_of_birth: string
          emergency_contact_consent: boolean | null
          enrollment_date: string | null
          first_name: string
          gender: string | null
          hipaa_consent: boolean | null
          id: string
          last_contact_date: string | null
          last_name: string
          medical_conditions: string[] | null
          medications: string[] | null
          membership_end_date: string | null
          membership_number: string | null
          membership_start_date: string | null
          membership_status: string | null
          metadata: Json | null
          notes: string | null
          phone: string | null
          plan_id: string | null
          plan_name: string | null
          plan_type: string | null
          preferred_language: string | null
          profile_photo_url: string | null
          renewal_date: string | null
          state: string | null
          status: string | null
          tags: string[] | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          allergies?: string[] | null
          assigned_advisor_id?: string | null
          city?: string | null
          communication_preferences?: Json | null
          consent_date?: string | null
          country?: string | null
          created_at?: string
          date_of_birth: string
          emergency_contact_consent?: boolean | null
          enrollment_date?: string | null
          first_name: string
          gender?: string | null
          hipaa_consent?: boolean | null
          id: string
          last_contact_date?: string | null
          last_name: string
          medical_conditions?: string[] | null
          medications?: string[] | null
          membership_end_date?: string | null
          membership_number?: string | null
          membership_start_date?: string | null
          membership_status?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          plan_id?: string | null
          plan_name?: string | null
          plan_type?: string | null
          preferred_language?: string | null
          profile_photo_url?: string | null
          renewal_date?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          allergies?: string[] | null
          assigned_advisor_id?: string | null
          city?: string | null
          communication_preferences?: Json | null
          consent_date?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string
          emergency_contact_consent?: boolean | null
          enrollment_date?: string | null
          first_name?: string
          gender?: string | null
          hipaa_consent?: boolean | null
          id?: string
          last_contact_date?: string | null
          last_name?: string
          medical_conditions?: string[] | null
          medications?: string[] | null
          membership_end_date?: string | null
          membership_number?: string | null
          membership_start_date?: string | null
          membership_status?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          plan_id?: string | null
          plan_name?: string | null
          plan_type?: string | null
          preferred_language?: string | null
          profile_photo_url?: string | null
          renewal_date?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          body: string
          category: string | null
          created_at: string | null
          created_by: string | null
          id: string
          last_used_at: string | null
          name: string
          org_id: string | null
          subject: string | null
          times_used: number | null
          updated_at: string | null
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_used_at?: string | null
          name: string
          org_id?: string | null
          subject?: string | null
          times_used?: number | null
          updated_at?: string | null
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_used_at?: string | null
          name?: string
          org_id?: string | null
          subject?: string | null
          times_used?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachments: Json | null
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message_body: string
          parent_message_id: string | null
          read_at: string | null
          recipient_id: string
          sender_id: string
          subject: string | null
        }
        Insert: {
          attachments?: Json | null
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_body: string
          parent_message_id?: string | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
          subject?: string | null
        }
        Update: {
          attachments?: Json | null
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_body?: string
          parent_message_id?: string | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_analytics: {
        Row: {
          action: string
          id: string
          navigation_item_id: string | null
          referrer: string | null
          session_id: string
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          navigation_item_id?: string | null
          referrer?: string | null
          session_id: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          navigation_item_id?: string | null
          referrer?: string | null
          session_id?: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "navigation_analytics_navigation_item_id_fkey"
            columns: ["navigation_item_id"]
            isOneToOne: false
            referencedRelation: "navigation_items"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_items: {
        Row: {
          allowed_roles: string[] | null
          badge: string | null
          created_at: string | null
          description: string | null
          external: boolean | null
          href: string
          icon: string | null
          id: string
          is_active: boolean | null
          label: string
          order_position: number
          parent_id: string | null
          requires_auth: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_roles?: string[] | null
          badge?: string | null
          created_at?: string | null
          description?: string | null
          external?: boolean | null
          href: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          order_position?: number
          parent_id?: string | null
          requires_auth?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_roles?: string[] | null
          badge?: string | null
          created_at?: string | null
          description?: string | null
          external?: boolean | null
          href?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          order_position?: number
          parent_id?: string | null
          requires_auth?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "navigation_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "navigation_items"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_search_analytics: {
        Row: {
          created_at: string
          id: string
          query: string
          results_count: number
          selected_result: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
          results_count?: number
          selected_result?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
          results_count?: number
          selected_result?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      newsletter_campaigns: {
        Row: {
          blog_post_id: string | null
          bounced_count: number | null
          click_rate: number | null
          clicked_count: number | null
          created_at: string | null
          created_by: string | null
          delivered_count: number | null
          id: string
          n8n_execution_id: string | null
          n8n_webhook_url: string | null
          open_rate: number | null
          opened_count: number | null
          preview_text: string | null
          send_at: string | null
          sent_count: number | null
          status: string | null
          subject_line: string
          target_segment: Json | null
          unsubscribed_count: number | null
          updated_at: string | null
        }
        Insert: {
          blog_post_id?: string | null
          bounced_count?: number | null
          click_rate?: number | null
          clicked_count?: number | null
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          id?: string
          n8n_execution_id?: string | null
          n8n_webhook_url?: string | null
          open_rate?: number | null
          opened_count?: number | null
          preview_text?: string | null
          send_at?: string | null
          sent_count?: number | null
          status?: string | null
          subject_line: string
          target_segment?: Json | null
          unsubscribed_count?: number | null
          updated_at?: string | null
        }
        Update: {
          blog_post_id?: string | null
          bounced_count?: number | null
          click_rate?: number | null
          clicked_count?: number | null
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          id?: string
          n8n_execution_id?: string | null
          n8n_webhook_url?: string | null
          open_rate?: number | null
          opened_count?: number | null
          preview_text?: string | null
          send_at?: string | null
          sent_count?: number | null
          status?: string | null
          subject_line?: string
          target_segment?: Json | null
          unsubscribed_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_queue: {
        Row: {
          bounce_reason: string | null
          campaign_id: string
          clicked_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          sent_at: string | null
          status: string | null
          subscriber_id: string
          tracking_token: string | null
        }
        Insert: {
          bounce_reason?: string | null
          campaign_id: string
          clicked_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
          subscriber_id: string
          tracking_token?: string | null
        }
        Update: {
          bounce_reason?: string | null
          campaign_id?: string
          clicked_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
          subscriber_id?: string
          tracking_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "newsletter_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_queue_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "newsletter_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          confirmed_at: string | null
          created_at: string | null
          email: string
          id: string
          ip_address: string | null
          metadata: Json | null
          source: string | null
          status: string
          unsubscribed_at: string | null
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          source?: string | null
          status?: string
          unsubscribed_at?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          source?: string | null
          status?: string
          unsubscribed_at?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      note_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          metadata: Json | null
          note_id: string | null
          notification_type: string | null
          recipient_user_id: string | null
          sent_via: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          note_id?: string | null
          notification_type?: string | null
          recipient_user_id?: string | null
          sent_via?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          note_id?: string | null
          notification_type?: string | null
          recipient_user_id?: string | null
          sent_via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_notifications_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      note_shares: {
        Row: {
          created_at: string | null
          id: string
          note_id: string | null
          permission_level: string | null
          share_message: string | null
          shared_by_user_id: string | null
          shared_with_role: string | null
          shared_with_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          note_id?: string | null
          permission_level?: string | null
          share_message?: string | null
          shared_by_user_id?: string | null
          shared_with_role?: string | null
          shared_with_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          note_id?: string | null
          permission_level?: string | null
          share_message?: string | null
          shared_by_user_id?: string | null
          shared_with_role?: string | null
          shared_with_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_shares_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          created_for_role: string | null
          id: string
          is_collaborative: boolean | null
          is_pinned: boolean | null
          is_shared: boolean | null
          owner_role: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          created_for_role?: string | null
          id?: string
          is_collaborative?: boolean | null
          is_pinned?: boolean | null
          is_shared?: boolean | null
          owner_role?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          created_for_role?: string | null
          id?: string
          is_collaborative?: boolean | null
          is_pinned?: boolean | null
          is_shared?: boolean | null
          owner_role?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notification_events: {
        Row: {
          action_url: string | null
          actor_id: string | null
          actor_name: string | null
          body: string | null
          created_at: string | null
          event_type: string
          id: string
          is_read: boolean | null
          metadata: Json | null
          org_id: string
          read_at: string | null
          source_id: string | null
          source_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          actor_id?: string | null
          actor_name?: string | null
          body?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          org_id: string
          read_at?: string | null
          source_id?: string | null
          source_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          actor_id?: string | null
          actor_name?: string | null
          body?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          org_id?: string
          read_at?: string | null
          source_id?: string | null
          source_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          body: string | null
          channel: string
          clicked_at: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          event_id: string | null
          id: string
          lead_id: string | null
          notification_type: string
          sent_at: string | null
          status: string | null
          task_id: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          channel: string
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          event_id?: string | null
          id?: string
          lead_id?: string | null
          notification_type: string
          sent_at?: string | null
          status?: string | null
          task_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          channel?: string
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          event_id?: string | null
          id?: string
          lead_id?: string | null
          notification_type?: string
          sent_at?: string | null
          status?: string | null
          task_id?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "lead_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_daily_digest: boolean | null
          email_enabled: boolean | null
          email_hot_leads: boolean | null
          email_new_leads: boolean | null
          email_task_reminders: boolean | null
          email_weekly_summary: boolean | null
          id: string
          min_priority_for_push: string | null
          mute_all_until: string | null
          push_bulletins: boolean | null
          push_chat_mentions: boolean | null
          push_chat_messages: boolean | null
          push_enabled: boolean | null
          push_hot_leads: boolean | null
          push_lead_activity: boolean | null
          push_new_leads: boolean | null
          push_subscription: Json | null
          push_task_due: boolean | null
          push_ticket_updates: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          slack_channel: string | null
          slack_daily_summary: boolean | null
          slack_enabled: boolean | null
          slack_hot_leads: boolean | null
          slack_new_leads: boolean | null
          slack_webhook_url: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_daily_digest?: boolean | null
          email_enabled?: boolean | null
          email_hot_leads?: boolean | null
          email_new_leads?: boolean | null
          email_task_reminders?: boolean | null
          email_weekly_summary?: boolean | null
          id?: string
          min_priority_for_push?: string | null
          mute_all_until?: string | null
          push_bulletins?: boolean | null
          push_chat_mentions?: boolean | null
          push_chat_messages?: boolean | null
          push_enabled?: boolean | null
          push_hot_leads?: boolean | null
          push_lead_activity?: boolean | null
          push_new_leads?: boolean | null
          push_subscription?: Json | null
          push_task_due?: boolean | null
          push_ticket_updates?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          slack_channel?: string | null
          slack_daily_summary?: boolean | null
          slack_enabled?: boolean | null
          slack_hot_leads?: boolean | null
          slack_new_leads?: boolean | null
          slack_webhook_url?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_daily_digest?: boolean | null
          email_enabled?: boolean | null
          email_hot_leads?: boolean | null
          email_new_leads?: boolean | null
          email_task_reminders?: boolean | null
          email_weekly_summary?: boolean | null
          id?: string
          min_priority_for_push?: string | null
          mute_all_until?: string | null
          push_bulletins?: boolean | null
          push_chat_mentions?: boolean | null
          push_chat_messages?: boolean | null
          push_enabled?: boolean | null
          push_hot_leads?: boolean | null
          push_lead_activity?: boolean | null
          push_new_leads?: boolean | null
          push_subscription?: Json | null
          push_task_due?: boolean | null
          push_ticket_updates?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          slack_channel?: string | null
          slack_daily_summary?: boolean | null
          slack_enabled?: boolean | null
          slack_hot_leads?: boolean | null
          slack_new_leads?: boolean | null
          slack_webhook_url?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string
          digest_day: number
          digest_frequency: string
          digest_time: string
          email_compliance_alert: boolean
          email_enabled: boolean
          email_marketing: boolean
          email_new_lead: boolean
          email_new_message: boolean
          email_task_reminder: boolean
          email_weekly_digest: boolean
          id: string
          in_app_desktop: boolean
          in_app_enabled: boolean
          in_app_sound: boolean
          org_id: string
          push_bulletins: boolean | null
          push_chat_mentions: boolean | null
          push_chat_messages: boolean | null
          push_enabled: boolean
          push_new_lead: boolean
          push_new_message: boolean
          push_task_reminder: boolean
          push_ticket_updates: boolean | null
          quiet_hours_enabled: boolean
          quiet_hours_end: string
          quiet_hours_start: string
          quiet_hours_timezone: string | null
          sms_enabled: boolean
          sms_phone_number: string | null
          sms_urgent_only: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          digest_day?: number
          digest_frequency?: string
          digest_time?: string
          email_compliance_alert?: boolean
          email_enabled?: boolean
          email_marketing?: boolean
          email_new_lead?: boolean
          email_new_message?: boolean
          email_task_reminder?: boolean
          email_weekly_digest?: boolean
          id?: string
          in_app_desktop?: boolean
          in_app_enabled?: boolean
          in_app_sound?: boolean
          org_id?: string
          push_bulletins?: boolean | null
          push_chat_mentions?: boolean | null
          push_chat_messages?: boolean | null
          push_enabled?: boolean
          push_new_lead?: boolean
          push_new_message?: boolean
          push_task_reminder?: boolean
          push_ticket_updates?: boolean | null
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          quiet_hours_timezone?: string | null
          sms_enabled?: boolean
          sms_phone_number?: string | null
          sms_urgent_only?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          digest_day?: number
          digest_frequency?: string
          digest_time?: string
          email_compliance_alert?: boolean
          email_enabled?: boolean
          email_marketing?: boolean
          email_new_lead?: boolean
          email_new_message?: boolean
          email_task_reminder?: boolean
          email_weekly_digest?: boolean
          id?: string
          in_app_desktop?: boolean
          in_app_enabled?: boolean
          in_app_sound?: boolean
          org_id?: string
          push_bulletins?: boolean | null
          push_chat_mentions?: boolean | null
          push_chat_messages?: boolean | null
          push_enabled?: boolean
          push_new_lead?: boolean
          push_new_message?: boolean
          push_task_reminder?: boolean
          push_ticket_updates?: boolean | null
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          quiet_hours_timezone?: string | null
          sms_enabled?: boolean
          sms_phone_number?: string | null
          sms_urgent_only?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          activity_id: string | null
          body: string | null
          category: string | null
          channels: Database["public"]["Enums"]["notification_channel"][] | null
          created_at: string | null
          delivered_via:
            | Database["public"]["Enums"]["notification_channel"][]
            | null
          dismissed_at: string | null
          expires_at: string | null
          icon: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          metadata: Json | null
          org_id: string
          priority: Database["public"]["Enums"]["notification_priority"] | null
          read_at: string | null
          scheduled_for: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          activity_id?: string | null
          body?: string | null
          category?: string | null
          channels?:
            | Database["public"]["Enums"]["notification_channel"][]
            | null
          created_at?: string | null
          delivered_via?:
            | Database["public"]["Enums"]["notification_channel"][]
            | null
          dismissed_at?: string | null
          expires_at?: string | null
          icon?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          metadata?: Json | null
          org_id: string
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          read_at?: string | null
          scheduled_for?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          activity_id?: string | null
          body?: string | null
          category?: string | null
          channels?:
            | Database["public"]["Enums"]["notification_channel"][]
            | null
          created_at?: string | null
          delivered_via?:
            | Database["public"]["Enums"]["notification_channel"][]
            | null
          dismissed_at?: string | null
          expires_at?: string | null
          icon?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          metadata?: Json | null
          org_id?: string
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          read_at?: string | null
          scheduled_for?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          advisor_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          org_id: string | null
          status: string | null
          step_id: string
          updated_at: string | null
        }
        Insert: {
          advisor_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          org_id?: string | null
          status?: string | null
          step_id: string
          updated_at?: string | null
        }
        Update: {
          advisor_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          org_id?: string | null
          status?: string | null
          step_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_progress_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisor_training_completion"
            referencedColumns: ["advisor_id"]
          },
          {
            foreignKeyName: "onboarding_progress_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_progress_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "onboarding_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_responses: {
        Row: {
          ages: Json | null
          audience: string | null
          completed_at: string | null
          contact_email: string | null
          contact_opt_in: boolean | null
          contact_phone: string | null
          created_at: string | null
          extras: Json | null
          id: string
          iua_comfort: string | null
          pre_existing_awareness: boolean | null
          priority: string | null
          recommended_plan_alternate: string | null
          recommended_plan_primary: string | null
          session_id: string
          updated_at: string | null
          usage: string | null
          zip_code: string | null
        }
        Insert: {
          ages?: Json | null
          audience?: string | null
          completed_at?: string | null
          contact_email?: string | null
          contact_opt_in?: boolean | null
          contact_phone?: string | null
          created_at?: string | null
          extras?: Json | null
          id?: string
          iua_comfort?: string | null
          pre_existing_awareness?: boolean | null
          priority?: string | null
          recommended_plan_alternate?: string | null
          recommended_plan_primary?: string | null
          session_id?: string
          updated_at?: string | null
          usage?: string | null
          zip_code?: string | null
        }
        Update: {
          ages?: Json | null
          audience?: string | null
          completed_at?: string | null
          contact_email?: string | null
          contact_opt_in?: boolean | null
          contact_phone?: string | null
          created_at?: string | null
          extras?: Json | null
          id?: string
          iua_comfort?: string | null
          pre_existing_awareness?: boolean | null
          priority?: string | null
          recommended_plan_alternate?: string | null
          recommended_plan_primary?: string | null
          session_id?: string
          updated_at?: string | null
          usage?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      onboarding_steps: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          org_id: string | null
          required_forms: string[] | null
          required_modules: string[] | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          org_id?: string | null
          required_forms?: string[] | null
          required_modules?: string[] | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          org_id?: string | null
          required_forms?: string[] | null
          required_modules?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_steps_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_feature_overrides: {
        Row: {
          created_at: string
          enabled: boolean
          feature_id: string
          id: string
          org_id: string
          reason: string | null
          set_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled: boolean
          feature_id: string
          id?: string
          org_id: string
          reason?: string | null
          set_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          feature_id?: string
          id?: string
          org_id?: string
          reason?: string | null
          set_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_feature_overrides_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "feature_flags"
            referencedColumns: ["id"]
          },
        ]
      }
      org_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          org_id: string
          role: string
          status: string | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          org_id: string
          role: string
          status?: string | null
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          org_id?: string
          role?: string
          status?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_memberships: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          org_id: string
          role: string
          status: string
          suspended_at: string | null
          suspended_reason: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          org_id: string
          role?: string
          status?: string
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          org_id?: string
          role?: string
          status?: string
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_memberships_user_id_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_module_licenses: {
        Row: {
          activated_at: string
          canceled_at: string | null
          created_at: string
          custom_limits: Json | null
          expires_at: string | null
          granted_by: string | null
          id: string
          license_source: string
          module_id: string
          notes: string | null
          org_id: string
          status: string
          stripe_subscription_item_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string
          canceled_at?: string | null
          created_at?: string
          custom_limits?: Json | null
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          license_source?: string
          module_id: string
          notes?: string | null
          org_id: string
          status?: string
          stripe_subscription_item_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string
          canceled_at?: string | null
          created_at?: string
          custom_limits?: Json | null
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          license_source?: string
          module_id?: string
          notes?: string | null
          org_id?: string
          status?: string
          stripe_subscription_item_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_module_licenses_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "product_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          brand_config: Json | null
          created_at: string | null
          id: string
          logo_url: string | null
          max_contacts: number | null
          max_sequences: number | null
          max_users: number | null
          metadata: Json | null
          name: string
          settings: Json | null
          slug: string
          subscription_status: string | null
          subscription_tier: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          brand_config?: Json | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          max_contacts?: number | null
          max_sequences?: number | null
          max_users?: number | null
          metadata?: Json | null
          name: string
          settings?: Json | null
          slug: string
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_config?: Json | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          max_contacts?: number | null
          max_sequences?: number | null
          max_users?: number | null
          metadata?: Json | null
          name?: string
          settings?: Json | null
          slug?: string
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      orgs: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string
          logo_url: string | null
          name: string
          settings: Json | null
          slug: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json | null
          slug: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json | null
          slug?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      outlook_config: {
        Row: {
          access_token: string | null
          client_id: string
          client_secret: string
          created_at: string | null
          id: string
          is_active: boolean | null
          refresh_token: string | null
          tenant_id: string
          token_expires_at: string | null
          updated_at: string | null
          user_email: string | null
        }
        Insert: {
          access_token?: string | null
          client_id: string
          client_secret: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          refresh_token?: string | null
          tenant_id: string
          token_expires_at?: string | null
          updated_at?: string | null
          user_email?: string | null
        }
        Update: {
          access_token?: string | null
          client_id?: string
          client_secret?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          refresh_token?: string | null
          tenant_id?: string
          token_expires_at?: string | null
          updated_at?: string | null
          user_email?: string | null
        }
        Relationships: []
      }
      page_performance: {
        Row: {
          avg_scroll_depth: number | null
          avg_time_on_page: number | null
          bounce_rate: number | null
          created_at: string | null
          cta_clicks: number | null
          date: string
          entry_count: number | null
          exit_count: number | null
          form_submissions: number | null
          id: string
          page_path: string
          page_title: string | null
          unique_views: number | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          avg_scroll_depth?: number | null
          avg_time_on_page?: number | null
          bounce_rate?: number | null
          created_at?: string | null
          cta_clicks?: number | null
          date: string
          entry_count?: number | null
          exit_count?: number | null
          form_submissions?: number | null
          id?: string
          page_path: string
          page_title?: string | null
          unique_views?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          avg_scroll_depth?: number | null
          avg_time_on_page?: number | null
          bounce_rate?: number | null
          created_at?: string | null
          cta_clicks?: number | null
          date?: string
          entry_count?: number | null
          exit_count?: number | null
          form_submissions?: number | null
          id?: string
          page_path?: string
          page_title?: string | null
          unique_views?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          country: string | null
          created_at: string | null
          device_type: string | null
          id: string
          is_entry: boolean | null
          is_exit: boolean | null
          path: string
          referrer: string | null
          scroll_depth: number | null
          session_id: string
          time_on_page: number | null
          title: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          is_entry?: boolean | null
          is_exit?: boolean | null
          path: string
          referrer?: string | null
          scroll_depth?: number | null
          session_id: string
          time_on_page?: number | null
          title?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          is_entry?: boolean | null
          is_exit?: boolean | null
          path?: string
          referrer?: string | null
          scroll_depth?: number | null
          session_id?: string
          time_on_page?: number | null
          title?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      password_history: {
        Row: {
          changed_at: string
          id: string
          password_hash: string
          user_id: string
        }
        Insert: {
          changed_at?: string
          id?: string
          password_hash: string
          user_id: string
        }
        Update: {
          changed_at?: string
          id?: string
          password_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_last_four: string | null
          bank_name: string | null
          billing_address: string | null
          billing_name: string
          billing_zip: string | null
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last_four: string | null
          created_at: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          member_id: string
          payment_token: string | null
          payment_type: string
          updated_at: string
        }
        Insert: {
          account_last_four?: string | null
          bank_name?: string | null
          billing_address?: string | null
          billing_name: string
          billing_zip?: string | null
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last_four?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          member_id: string
          payment_token?: string | null
          payment_type: string
          updated_at?: string
        }
        Update: {
          account_last_four?: string | null
          bank_name?: string | null
          billing_address?: string | null
          billing_name?: string
          billing_zip?: string | null
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last_four?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          member_id?: string
          payment_token?: string | null
          payment_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_processors: {
        Row: {
          config: Json | null
          created_at: string | null
          created_by: string | null
          fee_structure: Json | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          last_transaction_at: string | null
          name: string
          org_id: string | null
          provider: string
          supported_methods: Json | null
          total_processed: number | null
          updated_at: string | null
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          fee_structure?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_transaction_at?: string | null
          name: string
          org_id?: string | null
          provider: string
          supported_methods?: Json | null
          total_processed?: number | null
          updated_at?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          fee_structure?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_transaction_at?: string | null
          name?: string
          org_id?: string | null
          provider?: string
          supported_methods?: Json | null
          total_processed?: number | null
          updated_at?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_processors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_goals: {
        Row: {
          created_at: string | null
          current_value: number | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          metric_type: string
          org_id: string | null
          start_date: string | null
          target_value: number
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          metric_type: string
          org_id?: string | null
          start_date?: string | null
          target_value: number
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          metric_type?: string
          org_id?: string | null
          start_date?: string | null
          target_value?: number
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_goals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          key: string
          module: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          module: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          module?: string
        }
        Relationships: []
      }
      phi_access_log: {
        Row: {
          accessed_at: string
          id: string
          ip_address: string | null
          justification: string | null
          operation: string
          phi_fields: Json
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          accessed_at?: string
          id?: string
          ip_address?: string | null
          justification?: string | null
          operation: string
          phi_fields?: Json
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          accessed_at?: string
          id?: string
          ip_address?: string | null
          justification?: string | null
          operation?: string
          phi_fields?: Json
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      plan_category_features: {
        Row: {
          category_id: string
          created_at: string | null
          feature_text: string
          feature_type: string
          id: string
          order_index: number | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          feature_text: string
          feature_type: string
          id?: string
          order_index?: number | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          feature_text?: string
          feature_type?: string
          id?: string
          order_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_category_features_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "healthcare_plan_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_category_profiles: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          order_index: number | null
          profile_text: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          order_index?: number | null
          profile_text: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          order_index?: number | null
          profile_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_category_profiles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "healthcare_plan_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          category: string
          cost: string | null
          created_at: string | null
          feature_name: string
          feature_value: string | null
          id: string
          notes: string | null
          plan_id: string
          sort_order: number | null
        }
        Insert: {
          category: string
          cost?: string | null
          created_at?: string | null
          feature_name: string
          feature_value?: string | null
          id?: string
          notes?: string | null
          plan_id: string
          sort_order?: number | null
        }
        Update: {
          category?: string
          cost?: string | null
          created_at?: string | null
          feature_name?: string
          feature_value?: string | null
          id?: string
          notes?: string | null
          plan_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_pricing: {
        Row: {
          age_max: number | null
          age_min: number | null
          created_at: string | null
          effective_date: string
          id: string
          iua_amount: number | null
          member_type: string
          monthly_contribution: number | null
          plan_id: string
        }
        Insert: {
          age_max?: number | null
          age_min?: number | null
          created_at?: string | null
          effective_date: string
          id?: string
          iua_amount?: number | null
          member_type: string
          monthly_contribution?: number | null
          plan_id: string
        }
        Update: {
          age_max?: number | null
          age_min?: number | null
          created_at?: string | null
          effective_date?: string
          id?: string
          iua_amount?: number | null
          member_type?: string
          monthly_contribution?: number | null
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_pricing_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_selections: {
        Row: {
          action: string
          created_at: string | null
          id: string
          plan_type: string
          referrer: string | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          plan_type: string
          referrer?: string | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          plan_type?: string
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      plan_sharing_details: {
        Row: {
          created_at: string | null
          has_annual_cap: boolean | null
          has_international_coverage: boolean | null
          has_lifetime_cap: boolean | null
          id: string
          iua_options: Json | null
          maternity_waiting_months: number | null
          plan_id: string
          preexisting_lookback_months: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          has_annual_cap?: boolean | null
          has_international_coverage?: boolean | null
          has_lifetime_cap?: boolean | null
          id?: string
          iua_options?: Json | null
          maternity_waiting_months?: number | null
          plan_id: string
          preexisting_lookback_months?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          has_annual_cap?: boolean | null
          has_international_coverage?: boolean | null
          has_lifetime_cap?: boolean | null
          id?: string
          iua_options?: Json | null
          maternity_waiting_months?: number | null
          plan_id?: string
          preexisting_lookback_months?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_sharing_details_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: true
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          annual_membership_fee: number | null
          code: string | null
          cost_basis: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          enroll_url: string | null
          enrollment_fee: number | null
          external_product_id: string | null
          id: string
          is_active: boolean | null
          is_hsa_compatible: boolean | null
          is_mec_compliant: boolean | null
          is_medical_cost_sharing: boolean | null
          name: string
          plan_type: string
          slug: string
          sort_order: number | null
          tagline: string | null
          target_audience: string | null
          tobacco_surcharge_pct: number | null
          updated_at: string | null
        }
        Insert: {
          annual_membership_fee?: number | null
          code?: string | null
          cost_basis?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          enroll_url?: string | null
          enrollment_fee?: number | null
          external_product_id?: string | null
          id?: string
          is_active?: boolean | null
          is_hsa_compatible?: boolean | null
          is_mec_compliant?: boolean | null
          is_medical_cost_sharing?: boolean | null
          name: string
          plan_type: string
          slug: string
          sort_order?: number | null
          tagline?: string | null
          target_audience?: string | null
          tobacco_surcharge_pct?: number | null
          updated_at?: string | null
        }
        Update: {
          annual_membership_fee?: number | null
          code?: string | null
          cost_basis?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          enroll_url?: string | null
          enrollment_fee?: number | null
          external_product_id?: string | null
          id?: string
          is_active?: boolean | null
          is_hsa_compatible?: boolean | null
          is_mec_compliant?: boolean | null
          is_medical_cost_sharing?: boolean | null
          name?: string
          plan_type?: string
          slug?: string
          sort_order?: number | null
          tagline?: string | null
          target_audience?: string | null
          tobacco_surcharge_pct?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          created_at: string
          dosage: string
          expiration_date: string | null
          filled_date: string | null
          id: string
          instructions: string | null
          is_controlled: boolean | null
          medication_name: string
          member_id: string
          pharmacy_id: string | null
          prescribed_date: string
          prescribing_provider: string
          prescription_number: string | null
          provider_id: string | null
          quantity: number
          refills_remaining: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dosage: string
          expiration_date?: string | null
          filled_date?: string | null
          id?: string
          instructions?: string | null
          is_controlled?: boolean | null
          medication_name: string
          member_id: string
          pharmacy_id?: string | null
          prescribed_date: string
          prescribing_provider: string
          prescription_number?: string | null
          provider_id?: string | null
          quantity: number
          refills_remaining?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dosage?: string
          expiration_date?: string | null
          filled_date?: string | null
          id?: string
          instructions?: string | null
          is_controlled?: boolean | null
          medication_name?: string
          member_id?: string
          pharmacy_id?: string | null
          prescribed_date?: string
          prescribing_provider?: string
          prescription_number?: string | null
          provider_id?: string | null
          quantity?: number
          refills_remaining?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      priority_items: {
        Row: {
          completed_at: string | null
          completed_reason: string | null
          contact_id: string | null
          created_at: string | null
          id: string
          lane_id: string
          last_action_at: string | null
          lead_id: string | null
          next_action_at: string | null
          org_id: string
          owner_user_id: string | null
          rank: number | null
          reason: string | null
          score: number | null
          snooze_reason: string | null
          snoozed_until: string | null
          source: string | null
          source_rule_id: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_reason?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          lane_id: string
          last_action_at?: string | null
          lead_id?: string | null
          next_action_at?: string | null
          org_id: string
          owner_user_id?: string | null
          rank?: number | null
          reason?: string | null
          score?: number | null
          snooze_reason?: string | null
          snoozed_until?: string | null
          source?: string | null
          source_rule_id?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_reason?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          lane_id?: string
          last_action_at?: string | null
          lead_id?: string | null
          next_action_at?: string | null
          org_id?: string
          owner_user_id?: string | null
          rank?: number | null
          reason?: string | null
          score?: number | null
          snooze_reason?: string | null
          snoozed_until?: string | null
          source?: string | null
          source_rule_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "priority_items_lane_id_fkey"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "priority_lanes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "priority_items_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "priority_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      priority_lanes: {
        Row: {
          auto_rules: Json | null
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          max_items: number | null
          name: string
          order_index: number | null
          org_id: string
          updated_at: string | null
        }
        Insert: {
          auto_rules?: Json | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_items?: number | null
          name: string
          order_index?: number | null
          org_id: string
          updated_at?: string | null
        }
        Update: {
          auto_rules?: Json | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_items?: number | null
          name?: string
          order_index?: number | null
          org_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "priority_lanes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_modules: {
        Row: {
          addon_price_monthly: number | null
          addon_price_yearly: number | null
          category: string
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          included_in_core: boolean
          is_active: boolean
          is_public: boolean
          is_standalone: boolean
          name: string
          requires_modules: string[] | null
          setup_fee: number | null
          slug: string
          sort_order: number
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
          stripe_product_id: string | null
          updated_at: string
        }
        Insert: {
          addon_price_monthly?: number | null
          addon_price_yearly?: number | null
          category: string
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          included_in_core?: boolean
          is_active?: boolean
          is_public?: boolean
          is_standalone?: boolean
          name: string
          requires_modules?: string[] | null
          setup_fee?: number | null
          slug: string
          sort_order?: number
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Update: {
          addon_price_monthly?: number | null
          addon_price_yearly?: number | null
          category?: string
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          included_in_core?: boolean
          is_active?: boolean
          is_public?: boolean
          is_standalone?: boolean
          name?: string
          requires_modules?: string[] | null
          setup_fee?: number | null
          slug?: string
          sort_order?: number
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          department: string | null
          display_name: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          job_title: string | null
          last_name: string | null
          locale: string | null
          mobile_phone: string | null
          phone: string | null
          postal_code: string | null
          role: string
          social_facebook: string | null
          social_github: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_twitter: string | null
          social_website: string | null
          state: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          last_name?: string | null
          locale?: string | null
          mobile_phone?: string | null
          phone?: string | null
          postal_code?: string | null
          role?: string
          social_facebook?: string | null
          social_github?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_website?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          locale?: string | null
          mobile_phone?: string | null
          phone?: string | null
          postal_code?: string | null
          role?: string
          social_facebook?: string | null
          social_github?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_website?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_code_usage: {
        Row: {
          discount_applied: number
          id: string
          member_id: string | null
          order_id: string | null
          promo_code_id: string | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          discount_applied: number
          id?: string
          member_id?: string | null
          order_id?: string | null
          promo_code_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          discount_applied?: number
          id?: string
          member_id?: string | null
          order_id?: string | null
          promo_code_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usage_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          applies_to: Json | null
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          min_purchase_amount: number | null
          name: string
          org_id: string | null
          per_user_limit: number | null
          requires_approval: boolean | null
          stackable: boolean | null
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applies_to?: Json | null
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_purchase_amount?: number | null
          name: string
          org_id?: string | null
          per_user_limit?: number | null
          requires_approval?: boolean | null
          stackable?: boolean | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applies_to?: Json | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_purchase_amount?: number | null
          name?: string
          org_id?: string | null
          per_user_limit?: number | null
          requires_approval?: boolean | null
          stackable?: boolean | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_locations: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          created_at: string
          fax: string | null
          hours_of_operation: Json | null
          id: string
          is_primary: boolean | null
          latitude: number | null
          location_name: string | null
          longitude: number | null
          phone: string | null
          provider_id: string
          state: string
          zip_code: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          created_at?: string
          fax?: string | null
          hours_of_operation?: Json | null
          id?: string
          is_primary?: boolean | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          phone?: string | null
          provider_id: string
          state: string
          zip_code: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          created_at?: string
          fax?: string | null
          hours_of_operation?: Json | null
          id?: string
          is_primary?: boolean | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          phone?: string | null
          provider_id?: string
          state?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_locations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          accepts_new_patients: boolean | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_network: boolean | null
          last_name: string | null
          metadata: Json | null
          npi: string | null
          phone: string | null
          practice_name: string
          provider_type: string
          rating: number | null
          review_count: number | null
          specialties: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          accepts_new_patients?: boolean | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_network?: boolean | null
          last_name?: string | null
          metadata?: Json | null
          npi?: string | null
          phone?: string | null
          practice_name: string
          provider_type: string
          rating?: number | null
          review_count?: number | null
          specialties?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          accepts_new_patients?: boolean | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_network?: boolean | null
          last_name?: string | null
          metadata?: Json | null
          npi?: string | null
          phone?: string | null
          practice_name?: string
          provider_type?: string
          rating?: number | null
          review_count?: number | null
          specialties?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      quick_actions: {
        Row: {
          action_data: Json
          action_type: string
          category: string
          created_at: string
          description: string | null
          display_order: number | null
          icon: string
          id: string
          is_enabled: boolean | null
          name: string
          org_id: string | null
          shortcut: string | null
        }
        Insert: {
          action_data: Json
          action_type: string
          category: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon: string
          id?: string
          is_enabled?: boolean | null
          name: string
          org_id?: string | null
          shortcut?: string | null
        }
        Update: {
          action_data?: Json
          action_type?: string
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string
          id?: string
          is_enabled?: boolean | null
          name?: string
          org_id?: string | null
          shortcut?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quick_actions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_calculator_funnel_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          session_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          session_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          session_id?: string
        }
        Relationships: []
      }
      rate_calculator_views: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          session_id: string
          source_section: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          session_id: string
          source_section?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          session_id?: string
          source_section?: string | null
        }
        Relationships: []
      }
      rate_configuration: {
        Row: {
          age_band: string
          age_max: number
          age_min: number
          created_at: string | null
          effective_date: string
          end_date: string | null
          id: string
          is_active: boolean | null
          monthly_rate: number
          plan_name: string
          tobacco_user: boolean | null
        }
        Insert: {
          age_band: string
          age_max: number
          age_min: number
          created_at?: string | null
          effective_date?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          monthly_rate: number
          plan_name: string
          tobacco_user?: boolean | null
        }
        Update: {
          age_band?: string
          age_max?: number
          age_min?: number
          created_at?: string | null
          effective_date?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          monthly_rate?: number
          plan_name?: string
          tobacco_user?: boolean | null
        }
        Relationships: []
      }
      report_exports: {
        Row: {
          error_message: string | null
          expires_at: string | null
          export_format: string
          exported_at: string | null
          exported_by: string | null
          file_path: string | null
          file_size_bytes: number | null
          filters_used: Json | null
          id: string
          org_id: string | null
          report_name: string
          report_type: string
          row_count: number | null
          saved_report_id: string | null
          status: string | null
        }
        Insert: {
          error_message?: string | null
          expires_at?: string | null
          export_format: string
          exported_at?: string | null
          exported_by?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          filters_used?: Json | null
          id?: string
          org_id?: string | null
          report_name: string
          report_type: string
          row_count?: number | null
          saved_report_id?: string | null
          status?: string | null
        }
        Update: {
          error_message?: string | null
          expires_at?: string | null
          export_format?: string
          exported_at?: string | null
          exported_by?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          filters_used?: Json | null
          id?: string
          org_id?: string | null
          report_name?: string
          report_type?: string
          row_count?: number | null
          saved_report_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_exports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_exports_saved_report_id_fkey"
            columns: ["saved_report_id"]
            isOneToOne: false
            referencedRelation: "saved_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_library: {
        Row: {
          content: string | null
          created_at: string | null
          description: string
          download_count: number | null
          featured_image_url: string | null
          file_url: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          metadata: Json | null
          published_date: string | null
          resource_type: string
          slug: string
          target_audience: string
          title: string
          topics: string[] | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          description: string
          download_count?: number | null
          featured_image_url?: string | null
          file_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          metadata?: Json | null
          published_date?: string | null
          resource_type: string
          slug: string
          target_audience: string
          title: string
          topics?: string[] | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          description?: string
          download_count?: number | null
          featured_image_url?: string | null
          file_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          metadata?: Json | null
          published_date?: string | null
          resource_type?: string
          slug?: string
          target_audience?: string
          title?: string
          topics?: string[] | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      resource_topics: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          granted_by: string | null
          id: string
          org_id: string
          permission_id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          org_id: string
          permission_id: string
          role: string
        }
        Update: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          org_id?: string
          permission_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_reports: {
        Row: {
          chart_config: Json | null
          columns: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          filters: Json | null
          id: string
          is_default: boolean | null
          is_shared: boolean | null
          name: string
          org_id: string | null
          report_type: string
          schedule_config: Json | null
          sort_config: Json | null
          updated_at: string | null
        }
        Insert: {
          chart_config?: Json | null
          columns?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          filters?: Json | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          name: string
          org_id?: string | null
          report_type: string
          schedule_config?: Json | null
          sort_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          chart_config?: Json | null
          columns?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          filters?: Json | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          name?: string
          org_id?: string | null
          report_type?: string
          schedule_config?: Json | null
          sort_config?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_reports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string | null
          filters: Json | null
          id: string
          last_used_at: string | null
          name: string
          org_id: string | null
          search_type: string | null
          updated_at: string | null
          use_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          last_used_at?: string | null
          name: string
          org_id?: string | null
          search_type?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          last_used_at?: string | null
          name?: string
          org_id?: string | null
          search_type?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      scoring_rules: {
        Row: {
          conditions: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          execution_order: number | null
          id: string
          is_active: boolean | null
          lane_assignment: string | null
          last_triggered_at: string | null
          name: string
          notification_message: string | null
          notify_owner: boolean | null
          org_id: string
          priority_boost: boolean | null
          score_delta: number | null
          times_triggered: number | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          execution_order?: number | null
          id?: string
          is_active?: boolean | null
          lane_assignment?: string | null
          last_triggered_at?: string | null
          name: string
          notification_message?: string | null
          notify_owner?: boolean | null
          org_id: string
          priority_boost?: boolean | null
          score_delta?: number | null
          times_triggered?: number | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          execution_order?: number | null
          id?: string
          is_active?: boolean | null
          lane_assignment?: string | null
          last_triggered_at?: string | null
          name?: string
          notification_message?: string | null
          notify_owner?: boolean | null
          org_id?: string
          priority_boost?: boolean | null
          score_delta?: number | null
          times_triggered?: number | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scoring_rules_lane_assignment_fkey"
            columns: ["lane_assignment"]
            isOneToOne: false
            referencedRelation: "priority_lanes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoring_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alert_log: {
        Row: {
          error_message: string | null
          event_severity: string
          event_type: string
          id: string
          response_status: number | null
          sent_at: string
          webhook_id: string
        }
        Insert: {
          error_message?: string | null
          event_severity: string
          event_type: string
          id?: string
          response_status?: number | null
          sent_at?: string
          webhook_id: string
        }
        Update: {
          error_message?: string | null
          event_severity?: string
          event_type?: string
          id?: string
          response_status?: number | null
          sent_at?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_alert_log_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "security_alert_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alert_webhooks: {
        Row: {
          channel_type: string
          created_at: string
          created_by: string | null
          enabled: boolean
          event_types: string[] | null
          headers: Json | null
          id: string
          min_severity: string
          name: string
          updated_at: string
          url: string
        }
        Insert: {
          channel_type?: string
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          event_types?: string[] | null
          headers?: Json | null
          id?: string
          min_severity?: string
          name: string
          updated_at?: string
          url: string
        }
        Update: {
          channel_type?: string
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          event_types?: string[] | null
          headers?: Json | null
          id?: string
          min_severity?: string
          name?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      seo_backlinks: {
        Row: {
          anchor_text: string | null
          created_at: string | null
          data_source: string | null
          domain_authority: number | null
          first_seen_at: string | null
          id: string
          is_active: boolean | null
          last_checked_at: string | null
          link_type: string | null
          page_authority: number | null
          site_url: string
          source_domain: string
          source_url: string
          spam_score: number | null
          status: string | null
          target_url: string
          updated_at: string | null
        }
        Insert: {
          anchor_text?: string | null
          created_at?: string | null
          data_source?: string | null
          domain_authority?: number | null
          first_seen_at?: string | null
          id?: string
          is_active?: boolean | null
          last_checked_at?: string | null
          link_type?: string | null
          page_authority?: number | null
          site_url: string
          source_domain: string
          source_url: string
          spam_score?: number | null
          status?: string | null
          target_url: string
          updated_at?: string | null
        }
        Update: {
          anchor_text?: string | null
          created_at?: string | null
          data_source?: string | null
          domain_authority?: number | null
          first_seen_at?: string | null
          id?: string
          is_active?: boolean | null
          last_checked_at?: string | null
          link_type?: string | null
          page_authority?: number | null
          site_url?: string
          source_domain?: string
          source_url?: string
          spam_score?: number | null
          status?: string | null
          target_url?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      seo_daily_summary: {
        Row: {
          avg_ctr: number | null
          avg_position: number | null
          created_at: string | null
          date: string
          id: string
          keywords_declined: number | null
          keywords_improved: number | null
          keywords_in_top_10: number | null
          keywords_in_top_20: number | null
          keywords_in_top_3: number | null
          site_url: string
          top_keywords: Json | null
          top_pages: Json | null
          total_clicks: number | null
          total_impressions: number | null
          total_keywords: number | null
          updated_at: string | null
        }
        Insert: {
          avg_ctr?: number | null
          avg_position?: number | null
          created_at?: string | null
          date: string
          id?: string
          keywords_declined?: number | null
          keywords_improved?: number | null
          keywords_in_top_10?: number | null
          keywords_in_top_20?: number | null
          keywords_in_top_3?: number | null
          site_url: string
          top_keywords?: Json | null
          top_pages?: Json | null
          total_clicks?: number | null
          total_impressions?: number | null
          total_keywords?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_ctr?: number | null
          avg_position?: number | null
          created_at?: string | null
          date?: string
          id?: string
          keywords_declined?: number | null
          keywords_improved?: number | null
          keywords_in_top_10?: number | null
          keywords_in_top_20?: number | null
          keywords_in_top_3?: number | null
          site_url?: string
          top_keywords?: Json | null
          top_pages?: Json | null
          total_clicks?: number | null
          total_impressions?: number | null
          total_keywords?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      seo_google_credentials: {
        Row: {
          access_token: string
          created_at: string | null
          created_by: string | null
          expires_at: string
          id: string
          is_connected: boolean | null
          last_sync_at: string | null
          refresh_token: string
          scope: string | null
          site_name: string | null
          site_url: string
          sync_error: string | null
          sync_status: string | null
          token_type: string | null
          updated_at: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          created_by?: string | null
          expires_at: string
          id?: string
          is_connected?: boolean | null
          last_sync_at?: string | null
          refresh_token: string
          scope?: string | null
          site_name?: string | null
          site_url: string
          sync_error?: string | null
          sync_status?: string | null
          token_type?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string
          id?: string
          is_connected?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string
          scope?: string | null
          site_name?: string | null
          site_url?: string
          sync_error?: string | null
          sync_status?: string | null
          token_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      seo_keyword_rankings: {
        Row: {
          clicks: number | null
          created_at: string | null
          date: string
          days_in_trend: number | null
          id: string
          impressions: number | null
          keyword: string
          position: number
          position_change: number | null
          previous_position: number | null
          site_url: string
          trend: string | null
        }
        Insert: {
          clicks?: number | null
          created_at?: string | null
          date: string
          days_in_trend?: number | null
          id?: string
          impressions?: number | null
          keyword: string
          position: number
          position_change?: number | null
          previous_position?: number | null
          site_url: string
          trend?: string | null
        }
        Update: {
          clicks?: number | null
          created_at?: string | null
          date?: string
          days_in_trend?: number | null
          id?: string
          impressions?: number | null
          keyword?: string
          position?: number
          position_change?: number | null
          previous_position?: number | null
          site_url?: string
          trend?: string | null
        }
        Relationships: []
      }
      seo_keywords: {
        Row: {
          clicks: number | null
          country: string | null
          created_at: string | null
          ctr: number | null
          date: string
          device: string | null
          id: string
          impressions: number | null
          keyword: string
          page_url: string | null
          position: number | null
          site_url: string
        }
        Insert: {
          clicks?: number | null
          country?: string | null
          created_at?: string | null
          ctr?: number | null
          date: string
          device?: string | null
          id?: string
          impressions?: number | null
          keyword: string
          page_url?: string | null
          position?: number | null
          site_url: string
        }
        Update: {
          clicks?: number | null
          country?: string | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          device?: string | null
          id?: string
          impressions?: number | null
          keyword?: string
          page_url?: string | null
          position?: number | null
          site_url?: string
        }
        Relationships: []
      }
      seo_metadata: {
        Row: {
          canonical_url: string | null
          change_frequency: string | null
          crawl_status: string | null
          created_at: string | null
          id: string
          last_crawled: string | null
          meta_description: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          og_description: string | null
          og_image: string | null
          og_title: string | null
          og_type: string | null
          page_path: string
          priority: number | null
          robots: string | null
          structured_data: Json | null
          twitter_card: string | null
          twitter_description: string | null
          twitter_image: string | null
          twitter_title: string | null
          updated_at: string | null
        }
        Insert: {
          canonical_url?: string | null
          change_frequency?: string | null
          crawl_status?: string | null
          created_at?: string | null
          id?: string
          last_crawled?: string | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          og_type?: string | null
          page_path: string
          priority?: number | null
          robots?: string | null
          structured_data?: Json | null
          twitter_card?: string | null
          twitter_description?: string | null
          twitter_image?: string | null
          twitter_title?: string | null
          updated_at?: string | null
        }
        Update: {
          canonical_url?: string | null
          change_frequency?: string | null
          crawl_status?: string | null
          created_at?: string | null
          id?: string
          last_crawled?: string | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          og_type?: string | null
          page_path?: string
          priority?: number | null
          robots?: string | null
          structured_data?: Json | null
          twitter_card?: string | null
          twitter_description?: string | null
          twitter_image?: string | null
          twitter_title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      seo_pages: {
        Row: {
          avg_position: number | null
          clicks: number | null
          created_at: string | null
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          keyword_count: number | null
          page_title: string | null
          page_url: string
          site_url: string
        }
        Insert: {
          avg_position?: number | null
          clicks?: number | null
          created_at?: string | null
          ctr?: number | null
          date: string
          id?: string
          impressions?: number | null
          keyword_count?: number | null
          page_title?: string | null
          page_url: string
          site_url: string
        }
        Update: {
          avg_position?: number | null
          clicks?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          keyword_count?: number | null
          page_title?: string | null
          page_url?: string
          site_url?: string
        }
        Relationships: []
      }
      seo_sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          date_from: string | null
          date_to: string | null
          duration_ms: number | null
          error_details: Json | null
          error_message: string | null
          id: string
          records_fetched: number | null
          records_inserted: number | null
          records_updated: number | null
          site_url: string
          started_at: string | null
          status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          date_from?: string | null
          date_to?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          records_fetched?: number | null
          records_inserted?: number | null
          records_updated?: number | null
          site_url: string
          started_at?: string | null
          status: string
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          date_from?: string | null
          date_to?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          records_fetched?: number | null
          records_inserted?: number | null
          records_updated?: number | null
          site_url?: string
          started_at?: string | null
          status?: string
          sync_type?: string
        }
        Relationships: []
      }
      sequence_enrollments: {
        Row: {
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          current_step: number | null
          enrolled_at: string | null
          enrolled_by: string | null
          exit_reason: string | null
          id: string
          lead_id: string | null
          messages_clicked: number | null
          messages_opened: number | null
          messages_sent: number | null
          next_step_at: string | null
          org_id: string
          sequence_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          current_step?: number | null
          enrolled_at?: string | null
          enrolled_by?: string | null
          exit_reason?: string | null
          id?: string
          lead_id?: string | null
          messages_clicked?: number | null
          messages_opened?: number | null
          messages_sent?: number | null
          next_step_at?: string | null
          org_id: string
          sequence_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          current_step?: number | null
          enrolled_at?: string | null
          enrolled_by?: string | null
          exit_reason?: string | null
          id?: string
          lead_id?: string | null
          messages_clicked?: number | null
          messages_opened?: number | null
          messages_sent?: number | null
          next_step_at?: string | null
          org_id?: string
          sequence_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sequence_enrollments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "_deprecated_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_enrollments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      sequence_steps: {
        Row: {
          action_config: Json | null
          action_type: string
          body_html: string | null
          body_text: string | null
          channel: string | null
          condition_type: string | null
          created_at: string | null
          delay_days: number | null
          delay_hours: number | null
          delay_minutes: number | null
          id: string
          is_active: boolean | null
          sequence_id: string
          step_number: number
          subject: string | null
          template_id: string | null
          times_executed: number | null
          times_skipped: number | null
          updated_at: string | null
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          body_html?: string | null
          body_text?: string | null
          channel?: string | null
          condition_type?: string | null
          created_at?: string | null
          delay_days?: number | null
          delay_hours?: number | null
          delay_minutes?: number | null
          id?: string
          is_active?: boolean | null
          sequence_id: string
          step_number: number
          subject?: string | null
          template_id?: string | null
          times_executed?: number | null
          times_skipped?: number | null
          updated_at?: string | null
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          body_html?: string | null
          body_text?: string | null
          channel?: string | null
          condition_type?: string | null
          created_at?: string | null
          delay_days?: number | null
          delay_hours?: number | null
          delay_minutes?: number | null
          id?: string
          is_active?: boolean | null
          sequence_id?: string
          step_number?: number
          subject?: string | null
          template_id?: string | null
          times_executed?: number | null
          times_skipped?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      sequences: {
        Row: {
          completion_rate: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          enrollment_count: number | null
          exit_on_meeting_scheduled: boolean | null
          exit_on_reply: boolean | null
          exit_on_unsubscribe: boolean | null
          id: string
          name: string
          org_id: string
          send_days: string[] | null
          send_window_end: string | null
          send_window_start: string | null
          status: string | null
          steps: Json | null
          timezone: string | null
          total_completed: number | null
          total_enrolled: number | null
          total_replied: number | null
          trigger_conditions: Json | null
          trigger_type: string | null
          updated_at: string | null
        }
        Insert: {
          completion_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enrollment_count?: number | null
          exit_on_meeting_scheduled?: boolean | null
          exit_on_reply?: boolean | null
          exit_on_unsubscribe?: boolean | null
          id?: string
          name: string
          org_id: string
          send_days?: string[] | null
          send_window_end?: string | null
          send_window_start?: string | null
          status?: string | null
          steps?: Json | null
          timezone?: string | null
          total_completed?: number | null
          total_enrolled?: number | null
          total_replied?: number | null
          trigger_conditions?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
        }
        Update: {
          completion_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enrollment_count?: number | null
          exit_on_meeting_scheduled?: boolean | null
          exit_on_reply?: boolean | null
          exit_on_unsubscribe?: boolean | null
          id?: string
          name?: string
          org_id?: string
          send_days?: string[] | null
          send_window_end?: string | null
          send_window_start?: string | null
          status?: string | null
          steps?: Json | null
          timezone?: string | null
          total_completed?: number | null
          total_enrolled?: number | null
          total_replied?: number | null
          trigger_conditions?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sequences_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      site_analytics: {
        Row: {
          avg_session_duration: number | null
          bounce_rate: number | null
          conversion_rate: number | null
          created_at: string | null
          date: string
          device_breakdown: Json | null
          id: string
          new_visitors: number | null
          page_views: number | null
          returning_visitors: number | null
          top_pages: Json | null
          total_sessions: number | null
          traffic_sources: Json | null
          unique_visitors: number | null
          updated_at: string | null
        }
        Insert: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date: string
          device_breakdown?: Json | null
          id?: string
          new_visitors?: number | null
          page_views?: number | null
          returning_visitors?: number | null
          top_pages?: Json | null
          total_sessions?: number | null
          traffic_sources?: Json | null
          unique_visitors?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date?: string
          device_breakdown?: Json | null
          id?: string
          new_visitors?: number | null
          page_views?: number | null
          returning_visitors?: number | null
          top_pages?: Json | null
          total_sessions?: number | null
          traffic_sources?: Json | null
          unique_visitors?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          category: string
          created_at: string | null
          data_type: string | null
          description: string | null
          id: string
          is_public: boolean | null
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          data_type?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          data_type?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      sms_accounts: {
        Row: {
          config: Json | null
          created_at: string | null
          created_by: string | null
          current_month_sent: number | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          last_message_at: string | null
          monthly_limit: number | null
          name: string
          org_id: string | null
          phone_numbers: Json | null
          provider: string
          total_received: number | null
          total_sent: number | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          current_month_sent?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_message_at?: string | null
          monthly_limit?: number | null
          name: string
          org_id?: string | null
          phone_numbers?: Json | null
          provider: string
          total_received?: number | null
          total_sent?: number | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          current_month_sent?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_message_at?: string | null
          monthly_limit?: number | null
          name?: string
          org_id?: string | null
          phone_numbers?: Json | null
          provider?: string
          total_received?: number | null
          total_sent?: number | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_log: {
        Row: {
          body: string
          cost: number | null
          delivered_at: string | null
          direction: string
          error_message: string | null
          from_number: string
          id: string
          org_id: string | null
          provider_message_id: string | null
          segments: number | null
          sent_at: string | null
          sent_by: string | null
          sms_account_id: string | null
          status: string | null
          template_id: string | null
          to_number: string
        }
        Insert: {
          body: string
          cost?: number | null
          delivered_at?: string | null
          direction: string
          error_message?: string | null
          from_number: string
          id?: string
          org_id?: string | null
          provider_message_id?: string | null
          segments?: number | null
          sent_at?: string | null
          sent_by?: string | null
          sms_account_id?: string | null
          status?: string | null
          template_id?: string | null
          to_number: string
        }
        Update: {
          body?: string
          cost?: number | null
          delivered_at?: string | null
          direction?: string
          error_message?: string | null
          from_number?: string
          id?: string
          org_id?: string | null
          provider_message_id?: string | null
          segments?: number | null
          sent_at?: string | null
          sent_by?: string | null
          sms_account_id?: string | null
          status?: string | null
          template_id?: string | null
          to_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_log_sms_account_id_fkey"
            columns: ["sms_account_id"]
            isOneToOne: false
            referencedRelation: "sms_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_log_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "crm_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          order_index: number | null
          parent_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          order_index?: number | null
          parent_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          order_index?: number | null
          parent_id?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sop_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "sop_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_documents: {
        Row: {
          category: string
          content: string | null
          content_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          file_url: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_published: boolean | null
          metadata: Json | null
          order_index: number | null
          org_id: string | null
          slug: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          version: string | null
          view_count: number | null
        }
        Insert: {
          category: string
          content?: string | null
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_published?: boolean | null
          metadata?: Json | null
          order_index?: number | null
          org_id?: string | null
          slug?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          version?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string
          content?: string | null
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_published?: boolean | null
          metadata?: Json | null
          order_index?: number | null
          org_id?: string | null
          slug?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          version?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sop_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_notes: {
        Row: {
          color: string
          content: string
          created_at: string
          id: string
          pinned: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      staff_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          id: string
          member_id: string
          priority: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          ticket_number: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          member_id: string
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          ticket_number: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          member_id?: string
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_sensitive: boolean | null
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_sensitive?: boolean | null
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_sensitive?: boolean | null
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      tag_firing_rules: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          match_type: string | null
          rule_condition: string
          rule_type: string
          rule_value: string | null
          tag_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          match_type?: string | null
          rule_condition: string
          rule_type: string
          rule_value?: string | null
          tag_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          match_type?: string | null
          rule_condition?: string
          rule_type?: string
          rule_value?: string | null
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tag_firing_rules_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tracking_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          org_id: string
          priority: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          org_id: string
          priority?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          org_id?: string
          priority?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "_deprecated_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      terminal_tool_permissions: {
        Row: {
          allowed_roles: Json | null
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          rate_limit_calls: number | null
          rate_limit_period: string | null
          requires_approval: boolean | null
          tool_name: string
        }
        Insert: {
          allowed_roles?: Json | null
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          rate_limit_calls?: number | null
          rate_limit_period?: string | null
          requires_approval?: boolean | null
          tool_name: string
        }
        Update: {
          allowed_roles?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          rate_limit_calls?: number | null
          rate_limit_period?: string | null
          requires_approval?: boolean | null
          tool_name?: string
        }
        Relationships: []
      }
      ticket_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      tracking_event_log: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_data: Json | null
          event_name: string
          event_type: string
          id: string
          ip_address: unknown
          page_path: string | null
          platform_name: string | null
          referrer: string | null
          session_id: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_name: string
          event_type: string
          id?: string
          ip_address?: unknown
          page_path?: string | null
          platform_name?: string | null
          referrer?: string | null
          session_id?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_name?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          page_path?: string | null
          platform_name?: string | null
          referrer?: string | null
          session_id?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tracking_platforms: {
        Row: {
          config_schema: Json | null
          created_at: string | null
          default_settings: Json | null
          description: string | null
          display_name: string
          documentation_url: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          platform_name: string
          platform_type: string
          requires_consent: boolean | null
          updated_at: string | null
        }
        Insert: {
          config_schema?: Json | null
          created_at?: string | null
          default_settings?: Json | null
          description?: string | null
          display_name: string
          documentation_url?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          platform_name: string
          platform_type: string
          requires_consent?: boolean | null
          updated_at?: string | null
        }
        Update: {
          config_schema?: Json | null
          created_at?: string | null
          default_settings?: Json | null
          description?: string | null
          display_name?: string
          documentation_url?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          platform_name?: string
          platform_type?: string
          requires_consent?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tracking_snippets: {
        Row: {
          configuration: Json | null
          created_at: string | null
          created_by: string | null
          custom_parameters: Json | null
          id: string
          injection_point: string | null
          is_enabled: boolean | null
          is_test_mode: boolean | null
          load_priority: number | null
          platform_id: string | null
          snippet_code: string | null
          snippet_name: string
          snippet_type: string | null
          tracking_id: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          configuration?: Json | null
          created_at?: string | null
          created_by?: string | null
          custom_parameters?: Json | null
          id?: string
          injection_point?: string | null
          is_enabled?: boolean | null
          is_test_mode?: boolean | null
          load_priority?: number | null
          platform_id?: string | null
          snippet_code?: string | null
          snippet_name: string
          snippet_type?: string | null
          tracking_id?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          configuration?: Json | null
          created_at?: string | null
          created_by?: string | null
          custom_parameters?: Json | null
          id?: string
          injection_point?: string | null
          is_enabled?: boolean | null
          is_test_mode?: boolean | null
          load_priority?: number | null
          platform_id?: string | null
          snippet_code?: string | null
          snippet_name?: string
          snippet_type?: string | null
          tracking_id?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_snippets_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "tracking_platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_tags: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          fire_on_page_load: boolean | null
          fire_priority: number | null
          id: string
          is_active: boolean | null
          snippet_id: string | null
          tag_category: string
          tag_name: string
          tag_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fire_on_page_load?: boolean | null
          fire_priority?: number | null
          id?: string
          is_active?: boolean | null
          snippet_id?: string | null
          tag_category: string
          tag_name: string
          tag_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fire_on_page_load?: boolean | null
          fire_priority?: number | null
          id?: string
          is_active?: boolean | null
          snippet_id?: string | null
          tag_category?: string
          tag_name?: string
          tag_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_tags_snippet_id_fkey"
            columns: ["snippet_id"]
            isOneToOne: false
            referencedRelation: "tracking_snippets"
            referencedColumns: ["id"]
          },
        ]
      }
      traffic_sources: {
        Row: {
          avg_session_duration: number | null
          bounce_rate: number | null
          created_at: string | null
          date: string
          id: string
          page_views: number | null
          sessions: number | null
          source_medium: string | null
          source_name: string | null
          source_type: string
          users: number | null
        }
        Insert: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          created_at?: string | null
          date: string
          id?: string
          page_views?: number | null
          sessions?: number | null
          source_medium?: string | null
          source_name?: string | null
          source_type: string
          users?: number | null
        }
        Update: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          created_at?: string | null
          date?: string
          id?: string
          page_views?: number | null
          sessions?: number | null
          source_medium?: string | null
          source_name?: string | null
          source_type?: string
          users?: number | null
        }
        Relationships: []
      }
      training_modules: {
        Row: {
          category: string
          content_html: string | null
          content_type: string
          content_url: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          external_course_name: string | null
          external_lms_course_id: string | null
          external_lms_lesson_id: string | null
          external_lms_url: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          lms_provider: string | null
          order_index: number | null
          org_id: string | null
          prerequisites: string[] | null
          requires_external_completion: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content_html?: string | null
          content_type: string
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          external_course_name?: string | null
          external_lms_course_id?: string | null
          external_lms_lesson_id?: string | null
          external_lms_url?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          lms_provider?: string | null
          order_index?: number | null
          org_id?: string | null
          prerequisites?: string[] | null
          requires_external_completion?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content_html?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          external_course_name?: string | null
          external_lms_course_id?: string | null
          external_lms_lesson_id?: string | null
          external_lms_url?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          lms_provider?: string | null
          order_index?: number | null
          org_id?: string | null
          prerequisites?: string[] | null
          requires_external_completion?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_modules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      training_progress: {
        Row: {
          advisor_id: string
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          id: string
          module_id: string
          notes: string | null
          org_id: string | null
          quiz_score: number | null
          started_at: string | null
          status: string | null
          time_spent_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          advisor_id: string
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          module_id: string
          notes?: string | null
          org_id?: string | null
          quiz_score?: number | null
          started_at?: string | null
          status?: string | null
          time_spent_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          advisor_id?: string
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          module_id?: string
          notes?: string | null
          org_id?: string | null
          quiz_score?: number | null
          started_at?: string | null
          status?: string | null
          time_spent_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_progress_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_progress_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisor_training_completion"
            referencedColumns: ["advisor_id"]
          },
          {
            foreignKeyName: "training_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_progress_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          claim_id: string | null
          created_at: string
          description: string | null
          id: string
          invoice_id: string | null
          member_id: string
          metadata: Json | null
          payment_gateway_id: string | null
          payment_method_id: string | null
          processed_date: string | null
          receipt_url: string | null
          status: string | null
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          claim_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          member_id: string
          metadata?: Json | null
          payment_gateway_id?: string | null
          payment_method_id?: string | null
          processed_date?: string | null
          receipt_url?: string | null
          status?: string | null
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          claim_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          member_id?: string
          metadata?: Json | null
          payment_gateway_id?: string | null
          payment_method_id?: string | null
          processed_date?: string | null
          receipt_url?: string | null
          status?: string | null
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          achievement_name: string
          achievement_tier: string | null
          created_at: string
          earned_at: string | null
          id: string
          is_earned: boolean | null
          metadata: Json | null
          org_id: string
          progress: number | null
          target: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          achievement_name: string
          achievement_tier?: string | null
          created_at?: string
          earned_at?: string | null
          id?: string
          is_earned?: boolean | null
          metadata?: Json | null
          org_id: string
          progress?: number | null
          target?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          achievement_name?: string
          achievement_tier?: string | null
          created_at?: string
          earned_at?: string | null
          id?: string
          is_earned?: boolean | null
          metadata?: Json | null
          org_id?: string
          progress?: number | null
          target?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mfa_settings: {
        Row: {
          backup_codes: Json
          created_at: string
          enrolled_at: string | null
          id: string
          last_verified_at: string | null
          mfa_enabled: boolean
          mfa_method: string
          phone_number: string | null
          trusted_devices: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: Json
          created_at?: string
          enrolled_at?: string | null
          id?: string
          last_verified_at?: string | null
          mfa_enabled?: boolean
          mfa_method?: string
          phone_number?: string | null
          trusted_devices?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: Json
          created_at?: string
          enrolled_at?: string | null
          id?: string
          last_verified_at?: string | null
          mfa_enabled?: boolean
          mfa_method?: string
          phone_number?: string | null
          trusted_devices?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_navigation_preferences: {
        Row: {
          created_at: string | null
          custom_order: Json | null
          favorite_links: Json | null
          id: string
          recent_pages: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_order?: Json | null
          favorite_links?: Json | null
          id?: string
          recent_pages?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_order?: Json | null
          favorite_links?: Json | null
          id?: string
          recent_pages?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          auto_advance_after_complete: boolean | null
          compact_mode: boolean | null
          created_at: string
          dashboard_layout: Json | null
          default_lane_id: string | null
          id: string
          inbox_group_by: string | null
          inbox_preview_lines: number | null
          inbox_sort_order: string | null
          keyboard_shortcuts_enabled: boolean | null
          language: string | null
          org_id: string
          pinned_items: Json | null
          power_list_view: string | null
          sidebar_collapsed: boolean | null
          theme: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_advance_after_complete?: boolean | null
          compact_mode?: boolean | null
          created_at?: string
          dashboard_layout?: Json | null
          default_lane_id?: string | null
          id?: string
          inbox_group_by?: string | null
          inbox_preview_lines?: number | null
          inbox_sort_order?: string | null
          keyboard_shortcuts_enabled?: boolean | null
          language?: string | null
          org_id: string
          pinned_items?: Json | null
          power_list_view?: string | null
          sidebar_collapsed?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_advance_after_complete?: boolean | null
          compact_mode?: boolean | null
          created_at?: string
          dashboard_layout?: Json | null
          default_lane_id?: string | null
          id?: string
          inbox_group_by?: string | null
          inbox_preview_lines?: number | null
          inbox_sort_order?: string | null
          keyboard_shortcuts_enabled?: boolean | null
          language?: string | null
          org_id?: string
          pinned_items?: Json | null
          power_list_view?: string | null
          sidebar_collapsed?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          current_page: string | null
          id: string
          ip_address: unknown
          last_activity_at: string | null
          org_id: string | null
          session_started_at: string | null
          status: string | null
          user_agent: string | null
          user_id: string | null
          viewing_entity_id: string | null
          viewing_entity_type: string | null
        }
        Insert: {
          current_page?: string | null
          id?: string
          ip_address?: unknown
          last_activity_at?: string | null
          org_id?: string | null
          session_started_at?: string | null
          status?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewing_entity_id?: string | null
          viewing_entity_type?: string | null
        }
        Update: {
          current_page?: string | null
          id?: string
          ip_address?: unknown
          last_activity_at?: string | null
          org_id?: string | null
          session_started_at?: string | null
          status?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewing_entity_id?: string | null
          viewing_entity_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          granted_by: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          expires_at: string
          id: string
          ip_address: string | null
          last_activity: string
          revoked: boolean
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          last_activity?: string
          revoked?: boolean
          session_token?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          last_activity?: string
          revoked?: boolean
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      utm_campaigns: {
        Row: {
          campaign_budget: number | null
          campaign_end_date: string | null
          campaign_name: string
          campaign_start_date: string | null
          campaign_url: string
          click_count: number | null
          conversion_count: number | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          qr_code_url: string | null
          revenue_generated: number | null
          short_url: string | null
          updated_at: string | null
          utm_campaign: string
          utm_content: string | null
          utm_medium: string
          utm_source: string
          utm_term: string | null
        }
        Insert: {
          campaign_budget?: number | null
          campaign_end_date?: string | null
          campaign_name: string
          campaign_start_date?: string | null
          campaign_url: string
          click_count?: number | null
          conversion_count?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          qr_code_url?: string | null
          revenue_generated?: number | null
          short_url?: string | null
          updated_at?: string | null
          utm_campaign: string
          utm_content?: string | null
          utm_medium: string
          utm_source: string
          utm_term?: string | null
        }
        Update: {
          campaign_budget?: number | null
          campaign_end_date?: string | null
          campaign_name?: string
          campaign_start_date?: string | null
          campaign_url?: string
          click_count?: number | null
          conversion_count?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          qr_code_url?: string | null
          revenue_generated?: number | null
          short_url?: string | null
          updated_at?: string | null
          utm_campaign?: string
          utm_content?: string | null
          utm_medium?: string
          utm_source?: string
          utm_term?: string | null
        }
        Relationships: []
      }
      visit_summaries: {
        Row: {
          chief_complaint: string | null
          created_at: string
          diagnosis: string | null
          document_url: string | null
          follow_up_instructions: string | null
          id: string
          medications_prescribed: string[] | null
          member_id: string
          next_appointment_date: string | null
          provider_id: string | null
          provider_name: string
          treatment_plan: string | null
          updated_at: string
          visit_date: string
          visit_type: string
        }
        Insert: {
          chief_complaint?: string | null
          created_at?: string
          diagnosis?: string | null
          document_url?: string | null
          follow_up_instructions?: string | null
          id?: string
          medications_prescribed?: string[] | null
          member_id: string
          next_appointment_date?: string | null
          provider_id?: string | null
          provider_name: string
          treatment_plan?: string | null
          updated_at?: string
          visit_date: string
          visit_type: string
        }
        Update: {
          chief_complaint?: string | null
          created_at?: string
          diagnosis?: string | null
          document_url?: string | null
          follow_up_instructions?: string | null
          id?: string
          medications_prescribed?: string[] | null
          member_id?: string
          next_appointment_date?: string | null
          provider_id?: string | null
          provider_name?: string
          treatment_plan?: string | null
          updated_at?: string
          visit_date?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_summaries_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_delivery_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          retry_count: number | null
          success: boolean | null
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          retry_count?: number | null
          success?: boolean | null
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          retry_count?: number | null
          success?: boolean | null
          webhook_url?: string
        }
        Relationships: []
      }
      white_label_configs: {
        Row: {
          accent_color: string
          app_icon_url: string | null
          app_store_url: string | null
          background_color: string | null
          company_name: string
          created_at: string
          custom_domain: string | null
          custom_email_templates: boolean
          custom_login_page: boolean
          custom_sms_sender_id: string | null
          domain_verified: boolean
          domain_verified_at: string | null
          favicon_url: string | null
          font_family: string | null
          header_color: string | null
          heading_font_family: string | null
          id: string
          is_active: boolean
          last_build_at: string | null
          logo_dark_url: string | null
          logo_url: string | null
          meta_description: string | null
          meta_title: string | null
          mobile_app_name: string | null
          mobile_build_status: string | null
          mobile_bundle_id_android: string | null
          mobile_bundle_id_ios: string | null
          og_image_url: string | null
          org_id: string
          play_store_url: string | null
          primary_color: string
          privacy_url: string | null
          secondary_color: string
          show_powered_by: boolean
          sidebar_color: string | null
          splash_screen_url: string | null
          ssl_certificate_status: string | null
          support_email: string | null
          support_phone: string | null
          support_url: string | null
          terms_url: string | null
          text_color: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string
          app_icon_url?: string | null
          app_store_url?: string | null
          background_color?: string | null
          company_name: string
          created_at?: string
          custom_domain?: string | null
          custom_email_templates?: boolean
          custom_login_page?: boolean
          custom_sms_sender_id?: string | null
          domain_verified?: boolean
          domain_verified_at?: string | null
          favicon_url?: string | null
          font_family?: string | null
          header_color?: string | null
          heading_font_family?: string | null
          id?: string
          is_active?: boolean
          last_build_at?: string | null
          logo_dark_url?: string | null
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          mobile_app_name?: string | null
          mobile_build_status?: string | null
          mobile_bundle_id_android?: string | null
          mobile_bundle_id_ios?: string | null
          og_image_url?: string | null
          org_id: string
          play_store_url?: string | null
          primary_color?: string
          privacy_url?: string | null
          secondary_color?: string
          show_powered_by?: boolean
          sidebar_color?: string | null
          splash_screen_url?: string | null
          ssl_certificate_status?: string | null
          support_email?: string | null
          support_phone?: string | null
          support_url?: string | null
          terms_url?: string | null
          text_color?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string
          app_icon_url?: string | null
          app_store_url?: string | null
          background_color?: string | null
          company_name?: string
          created_at?: string
          custom_domain?: string | null
          custom_email_templates?: boolean
          custom_login_page?: boolean
          custom_sms_sender_id?: string | null
          domain_verified?: boolean
          domain_verified_at?: string | null
          favicon_url?: string | null
          font_family?: string | null
          header_color?: string | null
          heading_font_family?: string | null
          id?: string
          is_active?: boolean
          last_build_at?: string | null
          logo_dark_url?: string | null
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          mobile_app_name?: string | null
          mobile_build_status?: string | null
          mobile_bundle_id_android?: string | null
          mobile_bundle_id_ios?: string | null
          og_image_url?: string | null
          org_id?: string
          play_store_url?: string | null
          primary_color?: string
          privacy_url?: string | null
          secondary_color?: string
          show_powered_by?: boolean
          sidebar_color?: string | null
          splash_screen_url?: string | null
          ssl_certificate_status?: string | null
          support_email?: string | null
          support_phone?: string | null
          support_url?: string | null
          terms_url?: string | null
          text_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      white_label_email_templates: {
        Row: {
          created_at: string
          html_body: string
          id: string
          is_active: boolean
          org_id: string
          subject: string
          template_type: string
          text_body: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          html_body: string
          id?: string
          is_active?: boolean
          org_id: string
          subject: string
          template_type: string
          text_body?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          html_body?: string
          id?: string
          is_active?: boolean
          org_id?: string
          subject?: string
          template_type?: string
          text_body?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      wordpress_courses: {
        Row: {
          category: string | null
          completions_count: number | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          is_password_protected: boolean | null
          language: string | null
          level: string | null
          password: string | null
          password_hint: string | null
          slug: string
          start_timestamp: number | null
          status: string | null
          summary_bullets: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          wp_course_id: number
        }
        Insert: {
          category?: string | null
          completions_count?: number | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_password_protected?: boolean | null
          language?: string | null
          level?: string | null
          password?: string | null
          password_hint?: string | null
          slug: string
          start_timestamp?: number | null
          status?: string | null
          summary_bullets?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          wp_course_id: number
        }
        Update: {
          category?: string | null
          completions_count?: number | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_password_protected?: boolean | null
          language?: string | null
          level?: string | null
          password?: string | null
          password_hint?: string | null
          slug?: string
          start_timestamp?: number | null
          status?: string | null
          summary_bullets?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          wp_course_id?: number
        }
        Relationships: []
      }
      workflow_steps: {
        Row: {
          action_config: Json | null
          action_type: string
          condition_config: Json | null
          condition_type: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          step_order: number
          updated_at: string | null
          workflow_id: string
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          condition_config?: Json | null
          condition_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          step_order: number
          updated_at?: string | null
          workflow_id: string
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          condition_config?: Json | null
          condition_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          step_order?: number
          updated_at?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          org_id: string
          trigger_conditions: Json | null
          trigger_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          org_id: string
          trigger_conditions?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          org_id?: string
          trigger_conditions?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflows_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      zoho_salesiq_errors: {
        Row: {
          created_at: string | null
          error_message: string
          error_type: string
          id: string
          network_details: Json | null
          url: string
          user_agent: string
          widget_code: string
        }
        Insert: {
          created_at?: string | null
          error_message: string
          error_type: string
          id?: string
          network_details?: Json | null
          url: string
          user_agent: string
          widget_code: string
        }
        Update: {
          created_at?: string | null
          error_message?: string
          error_type?: string
          id?: string
          network_details?: Json | null
          url?: string
          user_agent?: string
          widget_code?: string
        }
        Relationships: []
      }
      zoho_salesiq_health_checks: {
        Row: {
          checked_at: string | null
          id: string
          is_loaded: boolean | null
          is_ready: boolean | null
          response_time_ms: number | null
          status: string
        }
        Insert: {
          checked_at?: string | null
          id?: string
          is_loaded?: boolean | null
          is_ready?: boolean | null
          response_time_ms?: number | null
          status: string
        }
        Update: {
          checked_at?: string | null
          id?: string
          is_loaded?: boolean | null
          is_ready?: boolean | null
          response_time_ms?: number | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_sessions: {
        Row: {
          country: string | null
          device_type: string | null
          last_activity: string | null
          page_count: number | null
          session_id: string | null
        }
        Relationships: []
      }
      advisor_training_completion: {
        Row: {
          advisor_id: string | null
          completed_all_modules: number | null
          completed_required_modules: number | null
          email: string | null
          first_name: string | null
          last_name: string | null
          onboarding_completed: boolean | null
          required_completion_pct: number | null
          total_modules: number | null
          total_required_modules: number | null
        }
        Relationships: []
      }
      course_catalog: {
        Row: {
          category: string | null
          completions_count: number | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string | null
          is_password_protected: boolean | null
          language: string | null
          level: string | null
          level_order: number | null
          password_hint: string | null
          slug: string | null
          status: string | null
          summary_bullets: string[] | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          wp_course_id: number | null
        }
        Insert: {
          category?: string | null
          completions_count?: number | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string | null
          is_password_protected?: boolean | null
          language?: string | null
          level?: string | null
          level_order?: never
          password_hint?: string | null
          slug?: string | null
          status?: string | null
          summary_bullets?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          wp_course_id?: number | null
        }
        Update: {
          category?: string | null
          completions_count?: number | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string | null
          is_password_protected?: boolean | null
          language?: string | null
          level?: string | null
          level_order?: never
          password_hint?: string | null
          slug?: string | null
          status?: string | null
          summary_bullets?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          wp_course_id?: number | null
        }
        Relationships: []
      }
      crm_deal_stage_metrics: {
        Row: {
          avg_days_in_stage: number | null
          avg_deal_size: number | null
          is_lost_stage: boolean | null
          is_won_stage: boolean | null
          lost_deals: number | null
          org_id: string | null
          sort_order: number | null
          stage_display_name: string | null
          stage_id: string | null
          stage_name: string | null
          total_deals: number | null
          win_rate: number | null
          won_deals: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_v_application_dropoff: {
        Row: {
          app_in_progress: number | null
          app_to_lost: number | null
          app_to_nurture: number | null
          app_to_won: number | null
          org_id: string | null
          week_starting: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_submissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_v_call_breakdown: {
        Row: {
          cancellation_calls: number | null
          log_date: string | null
          org_id: string | null
          regular_calls: number | null
          total_calls: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_daily_log_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_v_conversion_by_source: {
        Row: {
          lead_source: string | null
          lost: number | null
          nurtured: number | null
          org_id: string | null
          total: number | null
          win_rate_pct: number | null
          won: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_submissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_v_pipeline_movement: {
        Row: {
          advanced_last_7d: number | null
          lost_last_7d: number | null
          new_last_7d: number | null
          nurtured_last_7d: number | null
          org_id: string | null
          pipeline_stage: string | null
          total: number | null
          won_last_7d: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_submissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_v_special_project_rollup: {
        Row: {
          entry_count: number | null
          log_date: string | null
          org_id: string | null
          project_label: string | null
          project_type_id: string | null
          total_minutes: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_special_projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_special_projects_project_type_id_fkey"
            columns: ["project_type_id"]
            isOneToOne: false
            referencedRelation: "crm_special_project_types"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_attendees: {
        Row: {
          advisor_id: string | null
          created_at: string | null
          duration_seconds: number | null
          email: string | null
          id: string | null
          joined_at: string | null
          left_at: string | null
          meeting_id: string | null
          name: string | null
          user_id: string | null
        }
        Insert: {
          advisor_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          email?: string | null
          id?: string | null
          joined_at?: string | null
          left_at?: string | null
          meeting_id?: string | null
          name?: string | null
          user_id?: string | null
        }
        Update: {
          advisor_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          email?: string | null
          id?: string | null
          joined_at?: string | null
          left_at?: string | null
          meeting_id?: string | null
          name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advisor_meeting_attendees_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_meeting_attendees_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisor_training_completion"
            referencedColumns: ["advisor_id"]
          },
          {
            foreignKeyName: "advisor_meeting_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "advisor_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string | null
          joined_at: string | null
          org_id: string | null
          role: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          joined_at?: string | null
          org_id?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          joined_at?: string | null
          org_id?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_memberships_user_id_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organization_roles: {
        Row: {
          created_at: string | null
          org_id: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          org_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          org_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_memberships_user_id_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_org_invite: { Args: { invite_token: string }; Returns: Json }
      activate_module_for_org: {
        Args: {
          p_license_source?: string
          p_module_slug: string
          p_org_id: string
          p_trial_days?: number
        }
        Returns: string
      }
      add_custom_module_column: {
        Args: {
          p_api_name: string
          p_field_api_name: string
          p_field_type: string
          p_org_id: string
        }
        Returns: undefined
      }
      add_to_priority_lane: {
        Args: {
          p_lane_id: string
          p_lead_id: string
          p_org_id: string
          p_owner_user_id?: string
          p_reason?: string
        }
        Returns: string
      }
      aggregate_daily_analytics: {
        Args: { target_date: string }
        Returns: undefined
      }
      array_append_unique: {
        Args: { arr: string[]; new_value: string }
        Returns: string[]
      }
      assign_user_role: {
        Args: { target_role: string; target_user_id: string }
        Returns: Json
      }
      auth_uid: { Args: never; Returns: string }
      calculate_lead_score_factors: {
        Args: { p_lead_id: string }
        Returns: Json
      }
      calculate_newsletter_metrics: {
        Args: { campaign_uuid: string }
        Returns: undefined
      }
      can_user_manage_user_in_org: {
        Args: { check_org_id: string; target_user_id: string }
        Returns: boolean
      }
      check_repeat_lead: {
        Args: { p_email: string; p_phone: string }
        Returns: {
          is_repeat: boolean
          previous_count: number
        }[]
      }
      clean_expired_rate_limits: { Args: never; Returns: undefined }
      cleanup_old_page_views: { Args: never; Returns: undefined }
      cleanup_old_security_alert_logs: { Args: never; Returns: number }
      clear_must_change_password_after_reset: {
        Args: never
        Returns: undefined
      }
      complete_priority_item: {
        Args: { p_item_id: string; p_reason?: string }
        Returns: boolean
      }
      create_custom_module_table: {
        Args: { p_api_name: string; p_fields: Json; p_org_id: string }
        Returns: undefined
      }
      create_instant_meeting: {
        Args: {
          p_advisor_ids?: string[]
          p_host_id: string
          p_title: string
          p_visibility?: string
        }
        Returns: {
          agenda: string | null
          allow_guests: boolean | null
          attendee_count: number | null
          auto_record: boolean | null
          co_host_ids: string[] | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          ended_at: string | null
          host_id: string | null
          host_name: string | null
          id: string
          is_recurring: boolean | null
          max_attendees: number | null
          max_participants: number | null
          meeting_link: string | null
          meeting_notes: string | null
          meeting_type: string | null
          metadata: Json | null
          notes: string | null
          org_id: string | null
          passcode: string | null
          recording_url: string | null
          recurrence_day: number | null
          recurrence_pattern: string | null
          recurrence_time: string | null
          reminder_minutes: number | null
          reminder_sent: boolean | null
          require_registration: boolean | null
          resources: Json | null
          room_name: string
          room_password: string | null
          scheduled_at: string
          started_at: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          visibility: string | null
        }
        SetofOptions: {
          from: "*"
          to: "advisor_meetings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_organization_with_owner: {
        Args: { org_name: string; org_slug: string; owner_user_id?: string }
        Returns: string
      }
      crm_active_pipeline_stages: {
        Args: { p_org_id: string }
        Returns: {
          display_name: string
          id: string
          is_lost_stage: boolean
          is_terminal: boolean
          is_won_stage: boolean
          name: string
          routes_to_subsection: string
          sort_order: number
        }[]
      }
      crm_activity_summary_filtered: {
        Args: {
          p_month: number
          p_org_id: string
          p_rep_ids?: string[]
          p_year: number
        }
        Returns: {
          activity_type: string
          actual: number
          rep_id: string
          rep_name: string
          target: number
        }[]
      }
      crm_activity_summary_vs_targets: {
        Args: { p_month: number; p_org_id: string; p_year: number }
        Returns: {
          activity_type: string
          actual: number
          rep_id: string
          rep_name: string
          target: number
        }[]
      }
      crm_advisor_performance: {
        Args: { p_org_id: string }
        Returns: {
          activities_this_month: number
          advisor_email: string
          advisor_id: string
          advisor_name: string
          converted_leads: number
          new_leads_this_month: number
          open_tasks: number
          overdue_tasks: number
          total_leads: number
        }[]
      }
      crm_age_to_nurture: {
        Args: { p_org_id: string }
        Returns: {
          lead_id: string
          prior_stage: string
        }[]
      }
      crm_annual_conversion_by_rep: {
        Args: { p_org_id: string; p_year: number }
        Returns: {
          inhouse_conv_pct: number
          overall_conv_pct: number
          rep_id: string
          rep_name: string
          selfgen_conv_pct: number
          total_closed: number
          total_leads: number
        }[]
      }
      crm_annual_lead_trend: {
        Args: { p_org_id: string; p_year: number }
        Returns: {
          lead_count: number
          month_label: string
          month_num: number
        }[]
      }
      crm_annual_revenue_trend: {
        Args: { p_org_id: string; p_year: number }
        Returns: {
          month_num: number
          rep_id: string
          rep_name: string
          revenue: number
        }[]
      }
      crm_annual_source_distribution: {
        Args: { p_org_id: string; p_year: number }
        Returns: {
          conversion_pct: number
          converted: number
          source_label: string
          total_leads: number
        }[]
      }
      crm_apply_enrollment_won: {
        Args: { p_lead_id: string }
        Returns: undefined
      }
      crm_apply_lead_opt_out: {
        Args: { p_lead_id: string; p_phrase?: string; p_reason?: string }
        Returns: undefined
      }
      crm_assign_leads_round_robin: {
        Args: { p_lead_ids: string[]; p_org_id?: string }
        Returns: {
          assigned_to: string
          lead_id: string
          position_at_assignment: number
          was_skip: boolean
        }[]
      }
      crm_award_xp: {
        Args: {
          p_action: string
          p_description?: string
          p_entity_id?: string
          p_entity_type?: string
          p_org_id: string
          p_user_id: string
          p_xp_amount: number
        }
        Returns: Json
      }
      crm_business_days_back: {
        Args: { from_date: string; n: number }
        Returns: string
      }
      crm_calc_business_hour_deadline: {
        Args: {
          p_bh_end: string
          p_bh_start: string
          p_business_days: number[]
          p_hours: number
          p_start: string
          p_timezone: string
        }
        Returns: string
      }
      crm_calculate_deal_win_probability: {
        Args: { p_deal_id: string }
        Returns: Json
      }
      crm_check_quoted_sla: {
        Args: { p_org_id: string; p_sla_hours?: number }
        Returns: {
          assigned_to: string
          hours_in_quoted: number
          lead_id: string
          org_id: string
          quoted_at: string
        }[]
      }
      crm_classify_log_section: {
        Args: { p_activity_type: string; p_source: string }
        Returns: string
      }
      crm_conversion_rates: {
        Args: { p_month: number; p_org_id: string; p_year: number }
        Returns: {
          inhouse_closed: number
          inhouse_conv_pct: number
          inhouse_leads: number
          leads_received: number
          overall_conv_pct: number
          rep_id: string
          rep_name: string
          selfgen_closed: number
          selfgen_conv_pct: number
          selfgen_leads: number
        }[]
      }
      crm_conversion_rates_filtered: {
        Args: {
          p_month: number
          p_org_id: string
          p_rep_ids?: string[]
          p_year: number
        }
        Returns: {
          inhouse_closed: number
          inhouse_conv_pct: number
          inhouse_leads: number
          leads_received: number
          overall_conv_pct: number
          rep_id: string
          rep_name: string
          selfgen_closed: number
          selfgen_conv_pct: number
          selfgen_leads: number
        }[]
      }
      crm_count_leads_worked: {
        Args: { p_date: string; p_org_id: string; p_user_id: string }
        Returns: number
      }
      crm_daily_log_add_manual: {
        Args: {
          p_activity_type: string
          p_description: string
          p_metadata?: Json
          p_occurred_at?: string
          p_org_id: string
          p_section: string
        }
        Returns: string
      }
      crm_daily_log_admin_delete: {
        Args: { p_event_id: string; p_reason: string }
        Returns: undefined
      }
      crm_daily_log_admin_edit: {
        Args: { p_event_id: string; p_patch: Json; p_reason: string }
        Returns: undefined
      }
      crm_detect_opt_out: {
        Args: { p_body: string; p_org_id?: string }
        Returns: {
          is_match: boolean
          match_phrase: string
        }[]
      }
      crm_detect_opt_out_keywords: {
        Args: { p_body: string }
        Returns: boolean
      }
      crm_dispatch_performance_lag_notification: {
        Args: { p_alert_id: string; p_org_id: string }
        Returns: undefined
      }
      crm_enroll_lead_in_cadence: {
        Args: { p_cadence_id: string; p_lead_id: string }
        Returns: string
      }
      crm_get_entity_viewers: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: {
          avatar_url: string
          full_name: string
          status: string
          user_id: string
        }[]
      }
      crm_get_leaderboard: {
        Args: { p_org_id: string; p_period?: string }
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          level: number
          level_name: string
          period_xp: number
          rank: number
          streak_days: number
          total_xp: number
          user_id: string
        }[]
      }
      crm_get_stuck_leads: {
        Args: { p_days_threshold?: number; p_org_id: string }
        Returns: {
          assigned_to_name: string
          days_in_stage: number
          days_since_contact: number
          first_name: string
          last_name: string
          lead_id: string
          lead_score: number
          pipeline_stage: string
          premium_amount: number
          primary_email: string
          stage_display_name: string
        }[]
      }
      crm_global_search: {
        Args: { p_limit?: number; p_org_id: string; p_query: string }
        Returns: {
          entity_id: string
          entity_type: string
          extra_info: string
          rank: number
          subtitle: string
          title: string
        }[]
      }
      crm_individual_performance: {
        Args: { p_month: number; p_org_id: string; p_year: number }
        Returns: {
          avg_deal_size: number
          calls_made: number
          close_rate: number
          closed_sales: number
          community_activities: number
          emails_sent: number
          linkedin_messages: number
          meetings_held: number
          new_leads_entered: number
          presentations_given: number
          proposals_sent: number
          referrals_requested: number
          rep_id: string
          rep_name: string
          revenue: number
        }[]
      }
      crm_individual_performance_filtered: {
        Args: {
          p_month: number
          p_org_id: string
          p_rep_ids?: string[]
          p_year: number
        }
        Returns: {
          avg_deal_size: number
          calls_made: number
          close_rate: number
          closed_sales: number
          community_activities: number
          emails_sent: number
          linkedin_messages: number
          meetings_held: number
          new_leads_entered: number
          presentations_given: number
          proposals_sent: number
          referrals_requested: number
          rep_id: string
          rep_name: string
          revenue: number
        }[]
      }
      crm_is_lead_manager: { Args: { p_org_id: string }; Returns: boolean }
      crm_lead_source_breakdown_monthly: {
        Args: { p_month: number; p_org_id: string; p_year: number }
        Returns: {
          conversion_pct: number
          converted_leads: number
          source_label: string
          total_leads: number
        }[]
      }
      crm_lead_stage_velocity: {
        Args: { p_org_id: string }
        Returns: {
          avg_days_in_stage: number
          conversion_rate: number
          lead_count: number
          median_days_in_stage: number
          stage_color: string
          stage_display_name: string
          stage_name: string
          stuck_count: number
          total_value: number
        }[]
      }
      crm_leads_inhouse_vs_selfgen: {
        Args: { p_month: number; p_org_id: string; p_year: number }
        Returns: {
          is_self_generated: boolean
          lead_count: number
          source_label: string
        }[]
      }
      crm_leads_split_2026: {
        Args: {
          p_month: number
          p_org_id: string
          p_rep_ids?: string[]
          p_year: number
          p_ytd?: boolean
        }
        Returns: {
          closed_count: number
          conversion_pct: number
          display_order: number
          label: string
          lead_count: number
          row_kind: string
        }[]
      }
      crm_log_activity: {
        Args: {
          p_account_id?: string
          p_activity_type: string
          p_contact_id?: string
          p_deal_id?: string
          p_description?: string
          p_lead_id?: string
          p_metadata?: Json
          p_org_id?: string
          p_subject?: string
          p_title: string
        }
        Returns: string
      }
      crm_mark_lead_lost: {
        Args: { p_lead_id: string; p_reason?: string }
        Returns: undefined
      }
      crm_mark_preliminary_quote_sent: {
        Args: { p_lead_id: string }
        Returns: undefined
      }
      crm_master_template_bump_usage: {
        Args: { p_template_id: string }
        Returns: undefined
      }
      crm_outside_advisor_production: {
        Args: { p_month: number; p_org_id: string; p_year: number }
        Returns: {
          advisor_id: string
          advisor_name: string
          closed_month: number
          closed_ytd: number
          leads_month: number
          leads_ytd: number
        }[]
      }
      crm_perflag_business_day_window: {
        Args: { p_n: number; p_today: string }
        Returns: {
          window_end: string
          window_start: string
        }[]
      }
      crm_perflag_distinct_business_days: {
        Args: { p_org_id: string; p_section_filter: string; p_user_id: string }
        Returns: number
      }
      crm_perflag_metric_for_user:
        | {
            Args: {
              p_metric_kind: string
              p_org_id: string
              p_section_filter: string
              p_user_id: string
              p_window_end: string
              p_window_start: string
            }
            Returns: number
          }
        | {
            Args: {
              p_business_days_only: boolean
              p_metric_kind: string
              p_org_id: string
              p_section_filter: string
              p_user_id: string
              p_window_end: string
              p_window_start: string
            }
            Returns: number
          }
      crm_pipeline_breakdown: {
        Args: { p_org_id: string }
        Returns: {
          healthshare_count: number
          stage_color: string
          stage_display_name: string
          stage_name: string
          total_in_stage: number
          traditional_count: number
          unspecified_count: number
        }[]
      }
      crm_plan_type_stats: {
        Args: { p_org_id: string }
        Returns: {
          new_this_month: number
          new_this_week: number
          new_today: number
          plan_type: string
          total_count: number
        }[]
      }
      crm_promote_stale_quotes_to_nurture: {
        Args: { p_org_id: string; p_stale_after?: string }
        Returns: number
      }
      crm_record_lead_engagement: {
        Args: { p_lead_id: string }
        Returns: undefined
      }
      crm_register_engagement_signal: {
        Args: { p_lead_id: string; p_signal_type?: string }
        Returns: undefined
      }
      crm_report_application_dropoff: {
        Args: { p_org_id: string }
        Returns: {
          still_in_progress: number
          withdrawn_or_lost: number
        }[]
      }
      crm_report_lead_stage_counts: {
        Args: { p_org_id: string }
        Returns: {
          lead_count: number
          pipeline_stage: string
        }[]
      }
      crm_report_stalled_leads: {
        Args: { p_org_id: string; p_threshold_days?: number }
        Returns: {
          assigned_to: string
          days_in_stage: number
          last_contacted_at: string
          lead_id: string
          pipeline_stage: string
          stage_changed_at: string
          workflow_subsection: string
        }[]
      }
      crm_revenue_closed_sales: {
        Args: { p_month: number; p_org_id: string; p_year: number }
        Returns: {
          avg_deal_size: number
          closed_sales_month: number
          closed_sales_ytd: number
          rep_id: string
          rep_name: string
          revenue_month: number
          revenue_ytd: number
        }[]
      }
      crm_revenue_closed_sales_filtered: {
        Args: {
          p_month: number
          p_org_id: string
          p_rep_ids?: string[]
          p_year: number
        }
        Returns: {
          avg_deal_size: number
          closed_sales_month: number
          closed_sales_ytd: number
          rep_id: string
          rep_name: string
          revenue_month: number
          revenue_ytd: number
        }[]
      }
      crm_scan_performance_lag: {
        Args: { p_org_id: string }
        Returns: {
          alert_fired: boolean
          rep_count: number
          team_avg: number
          top_performer_count: number
          user_id: string
          window_end: string
          window_start: string
        }[]
      }
      crm_scan_stalled_in_stage: {
        Args: { p_org_id: string }
        Returns: {
          hours_in_stage: number
          lead_id: string
          pipeline_stage: string
          sla_hours: number
          stage_changed_at: string
        }[]
      }
      crm_seed_recruiting_pipeline_stages: {
        Args: { p_org_id: string }
        Returns: undefined
      }
      crm_seed_sales_plan_2026_demo: {
        Args: {
          p_adam_email?: string
          p_leonardo_email?: string
          p_org_id: string
          p_tupac_email?: string
        }
        Returns: {
          email: string
          status: string
          user_id: string
        }[]
      }
      crm_strip_reply_quoted_and_signature: {
        Args: { p_body: string }
        Returns: string
      }
      crm_today_summary: { Args: { p_org_id: string }; Returns: Json }
      current_user_has_admin_access: { Args: never; Returns: boolean }
      current_user_has_advisor_command_access: { Args: never; Returns: boolean }
      current_user_has_advisor_or_admin_access: {
        Args: never
        Returns: boolean
      }
      current_user_has_concierge_portal_access: {
        Args: never
        Returns: boolean
      }
      current_user_has_extended_admin_access: { Args: never; Returns: boolean }
      current_user_has_super_admin_access: { Args: never; Returns: boolean }
      current_user_is_admin: { Args: never; Returns: boolean }
      current_user_is_super_admin: { Args: never; Returns: boolean }
      current_user_org_ids: { Args: never; Returns: string[] }
      current_user_org_role: { Args: { p_org_id: string }; Returns: string }
      decrypt_token: {
        Args: { encrypted: string; key: string }
        Returns: string
      }
      drop_custom_module_table: {
        Args: { p_api_name: string; p_org_id: string }
        Returns: undefined
      }
      encrypt_token: { Args: { key: string; token: string }; Returns: string }
      end_advisor_meeting: {
        Args: { p_meeting_id: string }
        Returns: {
          agenda: string | null
          allow_guests: boolean | null
          attendee_count: number | null
          auto_record: boolean | null
          co_host_ids: string[] | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          ended_at: string | null
          host_id: string | null
          host_name: string | null
          id: string
          is_recurring: boolean | null
          max_attendees: number | null
          max_participants: number | null
          meeting_link: string | null
          meeting_notes: string | null
          meeting_type: string | null
          metadata: Json | null
          notes: string | null
          org_id: string | null
          passcode: string | null
          recording_url: string | null
          recurrence_day: number | null
          recurrence_pattern: string | null
          recurrence_time: string | null
          reminder_minutes: number | null
          reminder_sent: boolean | null
          require_registration: boolean | null
          resources: Json | null
          room_name: string
          room_password: string | null
          scheduled_at: string
          started_at: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          visibility: string | null
        }
        SetofOptions: {
          from: "*"
          to: "advisor_meetings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      enroll_advisor_in_course: {
        Args: { p_advisor_id: string; p_course_id: string }
        Returns: string
      }
      ensure_user_in_advisor_announcements_channel: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      generate_claim_number: { Args: never; Returns: string }
      generate_health_quote_number: { Args: never; Returns: string }
      generate_invoice_number: { Args: { p_org_id: string }; Returns: string }
      generate_meeting_room_name: { Args: never; Returns: string }
      generate_module_permissions: {
        Args: { p_module_api_name: string }
        Returns: string[]
      }
      generate_quote_number: { Args: { p_org_id: string }; Returns: string }
      generate_ticket_number: { Args: never; Returns: string }
      get_active_advisor_emails: {
        Args: never
        Returns: {
          advisor_id: string
          email: string
          first_name: string
          last_name: string
        }[]
      }
      get_activity_feed: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_org_id?: string
          p_user_id: string
        }
        Returns: {
          activity_type: string
          created_at: string
          description: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json
        }[]
      }
      get_all_users_with_roles: {
        Args: never
        Returns: {
          email: string
          full_name: string
          id: string
          last_sign_in_at: string
          roles: string[]
          user_created_at: string
        }[]
      }
      get_automation_stats: {
        Args: { p_org_id: string }
        Returns: {
          active_rules: number
          success_rate: number
          total_rules: number
          total_runs: number
        }[]
      }
      get_available_health_plans: {
        Args: never
        Returns: {
          features: Json
          id: string
          monthly_contribution: number
          name: string
          slug: string
          tier: string
        }[]
      }
      get_chat_unread_counts: {
        Args: { p_user_id: string }
        Returns: {
          conversation_id: string
          unread_count: number
        }[]
      }
      get_crm_dashboard_stats: {
        Args: never
        Returns: {
          avg_days_to_close: number
          conversion_rate: number
          leads_by_priority: Json
          leads_by_stage: Json
          new_leads: number
          overdue_tasks: number
          tasks_due_today: number
          total_leads: number
        }[]
      }
      get_custom_module_table_name: {
        Args: { p_api_name: string; p_org_id: string }
        Returns: string
      }
      get_downline_advisor_ids: {
        Args: { root_advisor_id: string }
        Returns: {
          agent_id: string
        }[]
      }
      get_email_tracking_stats: {
        Args: { p_email_id: string }
        Returns: {
          first_open: string
          last_open: string
          opens_by_device: Json
          top_clicked_links: Json
          total_clicks: number
          total_opens: number
          unique_clicks: number
          unique_opens: number
        }[]
      }
      get_filtered_leads: {
        Args: {
          p_assigned_to?: string
          p_date_from?: string
          p_date_to?: string
          p_limit?: number
          p_offset?: number
          p_priority?: string
          p_search?: string
          p_stage?: string
        }
        Returns: {
          assigned_to: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          lead_score: number
          next_followup_at: string
          phone: string
          pipeline_stage: string
          priority: string
          source_cta: string
          source_page: string
          stage_changed_at: string
          tags: string[]
          total_count: number
          zip_code: string
        }[]
      }
      get_highest_role: { Args: { check_user_id: string }; Returns: string }
      get_inbox_summary: {
        Args: { p_org_id: string; p_user_id: string }
        Returns: {
          active_count: number
          archived_count: number
          total_conversations: number
          unread_count: number
        }[]
      }
      get_lead_health_quotes: {
        Args: { p_lead_id: string }
        Returns: {
          created_at: string
          household_type: string
          id: string
          member_count: number
          primary_age: number
          quote_lines: Json
          quote_number: string
          sent_at: string
          status: string
          total_annual: number
          total_monthly: number
          valid_until: string
        }[]
      }
      get_lead_notification_stats: {
        Args: { days_back?: number }
        Returns: {
          acknowledged_count: number
          avg_response_time_seconds: number
          critical_count: number
          high_count: number
          repeat_lead_count: number
          total_notifications: number
        }[]
      }
      get_lead_plan_interests: {
        Args: { p_lead_id: string }
        Returns: {
          created_at: string
          created_by: string
          dependent_ages: number[]
          family_size: string
          id: string
          interest_level: string
          notes: string
          plan_code: string
          plan_id: string
          plan_name: string
          primary_age: number
          quote_valid_until: string
          quoted_at: string
          quoted_monthly_rate: number
          spouse_age: number
        }[]
      }
      get_lead_with_insights: {
        Args: { p_lead_id: string }
        Returns: {
          activities: Json
          insights: Json
          lead: Json
          tasks: Json
        }[]
      }
      get_leaderboard:
        | {
            Args: { p_limit?: number; p_org_id?: string; p_period?: string }
            Returns: {
              avatar_url: string
              deals_closed: number
              rank: number
              revenue: number
              total_points: number
              user_id: string
              user_name: string
            }[]
          }
        | {
            Args: {
              p_limit?: number
              p_metric?: string
              p_org_id: string
              p_period?: string
            }
            Returns: {
              achievements_count: number
              avatar_url: string
              rank: number
              score: number
              user_id: string
              user_name: string
            }[]
          }
      get_metric_timeseries: {
        Args: {
          p_end_date?: string
          p_granularity?: string
          p_metric_name: string
          p_start_date?: string
        }
        Returns: {
          date: string
          value: number
        }[]
      }
      get_my_org_permissions_snapshot: {
        Args: { p_org_id: string }
        Returns: Json
      }
      get_notification_events_unread_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_or_create_dashboard_layout: {
        Args: { p_org_id: string; p_user_id: string }
        Returns: Json
      }
      get_or_create_email_thread: {
        Args: {
          p_lead_id?: string
          p_org_id: string
          p_participants?: string[]
          p_subject: string
        }
        Returns: string
      }
      get_or_create_notification_settings: {
        Args: { p_org_id?: string; p_user_id: string }
        Returns: Json
      }
      get_or_create_user_preferences: {
        Args: { p_org_id: string; p_user_id: string }
        Returns: {
          auto_advance_after_complete: boolean | null
          compact_mode: boolean | null
          created_at: string
          dashboard_layout: Json | null
          default_lane_id: string | null
          id: string
          inbox_group_by: string | null
          inbox_preview_lines: number | null
          inbox_sort_order: string | null
          keyboard_shortcuts_enabled: boolean | null
          language: string | null
          org_id: string
          pinned_items: Json | null
          power_list_view: string | null
          sidebar_collapsed: boolean | null
          theme: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_preferences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_org_features: {
        Args: { p_org_id: string }
        Returns: {
          category: string
          feature_name: string
          feature_slug: string
          source: string
        }[]
      }
      get_org_modules: {
        Args: { p_org_id: string }
        Returns: {
          activated_at: string
          category: string
          expires_at: string
          license_source: string
          module_name: string
          module_slug: string
          status: string
        }[]
      }
      get_plan_rate: {
        Args: {
          p_age: number
          p_effective_date?: string
          p_iua_amount?: number
          p_member_type: string
          p_plan_slug: string
        }
        Returns: {
          annual_membership_fee: number
          enrollment_fee: number
          monthly_contribution: number
          plan_id: string
          plan_name: string
          tobacco_surcharge_pct: number
        }[]
      }
      get_plan_resource_by_slug: {
        Args: { p_slug: string }
        Returns: {
          color: string
          description: string
          flyer_title: string
          flyer_url: string
          handbook_title: string
          handbook_url: string
          icon: string
          id: string
          overview_content: string
          plan_name: string
          plan_slug: string
          pricing_content: string
          qrg_title: string
          qrg_url: string
          state_guidelines: Json
        }[]
      }
      get_power_list: {
        Args: { p_limit?: number; p_org_id: string; p_user_id?: string }
        Returns: {
          contact_id: string
          item_id: string
          lane_color: string
          lane_id: string
          lane_name: string
          last_action_at: string
          lead_id: string
          next_action_at: string
          person_email: string
          person_name: string
          rank: number
          reason: string
          score: number
          snoozed_until: string
        }[]
      }
      get_quote_results_analytics: { Args: { p_days?: number }; Returns: Json }
      get_recent_searches: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          id: string
          query: string
          result_count: number
          searched_at: string
        }[]
      }
      get_trending_keywords: {
        Args: {
          p_days?: number
          p_direction?: string
          p_limit?: number
          p_site_url: string
        }
        Returns: {
          clicks: number
          current_position: number
          impressions: number
          keyword: string
          position_change: number
          previous_position: number
        }[]
      }
      get_unread_notification_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_upcoming_advisor_meetings: {
        Args: { p_limit?: number }
        Returns: {
          agenda: string | null
          allow_guests: boolean | null
          attendee_count: number | null
          auto_record: boolean | null
          co_host_ids: string[] | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          ended_at: string | null
          host_id: string | null
          host_name: string | null
          id: string
          is_recurring: boolean | null
          max_attendees: number | null
          max_participants: number | null
          meeting_link: string | null
          meeting_notes: string | null
          meeting_type: string | null
          metadata: Json | null
          notes: string | null
          org_id: string | null
          passcode: string | null
          recording_url: string | null
          recurrence_day: number | null
          recurrence_pattern: string | null
          recurrence_time: string | null
          reminder_minutes: number | null
          reminder_sent: boolean | null
          require_registration: boolean | null
          resources: Json | null
          room_name: string
          room_password: string | null
          scheduled_at: string
          started_at: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          visibility: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "advisor_meetings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_upcoming_events: {
        Args: { p_days?: number; p_user_id: string }
        Returns: {
          end_time: string
          event_type: string
          id: string
          lead_id: string
          lead_name: string
          start_time: string
          status: string
          title: string
        }[]
      }
      get_user_compliance_status: {
        Args: { p_user_id: string }
        Returns: {
          acknowledged: number
          compliance_rate: number
          expired: number
          pending: number
          total_documents: number
        }[]
      }
      get_user_org_ids:
        | { Args: never; Returns: string[] }
        | { Args: { p_user_id: string }; Returns: string[] }
      get_user_org_role: { Args: { check_org_id: string }; Returns: string }
      get_user_primary_org_id: { Args: never; Returns: string }
      get_user_roles: { Args: { check_user_id: string }; Returns: string[] }
      get_user_with_roles: {
        Args: { target_user_id: string }
        Returns: {
          email: string
          full_name: string
          id: string
          last_sign_in_at: string
          roles: string[]
          user_created_at: string
        }[]
      }
      has_org_permission: {
        Args: { p_org_id: string; p_permission_key: string }
        Returns: boolean
      }
      has_role: {
        Args: { check_role: string; check_user_id: string }
        Returns: boolean
      }
      increment_advisor_content_view_count: {
        Args: { content_id: string }
        Returns: undefined
      }
      increment_message_template_times_used: {
        Args: { template_id: string }
        Returns: undefined
      }
      increment_saved_search_use_count: {
        Args: { search_id: string }
        Returns: undefined
      }
      increment_times_used: {
        Args: { p_id_col: string; p_record_id: string; p_table: string }
        Returns: undefined
      }
      increment_use_count: {
        Args: { p_id_col: string; p_record_id: string; p_table: string }
        Returns: undefined
      }
      invite_advisors_to_meeting: {
        Args: { p_advisor_ids: string[]; p_meeting_id: string }
        Returns: number
      }
      invite_all_advisors_to_meeting: {
        Args: { p_meeting_id: string }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
      is_org_admin: { Args: { p_org_id: string }; Returns: boolean }
      is_org_member: { Args: { p_org_id: string }; Returns: boolean }
      is_org_role: {
        Args: { p_org_id: string; p_role: string }
        Returns: boolean
      }
      is_staff_or_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      mark_chat_conversation_read: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: undefined
      }
      move_priority_item: {
        Args: { p_item_id: string; p_new_lane_id: string; p_new_rank?: number }
        Returns: boolean
      }
      org_has_feature: {
        Args: { p_feature_slug: string; p_org_id: string }
        Returns: boolean
      }
      org_has_module: {
        Args: { p_module_slug: string; p_org_id: string }
        Returns: boolean
      }
      record_quote_calculator_event: {
        Args: { payload: Json }
        Returns: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          session_id: string
        }
        SetofOptions: {
          from: "*"
          to: "quote_calculator_funnel_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      remove_user_role: {
        Args: { target_role: string; target_user_id: string }
        Returns: Json
      }
      render_email_signature: {
        Args: { p_override_vars?: Json; p_signature_id: string }
        Returns: string
      }
      respond_to_meeting_invitation: {
        Args: { p_invitation_id: string; p_notes?: string; p_response: string }
        Returns: {
          advisor_id: string
          created_at: string | null
          id: string
          invited_at: string | null
          meeting_id: string
          notes: string | null
          org_id: string | null
          reminder_sent: boolean | null
          reminder_sent_at: string | null
          responded_at: string | null
          status: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "meeting_invitations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_dashboard_layout: {
        Args: {
          p_name?: string
          p_org_id: string
          p_user_id: string
          p_widgets: Json
        }
        Returns: Json
      }
      search_chat_messages: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_query: string
          p_user_id: string
        }
        Returns: {
          content: string
          conversation_id: string
          conversation_name: string
          created_at: string
          id: string
          rank: number
          sender_id: string
          sender_name: string
        }[]
      }
      search_crm_accounts: {
        Args: { p_limit?: number; p_org_id: string; p_query: string }
        Returns: {
          account_type: string
          address: Json | null
          annual_revenue: number | null
          billing_address: Json | null
          created_at: string
          created_by: string
          description: string | null
          employee_count: number | null
          fax: string | null
          id: string
          industry: string | null
          linkedin_url: string | null
          name: string
          org_id: string
          owner_id: string | null
          parent_account_id: string | null
          phone: string | null
          rating: string | null
          search_vector: unknown
          shipping_address: Json | null
          tags: string[] | null
          twitter_handle: string | null
          updated_at: string
          website: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "crm_accounts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_crm_contacts: {
        Args: { p_limit?: number; p_org_id: string; p_query: string }
        Returns: {
          account_id: string | null
          carrier_id: string | null
          city: string | null
          converted_at: string | null
          converted_from_lead_id: string | null
          created_at: string
          created_by: string
          date_of_birth: string | null
          department: string | null
          description: string | null
          do_not_call: boolean | null
          do_not_email: boolean | null
          email: string | null
          email_opt_out: boolean | null
          fax: string | null
          first_name: string
          id: string
          last_name: string
          lead_source: string | null
          linkedin_url: string | null
          mailing_address: Json | null
          member_responsibility: number | null
          mobile: string | null
          org_id: string
          original_effective_date: string | null
          other_address: Json | null
          owner_id: string | null
          phone: string | null
          plan_type: string | null
          premium_amount: number | null
          reports_to: string | null
          salutation: string | null
          search_vector: unknown
          state: string | null
          subsidy_amount: number | null
          tags: string[] | null
          title: string | null
          tobacco_status: string | null
          twitter_handle: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "crm_contacts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_crm_deals: {
        Args: { p_limit?: number; p_org_id: string; p_query: string }
        Returns: {
          account_id: string | null
          actual_close_date: string | null
          amount: number | null
          campaign_id: string | null
          contact_id: string | null
          converted_from_lead_id: string | null
          created_at: string
          created_by: string
          currency: string | null
          deal_type: string | null
          description: string | null
          expected_close_date: string | null
          id: string
          lead_source: string | null
          lost_at: string | null
          lost_reason: string | null
          name: string
          next_step: string | null
          org_id: string
          owner_id: string | null
          probability: number | null
          product_line: string | null
          search_vector: unknown
          stage_id: string
          tags: string[] | null
          updated_at: string
          won_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "crm_deals"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_users_with_roles: {
        Args: { search_email: string }
        Returns: {
          email: string
          full_name: string
          id: string
          last_sign_in_at: string
          roles: string[]
          user_created_at: string
        }[]
      }
      setup_catherine_superadmin_profile: {
        Args: { user_email: string; user_id: string }
        Returns: undefined
      }
      setup_superadmin_profile: {
        Args: { user_email: string; user_id: string }
        Returns: undefined
      }
      setup_test_advisor_profile: {
        Args: { user_email: string; user_id: string }
        Returns: undefined
      }
      snooze_priority_item: {
        Args: { p_item_id: string; p_reason?: string; p_until: string }
        Returns: boolean
      }
      start_advisor_meeting: {
        Args: { p_meeting_id: string }
        Returns: {
          agenda: string | null
          allow_guests: boolean | null
          attendee_count: number | null
          auto_record: boolean | null
          co_host_ids: string[] | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          ended_at: string | null
          host_id: string | null
          host_name: string | null
          id: string
          is_recurring: boolean | null
          max_attendees: number | null
          max_participants: number | null
          meeting_link: string | null
          meeting_notes: string | null
          meeting_type: string | null
          metadata: Json | null
          notes: string | null
          org_id: string | null
          passcode: string | null
          recording_url: string | null
          recurrence_day: number | null
          recurrence_pattern: string | null
          recurrence_time: string | null
          reminder_minutes: number | null
          reminder_sent: boolean | null
          require_registration: boolean | null
          resources: Json | null
          room_name: string
          room_password: string | null
          scheduled_at: string
          started_at: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          visibility: string | null
        }
        SetofOptions: {
          from: "*"
          to: "advisor_meetings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      start_bulletin_notification: {
        Args: { p_bulletin_id: string; p_sent_by: string }
        Returns: string
      }
      submit_public_lead: {
        Args: { payload: Json }
        Returns: {
          application_started_at: string | null
          assigned_to: string | null
          carrier_id: string | null
          city: string | null
          community_event_id: string | null
          concierge_handoff_at: string | null
          contact_preference: string | null
          converted_at: string | null
          coverage_preference: string | null
          created_at: string | null
          current_insurance: string | null
          dependent_count: number | null
          do_not_contact: boolean | null
          email: string
          engagement_detected_at: string | null
          enrollment_approved_at: string | null
          first_name: string
          form_data: Json | null
          group_type: string | null
          household_size: number | null
          household_type: string | null
          id: string
          interested_plans: string[] | null
          ip_address: unknown
          is_self_generated: boolean | null
          last_activity_at: string | null
          last_contacted_at: string | null
          last_name: string
          last_opt_out_signal_at: string | null
          last_touched_at: string | null
          lead_score: number | null
          lead_source: string | null
          linkedin_workflow_status: string | null
          lost_reason: string | null
          member_responsibility: number | null
          monthly_premium: string | null
          next_followup_at: string | null
          opt_out_detected_at: string | null
          opt_out_phrase: string | null
          opt_out_reason: string | null
          org_id: string | null
          original_effective_date: string | null
          outside_advisor_id: string | null
          phone: string
          pipeline_stage: string | null
          pipeline_stage_id: string | null
          plan_type: string | null
          preliminary_quote_sent_at: string | null
          premium_amount: number | null
          primary_age: number | null
          primary_concern: string | null
          priority: string | null
          quote_cadence_started_at: string | null
          quoted_plans: string[] | null
          reactivation_source_lead_id: string | null
          referral_partner_id: string | null
          referrer: string | null
          source_cta: string | null
          source_page: string | null
          spouse_age: number | null
          stage_changed_at: string | null
          state: string | null
          subsidy_amount: number | null
          tags: string[] | null
          tobacco_status: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          workflow_subsection: string | null
          zip_code: string | null
        }
        SetofOptions: {
          from: "*"
          to: "lead_submissions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_trusted_lead: {
        Args: { payload: Json }
        Returns: {
          application_started_at: string | null
          assigned_to: string | null
          carrier_id: string | null
          city: string | null
          community_event_id: string | null
          concierge_handoff_at: string | null
          contact_preference: string | null
          converted_at: string | null
          coverage_preference: string | null
          created_at: string | null
          current_insurance: string | null
          dependent_count: number | null
          do_not_contact: boolean | null
          email: string
          engagement_detected_at: string | null
          enrollment_approved_at: string | null
          first_name: string
          form_data: Json | null
          group_type: string | null
          household_size: number | null
          household_type: string | null
          id: string
          interested_plans: string[] | null
          ip_address: unknown
          is_self_generated: boolean | null
          last_activity_at: string | null
          last_contacted_at: string | null
          last_name: string
          last_opt_out_signal_at: string | null
          last_touched_at: string | null
          lead_score: number | null
          lead_source: string | null
          linkedin_workflow_status: string | null
          lost_reason: string | null
          member_responsibility: number | null
          monthly_premium: string | null
          next_followup_at: string | null
          opt_out_detected_at: string | null
          opt_out_phrase: string | null
          opt_out_reason: string | null
          org_id: string | null
          original_effective_date: string | null
          outside_advisor_id: string | null
          phone: string
          pipeline_stage: string | null
          pipeline_stage_id: string | null
          plan_type: string | null
          preliminary_quote_sent_at: string | null
          premium_amount: number | null
          primary_age: number | null
          primary_concern: string | null
          priority: string | null
          quote_cadence_started_at: string | null
          quoted_plans: string[] | null
          reactivation_source_lead_id: string | null
          referral_partner_id: string | null
          referrer: string | null
          source_cta: string | null
          source_page: string | null
          spouse_age: number | null
          stage_changed_at: string | null
          state: string | null
          subsidy_amount: number | null
          tags: string[] | null
          tobacco_status: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          workflow_subsection: string | null
          zip_code: string | null
        }
        SetofOptions: {
          from: "*"
          to: "lead_submissions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_bulletin_notification_status: {
        Args: {
          p_error_message?: string
          p_failed?: number
          p_notification_id: string
          p_resend_batch_id?: string
          p_status: string
          p_successful?: number
        }
        Returns: undefined
      }
      user_has_org_access: { Args: { check_org_id: string }; Returns: boolean }
      user_has_org_role: {
        Args: { allowed_roles: string[]; check_org_id: string }
        Returns: boolean
      }
      user_is_org_manager_or_above: {
        Args: { check_org_id: string }
        Returns: boolean
      }
      user_is_org_owner_or_admin: {
        Args: { check_org_id: string }
        Returns: boolean
      }
      user_org_role: { Args: { p_org_id: string }; Returns: string }
    }
    Enums: {
      activity_type:
        | "lead_created"
        | "lead_updated"
        | "lead_assigned"
        | "lead_status_changed"
        | "lead_converted"
        | "lead_lost"
        | "message_sent"
        | "message_received"
        | "message_opened"
        | "task_created"
        | "task_completed"
        | "task_overdue"
        | "task_assigned"
        | "compliance_completed"
        | "compliance_due"
        | "compliance_violation"
        | "meeting_scheduled"
        | "meeting_started"
        | "meeting_completed"
        | "meeting_cancelled"
        | "sequence_enrolled"
        | "sequence_completed"
        | "sequence_paused"
        | "member_joined"
        | "member_left"
        | "member_role_changed"
        | "goal_achieved"
        | "milestone_reached"
        | "system_alert"
      case_origin: "email" | "phone" | "web" | "chat" | "social" | "internal"
      case_priority: "low" | "medium" | "high" | "urgent"
      case_status:
        | "new"
        | "assigned"
        | "in_progress"
        | "on_hold"
        | "escalated"
        | "resolved"
        | "closed"
      domain_verification_status: "pending" | "verified" | "failed" | "expired"
      forecast_category: "committed" | "best_case" | "pipeline" | "omitted"
      forecast_status: "draft" | "active" | "closed"
      forecast_type: "monthly" | "quarterly" | "annual"
      mail_job_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
      mail_job_type:
        | "full_sync"
        | "delta_sync"
        | "send"
        | "fetch_body"
        | "webhook_process"
      mail_provider: "microsoft365" | "gmail" | "imap"
      mail_rule_action:
        | "move_to_folder"
        | "add_label"
        | "remove_label"
        | "mark_read"
        | "mark_flagged"
        | "forward"
        | "delete"
        | "auto_reply"
        | "assign_to_user"
      mail_sync_status: "idle" | "syncing" | "error" | "disabled"
      notification_channel: "in_app" | "email" | "sms" | "push"
      notification_priority: "low" | "normal" | "high" | "urgent"
      user_role_type:
        | "super_admin"
        | "admin"
        | "advisor"
        | "member"
        | "manager"
        | "staff"
        | "guest"
        | "crm_user"
        | "concierge"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type: [
        "lead_created",
        "lead_updated",
        "lead_assigned",
        "lead_status_changed",
        "lead_converted",
        "lead_lost",
        "message_sent",
        "message_received",
        "message_opened",
        "task_created",
        "task_completed",
        "task_overdue",
        "task_assigned",
        "compliance_completed",
        "compliance_due",
        "compliance_violation",
        "meeting_scheduled",
        "meeting_started",
        "meeting_completed",
        "meeting_cancelled",
        "sequence_enrolled",
        "sequence_completed",
        "sequence_paused",
        "member_joined",
        "member_left",
        "member_role_changed",
        "goal_achieved",
        "milestone_reached",
        "system_alert",
      ],
      case_origin: ["email", "phone", "web", "chat", "social", "internal"],
      case_priority: ["low", "medium", "high", "urgent"],
      case_status: [
        "new",
        "assigned",
        "in_progress",
        "on_hold",
        "escalated",
        "resolved",
        "closed",
      ],
      domain_verification_status: ["pending", "verified", "failed", "expired"],
      forecast_category: ["committed", "best_case", "pipeline", "omitted"],
      forecast_status: ["draft", "active", "closed"],
      forecast_type: ["monthly", "quarterly", "annual"],
      mail_job_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ],
      mail_job_type: [
        "full_sync",
        "delta_sync",
        "send",
        "fetch_body",
        "webhook_process",
      ],
      mail_provider: ["microsoft365", "gmail", "imap"],
      mail_rule_action: [
        "move_to_folder",
        "add_label",
        "remove_label",
        "mark_read",
        "mark_flagged",
        "forward",
        "delete",
        "auto_reply",
        "assign_to_user",
      ],
      mail_sync_status: ["idle", "syncing", "error", "disabled"],
      notification_channel: ["in_app", "email", "sms", "push"],
      notification_priority: ["low", "normal", "high", "urgent"],
      user_role_type: [
        "super_admin",
        "admin",
        "advisor",
        "member",
        "manager",
        "staff",
        "guest",
        "crm_user",
        "concierge",
      ],
    },
  },
} as const
