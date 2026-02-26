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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action_type: string
          actor_user_id: string | null
          business_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          new_value_json: Json | null
          old_value_json: Json | null
        }
        Insert: {
          action_type: string
          actor_user_id?: string | null
          business_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_value_json?: Json | null
          old_value_json?: Json | null
        }
        Update: {
          action_type?: string
          actor_user_id?: string | null
          business_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_value_json?: Json | null
          old_value_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          business_id: string
          config_json: Json | null
          created_at: string
          id: string
          is_enabled: boolean
          name: string
          trigger_event_type: string
          updated_at: string
        }
        Insert: {
          business_id: string
          config_json?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          name: string
          trigger_event_type: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          config_json?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          name?: string
          trigger_event_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_runs: {
        Row: {
          business_id: string
          created_at: string
          event_id: string | null
          id: string
          logs_json: Json | null
          rule_id: string
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string
          event_id?: string | null
          id?: string
          logs_json?: Json | null
          rule_id: string
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          event_id?: string | null
          id?: string
          logs_json?: Json | null
          rule_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "system_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          logo_url: string | null
          name: string
          status: Database["public"]["Enums"]["business_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          status?: Database["public"]["Enums"]["business_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          status?: Database["public"]["Enums"]["business_status"]
          updated_at?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          business_id: string
          created_at: string
          created_by_user_id: string
          description: string | null
          end_datetime: string
          id: string
          start_datetime: string
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["calendar_visibility"]
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by_user_id: string
          description?: string | null
          end_datetime: string
          id?: string
          start_datetime: string
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["calendar_visibility"]
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          end_datetime?: string
          id?: string
          start_datetime?: string
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["calendar_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          assigned_to_user_id: string | null
          business_id: string
          channel: Database["public"]["Enums"]["inquiry_channel"]
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          landing_page_url: string | null
          lead_id: string | null
          message: string | null
          name: string
          phone: string | null
          preferred_contact_method:
            | Database["public"]["Enums"]["preferred_contact"]
            | null
          service_interest: string | null
          source: Database["public"]["Enums"]["inquiry_source"]
          status: Database["public"]["Enums"]["inquiry_status"]
          suburb: string | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          assigned_to_user_id?: string | null
          business_id: string
          channel?: Database["public"]["Enums"]["inquiry_channel"]
          created_at?: string
          deleted_at?: string | null
          email: string
          id?: string
          landing_page_url?: string | null
          lead_id?: string | null
          message?: string | null
          name: string
          phone?: string | null
          preferred_contact_method?:
            | Database["public"]["Enums"]["preferred_contact"]
            | null
          service_interest?: string | null
          source?: Database["public"]["Enums"]["inquiry_source"]
          status?: Database["public"]["Enums"]["inquiry_status"]
          suburb?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          assigned_to_user_id?: string | null
          business_id?: string
          channel?: Database["public"]["Enums"]["inquiry_channel"]
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          landing_page_url?: string | null
          lead_id?: string | null
          message?: string | null
          name?: string
          phone?: string | null
          preferred_contact_method?:
            | Database["public"]["Enums"]["preferred_contact"]
            | null
          service_interest?: string | null
          source?: Database["public"]["Enums"]["inquiry_source"]
          status?: Database["public"]["Enums"]["inquiry_status"]
          suburb?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          business_id: string
          created_at: string
          credentials_encrypted_json: string | null
          id: string
          last_health_check_at: string | null
          provider: Database["public"]["Enums"]["integration_provider"]
          status: Database["public"]["Enums"]["integration_status"]
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          credentials_encrypted_json?: string | null
          id?: string
          last_health_check_at?: string | null
          provider: Database["public"]["Enums"]["integration_provider"]
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          credentials_encrypted_json?: string | null
          id?: string
          last_health_check_at?: string | null
          provider?: Database["public"]["Enums"]["integration_provider"]
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          actor_user_id: string
          business_id: string
          created_at: string
          details_json: Json | null
          id: string
          inquiry_id: string | null
          lead_id: string | null
          summary: string
          type: Database["public"]["Enums"]["lead_activity_type"]
        }
        Insert: {
          actor_user_id: string
          business_id: string
          created_at?: string
          details_json?: Json | null
          id?: string
          inquiry_id?: string | null
          lead_id?: string | null
          summary: string
          type?: Database["public"]["Enums"]["lead_activity_type"]
        }
        Update: {
          actor_user_id?: string
          business_id?: string
          created_at?: string
          details_json?: Json | null
          id?: string
          inquiry_id?: string | null
          lead_id?: string | null
          summary?: string
          type?: Database["public"]["Enums"]["lead_activity_type"]
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to_user_id: string | null
          business_id: string
          business_name: string | null
          created_at: string
          email: string
          estimated_budget: number | null
          id: string
          inquiry_id: string | null
          last_contacted_at: string | null
          name: string
          next_follow_up_at: string | null
          notes: string | null
          phone: string | null
          services_needed: string | null
          source: Database["public"]["Enums"]["lead_source"]
          stage: Database["public"]["Enums"]["lead_stage"]
          status: Database["public"]["Enums"]["lead_status"]
          suburb: string | null
          updated_at: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          business_id: string
          business_name?: string | null
          created_at?: string
          email: string
          estimated_budget?: number | null
          id?: string
          inquiry_id?: string | null
          last_contacted_at?: string | null
          name: string
          next_follow_up_at?: string | null
          notes?: string | null
          phone?: string | null
          services_needed?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          stage?: Database["public"]["Enums"]["lead_stage"]
          status?: Database["public"]["Enums"]["lead_status"]
          suburb?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to_user_id?: string | null
          business_id?: string
          business_name?: string | null
          created_at?: string
          email?: string
          estimated_budget?: number | null
          id?: string
          inquiry_id?: string | null
          last_contacted_at?: string | null
          name?: string
          next_follow_up_at?: string | null
          notes?: string | null
          phone?: string | null
          services_needed?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          stage?: Database["public"]["Enums"]["lead_stage"]
          status?: Database["public"]["Enums"]["lead_status"]
          suburb?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          business_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_id: string | null
          created_at: string
          deleted_at: string | null
          email: string
          failed_login_attempts: number
          full_name: string
          id: string
          is_email_verified: boolean
          locked_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          business_id?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          failed_login_attempts?: number
          full_name: string
          id?: string
          is_email_verified?: boolean
          locked_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          business_id?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          failed_login_attempts?: number
          full_name?: string
          id?: string
          is_email_verified?: boolean
          locked_until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          assigned_to_user_id: string
          business_id: string
          calendar_event_id: string | null
          created_at: string
          created_by_user_id: string
          due_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["reminder_entity_type"]
          id: string
          priority: Database["public"]["Enums"]["reminder_priority"]
          snoozed_until: string | null
          status: Database["public"]["Enums"]["reminder_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to_user_id: string
          business_id: string
          calendar_event_id?: string | null
          created_at?: string
          created_by_user_id: string
          due_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["reminder_entity_type"]
          id?: string
          priority?: Database["public"]["Enums"]["reminder_priority"]
          snoozed_until?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to_user_id?: string
          business_id?: string
          calendar_event_id?: string | null
          created_at?: string
          created_by_user_id?: string
          due_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["reminder_entity_type"]
          id?: string
          priority?: Database["public"]["Enums"]["reminder_priority"]
          snoozed_until?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_calendar_event_id_fkey"
            columns: ["calendar_event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          business_id: string
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      system_events: {
        Row: {
          business_id: string | null
          created_at: string
          event_type: string
          id: string
          payload_json: Json | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          payload_json?: Json | null
        }
        Update: {
          business_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          payload_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "system_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          business_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_business_id: { Args: { _user_id: string }; Returns: string }
      handle_signup: {
        Args: { _business_name: string; _email: string; _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "business_admin"
        | "manager"
        | "employee"
        | "client"
      business_status: "active" | "suspended" | "cancelled"
      calendar_visibility: "private" | "tenant"
      inquiry_channel:
        | "organic"
        | "google_ads"
        | "meta_ads"
        | "referral"
        | "direct"
        | "unknown"
      inquiry_source: "website_form" | "mobile_app" | "manual" | "other"
      inquiry_status:
        | "new"
        | "assigned"
        | "contacted"
        | "qualified"
        | "converted_to_lead"
        | "closed"
        | "spam"
      integration_provider:
        | "xero"
        | "stripe"
        | "eway"
        | "whatsapp"
        | "sms"
        | "google"
      integration_status: "active" | "inactive" | "error"
      lead_activity_type:
        | "call"
        | "email"
        | "whatsapp"
        | "note"
        | "meeting"
        | "status_change"
      lead_source: "inquiry" | "cold_call" | "referral" | "manual" | "other"
      lead_stage:
        | "new"
        | "contacted"
        | "meeting_booked"
        | "proposal_requested"
        | "negotiation"
        | "won"
        | "lost"
      lead_status: "active" | "archived"
      notification_type: "info" | "warning" | "system" | "reminder"
      preferred_contact: "call" | "email" | "whatsapp"
      reminder_entity_type: "inquiry" | "lead"
      reminder_priority: "low" | "medium" | "high"
      reminder_status: "pending" | "done" | "snoozed" | "cancelled" | "overdue"
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
      app_role: [
        "super_admin",
        "business_admin",
        "manager",
        "employee",
        "client",
      ],
      business_status: ["active", "suspended", "cancelled"],
      calendar_visibility: ["private", "tenant"],
      inquiry_channel: [
        "organic",
        "google_ads",
        "meta_ads",
        "referral",
        "direct",
        "unknown",
      ],
      inquiry_source: ["website_form", "mobile_app", "manual", "other"],
      inquiry_status: [
        "new",
        "assigned",
        "contacted",
        "qualified",
        "converted_to_lead",
        "closed",
        "spam",
      ],
      integration_provider: [
        "xero",
        "stripe",
        "eway",
        "whatsapp",
        "sms",
        "google",
      ],
      integration_status: ["active", "inactive", "error"],
      lead_activity_type: [
        "call",
        "email",
        "whatsapp",
        "note",
        "meeting",
        "status_change",
      ],
      lead_source: ["inquiry", "cold_call", "referral", "manual", "other"],
      lead_stage: [
        "new",
        "contacted",
        "meeting_booked",
        "proposal_requested",
        "negotiation",
        "won",
        "lost",
      ],
      lead_status: ["active", "archived"],
      notification_type: ["info", "warning", "system", "reminder"],
      preferred_contact: ["call", "email", "whatsapp"],
      reminder_entity_type: ["inquiry", "lead"],
      reminder_priority: ["low", "medium", "high"],
      reminder_status: ["pending", "done", "snoozed", "cancelled", "overdue"],
    },
  },
} as const
