export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'librarian' | 'student' | 'guest'
export type ContentStatus = 'available' | 'borrowed' | 'reserved' | 'archived'
export type BorrowStatus = 'borrowed' | 'returned' | 'overdue'
export type ReservationStatus = 'pending' | 'fulfilled' | 'expired' | 'cancelled'
export type WaitlistStatus = 'waiting' | 'notified' | 'expired'
export type ContentAccessLevel = 'public' | 'restricted' | 'institution_only' | 'subscription_only'
export type ContentViewMode = 'full_access' | 'view_only'
export type ExternalSystemType = 'moodle' | 'jstor' | 'proquest' | 'other'
export type FeedbackType = 'bug' | 'feature' | 'support' | 'other'
export type FeedbackStatus = 'pending' | 'in_progress' | 'resolved' | 'closed'
export type BackupStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          role: UserRole
          address: string | null
          phone: string | null
          registration_date: string | null
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          role?: UserRole
          address?: string | null
          phone?: string | null
          registration_date?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          role?: UserRole
          address?: string | null
          phone?: string | null
          registration_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      authors: {
        Row: {
          author_id: number
          name: string
          bio: string | null
          birth_date: string | null
          nationality: string | null
        }
        Insert: {
          author_id?: number
          name: string
          bio?: string | null
          birth_date?: string | null
          nationality?: string | null
        }
        Update: {
          author_id?: number
          name?: string
          bio?: string | null
          birth_date?: string | null
          nationality?: string | null
        }
        Relationships: []
      }
      book_authors: {
        Row: {
          content_id: number
          author_id: number
        }
        Insert: {
          content_id: number
          author_id: number
        }
        Update: {
          content_id?: number
          author_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "book_authors_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["author_id"]
          },
          {
            foreignKeyName: "book_authors_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "digital_content"
            referencedColumns: ["content_id"]
          }
        ]
      }
      digital_content: {
        Row: {
          content_id: number
          title: string
          description: string | null
          file_type: string
          file_url: string
          cover_image_url: string | null
          status: ContentStatus
          upload_date: string
          genre_id: number | null
          publisher: string | null
          created_by: string | null
          updated_by: string | null
          access_level: ContentAccessLevel
          view_mode: ContentViewMode
          institution_id: string | null
          watermark_enabled: boolean
          drm_enabled: boolean
        }
        Insert: {
          content_id?: number
          title: string
          description?: string | null
          file_type: string
          file_url: string
          cover_image_url?: string | null
          status?: ContentStatus
          upload_date?: string
          genre_id?: number | null
          publisher?: string | null
          created_by?: string | null
          updated_by?: string | null
          access_level?: ContentAccessLevel
          view_mode?: ContentViewMode
          institution_id?: string | null
          watermark_enabled?: boolean
          drm_enabled?: boolean
        }
        Update: {
          content_id?: number
          title?: string
          description?: string | null
          file_type?: string
          file_url?: string
          cover_image_url?: string | null
          status?: ContentStatus
          upload_date?: string
          genre_id?: number | null
          publisher?: string | null
          created_by?: string | null
          updated_by?: string | null
          access_level?: ContentAccessLevel
          view_mode?: ContentViewMode
          institution_id?: string | null
          watermark_enabled?: boolean
          drm_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "digital_content_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["genre_id"]
          }
        ]
      }
      genres: {
        Row: {
          genre_id: number
          name: string
          description: string | null
        }
        Insert: {
          genre_id?: number
          name: string
          description?: string | null
        }
        Update: {
          genre_id?: number
          name?: string
          description?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          tag_id: number
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          tag_id?: number
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          tag_id?: number
          name?: string
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      content_tags: {
        Row: {
          content_id: number
          tag_id: number
        }
        Insert: {
          content_id: number
          tag_id: number
        }
        Update: {
          content_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_tags_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "digital_content"
            referencedColumns: ["content_id"]
          },
          {
            foreignKeyName: "content_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["tag_id"]
          }
        ]
      }
      borrow_records: {
        Row: {
          borrow_id: number
          user_id: string
          content_id: number
          borrow_date: string
          due_date: string
          return_date: string | null
          status: BorrowStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          borrow_id?: number
          user_id: string
          content_id: number
          borrow_date?: string
          due_date: string
          return_date?: string | null
          status?: BorrowStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          borrow_id?: number
          user_id?: string
          content_id?: number
          borrow_date?: string
          due_date?: string
          return_date?: string | null
          status?: BorrowStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "borrow_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrow_records_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "digital_content"
            referencedColumns: ["content_id"]
          }
        ]
      }
      reservations: {
        Row: {
          reservation_id: number
          user_id: string
          content_id: number
          reservation_date: string
          expiry_date: string
          status: ReservationStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          reservation_id?: number
          user_id: string
          content_id: number
          reservation_date?: string
          expiry_date: string
          status?: ReservationStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          reservation_id?: number
          user_id?: string
          content_id?: number
          reservation_date?: string
          expiry_date?: string
          status?: ReservationStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "digital_content"
            referencedColumns: ["content_id"]
          }
        ]
      }
      waitlist: {
        Row: {
          waitlist_id: number
          user_id: string
          content_id: number
          join_date: string
          position: number
          status: WaitlistStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          waitlist_id?: number
          user_id: string
          content_id: number
          join_date?: string
          position: number
          status?: WaitlistStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          waitlist_id?: number
          user_id?: string
          content_id?: number
          join_date?: string
          position?: number
          status?: WaitlistStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "digital_content"
            referencedColumns: ["content_id"]
          }
        ]
      }
      external_systems: {
        Row: {
          id: string
          name: string
          type: ExternalSystemType
          url: string
          api_key: string | null
          client_id: string | null
          client_secret: string | null
          enabled: boolean
          last_sync_at: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          name: string
          type: ExternalSystemType
          url: string
          api_key?: string | null
          client_id?: string | null
          client_secret?: string | null
          enabled?: boolean
          last_sync_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: ExternalSystemType
          url?: string
          api_key?: string | null
          client_id?: string | null
          client_secret?: string | null
          enabled?: boolean
          last_sync_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_systems_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_systems_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      external_content_mappings: {
        Row: {
          id: string
          content_id: number
          external_system_id: string
          external_resource_id: string
          external_url: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content_id: number
          external_system_id: string
          external_resource_id: string
          external_url?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content_id?: number
          external_system_id?: string
          external_resource_id?: string
          external_url?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_content_mappings_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "digital_content"
            referencedColumns: ["content_id"]
          },
          {
            foreignKeyName: "external_content_mappings_external_system_id_fkey"
            columns: ["external_system_id"]
            isOneToOne: false
            referencedRelation: "external_systems"
            referencedColumns: ["id"]
          }
        ]
      }
      feedback: {
        Row: {
          feedback_id: string
          user_id: string
          type: FeedbackType
          message: string
          status: FeedbackStatus
          admin_response: string | null
          created_at: string
          updated_at: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          feedback_id?: string
          user_id: string
          type: FeedbackType
          message: string
          status?: FeedbackStatus
          admin_response?: string | null
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          feedback_id?: string
          user_id?: string
          type?: FeedbackType
          message?: string
          status?: FeedbackStatus
          admin_response?: string | null
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      system_backups: {
        Row: {
          backup_id: string
          name: string
          created_at: string
          created_by: string | null
          completed_at: string | null
          status: BackupStatus
          error_message: string | null
          file_size: number | null
          metadata: Json | null
        }
        Insert: {
          backup_id?: string
          name: string
          created_at?: string
          created_by?: string | null
          completed_at?: string | null
          status?: BackupStatus
          error_message?: string | null
          file_size?: number | null
          metadata?: Json | null
        }
        Update: {
          backup_id?: string
          name?: string
          created_at?: string
          created_by?: string | null
          completed_at?: string | null
          status?: BackupStatus
          error_message?: string | null
          file_size?: number | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "system_backups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      insert_author: {
        Args: {
          author_name: string
        }
        Returns: number
      }
      insert_digital_content: {
        Args: {
          p_title: string
          p_description: string | null
          p_file_type: string
          p_file_url: string
          p_cover_image_url: string | null
          p_genre_id: number | null
          p_publisher: string | null
          p_created_by: string
          p_updated_by: string
          p_access_level: ContentAccessLevel
          p_view_mode: ContentViewMode
          p_institution_id: string | null
          p_watermark_enabled: boolean
          p_drm_enabled: boolean
        }
        Returns: number
      }
      insert_book_author: {
        Args: {
          p_content_id: number
          p_author_id: number
        }
        Returns: void
      }
      add_content_tag: {
        Args: {
          p_content_id: number
          p_tag_name: string
        }
        Returns: number
      }
      borrow_item: {
        Args: {
          p_user_id: string
          p_content_id: number
          p_due_date: string
        }
        Returns: number
      }
      return_item: {
        Args: {
          p_borrow_id: number
        }
        Returns: boolean
      }
      reserve_item: {
        Args: {
          p_user_id: string
          p_content_id: number
          p_expiry_date: string
        }
        Returns: number
      }
      join_waitlist: {
        Args: {
          p_user_id: string
          p_content_id: number
        }
        Returns: number
      }
      update_waitlist_positions: {
        Args: {
          p_content_id: number
        }
        Returns: void
      }
      get_protected_content_url: {
        Args: {
          p_content_id: number
        }
        Returns: string
      }
      sync_external_content: {
        Args: {
          p_system_id: string
          p_metadata?: Json
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: UserRole
    }
  }
} 