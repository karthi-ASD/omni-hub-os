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
      account_suspensions: {
        Row: {
          business_id: string
          client_id: string | null
          created_at: string
          id: string
          is_active: boolean
          reason: string | null
          reinstated_at: string | null
          suspended_at: string
        }
        Insert: {
          business_id: string
          client_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          reason?: string | null
          reinstated_at?: string | null
          suspended_at?: string
        }
        Update: {
          business_id?: string
          client_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          reason?: string | null
          reinstated_at?: string | null
          suspended_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_suspensions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_suspensions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      acquisition_scenarios: {
        Row: {
          cost_savings: number
          created_at: string
          id: string
          integration_plan_json: Json | null
          projected_synergy: number
          purchase_price: number
          roi_projection: number
          target_id: string | null
        }
        Insert: {
          cost_savings?: number
          created_at?: string
          id?: string
          integration_plan_json?: Json | null
          projected_synergy?: number
          purchase_price?: number
          roi_projection?: number
          target_id?: string | null
        }
        Update: {
          cost_savings?: number
          created_at?: string
          id?: string
          integration_plan_json?: Json | null
          projected_synergy?: number
          purchase_price?: number
          roi_projection?: number
          target_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acquisition_scenarios_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "acquisition_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      acquisition_targets: {
        Row: {
          acquisition_score: number
          arr: number
          churn_rate: number
          company_name: string
          created_at: string
          id: string
          integration_complexity_score: number
          margin: number
          status: string
          tech_stack: string | null
        }
        Insert: {
          acquisition_score?: number
          arr?: number
          churn_rate?: number
          company_name: string
          created_at?: string
          id?: string
          integration_complexity_score?: number
          margin?: number
          status?: string
          tech_stack?: string | null
        }
        Update: {
          acquisition_score?: number
          arr?: number
          churn_rate?: number
          company_name?: string
          created_at?: string
          id?: string
          integration_complexity_score?: number
          margin?: number
          status?: string
          tech_stack?: string | null
        }
        Relationships: []
      }
      agent_interactions: {
        Row: {
          context_json: Json | null
          created_at: string
          id: string
          interaction_type: string
          source_agent_id: string | null
          target_agent_id: string | null
        }
        Insert: {
          context_json?: Json | null
          created_at?: string
          id?: string
          interaction_type: string
          source_agent_id?: string | null
          target_agent_id?: string | null
        }
        Update: {
          context_json?: Json | null
          created_at?: string
          id?: string
          interaction_type?: string
          source_agent_id?: string | null
          target_agent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_interactions_source_agent_id_fkey"
            columns: ["source_agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_interactions_target_agent_id_fkey"
            columns: ["target_agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_actions: {
        Row: {
          action_type: string
          approved_by_user_id: string | null
          created_at: string
          executed_at: string | null
          id: string
          payload_json: Json | null
          result_json: Json | null
          task_id: string
        }
        Insert: {
          action_type: string
          approved_by_user_id?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          payload_json?: Json | null
          result_json?: Json | null
          task_id: string
        }
        Update: {
          action_type?: string
          approved_by_user_id?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          payload_json?: Json | null
          result_json?: Json | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_actions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_goals: {
        Row: {
          agent_id: string
          created_at: string
          end_date: string | null
          goal_type: string
          id: string
          start_date: string | null
          status: string
          target_metrics_json: Json | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          end_date?: string | null
          goal_type: string
          id?: string
          start_date?: string | null
          status?: string
          target_metrics_json?: Json | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          end_date?: string | null
          goal_type?: string
          id?: string
          start_date?: string | null
          status?: string
          target_metrics_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_goals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_tasks: {
        Row: {
          agent_id: string
          approval_required: boolean
          created_at: string
          id: string
          related_entity_id: string | null
          related_entity_type: string | null
          status: string
          task_plan_json: Json | null
          task_title: string
        }
        Insert: {
          agent_id: string
          approval_required?: boolean
          created_at?: string
          id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string
          task_plan_json?: Json | null
          task_title: string
        }
        Update: {
          agent_id?: string
          approval_required?: boolean
          created_at?: string
          id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string
          task_plan_json?: Json | null
          task_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          agent_name: string
          autonomy_level: string
          business_id: string | null
          created_at: string
          enabled: boolean
          id: string
          scope: string
        }
        Insert: {
          agent_name: string
          autonomy_level?: string
          business_id?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          scope: string
        }
        Update: {
          agent_name?: string
          autonomy_level?: string
          business_id?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_expansion_strategies: {
        Row: {
          confidence: number
          created_at: string
          id: string
          projected_roi: number
          recommended_action: string
          target_region: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          id?: string
          projected_roi?: number
          recommended_action?: string
          target_region: string
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          projected_roi?: number
          recommended_action?: string
          target_region?: string
        }
        Relationships: []
      }
      ai_sales_forecasts: {
        Row: {
          business_id: string
          confidence: number | null
          created_at: string
          factors_json: Json | null
          id: string
          period: string
          projected_revenue: number
        }
        Insert: {
          business_id: string
          confidence?: number | null
          created_at?: string
          factors_json?: Json | null
          id?: string
          period: string
          projected_revenue?: number
        }
        Update: {
          business_id?: string
          confidence?: number | null
          created_at?: string
          factors_json?: Json | null
          id?: string
          period?: string
          projected_revenue?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_sales_forecasts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_strategy_engine: {
        Row: {
          autonomy_level: string
          business_id: string | null
          created_at: string
          goal_metrics_json: Json | null
          id: string
          status: string
          strategy_type: string
        }
        Insert: {
          autonomy_level?: string
          business_id?: string | null
          created_at?: string
          goal_metrics_json?: Json | null
          id?: string
          status?: string
          strategy_type?: string
        }
        Update: {
          autonomy_level?: string
          business_id?: string | null
          created_at?: string
          goal_metrics_json?: Json | null
          id?: string
          status?: string
          strategy_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_strategy_engine_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tasks: {
        Row: {
          business_id: string
          confidence_score: number | null
          created_at: string
          id: string
          input_json: Json | null
          output_json: Json | null
          status: string
          task_type: string
        }
        Insert: {
          business_id: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          input_json?: Json | null
          output_json?: Json | null
          status?: string
          task_type: string
        }
        Update: {
          business_id?: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          input_json?: Json | null
          output_json?: Json | null
          status?: string
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tasks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          business_id: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata_json: Json | null
        }
        Insert: {
          business_id: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metadata_json?: Json | null
        }
        Update: {
          business_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          business_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_name: string
          key_prefix: string
          last_used_at: string | null
          scopes: string[] | null
        }
        Insert: {
          business_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_name: string
          key_prefix: string
          last_used_at?: string | null
          scopes?: string[] | null
        }
        Update: {
          business_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_name?: string
          key_prefix?: string
          last_used_at?: string | null
          scopes?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage_logs: {
        Row: {
          api_key_id: string | null
          cost: number | null
          created_at: string
          endpoint: string
          id: string
          request_count: number
        }
        Insert: {
          api_key_id?: string | null
          cost?: number | null
          created_at?: string
          endpoint: string
          id?: string
          request_count?: number
        }
        Update: {
          api_key_id?: string | null
          cost?: number | null
          created_at?: string
          endpoint?: string
          id?: string
          request_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      app_builds: {
        Row: {
          build_log: string | null
          build_status: string
          bundle_id: string | null
          business_id: string
          created_at: string
          id: string
          platform: string
          store_status: string
          version: string
        }
        Insert: {
          build_log?: string | null
          build_status?: string
          bundle_id?: string | null
          business_id: string
          created_at?: string
          id?: string
          platform: string
          store_status?: string
          version?: string
        }
        Update: {
          build_log?: string | null
          build_status?: string
          bundle_id?: string | null
          business_id?: string
          created_at?: string
          id?: string
          platform?: string
          store_status?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_builds_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
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
      background_jobs: {
        Row: {
          business_id: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          job_type: string
          max_retries: number
          payload_json: Json | null
          retries: number
          started_at: string | null
          status: string
        }
        Insert: {
          business_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type: string
          max_retries?: number
          payload_json?: Json | null
          retries?: number
          started_at?: string | null
          status?: string
        }
        Update: {
          business_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type?: string
          max_retries?: number
          payload_json?: Json | null
          retries?: number
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "background_jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_accounts: {
        Row: {
          business_id: string
          created_at: string
          environment: Database["public"]["Enums"]["gateway_environment"]
          eway_api_key: string | null
          eway_customer_id: string | null
          eway_password: string | null
          gateway_provider: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          environment?: Database["public"]["Enums"]["gateway_environment"]
          eway_api_key?: string | null
          eway_customer_id?: string | null
          eway_password?: string | null
          gateway_provider?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          environment?: Database["public"]["Enums"]["gateway_environment"]
          eway_api_key?: string | null
          eway_customer_id?: string | null
          eway_password?: string | null
          gateway_provider?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_accounts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_products: {
        Row: {
          billing_type: Database["public"]["Enums"]["billing_type"]
          business_id: string | null
          category: Database["public"]["Enums"]["product_category"]
          created_at: string
          currency: string
          default_price: number
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          billing_type?: Database["public"]["Enums"]["billing_type"]
          business_id?: string | null
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          currency?: string
          default_price?: number
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          billing_type?: Database["public"]["Enums"]["billing_type"]
          business_id?: string | null
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          currency?: string
          default_price?: number
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      board_meetings: {
        Row: {
          agenda: string | null
          created_at: string
          id: string
          meeting_date: string
          minutes: string | null
          resolution_summary: string | null
        }
        Insert: {
          agenda?: string | null
          created_at?: string
          id?: string
          meeting_date: string
          minutes?: string | null
          resolution_summary?: string | null
        }
        Update: {
          agenda?: string | null
          created_at?: string
          id?: string
          meeting_date?: string
          minutes?: string | null
          resolution_summary?: string | null
        }
        Relationships: []
      }
      board_members: {
        Row: {
          appointed_at: string
          id: string
          name: string
          role: string
          voting_power: number
        }
        Insert: {
          appointed_at?: string
          id?: string
          name: string
          role?: string
          voting_power?: number
        }
        Update: {
          appointed_at?: string
          id?: string
          name?: string
          role?: string
          voting_power?: number
        }
        Relationships: []
      }
      brands: {
        Row: {
          brand_name: string
          created_at: string
          custom_css: string | null
          domain: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          owner_business_id: string
          primary_color: string | null
          secondary_color: string | null
        }
        Insert: {
          brand_name: string
          created_at?: string
          custom_css?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          owner_business_id: string
          primary_color?: string | null
          secondary_color?: string | null
        }
        Update: {
          brand_name?: string
          created_at?: string
          custom_css?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          owner_business_id?: string
          primary_color?: string | null
          secondary_color?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_owner_business_id_fkey"
            columns: ["owner_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
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
      call_logs: {
        Row: {
          business_id: string
          call_time: string
          call_type: Database["public"]["Enums"]["call_type"]
          caller_user_id: string
          created_at: string
          duration_seconds: number | null
          id: string
          notes: string | null
          outcome: Database["public"]["Enums"]["call_outcome"]
          related_entity_id: string
          related_entity_type: string
        }
        Insert: {
          business_id: string
          call_time?: string
          call_type?: Database["public"]["Enums"]["call_type"]
          caller_user_id: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          outcome: Database["public"]["Enums"]["call_outcome"]
          related_entity_id: string
          related_entity_type: string
        }
        Update: {
          business_id?: string
          call_time?: string
          call_type?: Database["public"]["Enums"]["call_type"]
          caller_user_id?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          outcome?: Database["public"]["Enums"]["call_outcome"]
          related_entity_id?: string
          related_entity_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_allocation_models: {
        Row: {
          created_at: string
          id: string
          investment_amount: number
          projected_roi: number
          risk_score: number
          scenario_type: string
          time_horizon: number
        }
        Insert: {
          created_at?: string
          id?: string
          investment_amount?: number
          projected_roi?: number
          risk_score?: number
          scenario_type?: string
          time_horizon?: number
        }
        Update: {
          created_at?: string
          id?: string
          investment_amount?: number
          projected_roi?: number
          risk_score?: number
          scenario_type?: string
          time_horizon?: number
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          business_id: string
          company_name: string | null
          contact_name: string
          created_at: string
          deal_id: string | null
          email: string
          id: string
          onboarding_status: Database["public"]["Enums"]["onboarding_status"]
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          business_id: string
          company_name?: string | null
          contact_name: string
          created_at?: string
          deal_id?: string | null
          email: string
          id?: string
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          business_id?: string
          company_name?: string | null
          contact_name?: string
          created_at?: string
          deal_id?: string | null
          email?: string
          id?: string
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      communications_log: {
        Row: {
          body: string | null
          business_id: string
          channel: string
          client_id: string | null
          created_at: string
          id: string
          sent_at: string
          subject: string | null
        }
        Insert: {
          body?: string | null
          business_id: string
          channel?: string
          client_id?: string | null
          created_at?: string
          id?: string
          sent_at?: string
          subject?: string | null
        }
        Update: {
          body?: string | null
          business_id?: string
          channel?: string
          client_id?: string | null
          created_at?: string
          id?: string
          sent_at?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communications_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      communications_providers: {
        Row: {
          business_id: string | null
          channel: string
          created_at: string
          credentials_json: string | null
          id: string
          is_active: boolean
          provider_type: string
        }
        Insert: {
          business_id?: string | null
          channel: string
          created_at?: string
          credentials_json?: string | null
          id?: string
          is_active?: boolean
          provider_type: string
        }
        Update: {
          business_id?: string | null
          channel?: string
          created_at?: string
          credentials_json?: string | null
          id?: string
          is_active?: boolean
          provider_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_providers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      communications_sends: {
        Row: {
          business_id: string | null
          channel: string
          created_at: string
          id: string
          provider_type: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          status: string
          to_address: string
        }
        Insert: {
          business_id?: string | null
          channel: string
          created_at?: string
          id?: string
          provider_type?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string
          to_address: string
        }
        Update: {
          business_id?: string | null
          channel?: string
          created_at?: string
          id?: string
          provider_type?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string
          to_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_sends_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      communications_templates: {
        Row: {
          body: string | null
          business_id: string | null
          channel: string
          created_at: string
          id: string
          subject: string | null
          template_key: string
          variables_json: Json | null
        }
        Insert: {
          body?: string | null
          business_id?: string | null
          channel: string
          created_at?: string
          id?: string
          subject?: string | null
          template_key: string
          variables_json?: Json | null
        }
        Update: {
          body?: string | null
          business_id?: string | null
          channel?: string
          created_at?: string
          id?: string
          subject?: string | null
          template_key?: string
          variables_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "communications_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      competitive_benchmarks: {
        Row: {
          competitor_id: string | null
          competitor_value: number
          created_at: string
          delta: number
          id: string
          metric: string
          nextweb_value: number
        }
        Insert: {
          competitor_id?: string | null
          competitor_value?: number
          created_at?: string
          delta?: number
          id?: string
          metric: string
          nextweb_value?: number
        }
        Update: {
          competitor_id?: string | null
          competitor_value?: number
          created_at?: string
          delta?: number
          id?: string
          metric?: string
          nextweb_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "competitive_benchmarks_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          company_name: string
          created_at: string
          estimated_arr: number
          feature_overlap_score: number
          id: string
          pricing_comparison: string | null
          strength_score: number
          threat_level: string
        }
        Insert: {
          company_name: string
          created_at?: string
          estimated_arr?: number
          feature_overlap_score?: number
          id?: string
          pricing_comparison?: string | null
          strength_score?: number
          threat_level?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          estimated_arr?: number
          feature_overlap_score?: number
          id?: string
          pricing_comparison?: string | null
          strength_score?: number
          threat_level?: string
        }
        Relationships: []
      }
      compliance_requests: {
        Row: {
          business_id: string | null
          completed_at: string | null
          created_at: string
          file_url: string | null
          id: string
          request_type: string
          requested_by: string | null
          status: string
        }
        Insert: {
          business_id?: string | null
          completed_at?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          request_type: string
          requested_by?: string | null
          status?: string
        }
        Update: {
          business_id?: string | null
          completed_at?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          request_type?: string
          requested_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          business_id: string
          contract_content: string | null
          contract_number: number
          created_at: string
          created_by_user_id: string
          deal_id: string
          id: string
          proposal_id: string | null
          signed_at: string | null
          status: Database["public"]["Enums"]["contract_status"]
          updated_at: string
        }
        Insert: {
          business_id: string
          contract_content?: string | null
          contract_number?: number
          created_at?: string
          created_by_user_id: string
          deal_id: string
          id?: string
          proposal_id?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          contract_content?: string | null
          contract_number?: number
          created_at?: string
          created_by_user_id?: string
          deal_id?: string
          id?: string
          proposal_id?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_entities: {
        Row: {
          created_at: string
          entity_name: string
          entity_type: string
          id: string
          jurisdiction: string | null
          parent_entity_id: string | null
          tax_structure_notes: string | null
        }
        Insert: {
          created_at?: string
          entity_name: string
          entity_type?: string
          id?: string
          jurisdiction?: string | null
          parent_entity_id?: string | null
          tax_structure_notes?: string | null
        }
        Update: {
          created_at?: string
          entity_name?: string
          entity_type?: string
          id?: string
          jurisdiction?: string | null
          parent_entity_id?: string | null
          tax_structure_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corporate_entities_parent_entity_id_fkey"
            columns: ["parent_entity_id"]
            isOneToOne: false
            referencedRelation: "corporate_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      data_room_documents: {
        Row: {
          access_level: string
          category: string
          file_url: string | null
          id: string
          title: string
          uploaded_at: string
          version: string | null
        }
        Insert: {
          access_level?: string
          category?: string
          file_url?: string | null
          id?: string
          title: string
          uploaded_at?: string
          version?: string | null
        }
        Update: {
          access_level?: string
          category?: string
          file_url?: string | null
          id?: string
          title?: string
          uploaded_at?: string
          version?: string | null
        }
        Relationships: []
      }
      deal_notes: {
        Row: {
          author_user_id: string
          business_id: string
          created_at: string
          deal_id: string
          id: string
          note: string
        }
        Insert: {
          author_user_id: string
          business_id: string
          created_at?: string
          deal_id: string
          id?: string
          note: string
        }
        Update: {
          author_user_id?: string
          business_id?: string
          created_at?: string
          deal_id?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_notes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_stage_history: {
        Row: {
          business_id: string
          changed_by_user_id: string
          created_at: string
          deal_id: string
          from_stage: Database["public"]["Enums"]["deal_stage"] | null
          id: string
          notes: string | null
          to_stage: Database["public"]["Enums"]["deal_stage"]
        }
        Insert: {
          business_id: string
          changed_by_user_id: string
          created_at?: string
          deal_id: string
          from_stage?: Database["public"]["Enums"]["deal_stage"] | null
          id?: string
          notes?: string | null
          to_stage: Database["public"]["Enums"]["deal_stage"]
        }
        Update: {
          business_id?: string
          changed_by_user_id?: string
          created_at?: string
          deal_id?: string
          from_stage?: Database["public"]["Enums"]["deal_stage"] | null
          id?: string
          notes?: string | null
          to_stage?: Database["public"]["Enums"]["deal_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "deal_stage_history_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_stage_history_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          business_id: string
          business_name: string | null
          contact_name: string
          created_at: string
          created_by_user_id: string
          currency: string
          deal_name: string
          email: string
          estimated_value: number | null
          expected_close_date: string | null
          id: string
          inquiry_id: string | null
          lead_id: string | null
          lost_reason: string | null
          owner_user_id: string | null
          phone: string | null
          service_interest: string | null
          stage: Database["public"]["Enums"]["deal_stage"]
          status: Database["public"]["Enums"]["deal_status"]
          updated_at: string
        }
        Insert: {
          business_id: string
          business_name?: string | null
          contact_name: string
          created_at?: string
          created_by_user_id: string
          currency?: string
          deal_name: string
          email: string
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          inquiry_id?: string | null
          lead_id?: string | null
          lost_reason?: string | null
          owner_user_id?: string | null
          phone?: string | null
          service_interest?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          status?: Database["public"]["Enums"]["deal_status"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          business_name?: string | null
          contact_name?: string
          created_at?: string
          created_by_user_id?: string
          currency?: string
          deal_name?: string
          email?: string
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          inquiry_id?: string | null
          lead_id?: string | null
          lost_reason?: string | null
          owner_user_id?: string | null
          phone?: string | null
          service_interest?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          status?: Database["public"]["Enums"]["deal_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      deployment_logs: {
        Row: {
          created_at: string
          deployed_by: string | null
          environment: string
          id: string
          notes: string | null
          status: string
          version: string
        }
        Insert: {
          created_at?: string
          deployed_by?: string | null
          environment?: string
          id?: string
          notes?: string | null
          status?: string
          version: string
        }
        Update: {
          created_at?: string
          deployed_by?: string | null
          environment?: string
          id?: string
          notes?: string | null
          status?: string
          version?: string
        }
        Relationships: []
      }
      dunning_rules: {
        Row: {
          action: Database["public"]["Enums"]["dunning_action"]
          business_id: string
          created_at: string
          days_offset: number
          id: string
          is_active: boolean
          message_template: string | null
        }
        Insert: {
          action?: Database["public"]["Enums"]["dunning_action"]
          business_id: string
          created_at?: string
          days_offset?: number
          id?: string
          is_active?: boolean
          message_template?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["dunning_action"]
          business_id?: string
          created_at?: string
          days_offset?: number
          id?: string
          is_active?: boolean
          message_template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dunning_rules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          business_id: string | null
          created_at: string
          error_type: string
          id: string
          message: string
          metadata_json: Json | null
          request_path: string | null
          stack_trace: string | null
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          error_type?: string
          id?: string
          message: string
          metadata_json?: Json | null
          request_path?: string | null
          stack_trace?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string
          error_type?: string
          id?: string
          message?: string
          metadata_json?: Json | null
          request_path?: string | null
          stack_trace?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      eway_events: {
        Row: {
          business_id: string | null
          created_at: string
          eway_reference: string | null
          id: string
          payload_json: Json | null
          processed_at: string | null
          status: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          eway_reference?: string | null
          id?: string
          payload_json?: Json | null
          processed_at?: string | null
          status?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          eway_reference?: string | null
          id?: string
          payload_json?: Json | null
          processed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "eway_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      expansion_targets: {
        Row: {
          created_at: string
          demand_score: number
          id: string
          industry: string | null
          partner_gap_score: number
          region: string
          sales_density: number
          seo_opportunity_score: number
        }
        Insert: {
          created_at?: string
          demand_score?: number
          id?: string
          industry?: string | null
          partner_gap_score?: number
          region: string
          sales_density?: number
          seo_opportunity_score?: number
        }
        Update: {
          created_at?: string
          demand_score?: number
          id?: string
          industry?: string | null
          partner_gap_score?: number
          region?: string
          sales_density?: number
          seo_opportunity_score?: number
        }
        Relationships: []
      }
      external_api_registry: {
        Row: {
          created_at: string
          id: string
          is_configured: boolean
          last_tested_at: string | null
          provider_name: string
          purpose: string
          required_keys: string[] | null
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_configured?: boolean
          last_tested_at?: string | null
          provider_name: string
          purpose: string
          required_keys?: string[] | null
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_configured?: boolean
          last_tested_at?: string | null
          provider_name?: string
          purpose?: string
          required_keys?: string[] | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      fact_leads: {
        Row: {
          business_id: string | null
          conversion_rate: number | null
          converted: number | null
          created_at: string
          id: string
          period: string
          total_leads: number | null
        }
        Insert: {
          business_id?: string | null
          conversion_rate?: number | null
          converted?: number | null
          created_at?: string
          id?: string
          period: string
          total_leads?: number | null
        }
        Update: {
          business_id?: string | null
          conversion_rate?: number | null
          converted?: number | null
          created_at?: string
          id?: string
          period?: string
          total_leads?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fact_leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_revenue: {
        Row: {
          business_id: string | null
          created_at: string
          id: string
          invoice_count: number | null
          paid_count: number | null
          period: string
          revenue: number
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          id?: string
          invoice_count?: number | null
          paid_count?: number | null
          period: string
          revenue?: number
        }
        Update: {
          business_id?: string | null
          created_at?: string
          id?: string
          invoice_count?: number | null
          paid_count?: number | null
          period?: string
          revenue?: number
        }
        Relationships: [
          {
            foreignKeyName: "fact_revenue_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_models: {
        Row: {
          created_at: string
          entry_fee: number
          id: string
          projected_break_even_month: number
          region: string
          required_team_size: number
          revenue_share_percentage: number
          support_cost: number
        }
        Insert: {
          created_at?: string
          entry_fee?: number
          id?: string
          projected_break_even_month?: number
          region: string
          required_team_size?: number
          revenue_share_percentage?: number
          support_cost?: number
        }
        Update: {
          created_at?: string
          entry_fee?: number
          id?: string
          projected_break_even_month?: number
          region?: string
          required_team_size?: number
          revenue_share_percentage?: number
          support_cost?: number
        }
        Relationships: []
      }
      franchise_pipeline: {
        Row: {
          candidate_name: string
          capital_available: number
          created_at: string
          experience_score: number
          fit_score: number
          id: string
          region: string
          status: string
        }
        Insert: {
          candidate_name: string
          capital_available?: number
          created_at?: string
          experience_score?: number
          fit_score?: number
          id?: string
          region: string
          status?: string
        }
        Update: {
          candidate_name?: string
          capital_available?: number
          created_at?: string
          experience_score?: number
          fit_score?: number
          id?: string
          region?: string
          status?: string
        }
        Relationships: []
      }
      fundraising_rounds: {
        Row: {
          id: string
          opened_at: string
          round_type: string
          status: string
          target_amount: number
          valuation_target: number
        }
        Insert: {
          id?: string
          opened_at?: string
          round_type?: string
          status?: string
          target_amount?: number
          valuation_target?: number
        }
        Update: {
          id?: string
          opened_at?: string
          round_type?: string
          status?: string
          target_amount?: number
          valuation_target?: number
        }
        Relationships: []
      }
      gateway_events: {
        Row: {
          business_id: string | null
          created_at: string
          event_type: string | null
          gateway_type: string
          id: string
          mode: string
          payload_json: Json | null
          processed_at: string | null
          status: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          event_type?: string | null
          gateway_type: string
          id?: string
          mode?: string
          payload_json?: Json | null
          processed_at?: string | null
          status?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          event_type?: string | null
          gateway_type?: string
          id?: string
          mode?: string
          payload_json?: Json | null
          processed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "gateway_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      gateway_transactions: {
        Row: {
          amount: number
          business_id: string
          created_at: string
          currency: string
          eway_response_code: string | null
          eway_response_message: string | null
          eway_transaction_id: string | null
          id: string
          invoice_id: string | null
          raw_payload: Json | null
          status: Database["public"]["Enums"]["payment_gateway_status"]
        }
        Insert: {
          amount?: number
          business_id: string
          created_at?: string
          currency?: string
          eway_response_code?: string | null
          eway_response_message?: string | null
          eway_transaction_id?: string | null
          id?: string
          invoice_id?: string | null
          raw_payload?: Json | null
          status?: Database["public"]["Enums"]["payment_gateway_status"]
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string
          currency?: string
          eway_response_code?: string | null
          eway_response_message?: string | null
          eway_transaction_id?: string | null
          id?: string
          invoice_id?: string | null
          raw_payload?: Json | null
          status?: Database["public"]["Enums"]["payment_gateway_status"]
        }
        Relationships: [
          {
            foreignKeyName: "gateway_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gateway_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      infrastructure_nodes: {
        Row: {
          created_at: string
          id: string
          last_sync: string | null
          latency_ms: number | null
          region: string
          role: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_sync?: string | null
          latency_ms?: number | null
          region: string
          role?: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_sync?: string | null
          latency_ms?: number | null
          region?: string
          role?: string
          status?: string
        }
        Relationships: []
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
      investor_assumptions: {
        Row: {
          assumption_key: string
          id: string
          period: string | null
          updated_at: string
          updated_by: string | null
          value: number
        }
        Insert: {
          assumption_key: string
          id?: string
          period?: string | null
          updated_at?: string
          updated_by?: string | null
          value?: number
        }
        Update: {
          assumption_key?: string
          id?: string
          period?: string | null
          updated_at?: string
          updated_by?: string | null
          value?: number
        }
        Relationships: []
      }
      investor_contacts: {
        Row: {
          contact_name: string
          created_at: string
          email: string | null
          firm_name: string
          id: string
          next_followup_date: string | null
          notes: string | null
          probability: number | null
          round_id: string | null
          stage: string
        }
        Insert: {
          contact_name: string
          created_at?: string
          email?: string | null
          firm_name: string
          id?: string
          next_followup_date?: string | null
          notes?: string | null
          probability?: number | null
          round_id?: string | null
          stage?: string
        }
        Update: {
          contact_name?: string
          created_at?: string
          email?: string | null
          firm_name?: string
          id?: string
          next_followup_date?: string | null
          notes?: string | null
          probability?: number | null
          round_id?: string | null
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_contacts_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "fundraising_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_decks: {
        Row: {
          created_at: string
          created_by: string | null
          deck_version: string
          file_url: string | null
          generated_at: string
          id: string
          narrative_type: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deck_version?: string
          file_url?: string | null
          generated_at?: string
          id?: string
          narrative_type?: string
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deck_version?: string
          file_url?: string | null
          generated_at?: string
          id?: string
          narrative_type?: string
          status?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          amount: number
          billing_product_id: string | null
          business_id: string
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          unit_amount: number
        }
        Insert: {
          amount?: number
          billing_product_id?: string | null
          business_id: string
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          unit_amount?: number
        }
        Update: {
          amount?: number
          billing_product_id?: string | null
          business_id?: string
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          unit_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_billing_product_id_fkey"
            columns: ["billing_product_id"]
            isOneToOne: false
            referencedRelation: "billing_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number
          amount_paid: number
          business_id: string
          client_id: string | null
          created_at: string
          created_by_user_id: string | null
          currency: string
          deal_id: string | null
          discount: number
          due_date: string | null
          id: string
          invoice_number: number
          invoice_type: Database["public"]["Enums"]["invoice_type"]
          pdf_url: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          amount_due?: number
          amount_paid?: number
          business_id: string
          client_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          currency?: string
          deal_id?: string | null
          discount?: number
          due_date?: string | null
          id?: string
          invoice_number?: number
          invoice_type?: Database["public"]["Enums"]["invoice_type"]
          pdf_url?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          business_id?: string
          client_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          currency?: string
          deal_id?: string | null
          discount?: number
          due_date?: string | null
          id?: string
          invoice_number?: number
          invoice_type?: Database["public"]["Enums"]["invoice_type"]
          pdf_url?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ipo_readiness: {
        Row: {
          assessed_at: string
          audit_compliance_score: number
          board_independence_score: number
          governance_score: number
          id: string
          overall_readiness_score: number
          revenue_stability_score: number
          scalability_score: number
        }
        Insert: {
          assessed_at?: string
          audit_compliance_score?: number
          board_independence_score?: number
          governance_score?: number
          id?: string
          overall_readiness_score?: number
          revenue_stability_score?: number
          scalability_score?: number
        }
        Update: {
          assessed_at?: string
          audit_compliance_score?: number
          board_independence_score?: number
          governance_score?: number
          id?: string
          overall_readiness_score?: number
          revenue_stability_score?: number
          scalability_score?: number
        }
        Relationships: []
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
          ai_priority: string | null
          ai_recommended_action: string | null
          ai_score: number | null
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
          ai_priority?: string | null
          ai_recommended_action?: string | null
          ai_score?: number | null
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
          ai_priority?: string | null
          ai_recommended_action?: string | null
          ai_score?: number | null
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
      partner_attribution: {
        Row: {
          attribution_source: string
          created_at: string
          deal_id: string | null
          id: string
          lead_id: string | null
          partner_id: string
          tenant_business_id: string | null
        }
        Insert: {
          attribution_source?: string
          created_at?: string
          deal_id?: string | null
          id?: string
          lead_id?: string | null
          partner_id: string
          tenant_business_id?: string | null
        }
        Update: {
          attribution_source?: string
          created_at?: string
          deal_id?: string | null
          id?: string
          lead_id?: string | null
          partner_id?: string
          tenant_business_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_attribution_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_attribution_tenant_business_id_fkey"
            columns: ["tenant_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_commission_plans: {
        Row: {
          commission_type: string
          created_at: string
          id: string
          partner_type: string
          payout_schedule: string
          plan_name: string
          rules_json: Json | null
        }
        Insert: {
          commission_type?: string
          created_at?: string
          id?: string
          partner_type: string
          payout_schedule?: string
          plan_name: string
          rules_json?: Json | null
        }
        Update: {
          commission_type?: string
          created_at?: string
          id?: string
          partner_type?: string
          payout_schedule?: string
          plan_name?: string
          rules_json?: Json | null
        }
        Relationships: []
      }
      partner_commissions: {
        Row: {
          amount: number
          approved_by_user_id: string | null
          created_at: string
          id: string
          partner_id: string
          payout_batch_id: string | null
          platform_invoice_id: string | null
          status: string
          tenant_business_id: string | null
        }
        Insert: {
          amount?: number
          approved_by_user_id?: string | null
          created_at?: string
          id?: string
          partner_id: string
          payout_batch_id?: string | null
          platform_invoice_id?: string | null
          status?: string
          tenant_business_id?: string | null
        }
        Update: {
          amount?: number
          approved_by_user_id?: string | null
          created_at?: string
          id?: string
          partner_id?: string
          payout_batch_id?: string | null
          platform_invoice_id?: string | null
          status?: string
          tenant_business_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commissions_tenant_business_id_fkey"
            columns: ["tenant_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_payout_batches: {
        Row: {
          created_at: string
          id: string
          payout_date: string
          status: string
          total_amount: number
        }
        Insert: {
          created_at?: string
          id?: string
          payout_date?: string
          status?: string
          total_amount?: number
        }
        Update: {
          created_at?: string
          id?: string
          payout_date?: string
          status?: string
          total_amount?: number
        }
        Relationships: []
      }
      partners: {
        Row: {
          business_id: string | null
          created_at: string
          email: string
          id: string
          name: string
          parent_partner_id: string | null
          partner_type: string
          phone: string | null
          region: string | null
          status: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          parent_partner_id?: string | null
          partner_type: string
          phone?: string | null
          region?: string | null
          status?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          parent_partner_id?: string | null
          partner_type?: string
          phone?: string | null
          region?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "partners_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partners_parent_partner_id_fkey"
            columns: ["parent_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateways: {
        Row: {
          business_id: string | null
          created_at: string
          credentials_json: string | null
          gateway_type: string
          id: string
          is_active: boolean
          mode: string
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          credentials_json?: string | null
          gateway_type?: string
          id?: string
          is_active?: boolean
          mode?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string
          credentials_json?: string | null
          gateway_type?: string
          id?: string
          is_active?: boolean
          mode?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_gateways_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          business_id: string
          client_id: string | null
          created_at: string
          currency: string
          eway_transaction_id: string | null
          gateway_provider: string
          id: string
          invoice_id: string | null
          paid_at: string | null
          receipt_url: string | null
          status: Database["public"]["Enums"]["payment_gateway_status"]
          subscription_id: string | null
        }
        Insert: {
          amount?: number
          business_id: string
          client_id?: string | null
          created_at?: string
          currency?: string
          eway_transaction_id?: string | null
          gateway_provider?: string
          id?: string
          invoice_id?: string | null
          paid_at?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_gateway_status"]
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          client_id?: string | null
          created_at?: string
          currency?: string
          eway_transaction_id?: string | null
          gateway_provider?: string
          id?: string
          invoice_id?: string | null
          paid_at?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_gateway_status"]
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_invoices: {
        Row: {
          amount: number
          client_business_id: string
          created_at: string
          currency: string
          description: string | null
          due_date: string | null
          gateway_invoice_reference: string | null
          id: string
          invoice_number: number
          status: string
          tax: number
          total: number
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          client_business_id: string
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          gateway_invoice_reference?: string | null
          id?: string
          invoice_number?: number
          status?: string
          tax?: number
          total?: number
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_business_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          gateway_invoice_reference?: string | null
          id?: string
          invoice_number?: number
          status?: string
          tax?: number
          total?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_invoices_client_business_id_fkey"
            columns: ["client_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_payments: {
        Row: {
          amount: number
          client_business_id: string
          created_at: string
          currency: string
          gateway_transaction_id: string | null
          gateway_type: string
          id: string
          invoice_id: string | null
          paid_at: string | null
          receipt_url: string | null
          status: string
        }
        Insert: {
          amount?: number
          client_business_id: string
          created_at?: string
          currency?: string
          gateway_transaction_id?: string | null
          gateway_type?: string
          id?: string
          invoice_id?: string | null
          paid_at?: string | null
          receipt_url?: string | null
          status?: string
        }
        Update: {
          amount?: number
          client_business_id?: string
          created_at?: string
          currency?: string
          gateway_transaction_id?: string | null
          gateway_type?: string
          id?: string
          invoice_id?: string | null
          paid_at?: string | null
          receipt_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_payments_client_business_id_fkey"
            columns: ["client_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "platform_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      plugins: {
        Row: {
          created_at: string
          description: string | null
          developer_name: string
          entry_point: string | null
          id: string
          install_count: number | null
          name: string
          permissions_required: string[] | null
          price: number | null
          pricing_type: string
          rating_avg: number | null
          status: string
          version: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          developer_name?: string
          entry_point?: string | null
          id?: string
          install_count?: number | null
          name: string
          permissions_required?: string[] | null
          price?: number | null
          pricing_type?: string
          rating_avg?: number | null
          status?: string
          version?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          developer_name?: string
          entry_point?: string | null
          id?: string
          install_count?: number | null
          name?: string
          permissions_required?: string[] | null
          price?: number | null
          pricing_type?: string
          rating_avg?: number | null
          status?: string
          version?: string
        }
        Relationships: []
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
      projects: {
        Row: {
          assigned_manager_user_id: string | null
          business_id: string
          client_id: string | null
          created_at: string
          deal_id: string | null
          description: string | null
          id: string
          project_name: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          target_end_date: string | null
          updated_at: string
        }
        Insert: {
          assigned_manager_user_id?: string | null
          business_id: string
          client_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          id?: string
          project_name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          target_end_date?: string | null
          updated_at?: string
        }
        Update: {
          assigned_manager_user_id?: string | null
          business_id?: string
          client_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          id?: string
          project_name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          target_end_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_views: {
        Row: {
          id: string
          proposal_id: string
          user_agent: string | null
          viewed_at: string
          viewer_ip: string | null
        }
        Insert: {
          id?: string
          proposal_id: string
          user_agent?: string | null
          viewed_at?: string
          viewer_ip?: string | null
        }
        Update: {
          id?: string
          proposal_id?: string
          user_agent?: string | null
          viewed_at?: string
          viewer_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_views_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          business_id: string
          created_at: string
          created_by_user_id: string
          currency: string
          deal_id: string
          description: string | null
          discount_amount: number | null
          id: string
          payment_required: boolean
          payment_status: Database["public"]["Enums"]["payment_status"]
          pricing_breakdown_json: Json | null
          proposal_number: number
          services_json: Json | null
          status: Database["public"]["Enums"]["proposal_status"]
          tax_amount: number | null
          title: string
          total_amount: number | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by_user_id: string
          currency?: string
          deal_id: string
          description?: string | null
          discount_amount?: number | null
          id?: string
          payment_required?: boolean
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pricing_breakdown_json?: Json | null
          proposal_number?: number
          services_json?: Json | null
          status?: Database["public"]["Enums"]["proposal_status"]
          tax_amount?: number | null
          title: string
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by_user_id?: string
          currency?: string
          deal_id?: string
          description?: string | null
          discount_amount?: number | null
          id?: string
          payment_required?: boolean
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pricing_breakdown_json?: Json | null
          proposal_number?: number
          services_json?: Json | null
          status?: Database["public"]["Enums"]["proposal_status"]
          tax_amount?: number | null
          title?: string
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          max_requests: number
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          max_requests?: number
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          max_requests?: number
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      recurring_profiles: {
        Row: {
          amount: number
          billing_product_id: string | null
          business_id: string
          client_id: string | null
          created_at: string
          currency: string
          eway_customer_token: string | null
          eway_recurring_id: string | null
          frequency: Database["public"]["Enums"]["billing_frequency"]
          id: string
          next_billing_date: string | null
          status: Database["public"]["Enums"]["recurring_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          billing_product_id?: string | null
          business_id: string
          client_id?: string | null
          created_at?: string
          currency?: string
          eway_customer_token?: string | null
          eway_recurring_id?: string | null
          frequency?: Database["public"]["Enums"]["billing_frequency"]
          id?: string
          next_billing_date?: string | null
          status?: Database["public"]["Enums"]["recurring_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_product_id?: string | null
          business_id?: string
          client_id?: string | null
          created_at?: string
          currency?: string
          eway_customer_token?: string | null
          eway_recurring_id?: string | null
          frequency?: Database["public"]["Enums"]["billing_frequency"]
          id?: string
          next_billing_date?: string | null
          status?: Database["public"]["Enums"]["recurring_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_profiles_billing_product_id_fkey"
            columns: ["billing_product_id"]
            isOneToOne: false
            referencedRelation: "billing_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      regional_pricing_rules: {
        Row: {
          created_at: string
          currency: string
          id: string
          monthly_price: number
          package_id: string | null
          region: string
          tax_rate: number
          yearly_price: number
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          monthly_price?: number
          package_id?: string | null
          region: string
          tax_rate?: number
          yearly_price?: number
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          monthly_price?: number
          package_id?: string | null
          region?: string
          tax_rate?: number
          yearly_price?: number
        }
        Relationships: []
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
      resolutions: {
        Row: {
          created_at: string
          id: string
          meeting_id: string | null
          resolution_text: string
          vote_result: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id?: string | null
          resolution_text: string
          vote_result?: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string | null
          resolution_text?: string
          vote_result?: string
        }
        Relationships: [
          {
            foreignKeyName: "resolutions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "board_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_register: {
        Row: {
          created_at: string
          description: string
          id: string
          impact_level: string
          mitigation_plan: string | null
          owner: string | null
          risk_category: string
          status: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          impact_level?: string
          mitigation_plan?: string | null
          owner?: string | null
          risk_category?: string
          status?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          impact_level?: string
          mitigation_plan?: string | null
          owner?: string | null
          risk_category?: string
          status?: string
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata_json: Json | null
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata_json?: Json | null
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata_json?: Json | null
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      seo_access_checklist: {
        Row: {
          business_id: string
          campaign_id: string
          created_at: string
          id: string
          item_key: string
          notes: string | null
          received_at: string | null
          requested_at: string | null
          status: string
          verified_at: string | null
        }
        Insert: {
          business_id: string
          campaign_id: string
          created_at?: string
          id?: string
          item_key: string
          notes?: string | null
          received_at?: string | null
          requested_at?: string | null
          status?: string
          verified_at?: string | null
        }
        Update: {
          business_id?: string
          campaign_id?: string
          created_at?: string
          id?: string
          item_key?: string
          notes?: string | null
          received_at?: string | null
          requested_at?: string | null
          status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_access_checklist_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_access_checklist_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "seo_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_ai_recommendations: {
        Row: {
          business_id: string
          campaign_id: string | null
          created_at: string
          id: string
          page_url: string | null
          recommendation_type: string
          recommendations_json: Json | null
        }
        Insert: {
          business_id: string
          campaign_id?: string | null
          created_at?: string
          id?: string
          page_url?: string | null
          recommendation_type: string
          recommendations_json?: Json | null
        }
        Update: {
          business_id?: string
          campaign_id?: string | null
          created_at?: string
          id?: string
          page_url?: string | null
          recommendation_type?: string
          recommendations_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_ai_recommendations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_ai_recommendations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "seo_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_campaigns: {
        Row: {
          business_id: string
          client_id: string | null
          created_at: string
          id: string
          primary_domain: string | null
          project_id: string | null
          service_areas_json: Json | null
          start_date: string | null
          status: string
          target_services_json: Json | null
          updated_at: string
        }
        Insert: {
          business_id: string
          client_id?: string | null
          created_at?: string
          id?: string
          primary_domain?: string | null
          project_id?: string | null
          service_areas_json?: Json | null
          start_date?: string | null
          status?: string
          target_services_json?: Json | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          client_id?: string | null
          created_at?: string
          id?: string
          primary_domain?: string | null
          project_id?: string | null
          service_areas_json?: Json | null
          start_date?: string | null
          status?: string
          target_services_json?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_campaigns_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_campaigns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_client_requests: {
        Row: {
          business_id: string
          campaign_id: string
          created_at: string
          id: string
          payload_json: Json | null
          request_type: string
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          status: string
          submitted_by_client_user_id: string | null
        }
        Insert: {
          business_id: string
          campaign_id: string
          created_at?: string
          id?: string
          payload_json?: Json | null
          request_type: string
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          status?: string
          submitted_by_client_user_id?: string | null
        }
        Update: {
          business_id?: string
          campaign_id?: string
          created_at?: string
          id?: string
          payload_json?: Json | null
          request_type?: string
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          status?: string
          submitted_by_client_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_client_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_client_requests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "seo_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_content_items: {
        Row: {
          assigned_writer_user_id: string | null
          brief: string | null
          business_id: string
          campaign_id: string
          created_at: string
          due_at: string | null
          id: string
          status: string
          target_url: string | null
          title: string
          type: string
        }
        Insert: {
          assigned_writer_user_id?: string | null
          brief?: string | null
          business_id: string
          campaign_id: string
          created_at?: string
          due_at?: string | null
          id?: string
          status?: string
          target_url?: string | null
          title: string
          type?: string
        }
        Update: {
          assigned_writer_user_id?: string | null
          brief?: string | null
          business_id?: string
          campaign_id?: string
          created_at?: string
          due_at?: string | null
          id?: string
          status?: string
          target_url?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_content_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_content_items_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "seo_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_gbp: {
        Row: {
          business_id: string
          campaign_id: string
          created_at: string
          gbp_profile_url: string | null
          id: string
          last_post_date: string | null
          rating_avg: number | null
          reviews_count: number | null
          status: string
        }
        Insert: {
          business_id: string
          campaign_id: string
          created_at?: string
          gbp_profile_url?: string | null
          id?: string
          last_post_date?: string | null
          rating_avg?: number | null
          reviews_count?: number | null
          status?: string
        }
        Update: {
          business_id?: string
          campaign_id?: string
          created_at?: string
          gbp_profile_url?: string | null
          id?: string
          last_post_date?: string | null
          rating_avg?: number | null
          reviews_count?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_gbp_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_gbp_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "seo_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_keywords: {
        Row: {
          business_id: string
          campaign_id: string
          created_at: string
          id: string
          keyword: string
          keyword_type: string
          priority: string
          status: string
          target_url: string | null
        }
        Insert: {
          business_id: string
          campaign_id: string
          created_at?: string
          id?: string
          keyword: string
          keyword_type?: string
          priority?: string
          status?: string
          target_url?: string | null
        }
        Update: {
          business_id?: string
          campaign_id?: string
          created_at?: string
          id?: string
          keyword?: string
          keyword_type?: string
          priority?: string
          status?: string
          target_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_keywords_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_keywords_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "seo_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_offpage_items: {
        Row: {
          business_id: string
          campaign_id: string
          created_at: string
          id: string
          source_url: string | null
          status: string
          target_url: string | null
          type: string
        }
        Insert: {
          business_id: string
          campaign_id: string
          created_at?: string
          id?: string
          source_url?: string | null
          status?: string
          target_url?: string | null
          type?: string
        }
        Update: {
          business_id?: string
          campaign_id?: string
          created_at?: string
          id?: string
          source_url?: string | null
          status?: string
          target_url?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_offpage_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_offpage_items_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "seo_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_onpage_tasks: {
        Row: {
          assigned_to_user_id: string | null
          business_id: string
          campaign_id: string
          checklist_item: string
          created_at: string
          due_at: string | null
          id: string
          page_url: string | null
          status: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          business_id: string
          campaign_id: string
          checklist_item: string
          created_at?: string
          due_at?: string | null
          id?: string
          page_url?: string | null
          status?: string
        }
        Update: {
          assigned_to_user_id?: string | null
          business_id?: string
          campaign_id?: string
          checklist_item?: string
          created_at?: string
          due_at?: string | null
          id?: string
          page_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_onpage_tasks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_onpage_tasks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "seo_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_rankings: {
        Row: {
          business_id: string
          campaign_id: string
          created_at: string
          date: string
          id: string
          keyword_id: string | null
          location: string | null
          position: number | null
          search_engine: string
        }
        Insert: {
          business_id: string
          campaign_id: string
          created_at?: string
          date: string
          id?: string
          keyword_id?: string | null
          location?: string | null
          position?: number | null
          search_engine?: string
        }
        Update: {
          business_id?: string
          campaign_id?: string
          created_at?: string
          date?: string
          id?: string
          keyword_id?: string | null
          location?: string | null
          position?: number | null
          search_engine?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_rankings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_rankings_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "seo_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_rankings_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "seo_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_reports: {
        Row: {
          business_id: string
          campaign_id: string
          created_at: string
          id: string
          is_published: boolean
          published_at: string | null
          report_month: string
          summary_json: Json | null
        }
        Insert: {
          business_id: string
          campaign_id: string
          created_at?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          report_month: string
          summary_json?: Json | null
        }
        Update: {
          business_id?: string
          campaign_id?: string
          created_at?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          report_month?: string
          summary_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_reports_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "seo_campaigns"
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
      signatures: {
        Row: {
          contract_id: string
          id: string
          ip_address: string | null
          sign_token: string
          signature_data: string | null
          signed_at: string
          signer_email: string
          signer_name: string
        }
        Insert: {
          contract_id: string
          id?: string
          ip_address?: string | null
          sign_token?: string
          signature_data?: string | null
          signed_at?: string
          signer_email: string
          signer_name: string
        }
        Update: {
          contract_id?: string
          id?: string
          ip_address?: string | null
          sign_token?: string
          signature_data?: string | null
          signed_at?: string
          signer_email?: string
          signer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "signatures_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_packages: {
        Row: {
          ai_enabled: boolean
          created_at: string
          features_json: Json | null
          id: string
          is_active: boolean
          max_campaigns: number
          max_users: number
          monthly_price: number
          name: string
          white_label_enabled: boolean
          yearly_price: number
        }
        Insert: {
          ai_enabled?: boolean
          created_at?: string
          features_json?: Json | null
          id?: string
          is_active?: boolean
          max_campaigns?: number
          max_users?: number
          monthly_price?: number
          name: string
          white_label_enabled?: boolean
          yearly_price?: number
        }
        Update: {
          ai_enabled?: boolean
          created_at?: string
          features_json?: Json | null
          id?: string
          is_active?: boolean
          max_campaigns?: number
          max_users?: number
          monthly_price?: number
          name?: string
          white_label_enabled?: boolean
          yearly_price?: number
        }
        Relationships: []
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
      system_health: {
        Row: {
          created_at: string
          details_json: Json | null
          id: string
          last_checked: string
          response_time_ms: number | null
          service_name: string
          status: string
        }
        Insert: {
          created_at?: string
          details_json?: Json | null
          id?: string
          last_checked?: string
          response_time_ms?: number | null
          service_name: string
          status?: string
        }
        Update: {
          created_at?: string
          details_json?: Json | null
          id?: string
          last_checked?: string
          response_time_ms?: number | null
          service_name?: string
          status?: string
        }
        Relationships: []
      }
      tenant_invoices: {
        Row: {
          amount: number
          business_id: string
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          description: string | null
          due_date: string | null
          gateway_invoice_reference: string | null
          id: string
          status: string
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          amount?: number
          business_id: string
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          description?: string | null
          due_date?: string | null
          gateway_invoice_reference?: string | null
          id?: string
          status?: string
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          description?: string | null
          due_date?: string | null
          gateway_invoice_reference?: string | null
          id?: string
          status?: string
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_payments: {
        Row: {
          amount: number
          business_id: string
          created_at: string
          currency: string
          gateway_transaction_id: string | null
          gateway_type: string
          id: string
          invoice_id: string | null
          paid_at: string | null
          status: string
        }
        Insert: {
          amount?: number
          business_id: string
          created_at?: string
          currency?: string
          gateway_transaction_id?: string | null
          gateway_type?: string
          id?: string
          invoice_id?: string | null
          paid_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string
          currency?: string
          gateway_transaction_id?: string | null
          gateway_type?: string
          id?: string
          invoice_id?: string | null
          paid_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "tenant_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_plugins: {
        Row: {
          business_id: string
          configuration_json: Json | null
          enabled: boolean
          id: string
          installed_at: string
          plugin_id: string
        }
        Insert: {
          business_id: string
          configuration_json?: Json | null
          enabled?: boolean
          id?: string
          installed_at?: string
          plugin_id: string
        }
        Update: {
          business_id?: string
          configuration_json?: Json | null
          enabled?: boolean
          id?: string
          installed_at?: string
          plugin_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_plugins_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_plugins_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "plugins"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_subscriptions: {
        Row: {
          business_id: string
          created_at: string
          expires_at: string | null
          id: string
          package_id: string
          started_at: string
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          package_id: string
          started_at?: string
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          package_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_subscriptions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "subscription_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      uptime_checks: {
        Row: {
          checked_at: string
          endpoint: string
          id: string
          response_time_ms: number | null
          service_name: string
          status: string
        }
        Insert: {
          checked_at?: string
          endpoint: string
          id?: string
          response_time_ms?: number | null
          service_name: string
          status?: string
        }
        Update: {
          checked_at?: string
          endpoint?: string
          id?: string
          response_time_ms?: number | null
          service_name?: string
          status?: string
        }
        Relationships: []
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
      valuation_models: {
        Row: {
          generated_at: string
          id: string
          inputs_json: Json | null
          model_type: string
          outputs_json: Json | null
        }
        Insert: {
          generated_at?: string
          id?: string
          inputs_json?: Json | null
          model_type?: string
          outputs_json?: Json | null
        }
        Update: {
          generated_at?: string
          id?: string
          inputs_json?: Json | null
          model_type?: string
          outputs_json?: Json | null
        }
        Relationships: []
      }
      valuation_scenarios: {
        Row: {
          buyer_type: string
          created_at: string
          id: string
          multiple: number
          projected_exit_value: number
          sensitivity_analysis_json: Json | null
        }
        Insert: {
          buyer_type?: string
          created_at?: string
          id?: string
          multiple?: number
          projected_exit_value?: number
          sensitivity_analysis_json?: Json | null
        }
        Update: {
          buyer_type?: string
          created_at?: string
          id?: string
          multiple?: number
          projected_exit_value?: number
          sensitivity_analysis_json?: Json | null
        }
        Relationships: []
      }
      voice_sessions: {
        Row: {
          business_id: string
          created_at: string
          duration_seconds: number | null
          id: string
          provider: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          sentiment_score: number | null
          status: string
          summary: string | null
          transcript: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          provider?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sentiment_score?: number | null
          status?: string
          summary?: string | null
          transcript?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          provider?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sentiment_score?: number | null
          status?: string
          summary?: string | null
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_sessions_business_id_fkey"
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
      billing_frequency: "monthly" | "yearly"
      billing_type: "one_time" | "recurring" | "prepaid" | "milestone"
      business_status: "active" | "suspended" | "cancelled"
      calendar_visibility: "private" | "tenant"
      call_outcome:
        | "no_answer"
        | "left_voicemail"
        | "spoke"
        | "follow_up_required"
        | "not_interested"
        | "qualified"
      call_type: "outbound" | "inbound"
      contract_status: "draft" | "sent" | "signed" | "rejected"
      deal_stage:
        | "new"
        | "contacted"
        | "meeting_booked"
        | "needs_analysis"
        | "proposal_requested"
        | "negotiation"
        | "won"
        | "lost"
      deal_status: "open" | "won" | "lost" | "archived"
      dunning_action: "email" | "notification" | "task" | "suspend"
      gateway_environment: "sandbox" | "live"
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
      invoice_status:
        | "draft"
        | "open"
        | "paid"
        | "void"
        | "overdue"
        | "canceled"
      invoice_type: "one_time" | "recurring" | "milestone" | "prepaid"
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
      onboarding_status: "pending" | "in_progress" | "completed"
      payment_gateway_status: "approved" | "declined" | "failed" | "pending"
      payment_status: "unpaid" | "paid"
      preferred_contact: "call" | "email" | "whatsapp"
      product_category: "website" | "seo" | "ppc" | "hosting" | "crm" | "other"
      project_status: "new" | "in_progress" | "on_hold" | "completed"
      proposal_status:
        | "draft"
        | "sent"
        | "viewed"
        | "accepted"
        | "rejected"
        | "expired"
      recurring_status: "active" | "failed" | "paused" | "canceled"
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
      billing_frequency: ["monthly", "yearly"],
      billing_type: ["one_time", "recurring", "prepaid", "milestone"],
      business_status: ["active", "suspended", "cancelled"],
      calendar_visibility: ["private", "tenant"],
      call_outcome: [
        "no_answer",
        "left_voicemail",
        "spoke",
        "follow_up_required",
        "not_interested",
        "qualified",
      ],
      call_type: ["outbound", "inbound"],
      contract_status: ["draft", "sent", "signed", "rejected"],
      deal_stage: [
        "new",
        "contacted",
        "meeting_booked",
        "needs_analysis",
        "proposal_requested",
        "negotiation",
        "won",
        "lost",
      ],
      deal_status: ["open", "won", "lost", "archived"],
      dunning_action: ["email", "notification", "task", "suspend"],
      gateway_environment: ["sandbox", "live"],
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
      invoice_status: ["draft", "open", "paid", "void", "overdue", "canceled"],
      invoice_type: ["one_time", "recurring", "milestone", "prepaid"],
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
      onboarding_status: ["pending", "in_progress", "completed"],
      payment_gateway_status: ["approved", "declined", "failed", "pending"],
      payment_status: ["unpaid", "paid"],
      preferred_contact: ["call", "email", "whatsapp"],
      product_category: ["website", "seo", "ppc", "hosting", "crm", "other"],
      project_status: ["new", "in_progress", "on_hold", "completed"],
      proposal_status: [
        "draft",
        "sent",
        "viewed",
        "accepted",
        "rejected",
        "expired",
      ],
      recurring_status: ["active", "failed", "paused", "canceled"],
      reminder_entity_type: ["inquiry", "lead"],
      reminder_priority: ["low", "medium", "high"],
      reminder_status: ["pending", "done", "snoozed", "cancelled", "overdue"],
    },
  },
} as const
