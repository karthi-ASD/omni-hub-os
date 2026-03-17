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
      account_timeline: {
        Row: {
          account_id: string | null
          business_id: string
          client_id: string | null
          contact_id: string | null
          contract_id: string | null
          created_at: string
          event_description: string | null
          event_title: string
          event_type: string
          id: string
          lead_id: string | null
          module_name: string | null
          module_record_id: string | null
          opportunity_id: string | null
          ticket_id: string | null
          user_id: string | null
          visibility: string | null
        }
        Insert: {
          account_id?: string | null
          business_id: string
          client_id?: string | null
          contact_id?: string | null
          contract_id?: string | null
          created_at?: string
          event_description?: string | null
          event_title: string
          event_type: string
          id?: string
          lead_id?: string | null
          module_name?: string | null
          module_record_id?: string | null
          opportunity_id?: string | null
          ticket_id?: string | null
          user_id?: string | null
          visibility?: string | null
        }
        Update: {
          account_id?: string | null
          business_id?: string
          client_id?: string | null
          contact_id?: string | null
          contract_id?: string | null
          created_at?: string
          event_description?: string | null
          event_title?: string
          event_type?: string
          id?: string
          lead_id?: string | null
          module_name?: string | null
          module_record_id?: string | null
          opportunity_id?: string | null
          ticket_id?: string | null
          user_id?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_timeline_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_timeline_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_timeline_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_timeline_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_timeline_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_timeline_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_timeline_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_timeline_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          account_code: string | null
          account_status: string
          address: string | null
          assigned_account_manager_id: string | null
          business_id: string
          city: string | null
          company_name: string
          company_size: string | null
          country: string | null
          created_at: string
          created_from_client_id: string | null
          created_from_lead_id: string | null
          email: string | null
          id: string
          industry: string | null
          lead_source: string | null
          phone: string | null
          primary_contact_id: string | null
          renewal_date: string | null
          state: string | null
          total_revenue: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          account_code?: string | null
          account_status?: string
          address?: string | null
          assigned_account_manager_id?: string | null
          business_id: string
          city?: string | null
          company_name: string
          company_size?: string | null
          country?: string | null
          created_at?: string
          created_from_client_id?: string | null
          created_from_lead_id?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          lead_source?: string | null
          phone?: string | null
          primary_contact_id?: string | null
          renewal_date?: string | null
          state?: string | null
          total_revenue?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          account_code?: string | null
          account_status?: string
          address?: string | null
          assigned_account_manager_id?: string | null
          business_id?: string
          city?: string | null
          company_name?: string
          company_size?: string | null
          country?: string | null
          created_at?: string
          created_from_client_id?: string | null
          created_from_lead_id?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          lead_source?: string | null
          phone?: string | null
          primary_contact_id?: string | null
          renewal_date?: string | null
          state?: string | null
          total_revenue?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
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
      ads_campaigns: {
        Row: {
          business_id: string
          campaign_external_id: string | null
          campaign_name: string
          clicks: number | null
          client_id: string | null
          connection_id: string | null
          conversions: number | null
          cpc: number | null
          created_at: string | null
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          leads: number | null
          platform: string
          spend: number | null
          status: string | null
        }
        Insert: {
          business_id: string
          campaign_external_id?: string | null
          campaign_name: string
          clicks?: number | null
          client_id?: string | null
          connection_id?: string | null
          conversions?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          leads?: number | null
          platform?: string
          spend?: number | null
          status?: string | null
        }
        Update: {
          business_id?: string
          campaign_external_id?: string | null
          campaign_name?: string
          clicks?: number | null
          client_id?: string | null
          connection_id?: string | null
          conversions?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          leads?: number | null
          platform?: string
          spend?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ads_campaigns_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_campaigns_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "analytics_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      advocacy_badges: {
        Row: {
          badge_label: string
          badge_type: string
          business_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_label: string
          badge_type: string
          business_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_label?: string
          badge_type?: string
          business_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advocacy_badges_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      advocacy_campaigns: {
        Row: {
          business_id: string
          campaign_type: string
          caption_template: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          media_url: string | null
          points_per_click: number
          points_per_lead: number
          points_per_sale: number
          points_per_share: number
          reward_trigger: string
          reward_type: string
          rewards_enabled: boolean
          share_message_template: string | null
          start_date: string
          status: string
          title: string
          updated_at: string
          visibility_targets: string[] | null
          visibility_type: string
        }
        Insert: {
          business_id: string
          campaign_type?: string
          caption_template?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          media_url?: string | null
          points_per_click?: number
          points_per_lead?: number
          points_per_sale?: number
          points_per_share?: number
          reward_trigger?: string
          reward_type?: string
          rewards_enabled?: boolean
          share_message_template?: string | null
          start_date?: string
          status?: string
          title: string
          updated_at?: string
          visibility_targets?: string[] | null
          visibility_type?: string
        }
        Update: {
          business_id?: string
          campaign_type?: string
          caption_template?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          media_url?: string | null
          points_per_click?: number
          points_per_lead?: number
          points_per_sale?: number
          points_per_share?: number
          reward_trigger?: string
          reward_type?: string
          rewards_enabled?: boolean
          share_message_template?: string | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
          visibility_targets?: string[] | null
          visibility_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "advocacy_campaigns_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      advocacy_settings: {
        Row: {
          anti_fraud_cooldown_seconds: number
          business_id: string
          created_at: string
          default_network_size: number
          default_points_per_click: number
          default_points_per_lead: number
          default_points_per_sale: number
          default_points_per_share: number
          id: string
          updated_at: string
        }
        Insert: {
          anti_fraud_cooldown_seconds?: number
          business_id: string
          created_at?: string
          default_network_size?: number
          default_points_per_click?: number
          default_points_per_lead?: number
          default_points_per_sale?: number
          default_points_per_share?: number
          id?: string
          updated_at?: string
        }
        Update: {
          anti_fraud_cooldown_seconds?: number
          business_id?: string
          created_at?: string
          default_network_size?: number
          default_points_per_click?: number
          default_points_per_lead?: number
          default_points_per_sale?: number
          default_points_per_share?: number
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "advocacy_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      advocacy_shares: {
        Row: {
          business_id: string
          campaign_id: string
          id: string
          platform: string
          referral_code: string
          shared_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          campaign_id: string
          id?: string
          platform: string
          referral_code: string
          shared_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          campaign_id?: string
          id?: string
          platform?: string
          referral_code?: string
          shared_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advocacy_shares_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advocacy_shares_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "advocacy_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_expenses: {
        Row: {
          amount: number
          business_id: string
          category: string
          created_at: string | null
          created_by: string | null
          department: string | null
          description: string | null
          expense_date: string
          id: string
          is_recurring: boolean | null
          recurring_frequency: string | null
        }
        Insert: {
          amount?: number
          business_id: string
          category: string
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          is_recurring?: boolean | null
          recurring_frequency?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          category?: string
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          is_recurring?: boolean | null
          recurring_frequency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_expenses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
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
      ai_advisor_logs: {
        Row: {
          ai_response: string | null
          business_id: string
          created_at: string
          id: string
          question: string
          user_id: string | null
        }
        Insert: {
          ai_response?: string | null
          business_id: string
          created_at?: string
          id?: string
          question: string
          user_id?: string | null
        }
        Update: {
          ai_response?: string | null
          business_id?: string
          created_at?: string
          id?: string
          question?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_advisor_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
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
      ai_agent_actions_v2: {
        Row: {
          action_payload_json: Json | null
          action_type: string
          approval_request_id: string | null
          business_id: string
          created_at: string
          execution_status: Database["public"]["Enums"]["agent_action_status"]
          id: string
          requires_approval: boolean
          run_id: string
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action_payload_json?: Json | null
          action_type: string
          approval_request_id?: string | null
          business_id: string
          created_at?: string
          execution_status?: Database["public"]["Enums"]["agent_action_status"]
          id?: string
          requires_approval?: boolean
          run_id: string
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action_payload_json?: Json | null
          action_type?: string
          approval_request_id?: string | null
          business_id?: string
          created_at?: string
          execution_status?: Database["public"]["Enums"]["agent_action_status"]
          id?: string
          requires_approval?: boolean
          run_id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_actions_v2_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_actions_v2_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_approvals: {
        Row: {
          action_id: string | null
          approver_role: string
          business_id: string
          created_at: string
          decided_at: string | null
          id: string
          reason: string | null
          requested_by: string
          run_id: string
          status: Database["public"]["Enums"]["agent_approval_status"]
        }
        Insert: {
          action_id?: string | null
          approver_role?: string
          business_id: string
          created_at?: string
          decided_at?: string | null
          id?: string
          reason?: string | null
          requested_by?: string
          run_id: string
          status?: Database["public"]["Enums"]["agent_approval_status"]
        }
        Update: {
          action_id?: string | null
          approver_role?: string
          business_id?: string
          created_at?: string
          decided_at?: string | null
          id?: string
          reason?: string | null
          requested_by?: string
          run_id?: string
          status?: Database["public"]["Enums"]["agent_approval_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_approvals_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_actions_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_approvals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_approvals_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_assignments: {
        Row: {
          agent_id: string
          assigned_team_id: string | null
          assigned_user_id: string | null
          business_id: string
          created_at: string | null
          id: string
          scope_type: string
          triggers_enabled: boolean | null
        }
        Insert: {
          agent_id: string
          assigned_team_id?: string | null
          assigned_user_id?: string | null
          business_id: string
          created_at?: string | null
          id?: string
          scope_type?: string
          triggers_enabled?: boolean | null
        }
        Update: {
          agent_id?: string
          assigned_team_id?: string | null
          assigned_user_id?: string | null
          business_id?: string
          created_at?: string | null
          id?: string
          scope_type?: string
          triggers_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_assignments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_assignments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
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
      ai_agent_guardrails: {
        Row: {
          agent_type: Database["public"]["Enums"]["agent_type"]
          business_id: string
          created_at: string
          enforcement: Database["public"]["Enums"]["guardrail_enforcement"]
          id: string
          is_active: boolean
          risk_level: Database["public"]["Enums"]["risk_level"]
          rule_json: Json | null
          rule_name: string
        }
        Insert: {
          agent_type: Database["public"]["Enums"]["agent_type"]
          business_id: string
          created_at?: string
          enforcement?: Database["public"]["Enums"]["guardrail_enforcement"]
          id?: string
          is_active?: boolean
          risk_level?: Database["public"]["Enums"]["risk_level"]
          rule_json?: Json | null
          rule_name: string
        }
        Update: {
          agent_type?: Database["public"]["Enums"]["agent_type"]
          business_id?: string
          created_at?: string
          enforcement?: Database["public"]["Enums"]["guardrail_enforcement"]
          id?: string
          is_active?: boolean
          risk_level?: Database["public"]["Enums"]["risk_level"]
          rule_json?: Json | null
          rule_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_guardrails_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_knowledge_base: {
        Row: {
          business_id: string
          content: string | null
          created_at: string
          id: string
          source_type: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          business_id: string
          content?: string | null
          created_at?: string
          id?: string
          source_type?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          content?: string | null
          created_at?: string
          id?: string
          source_type?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_knowledge_base_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_runs: {
        Row: {
          agent_id: string
          business_id: string
          confidence_score: number | null
          created_at: string
          created_by_user_id: string | null
          ended_at: string | null
          error_message: string | null
          id: string
          input_json: Json | null
          output_json: Json | null
          playbook_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["agent_run_status"]
          trigger_ref: string | null
          trigger_source: string
        }
        Insert: {
          agent_id: string
          business_id: string
          confidence_score?: number | null
          created_at?: string
          created_by_user_id?: string | null
          ended_at?: string | null
          error_message?: string | null
          id?: string
          input_json?: Json | null
          output_json?: Json | null
          playbook_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["agent_run_status"]
          trigger_ref?: string | null
          trigger_source?: string
        }
        Update: {
          agent_id?: string
          business_id?: string
          confidence_score?: number | null
          created_at?: string
          created_by_user_id?: string | null
          ended_at?: string | null
          error_message?: string | null
          id?: string
          input_json?: Json | null
          output_json?: Json | null
          playbook_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["agent_run_status"]
          trigger_ref?: string | null
          trigger_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_runs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_autonomous_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_runs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_runs_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "ai_playbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_scripts: {
        Row: {
          agent_id: string | null
          business_id: string
          closing_text: string | null
          created_at: string | null
          id: string
          intro_text: string | null
          is_default: boolean | null
          qualification_questions_json: Json | null
          scheduling_text: string | null
          script_name: string
          verification_text: string | null
        }
        Insert: {
          agent_id?: string | null
          business_id: string
          closing_text?: string | null
          created_at?: string | null
          id?: string
          intro_text?: string | null
          is_default?: boolean | null
          qualification_questions_json?: Json | null
          scheduling_text?: string | null
          script_name: string
          verification_text?: string | null
        }
        Update: {
          agent_id?: string | null
          business_id?: string
          closing_text?: string | null
          created_at?: string | null
          id?: string
          intro_text?: string | null
          is_default?: boolean | null
          qualification_questions_json?: Json | null
          scheduling_text?: string | null
          script_name?: string
          verification_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_scripts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_scripts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
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
      ai_agent_tool_connections: {
        Row: {
          business_id: string
          config_vault_key: string | null
          created_at: string
          id: string
          status: string
          tool_name: string
          updated_at: string
        }
        Insert: {
          business_id: string
          config_vault_key?: string | null
          created_at?: string
          id?: string
          status?: string
          tool_name: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          config_vault_key?: string | null
          created_at?: string
          id?: string
          status?: string
          tool_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_tool_connections_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_versions: {
        Row: {
          agent_id: string
          business_id: string | null
          created_at: string | null
          data_capture_schema: Json | null
          id: string
          is_active: boolean | null
          safety_rules: string | null
          system_prompt: string | null
          tools_allowed: Json | null
          version_number: number
        }
        Insert: {
          agent_id: string
          business_id?: string | null
          created_at?: string | null
          data_capture_schema?: Json | null
          id?: string
          is_active?: boolean | null
          safety_rules?: string | null
          system_prompt?: string | null
          tools_allowed?: Json | null
          version_number?: number
        }
        Update: {
          agent_id?: string
          business_id?: string | null
          created_at?: string | null
          data_capture_schema?: Json | null
          id?: string
          is_active?: boolean | null
          safety_rules?: string | null
          system_prompt?: string | null
          tools_allowed?: Json | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_versions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_versions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          agent_name: string
          ai_provider: string | null
          autonomy_level: string
          business_id: string | null
          call_timeout_seconds: number | null
          created_at: string
          enabled: boolean
          id: string
          language: string | null
          retry_attempts: number | null
          scope: string
          script_id: string | null
          voice_type: string | null
        }
        Insert: {
          agent_name: string
          ai_provider?: string | null
          autonomy_level?: string
          business_id?: string | null
          call_timeout_seconds?: number | null
          created_at?: string
          enabled?: boolean
          id?: string
          language?: string | null
          retry_attempts?: number | null
          scope: string
          script_id?: string | null
          voice_type?: string | null
        }
        Update: {
          agent_name?: string
          ai_provider?: string | null
          autonomy_level?: string
          business_id?: string | null
          call_timeout_seconds?: number | null
          created_at?: string
          enabled?: boolean
          id?: string
          language?: string | null
          retry_attempts?: number | null
          scope?: string
          script_id?: string | null
          voice_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agents_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_autonomous_agents: {
        Row: {
          agent_type: Database["public"]["Enums"]["agent_type"]
          business_id: string
          config_json: Json | null
          created_at: string
          id: string
          is_enabled: boolean
          mode: Database["public"]["Enums"]["agent_mode"]
          name: string
          owner_user_id: string | null
          updated_at: string
        }
        Insert: {
          agent_type: Database["public"]["Enums"]["agent_type"]
          business_id: string
          config_json?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          mode?: Database["public"]["Enums"]["agent_mode"]
          name: string
          owner_user_id?: string | null
          updated_at?: string
        }
        Update: {
          agent_type?: Database["public"]["Enums"]["agent_type"]
          business_id?: string
          config_json?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          mode?: Database["public"]["Enums"]["agent_mode"]
          name?: string
          owner_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_autonomous_agents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_autonomous_tasks: {
        Row: {
          ai_confidence: number | null
          approved_at: string | null
          approved_by_user_id: string | null
          assigned_department: string | null
          auto_created: boolean | null
          business_id: string
          created_at: string
          department: string | null
          description: string | null
          id: string
          priority: string
          source_module: string | null
          status: string
          task_type: string
          title: string
        }
        Insert: {
          ai_confidence?: number | null
          approved_at?: string | null
          approved_by_user_id?: string | null
          assigned_department?: string | null
          auto_created?: boolean | null
          business_id: string
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          priority?: string
          source_module?: string | null
          status?: string
          task_type?: string
          title: string
        }
        Update: {
          ai_confidence?: number | null
          approved_at?: string | null
          approved_by_user_id?: string | null
          assigned_department?: string | null
          auto_created?: boolean | null
          business_id?: string
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          priority?: string
          source_module?: string | null
          status?: string
          task_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_autonomous_tasks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_behavior_patterns: {
        Row: {
          business_id: string
          confidence_score: number
          created_at: string
          description: string
          id: string
          pattern_type: string
          recommendation: string | null
        }
        Insert: {
          business_id: string
          confidence_score?: number
          created_at?: string
          description: string
          id?: string
          pattern_type: string
          recommendation?: string | null
        }
        Update: {
          business_id?: string
          confidence_score?: number
          created_at?: string
          description?: string
          id?: string
          pattern_type?: string
          recommendation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_behavior_patterns_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_blog_drafts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          brief_id: string | null
          business_id: string
          client_id: string | null
          content: string | null
          created_at: string
          id: string
          meta_description: string | null
          meta_title: string | null
          status: string
          target_keyword: string | null
          title: string
          tone: string | null
          word_count: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          brief_id?: string | null
          business_id: string
          client_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          status?: string
          target_keyword?: string | null
          title: string
          tone?: string | null
          word_count?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          brief_id?: string | null
          business_id?: string
          client_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          status?: string
          target_keyword?: string | null
          title?: string
          tone?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_blog_drafts_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "ai_content_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_blog_drafts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_business_alerts: {
        Row: {
          alert_type: string
          business_id: string
          created_at: string
          id: string
          message: string
          priority: string
          status: string
        }
        Insert: {
          alert_type?: string
          business_id: string
          created_at?: string
          id?: string
          message: string
          priority?: string
          status?: string
        }
        Update: {
          alert_type?: string
          business_id?: string
          created_at?: string
          id?: string
          message?: string
          priority?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_business_alerts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_business_health: {
        Row: {
          business_id: string
          created_at: string
          factors_json: Json | null
          growth_score: number
          health_score: number
          id: string
          last_updated: string
          risk_score: number
        }
        Insert: {
          business_id: string
          created_at?: string
          factors_json?: Json | null
          growth_score?: number
          health_score?: number
          id?: string
          last_updated?: string
          risk_score?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          factors_json?: Json | null
          growth_score?: number
          health_score?: number
          id?: string
          last_updated?: string
          risk_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_business_health_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_logs: {
        Row: {
          business_id: string
          client_id: string | null
          created_at: string
          id: string
          message: string
          metadata_json: Json | null
          role: string
          sender_email: string | null
          sender_name: string | null
          session_id: string
        }
        Insert: {
          business_id: string
          client_id?: string | null
          created_at?: string
          id?: string
          message: string
          metadata_json?: Json | null
          role?: string
          sender_email?: string | null
          sender_name?: string | null
          session_id: string
        }
        Update: {
          business_id?: string
          client_id?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata_json?: Json | null
          role?: string
          sender_email?: string | null
          sender_name?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_chat_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_competitor_analysis: {
        Row: {
          analysis_json: Json | null
          business_id: string
          client_id: string | null
          competitor_domain: string
          content_gaps_json: Json | null
          created_at: string
          id: string
          keyword_gaps_json: Json | null
          opportunities_json: Json | null
        }
        Insert: {
          analysis_json?: Json | null
          business_id: string
          client_id?: string | null
          competitor_domain: string
          content_gaps_json?: Json | null
          created_at?: string
          id?: string
          keyword_gaps_json?: Json | null
          opportunities_json?: Json | null
        }
        Update: {
          analysis_json?: Json | null
          business_id?: string
          client_id?: string | null
          competitor_domain?: string
          content_gaps_json?: Json | null
          created_at?: string
          id?: string
          keyword_gaps_json?: Json | null
          opportunities_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_competitor_analysis_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_content_briefs: {
        Row: {
          brief_type: string
          business_id: string
          client_id: string | null
          created_at: string
          headings_json: Json | null
          id: string
          recommended_title: string | null
          schema_recommendation: string | null
          search_intent: string | null
          secondary_keywords: string[] | null
          status: string
          structure_json: Json | null
          target_keyword: string
          word_count_recommendation: number | null
        }
        Insert: {
          brief_type?: string
          business_id: string
          client_id?: string | null
          created_at?: string
          headings_json?: Json | null
          id?: string
          recommended_title?: string | null
          schema_recommendation?: string | null
          search_intent?: string | null
          secondary_keywords?: string[] | null
          status?: string
          structure_json?: Json | null
          target_keyword: string
          word_count_recommendation?: number | null
        }
        Update: {
          brief_type?: string
          business_id?: string
          client_id?: string | null
          created_at?: string
          headings_json?: Json | null
          id?: string
          recommended_title?: string | null
          schema_recommendation?: string | null
          search_intent?: string | null
          secondary_keywords?: string[] | null
          status?: string
          structure_json?: Json | null
          target_keyword?: string
          word_count_recommendation?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_content_briefs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_content_opportunities: {
        Row: {
          ai_confidence: number | null
          business_id: string
          client_id: string | null
          competition: string | null
          created_at: string
          id: string
          keyword: string
          opportunity_type: string
          recommendation: string | null
          search_volume: number | null
          status: string
        }
        Insert: {
          ai_confidence?: number | null
          business_id: string
          client_id?: string | null
          competition?: string | null
          created_at?: string
          id?: string
          keyword: string
          opportunity_type?: string
          recommendation?: string | null
          search_volume?: number | null
          status?: string
        }
        Update: {
          ai_confidence?: number | null
          business_id?: string
          client_id?: string | null
          competition?: string | null
          created_at?: string
          id?: string
          keyword?: string
          opportunity_type?: string
          recommendation?: string | null
          search_volume?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_content_opportunities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversation_insights: {
        Row: {
          business_id: string
          conversation_id: string | null
          created_at: string | null
          id: string
          intent: string | null
          lead_id: string | null
          suggested_next_action: string | null
          suggested_reply: string | null
          summary: string | null
          urgency_score: number | null
        }
        Insert: {
          business_id: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          intent?: string | null
          lead_id?: string | null
          suggested_next_action?: string | null
          suggested_reply?: string | null
          summary?: string | null
          urgency_score?: number | null
        }
        Update: {
          business_id?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          intent?: string | null
          lead_id?: string | null
          suggested_next_action?: string | null
          suggested_reply?: string | null
          summary?: string | null
          urgency_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversation_insights_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversation_insights_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "lead_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_cs_feature_settings: {
        Row: {
          ai_chatbot: boolean
          auto_categorization: boolean
          business_id: string
          created_at: string
          escalation_prediction: boolean
          id: string
          intent_detection: boolean
          kb_recommendations: boolean
          priority_detection: boolean
          reply_suggestions: boolean
          sentiment_analysis: boolean
          smart_routing: boolean
          ticket_summary: boolean
          updated_at: string
        }
        Insert: {
          ai_chatbot?: boolean
          auto_categorization?: boolean
          business_id: string
          created_at?: string
          escalation_prediction?: boolean
          id?: string
          intent_detection?: boolean
          kb_recommendations?: boolean
          priority_detection?: boolean
          reply_suggestions?: boolean
          sentiment_analysis?: boolean
          smart_routing?: boolean
          ticket_summary?: boolean
          updated_at?: string
        }
        Update: {
          ai_chatbot?: boolean
          auto_categorization?: boolean
          business_id?: string
          created_at?: string
          escalation_prediction?: boolean
          id?: string
          intent_detection?: boolean
          kb_recommendations?: boolean
          priority_detection?: boolean
          reply_suggestions?: boolean
          sentiment_analysis?: boolean
          smart_routing?: boolean
          ticket_summary?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_cs_feature_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_email_drafts: {
        Row: {
          body: string
          business_id: string
          client_id: string | null
          created_at: string
          draft_type: string
          id: string
          status: string
          subject: string
        }
        Insert: {
          body: string
          business_id: string
          client_id?: string | null
          created_at?: string
          draft_type?: string
          id?: string
          status?: string
          subject: string
        }
        Update: {
          body?: string
          business_id?: string
          client_id?: string | null
          created_at?: string
          draft_type?: string
          id?: string
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_email_drafts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_execution_logs: {
        Row: {
          action: string
          approved_by: string | null
          business_id: string
          client_id: string | null
          created_at: string
          id: string
          module: string
          output_summary: string | null
          project_id: string | null
          status: string
        }
        Insert: {
          action: string
          approved_by?: string | null
          business_id: string
          client_id?: string | null
          created_at?: string
          id?: string
          module: string
          output_summary?: string | null
          project_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          approved_by?: string | null
          business_id?: string
          client_id?: string | null
          created_at?: string
          id?: string
          module?: string
          output_summary?: string | null
          project_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_execution_logs_business_id_fkey"
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
      ai_forecasts: {
        Row: {
          business_id: string
          confidence_score: number | null
          created_at: string
          factors_json: Json | null
          forecast_date: string | null
          forecast_type: string
          id: string
          predicted_value: number
        }
        Insert: {
          business_id: string
          confidence_score?: number | null
          created_at?: string
          factors_json?: Json | null
          forecast_date?: string | null
          forecast_type?: string
          id?: string
          predicted_value?: number
        }
        Update: {
          business_id?: string
          confidence_score?: number | null
          created_at?: string
          factors_json?: Json | null
          forecast_date?: string | null
          forecast_type?: string
          id?: string
          predicted_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_forecasts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_keyword_clusters: {
        Row: {
          business_id: string
          client_id: string | null
          cluster_name: string
          cluster_type: string
          created_at: string
          id: string
          keywords_json: Json | null
          primary_keyword: string | null
          priority: string | null
          search_intent: string | null
          status: string
          suggested_page_type: string | null
        }
        Insert: {
          business_id: string
          client_id?: string | null
          cluster_name: string
          cluster_type?: string
          created_at?: string
          id?: string
          keywords_json?: Json | null
          primary_keyword?: string | null
          priority?: string | null
          search_intent?: string | null
          status?: string
          suggested_page_type?: string | null
        }
        Update: {
          business_id?: string
          client_id?: string | null
          cluster_name?: string
          cluster_type?: string
          created_at?: string
          id?: string
          keywords_json?: Json | null
          primary_keyword?: string | null
          priority?: string | null
          search_intent?: string | null
          status?: string
          suggested_page_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_keyword_clusters_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_landing_pages: {
        Row: {
          business_id: string
          content_json: Json | null
          created_at: string | null
          export_format: string | null
          headline: string | null
          id: string
          keyword: string
          meta_description: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          content_json?: Json | null
          created_at?: string | null
          export_format?: string | null
          headline?: string | null
          id?: string
          keyword: string
          meta_description?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          content_json?: Json | null
          created_at?: string | null
          export_format?: string | null
          headline?: string | null
          id?: string
          keyword?: string
          meta_description?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_landing_pages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_lead_qualifications: {
        Row: {
          ai_summary: string | null
          budget_range: string | null
          business_id: string
          call_log_id: string | null
          created_at: string | null
          followup_date: string | null
          followup_time: string | null
          id: string
          lead_id: string | null
          lead_name: string | null
          lead_score: number | null
          project_type: string | null
          requirement_summary: string | null
          service_interest: string | null
          status: string | null
          timeframe: string | null
          timezone: string | null
        }
        Insert: {
          ai_summary?: string | null
          budget_range?: string | null
          business_id: string
          call_log_id?: string | null
          created_at?: string | null
          followup_date?: string | null
          followup_time?: string | null
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          lead_score?: number | null
          project_type?: string | null
          requirement_summary?: string | null
          service_interest?: string | null
          status?: string | null
          timeframe?: string | null
          timezone?: string | null
        }
        Update: {
          ai_summary?: string | null
          budget_range?: string | null
          business_id?: string
          call_log_id?: string | null
          created_at?: string | null
          followup_date?: string | null
          followup_time?: string | null
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          lead_score?: number | null
          project_type?: string | null
          requirement_summary?: string | null
          service_interest?: string | null
          status?: string | null
          timeframe?: string | null
          timezone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_lead_qualifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_lead_qualifications_call_log_id_fkey"
            columns: ["call_log_id"]
            isOneToOne: false
            referencedRelation: "ai_voice_call_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_lead_scores: {
        Row: {
          business_id: string
          confidence_score: number | null
          conversion_probability: number | null
          created_at: string | null
          factors_json: Json | null
          id: string
          last_updated: string | null
          lead_id: string | null
          lead_score: number | null
        }
        Insert: {
          business_id: string
          confidence_score?: number | null
          conversion_probability?: number | null
          created_at?: string | null
          factors_json?: Json | null
          id?: string
          last_updated?: string | null
          lead_id?: string | null
          lead_score?: number | null
        }
        Update: {
          business_id?: string
          confidence_score?: number | null
          conversion_probability?: number | null
          created_at?: string | null
          factors_json?: Json | null
          id?: string
          last_updated?: string | null
          lead_id?: string | null
          lead_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_lead_scores_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_learning_events: {
        Row: {
          business_id: string
          created_at: string
          data_payload: Json | null
          event_type: string
          id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          data_payload?: Json | null
          event_type: string
          id?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          data_payload?: Json | null
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_learning_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_marketing_insights: {
        Row: {
          business_id: string
          channel: string
          conversion_rate: number | null
          created_at: string | null
          id: string
          leads_generated: number | null
          period: string | null
          recommendations_json: Json | null
          revenue_attributed: number | null
          roi_score: number | null
          spend: number | null
        }
        Insert: {
          business_id: string
          channel?: string
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          leads_generated?: number | null
          period?: string | null
          recommendations_json?: Json | null
          revenue_attributed?: number | null
          roi_score?: number | null
          spend?: number | null
        }
        Update: {
          business_id?: string
          channel?: string
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          leads_generated?: number | null
          period?: string | null
          recommendations_json?: Json | null
          revenue_attributed?: number | null
          roi_score?: number | null
          spend?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_marketing_insights_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_model_training: {
        Row: {
          accuracy_score: number | null
          business_id: string
          created_at: string
          id: string
          model_type: string
          status: string
          summary: string | null
          trained_at: string | null
          training_data_size: number
        }
        Insert: {
          accuracy_score?: number | null
          business_id: string
          created_at?: string
          id?: string
          model_type: string
          status?: string
          summary?: string | null
          trained_at?: string | null
          training_data_size?: number
        }
        Update: {
          accuracy_score?: number | null
          business_id?: string
          created_at?: string
          id?: string
          model_type?: string
          status?: string
          summary?: string | null
          trained_at?: string | null
          training_data_size?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_model_training_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_outreach_prospects: {
        Row: {
          business_id: string
          client_id: string | null
          contact_email: string | null
          created_at: string
          domain_quality_score: number | null
          id: string
          outreach_category: string | null
          outreach_status: string
          prospect_domain: string
          relevance_score: number | null
          suggested_anchor: string | null
          suggested_target_url: string | null
        }
        Insert: {
          business_id: string
          client_id?: string | null
          contact_email?: string | null
          created_at?: string
          domain_quality_score?: number | null
          id?: string
          outreach_category?: string | null
          outreach_status?: string
          prospect_domain: string
          relevance_score?: number | null
          suggested_anchor?: string | null
          suggested_target_url?: string | null
        }
        Update: {
          business_id?: string
          client_id?: string | null
          contact_email?: string | null
          created_at?: string
          domain_quality_score?: number | null
          id?: string
          outreach_category?: string | null
          outreach_status?: string
          prospect_domain?: string
          relevance_score?: number | null
          suggested_anchor?: string | null
          suggested_target_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_outreach_prospects_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_playbooks: {
        Row: {
          agent_type: Database["public"]["Enums"]["agent_type"]
          business_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          requires_approval_default: boolean
          steps_json: Json
          trigger_filter_json: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          agent_type: Database["public"]["Enums"]["agent_type"]
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          requires_approval_default?: boolean
          steps_json?: Json
          trigger_filter_json?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          agent_type?: Database["public"]["Enums"]["agent_type"]
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          requires_approval_default?: boolean
          steps_json?: Json
          trigger_filter_json?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_playbooks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendations: {
        Row: {
          action_url: string | null
          business_id: string
          created_at: string | null
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          impact_score: number | null
          priority: string
          recommendation_type: string
          status: string
          title: string
        }
        Insert: {
          action_url?: string | null
          business_id: string
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          impact_score?: number | null
          priority?: string
          recommendation_type?: string
          status?: string
          title: string
        }
        Update: {
          action_url?: string | null
          business_id?: string
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          impact_score?: number | null
          priority?: string
          recommendation_type?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_reports: {
        Row: {
          business_id: string
          created_at: string
          data_snapshot_json: Json | null
          generated_by_user_id: string | null
          id: string
          model_used: string | null
          report_period: string
          report_type: string
          summary_text: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          data_snapshot_json?: Json | null
          generated_by_user_id?: string | null
          id?: string
          model_used?: string | null
          report_period: string
          report_type?: string
          summary_text?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          data_snapshot_json?: Json | null
          generated_by_user_id?: string | null
          id?: string
          model_used?: string | null
          report_period?: string
          report_type?: string
          summary_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_sales_brain_scores: {
        Row: {
          business_id: string
          conversion_probability: number | null
          created_at: string
          id: string
          lead_id: string | null
          lead_name: string | null
          reasoning: string | null
          recommended_action: string | null
          score_factors_json: Json | null
        }
        Insert: {
          business_id: string
          conversion_probability?: number | null
          created_at?: string
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          reasoning?: string | null
          recommended_action?: string | null
          score_factors_json?: Json | null
        }
        Update: {
          business_id?: string
          conversion_probability?: number | null
          created_at?: string
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          reasoning?: string | null
          recommended_action?: string | null
          score_factors_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_sales_brain_scores_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
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
      ai_sales_recommendations: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_applied: boolean | null
          priority: string | null
          recommendation_type: string
          title: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_applied?: boolean | null
          priority?: string | null
          recommendation_type?: string
          title: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_applied?: boolean | null
          priority?: string | null
          recommendation_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_sales_recommendations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_seo_audits: {
        Row: {
          business_id: string
          client_id: string | null
          created_at: string
          critical_issues: number | null
          health_score: number | null
          id: string
          issues_json: Json | null
          project_id: string | null
          status: string
          total_issues: number | null
        }
        Insert: {
          business_id: string
          client_id?: string | null
          created_at?: string
          critical_issues?: number | null
          health_score?: number | null
          id?: string
          issues_json?: Json | null
          project_id?: string | null
          status?: string
          total_issues?: number | null
        }
        Update: {
          business_id?: string
          client_id?: string | null
          created_at?: string
          critical_issues?: number | null
          health_score?: number | null
          id?: string
          issues_json?: Json | null
          project_id?: string | null
          status?: string
          total_issues?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_seo_audits_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_social_posts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          business_id: string
          caption: string
          client_id: string | null
          content_type: string | null
          created_at: string
          cta: string | null
          hashtags: string[] | null
          id: string
          image_brief: string | null
          platform: string
          scheduled_at: string | null
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          business_id: string
          caption: string
          client_id?: string | null
          content_type?: string | null
          created_at?: string
          cta?: string | null
          hashtags?: string[] | null
          id?: string
          image_brief?: string | null
          platform?: string
          scheduled_at?: string | null
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          business_id?: string
          caption?: string
          client_id?: string | null
          content_type?: string | null
          created_at?: string
          cta?: string | null
          hashtags?: string[] | null
          id?: string
          image_brief?: string | null
          platform?: string
          scheduled_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_social_posts_business_id_fkey"
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
      ai_team_metrics: {
        Row: {
          business_id: string
          conversion_rate: number | null
          created_at: string
          employee_id: string | null
          employee_name: string | null
          factors_json: Json | null
          id: string
          performance_score: number
          response_time_minutes: number | null
          task_completion_rate: number | null
        }
        Insert: {
          business_id: string
          conversion_rate?: number | null
          created_at?: string
          employee_id?: string | null
          employee_name?: string | null
          factors_json?: Json | null
          id?: string
          performance_score?: number
          response_time_minutes?: number | null
          task_completion_rate?: number | null
        }
        Update: {
          business_id?: string
          conversion_rate?: number | null
          created_at?: string
          employee_id?: string | null
          employee_name?: string | null
          factors_json?: Json | null
          id?: string
          performance_score?: number
          response_time_minutes?: number | null
          task_completion_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_team_metrics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_voice_call_logs: {
        Row: {
          agent_id: string | null
          ai_summary: string | null
          business_id: string
          call_duration_seconds: number | null
          call_outcome: string | null
          call_status: string | null
          consent_given: boolean | null
          created_at: string | null
          id: string
          lead_email: string | null
          lead_id: string | null
          lead_name: string | null
          lead_phone: string | null
          provider: string | null
          recording_url: string | null
          transcript: string | null
          website_source: string | null
        }
        Insert: {
          agent_id?: string | null
          ai_summary?: string | null
          business_id: string
          call_duration_seconds?: number | null
          call_outcome?: string | null
          call_status?: string | null
          consent_given?: boolean | null
          created_at?: string | null
          id?: string
          lead_email?: string | null
          lead_id?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          provider?: string | null
          recording_url?: string | null
          transcript?: string | null
          website_source?: string | null
        }
        Update: {
          agent_id?: string | null
          ai_summary?: string | null
          business_id?: string
          call_duration_seconds?: number | null
          call_outcome?: string | null
          call_status?: string | null
          consent_given?: boolean | null
          created_at?: string | null
          id?: string
          lead_email?: string | null
          lead_id?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          provider?: string | null
          recording_url?: string | null
          transcript?: string | null
          website_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_voice_call_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_voice_call_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_workflow_adaptations: {
        Row: {
          adaptation_reason: string
          applied_changes: Json | null
          business_id: string
          created_at: string
          id: string
          status: string
          workflow_type: string
        }
        Insert: {
          adaptation_reason: string
          applied_changes?: Json | null
          business_id: string
          created_at?: string
          id?: string
          status?: string
          workflow_type: string
        }
        Update: {
          adaptation_reason?: string
          applied_changes?: Json | null
          business_id?: string
          created_at?: string
          id?: string
          status?: string
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_workflow_adaptations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_rules: {
        Row: {
          channel: string
          condition_type: string
          created_at: string
          enabled: boolean
          id: string
          last_triggered_at: string | null
          rule_name: string
          threshold: number
          window_minutes: number
        }
        Insert: {
          channel?: string
          condition_type: string
          created_at?: string
          enabled?: boolean
          id?: string
          last_triggered_at?: string | null
          rule_name: string
          threshold?: number
          window_minutes?: number
        }
        Update: {
          channel?: string
          condition_type?: string
          created_at?: string
          enabled?: boolean
          id?: string
          last_triggered_at?: string | null
          rule_name?: string
          threshold?: number
          window_minutes?: number
        }
        Relationships: []
      }
      analytics_connections: {
        Row: {
          auth_type: string
          business_id: string
          created_at: string
          external_account_id: string | null
          id: string
          provider: string
          refresh_token_encrypted: string | null
          scopes_json: Json | null
          status: string
          token_encrypted: string | null
        }
        Insert: {
          auth_type?: string
          business_id: string
          created_at?: string
          external_account_id?: string | null
          id?: string
          provider: string
          refresh_token_encrypted?: string | null
          scopes_json?: Json | null
          status?: string
          token_encrypted?: string | null
        }
        Update: {
          auth_type?: string
          business_id?: string
          created_at?: string
          external_account_id?: string | null
          id?: string
          provider?: string
          refresh_token_encrypted?: string | null
          scopes_json?: Json | null
          status?: string
          token_encrypted?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_connections_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_daily_metrics: {
        Row: {
          ads_clicks: number | null
          ads_impressions: number | null
          ads_spend: number | null
          business_id: string
          calls_count: number | null
          created_at: string
          date: string
          gbp_calls: number | null
          gbp_direction_requests: number | null
          gbp_website_clicks: number | null
          gsc_avg_position: number | null
          gsc_clicks: number | null
          gsc_ctr: number | null
          gsc_impressions: number | null
          id: string
          leads_count: number | null
          sessions: number | null
          users_count: number | null
        }
        Insert: {
          ads_clicks?: number | null
          ads_impressions?: number | null
          ads_spend?: number | null
          business_id: string
          calls_count?: number | null
          created_at?: string
          date: string
          gbp_calls?: number | null
          gbp_direction_requests?: number | null
          gbp_website_clicks?: number | null
          gsc_avg_position?: number | null
          gsc_clicks?: number | null
          gsc_ctr?: number | null
          gsc_impressions?: number | null
          id?: string
          leads_count?: number | null
          sessions?: number | null
          users_count?: number | null
        }
        Update: {
          ads_clicks?: number | null
          ads_impressions?: number | null
          ads_spend?: number | null
          business_id?: string
          calls_count?: number | null
          created_at?: string
          date?: string
          gbp_calls?: number | null
          gbp_direction_requests?: number | null
          gbp_website_clicks?: number | null
          gsc_avg_position?: number | null
          gsc_clicks?: number | null
          gsc_ctr?: number | null
          gsc_impressions?: number | null
          id?: string
          leads_count?: number | null
          sessions?: number | null
          users_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_daily_metrics_business_id_fkey"
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
      app_module_settings: {
        Row: {
          business_id: string
          created_at: string | null
          display_order: number | null
          enabled: boolean | null
          id: string
          module_name: string
          updated_at: string | null
          visible_to_customer: boolean | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          display_order?: number | null
          enabled?: boolean | null
          id?: string
          module_name: string
          updated_at?: string | null
          visible_to_customer?: boolean | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          display_order?: number | null
          enabled?: boolean | null
          id?: string
          module_name?: string
          updated_at?: string | null
          visible_to_customer?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "app_module_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          approver_user_id: string | null
          business_id: string
          created_at: string
          decided_at: string | null
          decision_comment: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          reason: string | null
          request_type: string
          requested_by: string | null
          status: string
        }
        Insert: {
          approver_user_id?: string | null
          business_id: string
          created_at?: string
          decided_at?: string | null
          decision_comment?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          reason?: string | null
          request_type?: string
          requested_by?: string | null
          status?: string
        }
        Update: {
          approver_user_id?: string | null
          business_id?: string
          created_at?: string
          decided_at?: string | null
          decision_comment?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          reason?: string | null
          request_type?: string
          requested_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          approval_type: string
          approved_at: string | null
          assigned_to: string | null
          business_id: string
          created_at: string
          decision_notes: string | null
          id: string
          module_name: string
          record_id: string
          rejected_at: string | null
          request_notes: string | null
          requested_by: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          approval_type: string
          approved_at?: string | null
          assigned_to?: string | null
          business_id: string
          created_at?: string
          decision_notes?: string | null
          id?: string
          module_name: string
          record_id: string
          rejected_at?: string | null
          request_notes?: string | null
          requested_by?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          approval_type?: string
          approved_at?: string | null
          assigned_to?: string | null
          business_id?: string
          created_at?: string
          decision_notes?: string | null
          id?: string
          module_name?: string
          record_id?: string
          rejected_at?: string | null
          request_notes?: string | null
          requested_by?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_checkins: {
        Row: {
          business_id: string
          checkin_type: string
          created_at: string
          id: string
          latitude: number | null
          location_label: string | null
          longitude: number | null
          source: string
          timestamp: string
          user_id: string
        }
        Insert: {
          business_id: string
          checkin_type: string
          created_at?: string
          id?: string
          latitude?: number | null
          location_label?: string | null
          longitude?: number | null
          source?: string
          timestamp?: string
          user_id: string
        }
        Update: {
          business_id?: string
          checkin_type?: string
          created_at?: string
          id?: string
          latitude?: number | null
          location_label?: string | null
          longitude?: number | null
          source?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_checkins_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_daily: {
        Row: {
          business_id: string
          created_at: string
          date: string
          first_login_at: string | null
          id: string
          last_logout_at: string | null
          notes: string | null
          status: string
          total_work_minutes: number | null
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          date: string
          first_login_at?: string | null
          id?: string
          last_logout_at?: string | null
          notes?: string | null
          status?: string
          total_work_minutes?: number | null
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          date?: string
          first_login_at?: string | null
          id?: string
          last_logout_at?: string | null
          notes?: string | null
          status?: string
          total_work_minutes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_daily_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      attribution_events: {
        Row: {
          adgroup: string | null
          business_id: string
          campaign: string | null
          channel: string | null
          created_at: string
          event_type: string
          id: string
          keyword: string | null
          meta_json: Json | null
          person_id: string | null
          person_type: string
        }
        Insert: {
          adgroup?: string | null
          business_id: string
          campaign?: string | null
          channel?: string | null
          created_at?: string
          event_type?: string
          id?: string
          keyword?: string | null
          meta_json?: Json | null
          person_id?: string | null
          person_type?: string
        }
        Update: {
          adgroup?: string | null
          business_id?: string
          campaign?: string | null
          channel?: string | null
          created_at?: string
          event_type?: string
          id?: string
          keyword?: string | null
          meta_json?: Json | null
          person_id?: string | null
          person_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "attribution_events_business_id_fkey"
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
      auto_reply_rules: {
        Row: {
          business_id: string
          channel: string
          created_at: string
          enabled: boolean
          id: string
          template_id: string | null
          trigger_type: string
        }
        Insert: {
          business_id: string
          channel: string
          created_at?: string
          enabled?: boolean
          id?: string
          template_id?: string | null
          trigger_type?: string
        }
        Update: {
          business_id?: string
          channel?: string
          created_at?: string
          enabled?: boolean
          id?: string
          template_id?: string | null
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_reply_rules_business_id_fkey"
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
      autopilot_rate_limits: {
        Row: {
          business_id: string
          date: string
          id: string
          lead_id: string
          sent_count: number | null
          updated_at: string | null
          week_count: number | null
          week_key: string | null
        }
        Insert: {
          business_id: string
          date?: string
          id?: string
          lead_id: string
          sent_count?: number | null
          updated_at?: string | null
          week_count?: number | null
          week_key?: string | null
        }
        Update: {
          business_id?: string
          date?: string
          id?: string
          lead_id?: string
          sent_count?: number | null
          updated_at?: string | null
          week_count?: number | null
          week_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "autopilot_rate_limits_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      autopilot_runs: {
        Row: {
          business_id: string
          conversation_id: string | null
          created_at: string | null
          current_step_order: number | null
          ended_at: string | null
          failure_reason: string | null
          id: string
          lead_id: string | null
          next_step_at: string | null
          sequence_id: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          business_id: string
          conversation_id?: string | null
          created_at?: string | null
          current_step_order?: number | null
          ended_at?: string | null
          failure_reason?: string | null
          id?: string
          lead_id?: string | null
          next_step_at?: string | null
          sequence_id?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          business_id?: string
          conversation_id?: string | null
          created_at?: string | null
          current_step_order?: number | null
          ended_at?: string | null
          failure_reason?: string | null
          id?: string
          lead_id?: string | null
          next_step_at?: string | null
          sequence_id?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "autopilot_runs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autopilot_runs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "lead_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autopilot_runs_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "autopilot_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      autopilot_sequences: {
        Row: {
          business_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          purpose: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          purpose?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          purpose?: string
        }
        Relationships: [
          {
            foreignKeyName: "autopilot_sequences_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      autopilot_settings: {
        Row: {
          allowed_channels: Json | null
          business_id: string
          created_at: string | null
          default_owner_role: string | null
          escalation_enabled: boolean | null
          id: string
          is_enabled: boolean
          max_messages_per_day: number | null
          max_messages_per_week: number | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          allowed_channels?: Json | null
          business_id: string
          created_at?: string | null
          default_owner_role?: string | null
          escalation_enabled?: boolean | null
          id?: string
          is_enabled?: boolean
          max_messages_per_day?: number | null
          max_messages_per_week?: number | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          allowed_channels?: Json | null
          business_id?: string
          created_at?: string | null
          default_owner_role?: string | null
          escalation_enabled?: boolean | null
          id?: string
          is_enabled?: boolean
          max_messages_per_day?: number | null
          max_messages_per_week?: number | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "autopilot_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      autopilot_steps: {
        Row: {
          ai_enabled: boolean | null
          business_id: string | null
          channel: string
          delay_minutes: number
          id: string
          sequence_id: string
          step_order: number
          stop_if_booked: boolean | null
          stop_if_replied: boolean | null
          template_id: string | null
        }
        Insert: {
          ai_enabled?: boolean | null
          business_id?: string | null
          channel?: string
          delay_minutes?: number
          id?: string
          sequence_id: string
          step_order?: number
          stop_if_booked?: boolean | null
          stop_if_replied?: boolean | null
          template_id?: string | null
        }
        Update: {
          ai_enabled?: boolean | null
          business_id?: string | null
          channel?: string
          delay_minutes?: number
          id?: string
          sequence_id?: string
          step_order?: number
          stop_if_booked?: boolean | null
          stop_if_replied?: boolean | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "autopilot_steps_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autopilot_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "autopilot_sequences"
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
      backup_jobs: {
        Row: {
          backup_type: string
          created_at: string
          frequency: string
          id: string
          last_run_at: string | null
          retention_days: number
          status: string
        }
        Insert: {
          backup_type?: string
          created_at?: string
          frequency?: string
          id?: string
          last_run_at?: string | null
          retention_days?: number
          status?: string
        }
        Update: {
          backup_type?: string
          created_at?: string
          frequency?: string
          id?: string
          last_run_at?: string | null
          retention_days?: number
          status?: string
        }
        Relationships: []
      }
      backup_runs: {
        Row: {
          backup_job_id: string
          backup_location: string | null
          created_at: string
          error_message: string | null
          id: string
          status: string
        }
        Insert: {
          backup_job_id: string
          backup_location?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          status?: string
        }
        Update: {
          backup_job_id?: string
          backup_location?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_runs_backup_job_id_fkey"
            columns: ["backup_job_id"]
            isOneToOne: false
            referencedRelation: "backup_jobs"
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
      broadcast_poll_options: {
        Row: {
          created_at: string | null
          id: string
          option_text: string
          poll_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_text: string
          poll_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          option_text?: string
          poll_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "broadcast_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_poll_votes: {
        Row: {
          business_id: string
          employee_id: string
          id: string
          option_id: string
          poll_id: string
          voted_at: string | null
        }
        Insert: {
          business_id: string
          employee_id: string
          id?: string
          option_id: string
          poll_id: string
          voted_at?: string | null
        }
        Update: {
          business_id?: string
          employee_id?: string
          id?: string
          option_id?: string
          poll_id?: string
          voted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_poll_votes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "broadcast_poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "broadcast_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_polls: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          insight_id: string
          is_active: boolean | null
          question: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          insight_id: string
          is_active?: boolean | null
          question: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          insight_id?: string
          is_active?: boolean | null
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_polls_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_polls_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "daily_insights"
            referencedColumns: ["id"]
          },
        ]
      }
      business_department_config: {
        Row: {
          business_id: string
          created_at: string | null
          custom_fields: Json | null
          department_template_id: string
          field_overrides: Json | null
          id: string
          is_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          custom_fields?: Json | null
          department_template_id: string
          field_overrides?: Json | null
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          custom_fields?: Json | null
          department_template_id?: string
          field_overrides?: Json | null
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_department_config_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_department_config_department_template_id_fkey"
            columns: ["department_template_id"]
            isOneToOne: false
            referencedRelation: "department_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          business_model: string | null
          city: string | null
          cms_platform: string | null
          competitors: string[] | null
          country: string | null
          created_at: string
          crm_access_status: string
          deleted_at: string | null
          domain_name: string | null
          email: string | null
          hosting_provider: string | null
          id: string
          industry: string | null
          logo_url: string | null
          mobile_access_status: string
          mobile_app_downloads: number
          mobile_subscription_expiry: string | null
          mobile_subscription_start: string | null
          name: string
          onboarding_completed: boolean | null
          owner_name: string | null
          phone: string | null
          postcode: string | null
          registered_by_user_id: string | null
          registration_method: string | null
          services_offered: string[] | null
          slug: string | null
          social_facebook: string | null
          social_gbp: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_youtube: string | null
          state: string | null
          status: Database["public"]["Enums"]["business_status"]
          sub_industry: string | null
          subscribed_services: string[] | null
          target_locations: string[] | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          business_model?: string | null
          city?: string | null
          cms_platform?: string | null
          competitors?: string[] | null
          country?: string | null
          created_at?: string
          crm_access_status?: string
          deleted_at?: string | null
          domain_name?: string | null
          email?: string | null
          hosting_provider?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          mobile_access_status?: string
          mobile_app_downloads?: number
          mobile_subscription_expiry?: string | null
          mobile_subscription_start?: string | null
          name: string
          onboarding_completed?: boolean | null
          owner_name?: string | null
          phone?: string | null
          postcode?: string | null
          registered_by_user_id?: string | null
          registration_method?: string | null
          services_offered?: string[] | null
          slug?: string | null
          social_facebook?: string | null
          social_gbp?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_youtube?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["business_status"]
          sub_industry?: string | null
          subscribed_services?: string[] | null
          target_locations?: string[] | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          business_model?: string | null
          city?: string | null
          cms_platform?: string | null
          competitors?: string[] | null
          country?: string | null
          created_at?: string
          crm_access_status?: string
          deleted_at?: string | null
          domain_name?: string | null
          email?: string | null
          hosting_provider?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          mobile_access_status?: string
          mobile_app_downloads?: number
          mobile_subscription_expiry?: string | null
          mobile_subscription_start?: string | null
          name?: string
          onboarding_completed?: boolean | null
          owner_name?: string | null
          phone?: string | null
          postcode?: string | null
          registered_by_user_id?: string | null
          registration_method?: string | null
          services_offered?: string[] | null
          slug?: string | null
          social_facebook?: string | null
          social_gbp?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_youtube?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["business_status"]
          sub_industry?: string | null
          subscribed_services?: string[] | null
          target_locations?: string[] | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          attendees: string[] | null
          business_id: string
          created_at: string
          created_by_user_id: string
          description: string | null
          end_datetime: string
          id: string
          location: string | null
          recurrence_rule: string | null
          start_datetime: string
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["calendar_visibility"]
        }
        Insert: {
          attendees?: string[] | null
          business_id: string
          created_at?: string
          created_by_user_id: string
          description?: string | null
          end_datetime: string
          id?: string
          location?: string | null
          recurrence_rule?: string | null
          start_datetime: string
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["calendar_visibility"]
        }
        Update: {
          attendees?: string[] | null
          business_id?: string
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          end_datetime?: string
          id?: string
          location?: string | null
          recurrence_rule?: string | null
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
      call_click_events: {
        Row: {
          business_id: string
          campaign_source: string | null
          created_at: string | null
          device_type: string | null
          id: string
          page_url: string | null
          phone_number: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          business_id: string
          campaign_source?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          page_url?: string | null
          phone_number?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          business_id?: string
          campaign_source?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          page_url?: string | null
          phone_number?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_click_events_business_id_fkey"
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
      callbacks: {
        Row: {
          account_id: string | null
          assigned_agent_id: string | null
          business_id: string
          callback_date: string
          callback_reason: string | null
          callback_time: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          id: string
          lead_id: string | null
          notes: string | null
          opportunity_id: string | null
          priority: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          assigned_agent_id?: string | null
          business_id: string
          callback_date: string
          callback_reason?: string | null
          callback_time?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          opportunity_id?: string | null
          priority?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          assigned_agent_id?: string | null
          business_id?: string
          callback_date?: string
          callback_reason?: string | null
          callback_time?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          opportunity_id?: string | null
          priority?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "callbacks_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "callbacks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "callbacks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "callbacks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "callbacks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "deals"
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
      churn_signals: {
        Row: {
          business_id: string
          client_id: string
          created_at: string
          id: string
          reasons_json: Json | null
          risk_score: number
          updated_at: string
        }
        Insert: {
          business_id: string
          client_id: string
          created_at?: string
          id?: string
          reasons_json?: Json | null
          risk_score?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          client_id?: string
          created_at?: string
          id?: string
          reasons_json?: Json | null
          risk_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "churn_signals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      client_activity_log: {
        Row: {
          activity_source: string
          activity_type: string
          business_id: string
          client_id: string
          created_at: string
          created_by_user_id: string | null
          description: string | null
          id: string
        }
        Insert: {
          activity_source?: string
          activity_type: string
          business_id: string
          client_id: string
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
        }
        Update: {
          activity_source?: string
          activity_type?: string
          business_id?: string
          client_id?: string
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_activity_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_activity_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_alternate_emails: {
        Row: {
          added_by_user_id: string | null
          business_id: string
          client_id: string
          created_at: string
          email: string
          id: string
          label: string | null
        }
        Insert: {
          added_by_user_id?: string | null
          business_id: string
          client_id: string
          created_at?: string
          email: string
          id?: string
          label?: string | null
        }
        Update: {
          added_by_user_id?: string | null
          business_id?: string
          client_id?: string
          created_at?: string
          email?: string
          id?: string
          label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_alternate_emails_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_alternate_emails_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_billing_schedules: {
        Row: {
          billing_cycle: string | null
          business_id: string
          client_id: string
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          monthly_fee: number | null
          next_billing_date: string | null
          service_type: string
        }
        Insert: {
          billing_cycle?: string | null
          business_id: string
          client_id: string
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          monthly_fee?: number | null
          next_billing_date?: string | null
          service_type: string
        }
        Update: {
          billing_cycle?: string | null
          business_id?: string
          client_id?: string
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          monthly_fee?: number | null
          next_billing_date?: string | null
          service_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_billing_schedules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_billing_schedules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_conversations: {
        Row: {
          business_id: string
          client_id: string
          conversation_date: string
          conversation_type: string
          created_at: string
          id: string
          next_callback_date: string | null
          notes: string | null
          sales_user_id: string
        }
        Insert: {
          business_id: string
          client_id: string
          conversation_date?: string
          conversation_type?: string
          created_at?: string
          id?: string
          next_callback_date?: string | null
          notes?: string | null
          sales_user_id: string
        }
        Update: {
          business_id?: string
          client_id?: string
          conversation_date?: string
          conversation_type?: string
          created_at?: string
          id?: string
          next_callback_date?: string | null
          notes?: string | null
          sales_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_conversations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_departments: {
        Row: {
          business_id: string
          client_id: string
          created_at: string
          department_name: string
          id: string
          manager_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          client_id: string
          created_at?: string
          department_name: string
          id?: string
          manager_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          client_id?: string
          created_at?: string
          department_name?: string
          id?: string
          manager_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_departments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_departments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_domains: {
        Row: {
          auto_renew_status: boolean | null
          business_id: string
          client_id: string | null
          created_at: string
          dns_provider: string | null
          domain_name: string
          expiry_date: string | null
          id: string
          linked_website_id: string | null
          nameservers: string[] | null
          notes: string | null
          registrar_account_reference: string | null
          registrar_name: string | null
          registration_date: string | null
          updated_at: string
        }
        Insert: {
          auto_renew_status?: boolean | null
          business_id: string
          client_id?: string | null
          created_at?: string
          dns_provider?: string | null
          domain_name: string
          expiry_date?: string | null
          id?: string
          linked_website_id?: string | null
          nameservers?: string[] | null
          notes?: string | null
          registrar_account_reference?: string | null
          registrar_name?: string | null
          registration_date?: string | null
          updated_at?: string
        }
        Update: {
          auto_renew_status?: boolean | null
          business_id?: string
          client_id?: string | null
          created_at?: string
          dns_provider?: string | null
          domain_name?: string
          expiry_date?: string | null
          id?: string
          linked_website_id?: string | null
          nameservers?: string[] | null
          notes?: string | null
          registrar_account_reference?: string | null
          registrar_name?: string | null
          registration_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_domains_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_domains_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_domains_linked_website_id_fkey"
            columns: ["linked_website_id"]
            isOneToOne: false
            referencedRelation: "tenant_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      client_employees: {
        Row: {
          app_access: boolean
          business_id: string
          client_id: string
          created_at: string
          department_id: string | null
          designation: string | null
          email: string | null
          employee_name: string
          id: string
          joining_date: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          app_access?: boolean
          business_id: string
          client_id: string
          created_at?: string
          department_id?: string | null
          designation?: string | null
          email?: string | null
          employee_name: string
          id?: string
          joining_date?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          app_access?: boolean
          business_id?: string
          client_id?: string
          created_at?: string
          department_id?: string | null
          designation?: string | null
          email?: string | null
          employee_name?: string
          id?: string
          joining_date?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_employees_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_employees_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "client_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      client_health_scores: {
        Row: {
          business_id: string
          client_id: string
          created_at: string
          id: string
          reasons_json: Json | null
          risk_level: string
          score: number
          updated_at: string
        }
        Insert: {
          business_id: string
          client_id: string
          created_at?: string
          id?: string
          reasons_json?: Json | null
          risk_level?: string
          score?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          client_id?: string
          created_at?: string
          id?: string
          reasons_json?: Json | null
          risk_level?: string
          score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_health_scores_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      client_hosting_accounts: {
        Row: {
          backup_status: string | null
          business_id: string
          client_id: string | null
          control_panel_type: string | null
          created_at: string
          hosting_plan: string | null
          hosting_provider: string
          id: string
          linked_website_id: string | null
          notes: string | null
          renewal_date: string | null
          server_location: string | null
          ssl_expiry_date: string | null
          ssl_status: string | null
          updated_at: string
        }
        Insert: {
          backup_status?: string | null
          business_id: string
          client_id?: string | null
          control_panel_type?: string | null
          created_at?: string
          hosting_plan?: string | null
          hosting_provider: string
          id?: string
          linked_website_id?: string | null
          notes?: string | null
          renewal_date?: string | null
          server_location?: string | null
          ssl_expiry_date?: string | null
          ssl_status?: string | null
          updated_at?: string
        }
        Update: {
          backup_status?: string | null
          business_id?: string
          client_id?: string | null
          control_panel_type?: string | null
          created_at?: string
          hosting_plan?: string | null
          hosting_provider?: string
          id?: string
          linked_website_id?: string | null
          notes?: string | null
          renewal_date?: string | null
          server_location?: string | null
          ssl_expiry_date?: string | null
          ssl_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_hosting_accounts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_hosting_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_hosting_accounts_linked_website_id_fkey"
            columns: ["linked_website_id"]
            isOneToOne: false
            referencedRelation: "tenant_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      client_mobile_apps: {
        Row: {
          app_category: string | null
          app_name: string
          app_status: string
          app_store_link: string | null
          business_id: string
          client_id: string
          created_at: string
          download_count: number | null
          features_json: Json | null
          id: string
          notes: string | null
          platform: string
          play_store_link: string | null
          updated_at: string
        }
        Insert: {
          app_category?: string | null
          app_name: string
          app_status?: string
          app_store_link?: string | null
          business_id: string
          client_id: string
          created_at?: string
          download_count?: number | null
          features_json?: Json | null
          id?: string
          notes?: string | null
          platform?: string
          play_store_link?: string | null
          updated_at?: string
        }
        Update: {
          app_category?: string | null
          app_name?: string
          app_status?: string
          app_store_link?: string | null
          business_id?: string
          client_id?: string
          created_at?: string
          download_count?: number | null
          features_json?: Json | null
          id?: string
          notes?: string | null
          platform?: string
          play_store_link?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_mobile_apps_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_mobile_apps_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_pipeline_stages: {
        Row: {
          business_id: string
          client_id: string
          completed_at: string | null
          created_at: string
          id: string
          seo_project_id: string | null
          stage_name: string
          stage_order: number
          status: string
        }
        Insert: {
          business_id: string
          client_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          seo_project_id?: string | null
          stage_name: string
          stage_order?: number
          status?: string
        }
        Update: {
          business_id?: string
          client_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          seo_project_id?: string | null
          stage_name?: string
          stage_order?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_pipeline_stages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_pipeline_stages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_pipeline_stages_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          address_json: Json | null
          assigned_pm_user_id: string | null
          assigned_sales_user_id: string | null
          assigned_support_user_id: string | null
          business_id: string
          client_id: string | null
          contract_json: Json | null
          created_at: string
          id: string
          legal_name: string | null
          notes: string | null
          onboarding_status: string
          payment_profile_json: Json | null
          primary_contact_json: Json | null
          renewal_date: string | null
          service_packages_json: Json | null
        }
        Insert: {
          address_json?: Json | null
          assigned_pm_user_id?: string | null
          assigned_sales_user_id?: string | null
          assigned_support_user_id?: string | null
          business_id: string
          client_id?: string | null
          contract_json?: Json | null
          created_at?: string
          id?: string
          legal_name?: string | null
          notes?: string | null
          onboarding_status?: string
          payment_profile_json?: Json | null
          primary_contact_json?: Json | null
          renewal_date?: string | null
          service_packages_json?: Json | null
        }
        Update: {
          address_json?: Json | null
          assigned_pm_user_id?: string | null
          assigned_sales_user_id?: string | null
          assigned_support_user_id?: string | null
          business_id?: string
          client_id?: string | null
          contract_json?: Json | null
          created_at?: string
          id?: string
          legal_name?: string | null
          notes?: string | null
          onboarding_status?: string
          payment_profile_json?: Json | null
          primary_contact_json?: Json | null
          renewal_date?: string | null
          service_packages_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_projects: {
        Row: {
          assigned_department_id: string | null
          business_id: string
          client_id: string | null
          client_name: string
          company_name: string | null
          contract_duration_months: number | null
          created_at: string
          description: string | null
          id: string
          project_manager_user_id: string | null
          service_type: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_department_id?: string | null
          business_id: string
          client_id?: string | null
          client_name: string
          company_name?: string | null
          contract_duration_months?: number | null
          created_at?: string
          description?: string | null
          id?: string
          project_manager_user_id?: string | null
          service_type?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_department_id?: string | null
          business_id?: string
          client_id?: string | null
          client_name?: string
          company_name?: string | null
          contract_duration_months?: number | null
          created_at?: string
          description?: string | null
          id?: string
          project_manager_user_id?: string | null
          service_type?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_projects_assigned_department_id_fkey"
            columns: ["assigned_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_projects_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_risk_alerts: {
        Row: {
          alert_type: string
          business_id: string
          client_id: string
          created_at: string
          id: string
          is_resolved: boolean | null
          message: string
          resolved_at: string | null
          severity: string
        }
        Insert: {
          alert_type: string
          business_id: string
          client_id: string
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          message: string
          resolved_at?: string | null
          severity?: string
        }
        Update: {
          alert_type?: string
          business_id?: string
          client_id?: string
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          message?: string
          resolved_at?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_risk_alerts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_risk_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_services: {
        Row: {
          assigned_department: string | null
          assigned_salesperson_id: string | null
          billing_cycle: string | null
          billing_date: number | null
          business_id: string
          client_id: string
          created_at: string
          id: string
          next_billing_date: string | null
          payment_method: string | null
          payment_status: string
          price_amount: number | null
          reminder_days_before: number | null
          renewal_date: string | null
          service_category: string | null
          service_details_json: Json | null
          service_name: string | null
          service_status: string
          service_subtype: string | null
          service_type: string
          updated_at: string
        }
        Insert: {
          assigned_department?: string | null
          assigned_salesperson_id?: string | null
          billing_cycle?: string | null
          billing_date?: number | null
          business_id: string
          client_id: string
          created_at?: string
          id?: string
          next_billing_date?: string | null
          payment_method?: string | null
          payment_status?: string
          price_amount?: number | null
          reminder_days_before?: number | null
          renewal_date?: string | null
          service_category?: string | null
          service_details_json?: Json | null
          service_name?: string | null
          service_status?: string
          service_subtype?: string | null
          service_type: string
          updated_at?: string
        }
        Update: {
          assigned_department?: string | null
          assigned_salesperson_id?: string | null
          billing_cycle?: string | null
          billing_date?: number | null
          business_id?: string
          client_id?: string
          created_at?: string
          id?: string
          next_billing_date?: string | null
          payment_method?: string | null
          payment_status?: string
          price_amount?: number | null
          reminder_days_before?: number | null
          renewal_date?: string | null
          service_category?: string | null
          service_details_json?: Json | null
          service_name?: string | null
          service_status?: string
          service_subtype?: string | null
          service_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_users: {
        Row: {
          client_id: string
          created_at: string
          id: string
          invited_by: string | null
          is_primary: boolean
          role: Database["public"]["Enums"]["client_user_role"]
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          is_primary?: boolean
          role?: Database["public"]["Enums"]["client_user_role"]
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          is_primary?: boolean
          role?: Database["public"]["Enums"]["client_user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_websites: {
        Row: {
          business_id: string
          client_id: string
          cms_type: string | null
          created_at: string
          domain_provider: string | null
          hosting_provider: string | null
          id: string
          notes: string | null
          updated_at: string
          website_status: string
          website_url: string
        }
        Insert: {
          business_id: string
          client_id: string
          cms_type?: string | null
          created_at?: string
          domain_provider?: string | null
          hosting_provider?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          website_status?: string
          website_url: string
        }
        Update: {
          business_id?: string
          client_id?: string
          cms_type?: string | null
          created_at?: string
          domain_provider?: string | null
          hosting_provider?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          website_status?: string
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_websites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_websites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          activation_token: string | null
          activation_token_expires_at: string | null
          address: string | null
          assigned_seo_manager_id: string | null
          auth_user_id: string | null
          billing_address: string | null
          business_id: string
          churn_risk: string | null
          city: string | null
          client_since: string | null
          client_start_date: string | null
          client_status: string
          commission_rate: number | null
          company_name: string | null
          contact_name: string
          contract_value: number | null
          country: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string
          health_score: string | null
          id: string
          last_payment_date: string | null
          lead_id: string | null
          login_status: string
          merged_at: string | null
          merged_into: string | null
          mobile: string | null
          onboarding_status: Database["public"]["Enums"]["onboarding_status"]
          payment_method: string | null
          payment_status: string | null
          phone: string | null
          renewal_date: string | null
          renewal_probability: string | null
          sales_owner_id: string | null
          salesperson_owner: string | null
          seo_payment_hold: boolean | null
          service_category: string | null
          signup_source: string | null
          state: string | null
          tax_number: string | null
          updated_at: string
          user_id: string | null
          website: string | null
          xero_contact_id: string | null
        }
        Insert: {
          activation_token?: string | null
          activation_token_expires_at?: string | null
          address?: string | null
          assigned_seo_manager_id?: string | null
          auth_user_id?: string | null
          billing_address?: string | null
          business_id: string
          churn_risk?: string | null
          city?: string | null
          client_since?: string | null
          client_start_date?: string | null
          client_status?: string
          commission_rate?: number | null
          company_name?: string | null
          contact_name: string
          contract_value?: number | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email: string
          health_score?: string | null
          id?: string
          last_payment_date?: string | null
          lead_id?: string | null
          login_status?: string
          merged_at?: string | null
          merged_into?: string | null
          mobile?: string | null
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          payment_method?: string | null
          payment_status?: string | null
          phone?: string | null
          renewal_date?: string | null
          renewal_probability?: string | null
          sales_owner_id?: string | null
          salesperson_owner?: string | null
          seo_payment_hold?: boolean | null
          service_category?: string | null
          signup_source?: string | null
          state?: string | null
          tax_number?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
          xero_contact_id?: string | null
        }
        Update: {
          activation_token?: string | null
          activation_token_expires_at?: string | null
          address?: string | null
          assigned_seo_manager_id?: string | null
          auth_user_id?: string | null
          billing_address?: string | null
          business_id?: string
          churn_risk?: string | null
          city?: string | null
          client_since?: string | null
          client_start_date?: string | null
          client_status?: string
          commission_rate?: number | null
          company_name?: string | null
          contact_name?: string
          contract_value?: number | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string
          health_score?: string | null
          id?: string
          last_payment_date?: string | null
          lead_id?: string | null
          login_status?: string
          merged_at?: string | null
          merged_into?: string | null
          mobile?: string | null
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          payment_method?: string | null
          payment_status?: string | null
          phone?: string | null
          renewal_date?: string | null
          renewal_probability?: string | null
          sales_owner_id?: string | null
          salesperson_owner?: string | null
          seo_payment_hold?: boolean | null
          service_category?: string | null
          signup_source?: string | null
          state?: string | null
          tax_number?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
          xero_contact_id?: string | null
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
          {
            foreignKeyName: "clients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_memberships: {
        Row: {
          business_id: string
          client_id: string | null
          cohort_month: string
          cohort_type: string
          created_at: string
          id: string
          service_id: string | null
        }
        Insert: {
          business_id: string
          client_id?: string | null
          cohort_month: string
          cohort_type?: string
          created_at?: string
          id?: string
          service_id?: string | null
        }
        Update: {
          business_id?: string
          client_id?: string | null
          cohort_month?: string
          cohort_type?: string
          created_at?: string
          id?: string
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cohort_memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      cold_calls: {
        Row: {
          business_id: string
          business_name: string
          call_result: string
          caller_user_id: string
          contact_person: string | null
          created_at: string
          email: string | null
          follow_up_date: string | null
          follow_up_time: string | null
          follow_up_type: string | null
          id: string
          industry: string | null
          lead_id: string | null
          location: string | null
          notes: string | null
          phone: string | null
          website: string | null
        }
        Insert: {
          business_id: string
          business_name: string
          call_result?: string
          caller_user_id: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          follow_up_date?: string | null
          follow_up_time?: string | null
          follow_up_type?: string | null
          id?: string
          industry?: string | null
          lead_id?: string | null
          location?: string | null
          notes?: string | null
          phone?: string | null
          website?: string | null
        }
        Update: {
          business_id?: string
          business_name?: string
          call_result?: string
          caller_user_id?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          follow_up_date?: string | null
          follow_up_time?: string | null
          follow_up_type?: string | null
          id?: string
          industry?: string | null
          lead_id?: string | null
          location?: string | null
          notes?: string | null
          phone?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cold_calls_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cold_calls_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
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
      company_accounts: {
        Row: {
          account_manager_user_id: string | null
          address: string | null
          business_id: string
          company_name: string
          created_at: string
          email: string | null
          health_status: string
          id: string
          industry: string | null
          notes: string | null
          phone: string | null
          plan: string | null
          renewal_date: string | null
          status: string
          tags: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          account_manager_user_id?: string | null
          address?: string | null
          business_id: string
          company_name: string
          created_at?: string
          email?: string | null
          health_status?: string
          id?: string
          industry?: string | null
          notes?: string | null
          phone?: string | null
          plan?: string | null
          renewal_date?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          account_manager_user_id?: string | null
          address?: string | null
          business_id?: string
          company_name?: string
          created_at?: string
          email?: string | null
          health_status?: string
          id?: string
          industry?: string | null
          notes?: string | null
          phone?: string | null
          plan?: string | null
          renewal_date?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_accounts_business_id_fkey"
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
      competitor_keyword_rankings: {
        Row: {
          competitor_id: string
          created_at: string
          date_checked: string
          id: string
          keyword: string
          rank_position: number | null
          search_engine: string | null
        }
        Insert: {
          competitor_id: string
          created_at?: string
          date_checked?: string
          id?: string
          keyword: string
          rank_position?: number | null
          search_engine?: string | null
        }
        Update: {
          competitor_id?: string
          created_at?: string
          date_checked?: string
          id?: string
          keyword?: string
          rank_position?: number | null
          search_engine?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_keyword_rankings_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "seo_competitors"
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
      completion_notifications: {
        Row: {
          business_id: string
          channel: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          recipient_type: string
          sent_at: string | null
          status: string
        }
        Insert: {
          business_id: string
          channel?: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          recipient_type: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          business_id?: string
          channel?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          recipient_type?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "completion_notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
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
      consent_logs: {
        Row: {
          business_id: string
          consent_state_json: Json
          created_at: string
          id: string
          visitor_id: string
        }
        Insert: {
          business_id: string
          consent_state_json?: Json
          created_at?: string
          id?: string
          visitor_id: string
        }
        Update: {
          business_id?: string
          consent_state_json?: Json
          created_at?: string
          id?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          business_id: string
          consent_type: string
          created_at: string | null
          email: string | null
          id: string
          person_id: string | null
          person_type: string
          phone: string | null
          source: string
          status: string
        }
        Insert: {
          business_id: string
          consent_type: string
          created_at?: string | null
          email?: string | null
          id?: string
          person_id?: string | null
          person_type?: string
          phone?: string | null
          source?: string
          status?: string
        }
        Update: {
          business_id?: string
          consent_type?: string
          created_at?: string | null
          email?: string | null
          id?: string
          person_id?: string | null
          person_type?: string
          phone?: string | null
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_relationships: {
        Row: {
          account_id: string | null
          business_id: string
          child_contact_id: string | null
          created_at: string
          id: string
          parent_contact_id: string | null
          relationship_label: string | null
        }
        Insert: {
          account_id?: string | null
          business_id: string
          child_contact_id?: string | null
          created_at?: string
          id?: string
          parent_contact_id?: string | null
          relationship_label?: string | null
        }
        Update: {
          account_id?: string | null
          business_id?: string
          child_contact_id?: string | null
          created_at?: string
          id?: string
          parent_contact_id?: string | null
          relationship_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_relationships_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_relationships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_relationships_child_contact_id_fkey"
            columns: ["child_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_relationships_parent_contact_id_fkey"
            columns: ["parent_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          account_id: string | null
          alternate_phone: string | null
          business_id: string
          contact_code: string | null
          created_at: string
          decision_maker_flag: boolean | null
          department_name: string | null
          designation: string | null
          email: string | null
          first_name: string | null
          full_name: string
          id: string
          influence_level: string | null
          last_name: string | null
          linkedin_url: string | null
          notes: string | null
          phone: string | null
          relationship_type: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          alternate_phone?: string | null
          business_id: string
          contact_code?: string | null
          created_at?: string
          decision_maker_flag?: boolean | null
          department_name?: string | null
          designation?: string | null
          email?: string | null
          first_name?: string | null
          full_name: string
          id?: string
          influence_level?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          relationship_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          alternate_phone?: string | null
          business_id?: string
          contact_code?: string | null
          created_at?: string
          decision_maker_flag?: boolean | null
          department_name?: string | null
          designation?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string
          id?: string
          influence_level?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          relationship_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      content_tasks: {
        Row: {
          assigned_to: string | null
          business_id: string
          client_id: string | null
          content_type: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          published_url: string | null
          status: string
          target_keyword: string | null
          title: string
          updated_at: string
          word_count: number | null
        }
        Insert: {
          assigned_to?: string | null
          business_id: string
          client_id?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          published_url?: string | null
          status?: string
          target_keyword?: string | null
          title: string
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          assigned_to?: string | null
          business_id?: string
          client_id?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          published_url?: string | null
          status?: string
          target_keyword?: string | null
          title?: string
          updated_at?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_tasks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          business_id: string
          client_id: string | null
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
          client_id?: string | null
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
          client_id?: string | null
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
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
      conversation_messages: {
        Row: {
          body_html: string | null
          body_text: string | null
          business_id: string
          channel: string
          created_at: string | null
          created_by: string | null
          direction: string
          error_message: string | null
          from_address: string | null
          id: string
          media_urls: Json | null
          provider_message_id: string | null
          received_at: string | null
          sent_at: string | null
          status: string
          thread_id: string
          to_address: string | null
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          business_id: string
          channel?: string
          created_at?: string | null
          created_by?: string | null
          direction?: string
          error_message?: string | null
          from_address?: string | null
          id?: string
          media_urls?: Json | null
          provider_message_id?: string | null
          received_at?: string | null
          sent_at?: string | null
          status?: string
          thread_id: string
          to_address?: string | null
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          business_id?: string
          channel?: string
          created_at?: string | null
          created_by?: string | null
          direction?: string
          error_message?: string | null
          from_address?: string | null
          id?: string
          media_urls?: Json | null
          provider_message_id?: string | null
          received_at?: string | null
          sent_at?: string | null
          status?: string
          thread_id?: string
          to_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "conversation_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          business_id: string
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          participant_id: string | null
          participant_type: string
          phone: string | null
          thread_id: string
          whatsapp_number: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          participant_id?: string | null
          participant_type?: string
          phone?: string | null
          thread_id: string
          whatsapp_number?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          participant_id?: string | null
          participant_type?: string
          phone?: string | null
          thread_id?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "conversation_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_threads: {
        Row: {
          assigned_to: string | null
          business_id: string
          client_id: string | null
          created_at: string | null
          id: string
          job_id: string | null
          last_message_at: string | null
          lead_id: string | null
          status: string
          subject: string | null
          thread_type: string
          ticket_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          business_id: string
          client_id?: string | null
          created_at?: string | null
          id?: string
          job_id?: string | null
          last_message_at?: string | null
          lead_id?: string | null
          status?: string
          subject?: string | null
          thread_type?: string
          ticket_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          business_id?: string
          client_id?: string | null
          created_at?: string | null
          id?: string
          job_id?: string | null
          last_message_at?: string | null
          lead_id?: string | null
          status?: string
          subject?: string | null
          thread_type?: string
          ticket_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_threads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
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
      cost_entries: {
        Row: {
          amount: number
          business_id: string
          cost_type: string
          created_at: string
          currency: string
          date: string
          id: string
          linked_entity_id: string | null
          linked_entity_type: string | null
          notes: string | null
        }
        Insert: {
          amount?: number
          business_id: string
          cost_type?: string
          created_at?: string
          currency?: string
          date?: string
          id?: string
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          notes?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          cost_type?: string
          created_at?: string
          currency?: string
          date?: string
          id?: string
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_department_requests: {
        Row: {
          business_id: string
          created_at: string | null
          from_department_id: string | null
          id: string
          request_message: string | null
          request_title: string
          requested_by_name: string | null
          requested_by_user_id: string | null
          resolved_at: string | null
          source_task_id: string | null
          status: string
          to_department_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          from_department_id?: string | null
          id?: string
          request_message?: string | null
          request_title: string
          requested_by_name?: string | null
          requested_by_user_id?: string | null
          resolved_at?: string | null
          source_task_id?: string | null
          status?: string
          to_department_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          from_department_id?: string | null
          id?: string
          request_message?: string | null
          request_title?: string
          requested_by_name?: string | null
          requested_by_user_id?: string | null
          resolved_at?: string | null
          source_task_id?: string | null
          status?: string
          to_department_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cross_department_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_automation_rules: {
        Row: {
          action_type: string
          business_id: string
          config_json: Json | null
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          last_run_at: string | null
          name: string
          runs_count: number
          trigger_event: string
          updated_at: string
        }
        Insert: {
          action_type: string
          business_id: string
          config_json?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          name: string
          runs_count?: number
          trigger_event: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          business_id?: string
          config_json?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          name?: string
          runs_count?: number
          trigger_event?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cs_automation_rules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_values: {
        Row: {
          business_id: string
          created_at: string
          custom_field_id: string
          id: string
          module_name: string
          record_id: string
          updated_at: string
          value: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          custom_field_id: string
          id?: string
          module_name: string
          record_id: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          custom_field_id?: string
          id?: string
          module_name?: string
          record_id?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_values_custom_field_id_fkey"
            columns: ["custom_field_id"]
            isOneToOne: false
            referencedRelation: "custom_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          business_id: string
          created_at: string
          display_order: number
          field_key: string
          field_label: string
          field_type: string
          id: string
          is_active: boolean
          is_required: boolean
          module_name: string
          options: Json | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          display_order?: number
          field_key: string
          field_label: string
          field_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          module_name: string
          options?: Json | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          display_order?: number
          field_key?: string
          field_label?: string
          field_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          module_name?: string
          options?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_fields_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_feedback: {
        Row: {
          account_id: string | null
          business_id: string
          client_id: string | null
          comments: string | null
          contact_id: string | null
          feedback_type: string | null
          id: string
          score: number | null
          submitted_at: string | null
          ticket_id: string | null
        }
        Insert: {
          account_id?: string | null
          business_id: string
          client_id?: string | null
          comments?: string | null
          contact_id?: string | null
          feedback_type?: string | null
          id?: string
          score?: number | null
          submitted_at?: string | null
          ticket_id?: string | null
        }
        Update: {
          account_id?: string | null
          business_id?: string
          client_id?: string | null
          comments?: string | null
          contact_id?: string | null
          feedback_type?: string | null
          id?: string
          score?: number | null
          submitted_at?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_feedback_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_feedback_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_feedback_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_feedback_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_feedback_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_portal_settings: {
        Row: {
          branding_json: Json | null
          business_id: string
          created_at: string
          features_json: Json | null
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          branding_json?: Json | null
          business_id: string
          created_at?: string
          features_json?: Json | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          branding_json?: Json | null
          business_id?: string
          created_at?: string
          features_json?: Json | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_portal_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      customization_requests: {
        Row: {
          assigned_to: string | null
          business_id: string
          created_at: string | null
          created_by: string | null
          department: string | null
          description: string | null
          id: string
          priority: string | null
          request_type: string | null
          resolved_at: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          business_id: string
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          request_type?: string | null
          resolved_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          business_id?: string
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          request_type?: string | null
          resolved_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customization_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_insights: {
        Row: {
          allow_comments: boolean | null
          business_id: string
          created_at: string | null
          created_by: string | null
          department_target: string[] | null
          expiry_date: string | null
          id: string
          message: string | null
          nextweb_application: string | null
          priority_level: string
          require_acknowledgement: boolean | null
          start_date: string | null
          status: string | null
          title: string
          video_url: string | null
        }
        Insert: {
          allow_comments?: boolean | null
          business_id: string
          created_at?: string | null
          created_by?: string | null
          department_target?: string[] | null
          expiry_date?: string | null
          id?: string
          message?: string | null
          nextweb_application?: string | null
          priority_level?: string
          require_acknowledgement?: boolean | null
          start_date?: string | null
          status?: string | null
          title: string
          video_url?: string | null
        }
        Update: {
          allow_comments?: boolean | null
          business_id?: string
          created_at?: string | null
          created_by?: string | null
          department_target?: string[] | null
          expiry_date?: string | null
          id?: string
          message?: string | null
          nextweb_application?: string | null
          priority_level?: string
          require_acknowledgement?: boolean | null
          start_date?: string | null
          status?: string | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_insights_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_work_reports: {
        Row: {
          business_id: string
          calls_made: number | null
          created_at: string
          deals_closed: number | null
          demos_done: number | null
          department_id: string | null
          employee_id: string
          id: string
          leads_handled: number | null
          meetings_conducted: number | null
          notes: string | null
          proposals_sent: number | null
          report_date: string
          status: string | null
          submitted_at: string | null
          tasks_assigned: number | null
          tasks_completed: number | null
          tasks_pending: number | null
          tickets_created: number | null
          tickets_handled: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_id: string
          calls_made?: number | null
          created_at?: string
          deals_closed?: number | null
          demos_done?: number | null
          department_id?: string | null
          employee_id: string
          id?: string
          leads_handled?: number | null
          meetings_conducted?: number | null
          notes?: string | null
          proposals_sent?: number | null
          report_date?: string
          status?: string | null
          submitted_at?: string | null
          tasks_assigned?: number | null
          tasks_completed?: number | null
          tasks_pending?: number | null
          tickets_created?: number | null
          tickets_handled?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_id?: string
          calls_made?: number | null
          created_at?: string
          deals_closed?: number | null
          demos_done?: number | null
          department_id?: string | null
          employee_id?: string
          id?: string
          leads_handled?: number | null
          meetings_conducted?: number | null
          notes?: string | null
          proposals_sent?: number | null
          report_date?: string
          status?: string | null
          submitted_at?: string | null
          tasks_assigned?: number | null
          tasks_completed?: number | null
          tasks_pending?: number | null
          tickets_created?: number | null
          tickets_handled?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_work_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      data_requests: {
        Row: {
          business_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          request_type: string
          requester_user_id: string | null
          status: string
        }
        Insert: {
          business_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          request_type?: string
          requester_user_id?: string | null
          status?: string
        }
        Update: {
          business_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          request_type?: string
          requester_user_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      data_retention_policies: {
        Row: {
          analytics_retention_days: number
          business_id: string | null
          created_at: string
          id: string
          logs_retention_days: number
          scope_level: string
          ticket_retention_days: number
        }
        Insert: {
          analytics_retention_days?: number
          business_id?: string | null
          created_at?: string
          id?: string
          logs_retention_days?: number
          scope_level?: string
          ticket_retention_days?: number
        }
        Update: {
          analytics_retention_days?: number
          business_id?: string | null
          created_at?: string
          id?: string
          logs_retention_days?: number
          scope_level?: string
          ticket_retention_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "data_retention_policies_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
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
      deal_room_proposals: {
        Row: {
          business_id: string
          client_id: string | null
          created_at: string
          expiry_date: string | null
          id: string
          is_latest: boolean
          lead_id: string | null
          pdf_file_path: string | null
          proposal_request_id: string | null
          proposal_status: string
          proposal_title: string
          proposal_version: number
          updated_at: string
          uploaded_by_user_id: string | null
        }
        Insert: {
          business_id: string
          client_id?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_latest?: boolean
          lead_id?: string | null
          pdf_file_path?: string | null
          proposal_request_id?: string | null
          proposal_status?: string
          proposal_title: string
          proposal_version?: number
          updated_at?: string
          uploaded_by_user_id?: string | null
        }
        Update: {
          business_id?: string
          client_id?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_latest?: boolean
          lead_id?: string | null
          pdf_file_path?: string | null
          proposal_request_id?: string | null
          proposal_status?: string
          proposal_title?: string
          proposal_version?: number
          updated_at?: string
          uploaded_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_room_proposals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_room_proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_room_proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_room_proposals_proposal_request_id_fkey"
            columns: ["proposal_request_id"]
            isOneToOne: false
            referencedRelation: "proposal_requests"
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
      demo_configurations: {
        Row: {
          business_id: string
          created_at: string
          demo_email: string | null
          demo_enabled: boolean
          demo_phone: string | null
          demo_profile_type: string
          demo_whatsapp: string | null
          expiry_at: string | null
          id: string
          reset_allowed: boolean
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          demo_email?: string | null
          demo_enabled?: boolean
          demo_phone?: string | null
          demo_profile_type?: string
          demo_whatsapp?: string | null
          expiry_at?: string | null
          id?: string
          reset_allowed?: boolean
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          demo_email?: string | null
          demo_enabled?: boolean
          demo_phone?: string | null
          demo_profile_type?: string
          demo_whatsapp?: string | null
          expiry_at?: string | null
          id?: string
          reset_allowed?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_configurations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_inquiry_simulations: {
        Row: {
          business_id: string
          created_at: string
          id: string
          inquiry_id: string | null
          is_demo: boolean
          simulated_email: string | null
          simulated_name: string
          simulated_phone: string | null
          simulated_service: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          inquiry_id?: string | null
          is_demo?: boolean
          simulated_email?: string | null
          simulated_name: string
          simulated_phone?: string | null
          simulated_service?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          inquiry_id?: string | null
          is_demo?: boolean
          simulated_email?: string | null
          simulated_name?: string
          simulated_phone?: string | null
          simulated_service?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_inquiry_simulations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_jobs: {
        Row: {
          business_id: string
          created_at: string
          id: string
          is_demo: boolean
          job_title: string
          simulated_customer: string
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          is_demo?: boolean
          job_title?: string
          simulated_customer: string
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          job_title?: string
          simulated_customer?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      demos: {
        Row: {
          account_id: string | null
          assigned_agent_id: string | null
          business_id: string
          contact_id: string | null
          created_at: string
          demo_date: string
          demo_time: string | null
          demo_type: string | null
          followup_required: boolean | null
          id: string
          notes: string | null
          opportunity_id: string | null
          outcome: string | null
          platform: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          assigned_agent_id?: string | null
          business_id: string
          contact_id?: string | null
          created_at?: string
          demo_date: string
          demo_time?: string | null
          demo_type?: string | null
          followup_required?: boolean | null
          id?: string
          notes?: string | null
          opportunity_id?: string | null
          outcome?: string | null
          platform?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          assigned_agent_id?: string | null
          business_id?: string
          contact_id?: string | null
          created_at?: string
          demo_date?: string
          demo_time?: string | null
          demo_type?: string | null
          followup_required?: boolean | null
          id?: string
          notes?: string | null
          opportunity_id?: string | null
          outcome?: string | null
          platform?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demos_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demos_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demos_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demos_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      department_field_templates: {
        Row: {
          created_at: string | null
          department_template_id: string
          display_order: number | null
          field_key: string
          field_label: string
          field_type: string | null
          id: string
          is_default_enabled: boolean | null
          is_required: boolean | null
          options: Json | null
        }
        Insert: {
          created_at?: string | null
          department_template_id: string
          display_order?: number | null
          field_key: string
          field_label: string
          field_type?: string | null
          id?: string
          is_default_enabled?: boolean | null
          is_required?: boolean | null
          options?: Json | null
        }
        Update: {
          created_at?: string | null
          department_template_id?: string
          display_order?: number | null
          field_key?: string
          field_label?: string
          field_type?: string | null
          id?: string
          is_default_enabled?: boolean | null
          is_required?: boolean | null
          options?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "department_field_templates_department_template_id_fkey"
            columns: ["department_template_id"]
            isOneToOne: false
            referencedRelation: "department_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      department_handoffs: {
        Row: {
          account_id: string | null
          business_id: string
          created_at: string
          handoff_notes: string | null
          handoff_type: string | null
          id: string
          source_department_id: string | null
          source_user_id: string | null
          status: string | null
          target_department_id: string | null
          target_user_id: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          business_id: string
          created_at?: string
          handoff_notes?: string | null
          handoff_type?: string | null
          id?: string
          source_department_id?: string | null
          source_user_id?: string | null
          status?: string | null
          target_department_id?: string | null
          target_user_id?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          business_id?: string
          created_at?: string
          handoff_notes?: string | null
          handoff_type?: string | null
          id?: string
          source_department_id?: string | null
          source_user_id?: string | null
          status?: string | null
          target_department_id?: string | null
          target_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_handoffs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_handoffs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_handoffs_source_department_id_fkey"
            columns: ["source_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_handoffs_target_department_id_fkey"
            columns: ["target_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      department_templates: {
        Row: {
          created_at: string | null
          default_fields: Json | null
          default_permissions: Json | null
          default_reports: Json | null
          default_status_options: Json | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          default_fields?: Json | null
          default_permissions?: Json | null
          default_reports?: Json | null
          default_status_options?: Json | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          default_fields?: Json | null
          default_permissions?: Json | null
          default_reports?: Json | null
          default_status_options?: Json | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          head_user_id: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          head_user_id?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          head_user_id?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      dependency_registry: {
        Row: {
          category: string
          created_at: string
          credential_type: string | null
          id: string
          is_required: boolean
          label: string
          notes: string | null
          provider: string
          scope_level: string
          status: string
        }
        Insert: {
          category: string
          created_at?: string
          credential_type?: string | null
          id?: string
          is_required?: boolean
          label: string
          notes?: string | null
          provider: string
          scope_level?: string
          status?: string
        }
        Update: {
          category?: string
          created_at?: string
          credential_type?: string | null
          id?: string
          is_required?: boolean
          label?: string
          notes?: string | null
          provider?: string
          scope_level?: string
          status?: string
        }
        Relationships: []
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
      duplicate_candidates: {
        Row: {
          business_id: string
          candidate_entity_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          match_reasons_json: Json | null
          match_score: number
          status: string
        }
        Insert: {
          business_id: string
          candidate_entity_id: string
          created_at?: string
          entity_id: string
          entity_type?: string
          id?: string
          match_reasons_json?: Json | null
          match_score?: number
          status?: string
        }
        Update: {
          business_id?: string
          candidate_entity_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          match_reasons_json?: Json | null
          match_score?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "duplicate_candidates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_analytics: {
        Row: {
          bounced_at: string | null
          business_id: string
          campaign_name: string | null
          click_count: number | null
          clicked_at: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_status: string | null
          id: string
          open_count: number | null
          opened_at: string | null
          recipient_email: string | null
          send_id: string | null
          sent_at: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          bounced_at?: string | null
          business_id: string
          campaign_name?: string | null
          click_count?: number | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_status?: string | null
          id?: string
          open_count?: number | null
          opened_at?: string | null
          recipient_email?: string | null
          send_id?: string | null
          sent_at?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          bounced_at?: string | null
          business_id?: string
          campaign_name?: string | null
          click_count?: number | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_status?: string | null
          id?: string
          open_count?: number | null
          opened_at?: string | null
          recipient_email?: string | null
          send_id?: string | null
          sent_at?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_analytics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_analytics_send_id_fkey"
            columns: ["send_id"]
            isOneToOne: false
            referencedRelation: "communications_sends"
            referencedColumns: ["id"]
          },
        ]
      }
      email_configurations: {
        Row: {
          business_id: string
          config_name: string
          created_at: string
          default_department: string | null
          email_address: string
          encryption_type: string | null
          google_oauth_client_id: string | null
          google_oauth_client_secret_key: string | null
          google_refresh_token_key: string | null
          id: string
          imap_host: string | null
          imap_port: number | null
          is_active: boolean | null
          last_message_uid: string | null
          last_polled_at: string | null
          monitored: boolean | null
          password_secret_key: string | null
          polling_interval_seconds: number | null
          provider_type: string
          smtp_host: string | null
          smtp_port: number | null
          updated_at: string
          username: string | null
        }
        Insert: {
          business_id: string
          config_name: string
          created_at?: string
          default_department?: string | null
          email_address: string
          encryption_type?: string | null
          google_oauth_client_id?: string | null
          google_oauth_client_secret_key?: string | null
          google_refresh_token_key?: string | null
          id?: string
          imap_host?: string | null
          imap_port?: number | null
          is_active?: boolean | null
          last_message_uid?: string | null
          last_polled_at?: string | null
          monitored?: boolean | null
          password_secret_key?: string | null
          polling_interval_seconds?: number | null
          provider_type?: string
          smtp_host?: string | null
          smtp_port?: number | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          business_id?: string
          config_name?: string
          created_at?: string
          default_department?: string | null
          email_address?: string
          encryption_type?: string | null
          google_oauth_client_id?: string | null
          google_oauth_client_secret_key?: string | null
          google_refresh_token_key?: string | null
          id?: string
          imap_host?: string | null
          imap_port?: number | null
          is_active?: boolean | null
          last_message_uid?: string | null
          last_polled_at?: string | null
          monitored?: boolean | null
          password_secret_key?: string | null
          polling_interval_seconds?: number | null
          provider_type?: string
          smtp_host?: string | null
          smtp_port?: number | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_configurations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      email_messages: {
        Row: {
          body_html: string | null
          body_text: string | null
          business_id: string
          cc_email: string | null
          created_at: string
          external_message_id: string | null
          id: string
          linked_account_id: string | null
          linked_contact_id: string | null
          linked_lead_id: string | null
          linked_opportunity_id: string | null
          linked_ticket_id: string | null
          mailbox: string | null
          message_type: string | null
          processed_status: string | null
          received_at: string | null
          recipient_email: string | null
          sender_email: string | null
          sender_name: string | null
          subject: string | null
          thread_id: string | null
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          business_id: string
          cc_email?: string | null
          created_at?: string
          external_message_id?: string | null
          id?: string
          linked_account_id?: string | null
          linked_contact_id?: string | null
          linked_lead_id?: string | null
          linked_opportunity_id?: string | null
          linked_ticket_id?: string | null
          mailbox?: string | null
          message_type?: string | null
          processed_status?: string | null
          received_at?: string | null
          recipient_email?: string | null
          sender_email?: string | null
          sender_name?: string | null
          subject?: string | null
          thread_id?: string | null
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          business_id?: string
          cc_email?: string | null
          created_at?: string
          external_message_id?: string | null
          id?: string
          linked_account_id?: string | null
          linked_contact_id?: string | null
          linked_lead_id?: string | null
          linked_opportunity_id?: string | null
          linked_ticket_id?: string | null
          mailbox?: string | null
          message_type?: string | null
          processed_status?: string | null
          received_at?: string | null
          recipient_email?: string | null
          sender_email?: string | null
          sender_name?: string | null
          subject?: string | null
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_linked_account_id_fkey"
            columns: ["linked_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_linked_contact_id_fkey"
            columns: ["linked_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_linked_lead_id_fkey"
            columns: ["linked_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_linked_opportunity_id_fkey"
            columns: ["linked_opportunity_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_linked_ticket_id_fkey"
            columns: ["linked_ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_activity_logs: {
        Row: {
          activity_description: string | null
          activity_type: string
          business_id: string
          created_at: string
          id: string
          module_name: string | null
          record_id: string | null
          user_id: string
        }
        Insert: {
          activity_description?: string | null
          activity_type: string
          business_id: string
          created_at?: string
          id?: string
          module_name?: string | null
          record_id?: string | null
          user_id: string
        }
        Update: {
          activity_description?: string | null
          activity_type?: string
          business_id?: string
          created_at?: string
          id?: string
          module_name?: string | null
          record_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_activity_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_advocacy_points: {
        Row: {
          business_id: string
          clicks_count: number
          id: string
          leads_generated: number
          points_total: number
          sales_generated: number
          shares_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          clicks_count?: number
          id?: string
          leads_generated?: number
          points_total?: number
          sales_generated?: number
          shares_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          clicks_count?: number
          id?: string
          leads_generated?: number
          points_total?: number
          sales_generated?: number
          shares_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_advocacy_points_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_capacity: {
        Row: {
          business_id: string
          current_assigned_today: number
          daily_lead_limit: number
          employee_id: string
          id: string
          is_active: boolean
          last_reset_date: string
        }
        Insert: {
          business_id: string
          current_assigned_today?: number
          daily_lead_limit?: number
          employee_id: string
          id?: string
          is_active?: boolean
          last_reset_date?: string
        }
        Update: {
          business_id?: string
          current_assigned_today?: number
          daily_lead_limit?: number
          employee_id?: string
          id?: string
          is_active?: boolean
          last_reset_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_capacity_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_cost_rates: {
        Row: {
          business_id: string
          created_at: string
          effective_from: string
          hourly_rate: number
          id: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          effective_from?: string
          hourly_rate?: number
          id?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          effective_from?: string
          hourly_rate?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_cost_rates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          business_id: string
          created_at: string
          document_meta_json: Json | null
          document_type: string
          file_url: string
          id: string
          user_id: string
          verified_at: string | null
          verified_by_user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          document_meta_json?: Json | null
          document_type: string
          file_url: string
          id?: string
          user_id: string
          verified_at?: string | null
          verified_by_user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          document_meta_json?: Json | null
          document_type?: string
          file_url?: string
          id?: string
          user_id?: string
          verified_at?: string | null
          verified_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_insight_views: {
        Row: {
          acknowledged: boolean | null
          business_id: string
          employee_id: string
          id: string
          insight_id: string
          view_status: string | null
          view_time: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          business_id: string
          employee_id: string
          id?: string
          insight_id: string
          view_status?: string | null
          view_time?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          business_id?: string
          employee_id?: string
          id?: string
          insight_id?: string
          view_status?: string | null
          view_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_insight_views_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_insight_views_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "daily_insights"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_performance_daily: {
        Row: {
          business_id: string
          callbacks_completed: number | null
          callbacks_due: number | null
          callbacks_missed: number | null
          calls_logged: number | null
          created_at: string
          deals_closed: number | null
          demos_done: number | null
          followups_completed: number | null
          id: string
          leads_handled: number | null
          meetings_done: number | null
          proposals_sent: number | null
          revenue_closed: number | null
          stat_date: string
          tickets_followed_up: number | null
          tickets_opened: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          callbacks_completed?: number | null
          callbacks_due?: number | null
          callbacks_missed?: number | null
          calls_logged?: number | null
          created_at?: string
          deals_closed?: number | null
          demos_done?: number | null
          followups_completed?: number | null
          id?: string
          leads_handled?: number | null
          meetings_done?: number | null
          proposals_sent?: number | null
          revenue_closed?: number | null
          stat_date: string
          tickets_followed_up?: number | null
          tickets_opened?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          callbacks_completed?: number | null
          callbacks_due?: number | null
          callbacks_missed?: number | null
          calls_logged?: number | null
          created_at?: string
          deals_closed?: number | null
          demos_done?: number | null
          followups_completed?: number | null
          id?: string
          leads_handled?: number | null
          meetings_done?: number | null
          proposals_sent?: number | null
          revenue_closed?: number | null
          stat_date?: string
          tickets_followed_up?: number | null
          tickets_opened?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_performance_daily_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_performance_monthly: {
        Row: {
          business_id: string
          callback_compliance_rate: number | null
          calls_logged: number | null
          conversion_rate: number | null
          created_at: string
          deals_closed: number | null
          demos_done: number | null
          id: string
          leads_handled: number | null
          meetings_done: number | null
          proposals_sent: number | null
          revenue_closed: number | null
          stat_month: number
          stat_year: number
          ticket_handling_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          callback_compliance_rate?: number | null
          calls_logged?: number | null
          conversion_rate?: number | null
          created_at?: string
          deals_closed?: number | null
          demos_done?: number | null
          id?: string
          leads_handled?: number | null
          meetings_done?: number | null
          proposals_sent?: number | null
          revenue_closed?: number | null
          stat_month: number
          stat_year: number
          ticket_handling_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          callback_compliance_rate?: number | null
          calls_logged?: number | null
          conversion_rate?: number | null
          created_at?: string
          deals_closed?: number | null
          demos_done?: number | null
          id?: string
          leads_handled?: number | null
          meetings_done?: number | null
          proposals_sent?: number | null
          revenue_closed?: number | null
          stat_month?: number
          stat_year?: number
          ticket_handling_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_performance_monthly_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_profiles: {
        Row: {
          business_id: string
          created_at: string
          date_of_joining: string | null
          department_id: string | null
          emergency_contact_json: Json | null
          employee_code: string | null
          employment_type: string
          id: string
          manager_user_id: string | null
          status: string
          team_id: string | null
          user_id: string
          work_location_type: string
        }
        Insert: {
          business_id: string
          created_at?: string
          date_of_joining?: string | null
          department_id?: string | null
          emergency_contact_json?: Json | null
          employee_code?: string | null
          employment_type?: string
          id?: string
          manager_user_id?: string | null
          status?: string
          team_id?: string | null
          user_id: string
          work_location_type?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          date_of_joining?: string | null
          department_id?: string | null
          emergency_contact_json?: Json | null
          employee_code?: string | null
          employment_type?: string
          id?: string
          manager_user_id?: string | null
          status?: string
          team_id?: string | null
          user_id?: string
          work_location_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employee_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "org_structure_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employee_team"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "org_structure_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_sessions: {
        Row: {
          business_id: string
          created_at: string
          device_info_json: Json | null
          id: string
          ip_address: string | null
          login_at: string
          login_method: string
          logout_at: string | null
          session_duration_minutes: number | null
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          device_info_json?: Json | null
          id?: string
          ip_address?: string | null
          login_at?: string
          login_method?: string
          logout_at?: string | null
          session_duration_minutes?: number | null
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          device_info_json?: Json | null
          id?: string
          ip_address?: string | null
          login_at?: string
          login_method?: string
          logout_at?: string | null
          session_duration_minutes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_workloads: {
        Row: {
          business_id: string
          completed_tasks: number
          created_at: string
          current_tasks: number
          employee_id: string
          id: string
          last_calculated_at: string
          overdue_tasks: number
          productivity_score: number | null
          task_capacity: number
        }
        Insert: {
          business_id: string
          completed_tasks?: number
          created_at?: string
          current_tasks?: number
          employee_id: string
          id?: string
          last_calculated_at?: string
          overdue_tasks?: number
          productivity_score?: number | null
          task_capacity?: number
        }
        Update: {
          business_id?: string
          completed_tasks?: number
          created_at?: string
          current_tasks?: number
          employee_id?: string
          id?: string
          last_calculated_at?: string
          overdue_tasks?: number
          productivity_score?: number | null
          task_capacity?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_workloads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_workloads_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "hr_employees"
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
      escalation_rules: {
        Row: {
          business_id: string
          created_at: string | null
          escalate_to_role: string
          id: string
          is_active: boolean | null
          notify_channels: Json | null
          sla_minutes: number
          trigger_type: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          escalate_to_role?: string
          id?: string
          is_active?: boolean | null
          notify_channels?: Json | null
          sla_minutes?: number
          trigger_type?: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          escalate_to_role?: string
          id?: string
          is_active?: boolean | null
          notify_channels?: Json | null
          sla_minutes?: number
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalation_rules_business_id_fkey"
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
      export_jobs: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          export_type: string
          file_url: string | null
          filters_json: Json | null
          id: string
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          export_type?: string
          file_url?: string | null
          filters_json?: Json | null
          id?: string
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          export_type?: string
          file_url?: string | null
          filters_json?: Json | null
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
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
      feature_flags: {
        Row: {
          business_id: string | null
          created_at: string
          enabled: boolean
          flag_key: string
          id: string
          scope_level: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          enabled?: boolean
          flag_key: string
          id?: string
          scope_level?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          enabled?: boolean
          flag_key?: string
          id?: string
          scope_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      field_visits: {
        Row: {
          account_id: string | null
          agenda: string | null
          assigned_agent_id: string | null
          business_id: string
          contact_id: string | null
          created_at: string
          id: string
          notes: string | null
          opportunity_id: string | null
          updated_at: string
          visit_address: string | null
          visit_date: string
          visit_outcome: string | null
          visit_time: string | null
        }
        Insert: {
          account_id?: string | null
          agenda?: string | null
          assigned_agent_id?: string | null
          business_id: string
          contact_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          opportunity_id?: string | null
          updated_at?: string
          visit_address?: string | null
          visit_date: string
          visit_outcome?: string | null
          visit_time?: string | null
        }
        Update: {
          account_id?: string | null
          agenda?: string | null
          assigned_agent_id?: string | null
          business_id?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          opportunity_id?: string | null
          updated_at?: string
          visit_address?: string | null
          visit_date?: string
          visit_outcome?: string | null
          visit_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_visits_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_visits_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_visits_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_visits_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      first_login_security: {
        Row: {
          completed_at: string | null
          created_at: string | null
          email_verified: boolean | null
          id: string
          mobile_verified: boolean | null
          password_changed: boolean | null
          requires_security_setup: boolean | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          email_verified?: boolean | null
          id?: string
          mobile_verified?: boolean | null
          password_changed?: boolean | null
          requires_security_setup?: boolean | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          email_verified?: boolean | null
          id?: string
          mobile_verified?: boolean | null
          password_changed?: boolean | null
          requires_security_setup?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      followups: {
        Row: {
          account_id: string | null
          assigned_agent_id: string | null
          business_id: string
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          followup_date: string
          followup_time: string | null
          followup_type: string | null
          id: string
          lead_id: string | null
          notes: string | null
          opportunity_id: string | null
          priority: string | null
          status: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          assigned_agent_id?: string | null
          business_id: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          followup_date: string
          followup_time?: string | null
          followup_type?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          opportunity_id?: string | null
          priority?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          assigned_agent_id?: string | null
          business_id?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          followup_date?: string
          followup_time?: string | null
          followup_type?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          opportunity_id?: string | null
          priority?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "followups_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followups_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followups_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followups_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      forecast_snapshots: {
        Row: {
          business_id: string
          created_at: string
          expected_close_30d: number
          expected_close_60d: number
          expected_close_90d: number
          id: string
          notes: string | null
          snapshot_date: string
          weighted_pipeline_value: number
        }
        Insert: {
          business_id: string
          created_at?: string
          expected_close_30d?: number
          expected_close_60d?: number
          expected_close_90d?: number
          id?: string
          notes?: string | null
          snapshot_date?: string
          weighted_pipeline_value?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          expected_close_30d?: number
          expected_close_60d?: number
          expected_close_90d?: number
          id?: string
          notes?: string | null
          snapshot_date?: string
          weighted_pipeline_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "forecast_snapshots_business_id_fkey"
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
          collected_by_user_id: string | null
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          eway_response_code: string | null
          eway_response_message: string | null
          eway_transaction_id: string | null
          id: string
          invoice_id: string | null
          job_id: string | null
          notes: string | null
          payment_method: string
          raw_payload: Json | null
          receipt_number: string | null
          status: Database["public"]["Enums"]["payment_gateway_status"]
        }
        Insert: {
          amount?: number
          business_id: string
          collected_by_user_id?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          eway_response_code?: string | null
          eway_response_message?: string | null
          eway_transaction_id?: string | null
          id?: string
          invoice_id?: string | null
          job_id?: string | null
          notes?: string | null
          payment_method?: string
          raw_payload?: Json | null
          receipt_number?: string | null
          status?: Database["public"]["Enums"]["payment_gateway_status"]
        }
        Update: {
          amount?: number
          business_id?: string
          collected_by_user_id?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          eway_response_code?: string | null
          eway_response_message?: string | null
          eway_transaction_id?: string | null
          id?: string
          invoice_id?: string | null
          job_id?: string | null
          notes?: string | null
          payment_method?: string
          raw_payload?: Json | null
          receipt_number?: string | null
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
          {
            foreignKeyName: "gateway_transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_answer_blocks: {
        Row: {
          answer_text: string
          business_id: string
          citations: string | null
          created_at: string
          id: string
          query_intent: string
          status: string
        }
        Insert: {
          answer_text: string
          business_id: string
          citations?: string | null
          created_at?: string
          id?: string
          query_intent: string
          status?: string
        }
        Update: {
          answer_text?: string
          business_id?: string
          citations?: string | null
          created_at?: string
          id?: string
          query_intent?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "geo_answer_blocks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_entities: {
        Row: {
          attributes_json: Json | null
          business_id: string
          created_at: string
          entity_type: string
          id: string
          name: string
        }
        Insert: {
          attributes_json?: Json | null
          business_id: string
          created_at?: string
          entity_type?: string
          id?: string
          name: string
        }
        Update: {
          attributes_json?: Json | null
          business_id?: string
          created_at?: string
          entity_type?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "geo_entities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_relationships: {
        Row: {
          business_id: string
          created_at: string
          from_entity_id: string
          id: string
          relation_type: string
          to_entity_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          from_entity_id: string
          id?: string
          relation_type: string
          to_entity_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          from_entity_id?: string
          id?: string
          relation_type?: string
          to_entity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "geo_relationships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geo_relationships_from_entity_id_fkey"
            columns: ["from_entity_id"]
            isOneToOne: false
            referencedRelation: "geo_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geo_relationships_to_entity_id_fkey"
            columns: ["to_entity_id"]
            isOneToOne: false
            referencedRelation: "geo_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      gmb_tasks: {
        Row: {
          business_id: string
          client_id: string | null
          created_at: string
          created_by: string | null
          cta_text: string | null
          id: string
          image_urls_json: Json | null
          post_caption: string | null
          post_type: string
          scheduled_date: string | null
          seo_project_id: string
          status: string
        }
        Insert: {
          business_id: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          cta_text?: string | null
          id?: string
          image_urls_json?: Json | null
          post_caption?: string | null
          post_type?: string
          scheduled_date?: string | null
          seo_project_id: string
          status?: string
        }
        Update: {
          business_id?: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          cta_text?: string | null
          id?: string
          image_urls_json?: Json | null
          post_caption?: string | null
          post_type?: string
          scheduled_date?: string | null
          seo_project_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "gmb_tasks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gmb_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gmb_tasks_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      go_live_checklist: {
        Row: {
          category: string
          id: string
          is_checked: boolean
          is_required: boolean
          item_key: string
          label: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          category: string
          id?: string
          is_checked?: boolean
          is_required?: boolean
          item_key: string
          label: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          id?: string
          is_checked?: boolean
          is_required?: boolean
          item_key?: string
          label?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      google_rank_checks: {
        Row: {
          business_id: string
          client_id: string | null
          created_at: string | null
          device_type: string | null
          id: string
          keyword: string
          keyword_id: string | null
          location: string | null
          rank_position: number | null
          search_date: string
          search_engine: string | null
          seo_project_id: string | null
          url_found: string | null
        }
        Insert: {
          business_id: string
          client_id?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          keyword: string
          keyword_id?: string | null
          location?: string | null
          rank_position?: number | null
          search_date?: string
          search_engine?: string | null
          seo_project_id?: string | null
          url_found?: string | null
        }
        Update: {
          business_id?: string
          client_id?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          keyword?: string
          keyword_id?: string | null
          location?: string | null
          rank_position?: number | null
          search_date?: string
          search_engine?: string | null
          seo_project_id?: string | null
          url_found?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_rank_checks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_rank_checks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_rank_checks_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      google_reviews: {
        Row: {
          business_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          replied_at: string | null
          reply_text: string | null
          review_id: string | null
          review_time: string | null
          reviewer_name: string | null
          reviewer_photo_url: string | null
          source: string
        }
        Insert: {
          business_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          replied_at?: string | null
          reply_text?: string | null
          review_id?: string | null
          review_time?: string | null
          reviewer_name?: string | null
          reviewer_photo_url?: string | null
          source?: string
        }
        Update: {
          business_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          replied_at?: string | null
          reply_text?: string | null
          review_id?: string | null
          review_time?: string | null
          reviewer_name?: string | null
          reviewer_photo_url?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_campaigns: {
        Row: {
          adjustment_history_json: Json | null
          auto_adjust: boolean | null
          budget: number | null
          business_id: string
          channel: string
          conversion_rate: number | null
          created_at: string | null
          current_spend: number | null
          id: string
          last_adjustment: string | null
          leads_generated: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          adjustment_history_json?: Json | null
          auto_adjust?: boolean | null
          budget?: number | null
          business_id: string
          channel?: string
          conversion_rate?: number | null
          created_at?: string | null
          current_spend?: number | null
          id?: string
          last_adjustment?: string | null
          leads_generated?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          adjustment_history_json?: Json | null
          auto_adjust?: boolean | null
          budget?: number | null
          business_id?: string
          channel?: string
          conversion_rate?: number | null
          created_at?: string | null
          current_spend?: number | null
          id?: string
          last_adjustment?: string | null
          leads_generated?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_campaigns_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_experiments: {
        Row: {
          business_id: string
          conversion_rate_a: number | null
          conversion_rate_b: number | null
          created_at: string | null
          ended_at: string | null
          experiment_name: string
          experiment_type: string
          id: string
          impressions_a: number | null
          impressions_b: number | null
          started_at: string | null
          status: string
          variant_a: string | null
          variant_b: string | null
          winner: string | null
        }
        Insert: {
          business_id: string
          conversion_rate_a?: number | null
          conversion_rate_b?: number | null
          created_at?: string | null
          ended_at?: string | null
          experiment_name: string
          experiment_type?: string
          id?: string
          impressions_a?: number | null
          impressions_b?: number | null
          started_at?: string | null
          status?: string
          variant_a?: string | null
          variant_b?: string | null
          winner?: string | null
        }
        Update: {
          business_id?: string
          conversion_rate_a?: number | null
          conversion_rate_b?: number | null
          created_at?: string | null
          ended_at?: string | null
          experiment_name?: string
          experiment_type?: string
          id?: string
          impressions_a?: number | null
          impressions_b?: number | null
          started_at?: string | null
          status?: string
          variant_a?: string | null
          variant_b?: string | null
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_experiments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      gsc_data: {
        Row: {
          business_id: string
          clicks: number | null
          client_id: string | null
          created_at: string
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          position: number | null
          query: string
          seo_project_id: string | null
        }
        Insert: {
          business_id: string
          clicks?: number | null
          client_id?: string | null
          created_at?: string
          ctr?: number | null
          date: string
          id?: string
          impressions?: number | null
          position?: number | null
          query: string
          seo_project_id?: string | null
        }
        Update: {
          business_id?: string
          clicks?: number | null
          client_id?: string | null
          created_at?: string
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          position?: number | null
          query?: string
          seo_project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gsc_data_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_data_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_data_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employee_attendance: {
        Row: {
          business_id: string
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          status: string
          total_hours: number | null
        }
        Insert: {
          business_id: string
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date: string
          employee_id: string
          id?: string
          status?: string
          total_hours?: number | null
        }
        Update: {
          business_id?: string
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          status?: string
          total_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_employee_attendance_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employee_attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employee_bank_details: {
        Row: {
          account_number: string | null
          bank_name: string | null
          branch_name: string | null
          created_at: string
          employee_id: string
          id: string
          ifsc_code: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          account_number?: string | null
          bank_name?: string | null
          branch_name?: string | null
          created_at?: string
          employee_id: string
          id?: string
          ifsc_code?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          account_number?: string | null
          bank_name?: string | null
          branch_name?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          ifsc_code?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_employee_bank_details_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employee_documents: {
        Row: {
          business_id: string
          created_at: string
          document_type: string
          employee_id: string
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          uploaded_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          document_type: string
          employee_id: string
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          document_type?: string
          employee_id?: string
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_employee_documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employee_education: {
        Row: {
          additional_certifications: string | null
          college_name: string | null
          created_at: string
          employee_id: string
          id: string
          qualification: string
          specialization: string | null
          year_of_passing: string | null
        }
        Insert: {
          additional_certifications?: string | null
          college_name?: string | null
          created_at?: string
          employee_id: string
          id?: string
          qualification: string
          specialization?: string | null
          year_of_passing?: string | null
        }
        Update: {
          additional_certifications?: string | null
          college_name?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          qualification?: string
          specialization?: string | null
          year_of_passing?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_employee_education_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employee_emergency_contacts: {
        Row: {
          contact_name: string
          created_at: string
          employee_id: string
          id: string
          phone_number: string
          relationship: string | null
        }
        Insert: {
          contact_name: string
          created_at?: string
          employee_id: string
          id?: string
          phone_number: string
          relationship?: string | null
        }
        Update: {
          contact_name?: string
          created_at?: string
          employee_id?: string
          id?: string
          phone_number?: string
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_employee_emergency_contacts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employee_insurance: {
        Row: {
          additional_benefits: string | null
          coverage_amount: number | null
          created_at: string
          employee_id: string
          id: string
          policy_expiry: string | null
          policy_number: string | null
          policy_start: string | null
          provider: string | null
        }
        Insert: {
          additional_benefits?: string | null
          coverage_amount?: number | null
          created_at?: string
          employee_id: string
          id?: string
          policy_expiry?: string | null
          policy_number?: string | null
          policy_start?: string | null
          provider?: string | null
        }
        Update: {
          additional_benefits?: string | null
          coverage_amount?: number | null
          created_at?: string
          employee_id?: string
          id?: string
          policy_expiry?: string | null
          policy_number?: string | null
          policy_start?: string | null
          provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_employee_insurance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employee_tasks: {
        Row: {
          assigned_by_name: string | null
          business_id: string
          created_at: string
          created_by: string | null
          deadline: string | null
          department_id: string | null
          description: string | null
          employee_id: string
          id: string
          priority: string
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by_name?: string | null
          business_id: string
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          department_id?: string | null
          description?: string | null
          employee_id: string
          id?: string
          priority?: string
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by_name?: string | null
          business_id?: string
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          department_id?: string | null
          description?: string | null
          employee_id?: string
          id?: string
          priority?: string
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_employee_tasks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employee_tasks_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employee_tasks_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employees: {
        Row: {
          availability_status: string | null
          business_id: string
          created_at: string
          current_address: string | null
          date_of_birth: string | null
          deactivated_at: string | null
          deactivation_reason: string | null
          department_id: string | null
          designation: string | null
          email: string
          employee_code: string | null
          employment_status: string
          employment_type: string
          full_name: string
          gender: string | null
          id: string
          is_department_head: boolean | null
          job_role_description: string | null
          job_role_document_name: string | null
          job_role_document_url: string | null
          joining_date: string | null
          mobile_number: string | null
          permanent_address: string | null
          profile_photo_url: string | null
          reporting_manager_id: string | null
          skill_tags: string[] | null
          updated_at: string
          user_id: string | null
          work_location: string | null
        }
        Insert: {
          availability_status?: string | null
          business_id: string
          created_at?: string
          current_address?: string | null
          date_of_birth?: string | null
          deactivated_at?: string | null
          deactivation_reason?: string | null
          department_id?: string | null
          designation?: string | null
          email: string
          employee_code?: string | null
          employment_status?: string
          employment_type?: string
          full_name: string
          gender?: string | null
          id?: string
          is_department_head?: boolean | null
          job_role_description?: string | null
          job_role_document_name?: string | null
          job_role_document_url?: string | null
          joining_date?: string | null
          mobile_number?: string | null
          permanent_address?: string | null
          profile_photo_url?: string | null
          reporting_manager_id?: string | null
          skill_tags?: string[] | null
          updated_at?: string
          user_id?: string | null
          work_location?: string | null
        }
        Update: {
          availability_status?: string | null
          business_id?: string
          created_at?: string
          current_address?: string | null
          date_of_birth?: string | null
          deactivated_at?: string | null
          deactivation_reason?: string | null
          department_id?: string | null
          designation?: string | null
          email?: string
          employee_code?: string | null
          employment_status?: string
          employment_type?: string
          full_name?: string
          gender?: string | null
          id?: string
          is_department_head?: boolean | null
          job_role_description?: string | null
          job_role_document_name?: string | null
          job_role_document_url?: string | null
          joining_date?: string | null
          mobile_number?: string | null
          permanent_address?: string | null
          profile_photo_url?: string | null
          reporting_manager_id?: string | null
          skill_tags?: string[] | null
          updated_at?: string
          user_id?: string | null
          work_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_employees_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employees_reporting_manager_id_fkey"
            columns: ["reporting_manager_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attachment_url: string | null
          business_id: string
          created_at: string
          employee_id: string
          end_date: string
          id: string
          leave_type_id: string
          num_days: number
          reason: string | null
          start_date: string
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attachment_url?: string | null
          business_id: string
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          leave_type_id: string
          num_days?: number
          reason?: string | null
          start_date: string
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attachment_url?: string | null
          business_id?: string
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          leave_type_id?: string
          num_days?: number
          reason?: string | null
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_leave_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "hr_leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_leave_types: {
        Row: {
          approval_required: boolean
          business_id: string
          carry_forward: boolean
          created_at: string
          id: string
          max_days_per_year: number
          name: string
          status: string
        }
        Insert: {
          approval_required?: boolean
          business_id: string
          carry_forward?: boolean
          created_at?: string
          id?: string
          max_days_per_year?: number
          name: string
          status?: string
        }
        Update: {
          approval_required?: boolean
          business_id?: string
          carry_forward?: boolean
          created_at?: string
          id?: string
          max_days_per_year?: number
          name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_leave_types_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_payroll_records: {
        Row: {
          allowances: number
          approved_by: string | null
          basic_salary: number
          bonus: number
          business_id: string
          created_at: string
          deductions: number
          employee_id: string
          generated_at: string
          hra: number
          id: string
          month: string
          net_salary: number
          overtime: number
          pf_tax: number
          status: string
        }
        Insert: {
          allowances?: number
          approved_by?: string | null
          basic_salary?: number
          bonus?: number
          business_id: string
          created_at?: string
          deductions?: number
          employee_id: string
          generated_at?: string
          hra?: number
          id?: string
          month: string
          net_salary?: number
          overtime?: number
          pf_tax?: number
          status?: string
        }
        Update: {
          allowances?: number
          approved_by?: string | null
          basic_salary?: number
          bonus?: number
          business_id?: string
          created_at?: string
          deductions?: number
          employee_id?: string
          generated_at?: string
          hra?: number
          id?: string
          month?: string
          net_salary?: number
          overtime?: number
          pf_tax?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_payroll_records_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_payroll_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_performance_reviews: {
        Row: {
          business_id: string
          communication: number | null
          created_at: string
          employee_id: string
          hr_feedback: string | null
          id: string
          leadership: number | null
          manager_feedback: string | null
          overall_rating: number | null
          productivity: number | null
          result: string | null
          review_period: string
          reviewed_by: string | null
          team_collaboration: number | null
          work_quality: number | null
        }
        Insert: {
          business_id: string
          communication?: number | null
          created_at?: string
          employee_id: string
          hr_feedback?: string | null
          id?: string
          leadership?: number | null
          manager_feedback?: string | null
          overall_rating?: number | null
          productivity?: number | null
          result?: string | null
          review_period: string
          reviewed_by?: string | null
          team_collaboration?: number | null
          work_quality?: number | null
        }
        Update: {
          business_id?: string
          communication?: number | null
          created_at?: string
          employee_id?: string
          hr_feedback?: string | null
          id?: string
          leadership?: number | null
          manager_feedback?: string | null
          overall_rating?: number | null
          productivity?: number | null
          result?: string | null
          review_period?: string
          reviewed_by?: string | null
          team_collaboration?: number | null
          work_quality?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_performance_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_performance_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_task_updates: {
        Row: {
          business_id: string
          created_at: string
          employee_id: string
          id: string
          note: string
          status_change: string | null
          task_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          employee_id: string
          id?: string
          note: string
          status_change?: string | null
          task_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          note?: string
          status_change?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_task_updates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_task_updates_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_task_updates_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "hr_employee_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          error_report_url: string | null
          failed_rows: number | null
          file_url: string | null
          id: string
          job_type: string
          status: string
          success_rows: number | null
          total_rows: number | null
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          error_report_url?: string | null
          failed_rows?: number | null
          file_url?: string | null
          id?: string
          job_type?: string
          status?: string
          success_rows?: number | null
          total_rows?: number | null
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          error_report_url?: string | null
          failed_rows?: number | null
          file_url?: string | null
          id?: string
          job_type?: string
          status?: string
          success_rows?: number | null
          total_rows?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_updates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          incident_id: string
          message: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          incident_id: string
          message: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          incident_id?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_updates_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          created_at: string
          description: string | null
          id: string
          owner_user_id: string | null
          resolved_at: string | null
          severity: string
          started_at: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          owner_user_id?: string | null
          resolved_at?: string | null
          severity?: string
          started_at?: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          owner_user_id?: string | null
          resolved_at?: string | null
          severity?: string
          started_at?: string
          status?: string
          title?: string
        }
        Relationships: []
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
      inquiry_analytics_daily: {
        Row: {
          average_response_time_minutes: number | null
          business_id: string
          converted_count: number
          created_at: string
          date: string
          demo_inquiries: number
          id: string
          responded_count: number
          total_inquiries: number
        }
        Insert: {
          average_response_time_minutes?: number | null
          business_id: string
          converted_count?: number
          created_at?: string
          date: string
          demo_inquiries?: number
          id?: string
          responded_count?: number
          total_inquiries?: number
        }
        Update: {
          average_response_time_minutes?: number | null
          business_id?: string
          converted_count?: number
          created_at?: string
          date?: string
          demo_inquiries?: number
          id?: string
          responded_count?: number
          total_inquiries?: number
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_analytics_daily_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_comments: {
        Row: {
          business_id: string
          comment: string
          created_at: string | null
          employee_id: string
          id: string
          insight_id: string
        }
        Insert: {
          business_id: string
          comment: string
          created_at?: string | null
          employee_id: string
          id?: string
          insight_id: string
        }
        Update: {
          business_id?: string
          comment?: string
          created_at?: string | null
          employee_id?: string
          id?: string
          insight_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insight_comments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insight_comments_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "daily_insights"
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
      internal_ticket_activity: {
        Row: {
          action_type: string
          business_id: string
          created_at: string
          details: string | null
          id: string
          new_value: string | null
          old_value: string | null
          ticket_id: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action_type: string
          business_id: string
          created_at?: string
          details?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          ticket_id: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action_type?: string
          business_id?: string
          created_at?: string
          details?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          ticket_id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internal_ticket_activity_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_ticket_activity_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "internal_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_ticket_comments: {
        Row: {
          business_id: string
          content: string
          created_at: string
          id: string
          ticket_id: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          business_id: string
          content: string
          created_at?: string
          id?: string
          ticket_id: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          business_id?: string
          content?: string
          created_at?: string
          id?: string
          ticket_id?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internal_ticket_comments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "internal_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_tickets: {
        Row: {
          assigned_to_department: string | null
          assigned_to_user_id: string | null
          business_id: string
          created_at: string
          created_by_user_id: string
          department: string
          description: string | null
          id: string
          priority: string
          resolved_at: string | null
          resolved_by_user_id: string | null
          source_department: string | null
          source_type: string
          status: string
          ticket_number: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to_department?: string | null
          assigned_to_user_id?: string | null
          business_id: string
          created_at?: string
          created_by_user_id: string
          department?: string
          description?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          source_department?: string | null
          source_type?: string
          status?: string
          ticket_number?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to_department?: string | null
          assigned_to_user_id?: string | null
          business_id?: string
          created_at?: string
          created_by_user_id?: string
          department?: string
          description?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          source_department?: string | null
          source_type?: string
          status?: string
          ticket_number?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_tickets_business_id_fkey"
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
      job_assignments: {
        Row: {
          accepted_at: string | null
          assigned_at: string
          assigned_employee_user_id: string
          created_at: string
          id: string
          job_id: string
          notes: string | null
          rejected_at: string | null
          status: string
        }
        Insert: {
          accepted_at?: string | null
          assigned_at?: string
          assigned_employee_user_id: string
          created_at?: string
          id?: string
          job_id: string
          notes?: string | null
          rejected_at?: string | null
          status?: string
        }
        Update: {
          accepted_at?: string | null
          assigned_at?: string
          assigned_employee_user_id?: string
          created_at?: string
          id?: string
          job_id?: string
          notes?: string | null
          rejected_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_media: {
        Row: {
          file_url: string
          id: string
          job_id: string
          media_type: string
          uploaded_at: string
          uploaded_by_user_id: string | null
        }
        Insert: {
          file_url: string
          id?: string
          job_id: string
          media_type: string
          uploaded_at?: string
          uploaded_by_user_id?: string | null
        }
        Update: {
          file_url?: string
          id?: string
          job_id?: string
          media_type?: string
          uploaded_at?: string
          uploaded_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_media_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_renewal_instances: {
        Row: {
          business_id: string
          created_at: string
          id: string
          job_id: string | null
          next_due_date: string
          status: string
          tenant_customer_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          job_id?: string | null
          next_due_date: string
          status?: string
          tenant_customer_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          job_id?: string | null
          next_due_date?: string
          status?: string
          tenant_customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_renewal_instances_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_renewal_instances_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_renewal_instances_tenant_customer_id_fkey"
            columns: ["tenant_customer_id"]
            isOneToOne: false
            referencedRelation: "tenant_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      job_renewal_rules: {
        Row: {
          business_id: string
          created_at: string
          id: string
          message_template_id: string | null
          renewal_interval_days: number
          service_type: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          message_template_id?: string | null
          renewal_interval_days?: number
          service_type: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          message_template_id?: string | null
          renewal_interval_days?: number
          service_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_renewal_rules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      job_run_logs: {
        Row: {
          business_id: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          job_name: string
          run_at: string
          status: string
        }
        Insert: {
          business_id?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          job_name: string
          run_at?: string
          status?: string
        }
        Update: {
          business_id?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          job_name?: string
          run_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_run_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          actual_duration_minutes: number | null
          business_id: string
          completed_at: string | null
          created_at: string
          created_by_user_id: string | null
          customer_confirmation_status: string
          customer_reschedule_request: string | null
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          job_address: string | null
          job_lat: number | null
          job_lng: number | null
          job_title: string
          payment_amount: number | null
          payment_status: string
          rescheduled_time: string | null
          scheduled_end_at: string | null
          scheduled_start_at: string | null
          status: string
          tenant_customer_id: string | null
        }
        Insert: {
          actual_duration_minutes?: number | null
          business_id: string
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          customer_confirmation_status?: string
          customer_reschedule_request?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          job_address?: string | null
          job_lat?: number | null
          job_lng?: number | null
          job_title: string
          payment_amount?: number | null
          payment_status?: string
          rescheduled_time?: string | null
          scheduled_end_at?: string | null
          scheduled_start_at?: string | null
          status?: string
          tenant_customer_id?: string | null
        }
        Update: {
          actual_duration_minutes?: number | null
          business_id?: string
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          customer_confirmation_status?: string
          customer_reschedule_request?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          job_address?: string | null
          job_lat?: number | null
          job_lng?: number | null
          job_title?: string
          payment_amount?: number | null
          payment_status?: string
          rescheduled_time?: string | null
          scheduled_end_at?: string | null
          scheduled_start_at?: string | null
          status?: string
          tenant_customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_tenant_customer_id_fkey"
            columns: ["tenant_customer_id"]
            isOneToOne: false
            referencedRelation: "tenant_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_articles: {
        Row: {
          author_user_id: string | null
          business_id: string
          category: string
          content: string | null
          created_at: string
          helpful_count: number
          id: string
          not_helpful_count: number
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author_user_id?: string | null
          business_id: string
          category?: string
          content?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          not_helpful_count?: number
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_user_id?: string | null
          business_id?: string
          category?: string
          content?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          not_helpful_count?: number
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "kb_articles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_ranking_history: {
        Row: {
          business_id: string
          created_at: string
          date_checked: string
          device: string | null
          id: string
          keyword_id: string
          rank_position: number | null
          search_engine: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          date_checked?: string
          device?: string | null
          id?: string
          keyword_id: string
          rank_position?: number | null
          search_engine?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          date_checked?: string
          device?: string | null
          id?: string
          keyword_id?: string
          rank_position?: number | null
          search_engine?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keyword_ranking_history_business_id_fkey"
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
      lead_assignment_logs: {
        Row: {
          assigned_by: string
          business_id: string
          created_at: string
          from_employee_id: string | null
          id: string
          lead_id: string
          reason: string | null
          rule_id: string | null
          to_employee_id: string
        }
        Insert: {
          assigned_by?: string
          business_id: string
          created_at?: string
          from_employee_id?: string | null
          id?: string
          lead_id: string
          reason?: string | null
          rule_id?: string | null
          to_employee_id: string
        }
        Update: {
          assigned_by?: string
          business_id?: string
          created_at?: string
          from_employee_id?: string | null
          id?: string
          lead_id?: string
          reason?: string | null
          rule_id?: string | null
          to_employee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignment_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignment_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "lead_assignment_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_assignment_rules: {
        Row: {
          business_id: string
          config_json: Json
          created_at: string
          id: string
          is_active: boolean
          mode: Database["public"]["Enums"]["lead_assignment_mode"]
          rule_name: string
          updated_at: string
          website_id: string | null
        }
        Insert: {
          business_id: string
          config_json?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          mode?: Database["public"]["Enums"]["lead_assignment_mode"]
          rule_name: string
          updated_at?: string
          website_id?: string | null
        }
        Update: {
          business_id?: string
          config_json?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          mode?: Database["public"]["Enums"]["lead_assignment_mode"]
          rule_name?: string
          updated_at?: string
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignment_rules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignment_rules_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "tenant_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_calls: {
        Row: {
          account_id: string | null
          agent_id: string | null
          business_id: string
          call_datetime: string | null
          call_summary: string | null
          call_type: string | null
          contact_id: string | null
          created_at: string
          direction: string | null
          duration_seconds: number | null
          id: string
          lead_id: string | null
          next_action: string | null
          outcome: string | null
          recording_file: string | null
          recording_reference: string | null
          recording_url: string | null
          transcript_text: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          agent_id?: string | null
          business_id: string
          call_datetime?: string | null
          call_summary?: string | null
          call_type?: string | null
          contact_id?: string | null
          created_at?: string
          direction?: string | null
          duration_seconds?: number | null
          id?: string
          lead_id?: string | null
          next_action?: string | null
          outcome?: string | null
          recording_file?: string | null
          recording_reference?: string | null
          recording_url?: string | null
          transcript_text?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          agent_id?: string | null
          business_id?: string
          call_datetime?: string | null
          call_summary?: string | null
          call_type?: string | null
          contact_id?: string | null
          created_at?: string
          direction?: string | null
          duration_seconds?: number | null
          id?: string
          lead_id?: string | null
          next_action?: string | null
          outcome?: string | null
          recording_file?: string | null
          recording_reference?: string | null
          recording_url?: string | null
          transcript_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_calls_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_calls_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_calls_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_calls_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_conversations: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          inquiry_id: string | null
          last_message_at: string | null
          lead_id: string | null
          mode: string
          status: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          inquiry_id?: string | null
          last_message_at?: string | null
          lead_id?: string | null
          mode?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          inquiry_id?: string | null
          last_message_at?: string | null
          lead_id?: string | null
          mode?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_conversations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_conversion_requests: {
        Row: {
          accounts_user_id: string | null
          approved_at: string | null
          business_id: string
          contract_value: number | null
          created_at: string
          decision_notes: string | null
          id: string
          lead_id: string
          request_status: string
          requested_by_user_id: string
          services: string | null
          updated_at: string
        }
        Insert: {
          accounts_user_id?: string | null
          approved_at?: string | null
          business_id: string
          contract_value?: number | null
          created_at?: string
          decision_notes?: string | null
          id?: string
          lead_id: string
          request_status?: string
          requested_by_user_id: string
          services?: string | null
          updated_at?: string
        }
        Update: {
          accounts_user_id?: string | null
          approved_at?: string | null
          business_id?: string
          contract_value?: number | null
          created_at?: string
          decision_notes?: string | null
          id?: string
          lead_id?: string
          request_status?: string
          requested_by_user_id?: string
          services?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_conversion_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_conversion_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          business_id: string
          contact_method: string
          created_at: string
          id: string
          internal_only: boolean | null
          is_archived: boolean
          lead_id: string
          next_followup_date: string | null
          note_content: string
          note_type: string | null
          salesperson_id: string | null
          user_id: string | null
        }
        Insert: {
          business_id: string
          contact_method?: string
          created_at?: string
          id?: string
          internal_only?: boolean | null
          is_archived?: boolean
          lead_id: string
          next_followup_date?: string | null
          note_content: string
          note_type?: string | null
          salesperson_id?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: string
          contact_method?: string
          created_at?: string
          id?: string
          internal_only?: boolean | null
          is_archived?: boolean
          lead_id?: string
          next_followup_date?: string | null
          note_content?: string
          note_type?: string | null
          salesperson_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_scores: {
        Row: {
          business_id: string
          created_at: string
          id: string
          lead_id: string
          reasons_json: Json | null
          score: number
          tier: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          lead_id: string
          reasons_json?: Json | null
          score?: number
          tier?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          reasons_json?: Json | null
          score?: number
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_scores_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ai_prediction: string | null
          ai_priority: string | null
          ai_recommended_action: string | null
          ai_score: number | null
          assigned_to_user_id: string | null
          assignment_mode: string | null
          assignment_reason: string | null
          business_id: string
          business_name: string | null
          created_at: string
          email: string
          engagement_score: number | null
          estimated_budget: number | null
          fbclid: string | null
          gclid: string | null
          id: string
          inquiry_id: string | null
          is_deleted: boolean
          landing_page_url: string | null
          last_activity_at: string | null
          last_contact_method: string | null
          last_contacted_at: string | null
          lead_score: number | null
          lead_temperature: string | null
          locked_fields: Json | null
          name: string
          next_follow_up_at: string | null
          notes: string | null
          phone: string | null
          proposal_sent: boolean | null
          referrer_url: string | null
          response_speed_hours: number | null
          service_detected: string | null
          services_needed: string | null
          source: Database["public"]["Enums"]["lead_source"]
          stage: Database["public"]["Enums"]["lead_stage"]
          status: Database["public"]["Enums"]["lead_status"]
          suburb: string | null
          total_calls: number | null
          total_emails: number | null
          total_whatsapp: number | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          website_id: string | null
          website_visits: number | null
        }
        Insert: {
          ai_prediction?: string | null
          ai_priority?: string | null
          ai_recommended_action?: string | null
          ai_score?: number | null
          assigned_to_user_id?: string | null
          assignment_mode?: string | null
          assignment_reason?: string | null
          business_id: string
          business_name?: string | null
          created_at?: string
          email: string
          engagement_score?: number | null
          estimated_budget?: number | null
          fbclid?: string | null
          gclid?: string | null
          id?: string
          inquiry_id?: string | null
          is_deleted?: boolean
          landing_page_url?: string | null
          last_activity_at?: string | null
          last_contact_method?: string | null
          last_contacted_at?: string | null
          lead_score?: number | null
          lead_temperature?: string | null
          locked_fields?: Json | null
          name: string
          next_follow_up_at?: string | null
          notes?: string | null
          phone?: string | null
          proposal_sent?: boolean | null
          referrer_url?: string | null
          response_speed_hours?: number | null
          service_detected?: string | null
          services_needed?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          stage?: Database["public"]["Enums"]["lead_stage"]
          status?: Database["public"]["Enums"]["lead_status"]
          suburb?: string | null
          total_calls?: number | null
          total_emails?: number | null
          total_whatsapp?: number | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          website_id?: string | null
          website_visits?: number | null
        }
        Update: {
          ai_prediction?: string | null
          ai_priority?: string | null
          ai_recommended_action?: string | null
          ai_score?: number | null
          assigned_to_user_id?: string | null
          assignment_mode?: string | null
          assignment_reason?: string | null
          business_id?: string
          business_name?: string | null
          created_at?: string
          email?: string
          engagement_score?: number | null
          estimated_budget?: number | null
          fbclid?: string | null
          gclid?: string | null
          id?: string
          inquiry_id?: string | null
          is_deleted?: boolean
          landing_page_url?: string | null
          last_activity_at?: string | null
          last_contact_method?: string | null
          last_contacted_at?: string | null
          lead_score?: number | null
          lead_temperature?: string | null
          locked_fields?: Json | null
          name?: string
          next_follow_up_at?: string | null
          notes?: string | null
          phone?: string | null
          proposal_sent?: boolean | null
          referrer_url?: string | null
          response_speed_hours?: number | null
          service_detected?: string | null
          services_needed?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          stage?: Database["public"]["Enums"]["lead_stage"]
          status?: Database["public"]["Enums"]["lead_status"]
          suburb?: string | null
          total_calls?: number | null
          total_emails?: number | null
          total_whatsapp?: number | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          website_id?: string | null
          website_visits?: number | null
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
          {
            foreignKeyName: "leads_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "tenant_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by_user_id: string | null
          business_id: string
          created_at: string
          end_date: string
          id: string
          leave_type_id: string
          reason: string | null
          requested_at: string
          start_date: string
          status: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          business_id: string
          created_at?: string
          end_date: string
          id?: string
          leave_type_id: string
          reason?: string | null
          requested_at?: string
          start_date: string
          status?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          business_id?: string
          created_at?: string
          end_date?: string
          id?: string
          leave_type_id?: string
          reason?: string | null
          requested_at?: string
          start_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          annual_quota_days: number
          business_id: string
          carry_forward_rules_json: Json | null
          created_at: string
          id: string
          name: string
          requires_documents: boolean
        }
        Insert: {
          annual_quota_days?: number
          business_id: string
          carry_forward_rules_json?: Json | null
          created_at?: string
          id?: string
          name: string
          requires_documents?: boolean
        }
        Update: {
          annual_quota_days?: number
          business_id?: string
          carry_forward_rules_json?: Json | null
          created_at?: string
          id?: string
          name?: string
          requires_documents?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "leave_types_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          account_id: string | null
          assigned_agent_id: string | null
          business_id: string
          contact_id: string | null
          created_at: string
          id: string
          invite_sent: boolean | null
          meeting_date: string
          meeting_link: string | null
          meeting_location: string | null
          meeting_platform: string | null
          meeting_time: string | null
          meeting_type: string | null
          notes: string | null
          objective: string | null
          opportunity_id: string | null
          outcome: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          assigned_agent_id?: string | null
          business_id: string
          contact_id?: string | null
          created_at?: string
          id?: string
          invite_sent?: boolean | null
          meeting_date: string
          meeting_link?: string | null
          meeting_location?: string | null
          meeting_platform?: string | null
          meeting_time?: string | null
          meeting_type?: string | null
          notes?: string | null
          objective?: string | null
          opportunity_id?: string | null
          outcome?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          assigned_agent_id?: string | null
          business_id?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          invite_sent?: boolean | null
          meeting_date?: string
          meeting_link?: string | null
          meeting_location?: string | null
          meeting_platform?: string | null
          meeting_time?: string | null
          meeting_type?: string | null
          notes?: string | null
          objective?: string | null
          opportunity_id?: string | null
          outcome?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      migration_runs: {
        Row: {
          error_message: string | null
          finished_at: string | null
          id: string
          release_id: string
          started_at: string | null
          status: string
        }
        Insert: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          release_id: string
          started_at?: string | null
          status?: string
        }
        Update: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          release_id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "migration_runs_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          business_id: string | null
          client_id: string | null
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
          client_id?: string | null
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
          client_id?: string | null
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
          {
            foreignKeyName: "notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_checklist_items: {
        Row: {
          business_id: string
          client_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          deal_id: string | null
          id: string
          is_completed: boolean
          item_category: string
          item_title: string
          notes: string | null
          sort_order: number
        }
        Insert: {
          business_id: string
          client_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          is_completed?: boolean
          item_category?: string
          item_title: string
          notes?: string | null
          sort_order?: number
        }
        Update: {
          business_id?: string
          client_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          is_completed?: boolean
          item_category?: string
          item_title?: string
          notes?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_checklist_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklist_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklist_items_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_instances: {
        Row: {
          assigned_owner_user_id: string | null
          business_id: string
          client_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          service_type: string
          started_at: string | null
          status: string
        }
        Insert: {
          assigned_owner_user_id?: string | null
          business_id: string
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          service_type: string
          started_at?: string | null
          status?: string
        }
        Update: {
          assigned_owner_user_id?: string | null
          business_id?: string
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          service_type?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_instances_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_instances_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_step_items: {
        Row: {
          completed_at: string | null
          created_at: string
          due_at: string | null
          id: string
          notes: string | null
          onboarding_instance_id: string
          status: string
          step_name: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          notes?: string | null
          onboarding_instance_id: string
          status?: string
          step_name: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          notes?: string | null
          onboarding_instance_id?: string
          status?: string
          step_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_step_items_onboarding_instance_id_fkey"
            columns: ["onboarding_instance_id"]
            isOneToOne: false
            referencedRelation: "onboarding_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_tasks: {
        Row: {
          account_id: string | null
          assigned_to: string | null
          business_id: string
          completed_at: string | null
          created_at: string
          department_id: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          task_description: string | null
          task_title: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          account_id?: string | null
          assigned_to?: string | null
          business_id: string
          completed_at?: string | null
          created_at?: string
          department_id?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          task_description?: string | null
          task_title: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          account_id?: string | null
          assigned_to?: string | null
          business_id?: string
          completed_at?: string | null
          created_at?: string
          department_id?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          task_description?: string | null
          task_title?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tasks_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "onboarding_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_templates: {
        Row: {
          created_at: string
          id: string
          service_type: string
          steps_json: Json
          template_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_type: string
          steps_json?: Json
          template_name: string
        }
        Update: {
          created_at?: string
          id?: string
          service_type?: string
          steps_json?: Json
          template_name?: string
        }
        Relationships: []
      }
      onboarding_workflows: {
        Row: {
          account_id: string | null
          assigned_account_manager_id: string | null
          business_id: string
          client_id: string | null
          completed_date: string | null
          contract_id: string | null
          created_at: string
          id: string
          notes: string | null
          onboarding_status: string | null
          start_date: string | null
          target_completion_date: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          assigned_account_manager_id?: string | null
          business_id: string
          client_id?: string | null
          completed_date?: string | null
          contract_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          onboarding_status?: string | null
          start_date?: string | null
          target_completion_date?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          assigned_account_manager_id?: string | null
          business_id?: string
          client_id?: string | null
          completed_date?: string | null
          contract_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          onboarding_status?: string | null
          start_date?: string | null
          target_completion_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_workflows_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_workflows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_workflows_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_workflows_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_competitor_tracking: {
        Row: {
          business_id: string
          competitor_name: string
          competitor_notes: string | null
          created_at: string
          id: string
          opportunity_id: string
        }
        Insert: {
          business_id: string
          competitor_name: string
          competitor_notes?: string | null
          created_at?: string
          id?: string
          opportunity_id: string
        }
        Update: {
          business_id?: string
          competitor_name?: string
          competitor_notes?: string | null
          created_at?: string
          id?: string
          opportunity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_competitor_tracking_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_competitor_tracking_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_stage_history: {
        Row: {
          business_id: string
          changed_at: string
          changed_by: string | null
          id: string
          new_stage: string
          notes: string | null
          old_stage: string | null
          opportunity_id: string
        }
        Insert: {
          business_id: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_stage: string
          notes?: string | null
          old_stage?: string | null
          opportunity_id: string
        }
        Update: {
          business_id?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_stage?: string
          notes?: string | null
          old_stage?: string | null
          opportunity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_stage_history_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_stage_history_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      opt_out_registry: {
        Row: {
          business_id: string
          channel: string
          created_at: string | null
          email: string | null
          id: string
          phone: string | null
          reason: string
        }
        Insert: {
          business_id: string
          channel: string
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          reason?: string
        }
        Update: {
          business_id?: string
          channel?: string
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "opt_out_registry_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      org_structure_nodes: {
        Row: {
          business_id: string
          created_at: string
          id: string
          name: string
          node_type: string
          parent_node_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          name: string
          node_type: string
          parent_node_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          node_type?: string
          parent_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_structure_nodes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_structure_nodes_parent_node_id_fkey"
            columns: ["parent_node_id"]
            isOneToOne: false
            referencedRelation: "org_structure_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_verifications: {
        Row: {
          attempts: number | null
          created_at: string | null
          email: string | null
          expires_at: string
          id: string
          otp_code: string
          otp_type: string
          phone: string | null
          user_id: string
          verified: boolean | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          email?: string | null
          expires_at: string
          id?: string
          otp_code: string
          otp_type?: string
          phone?: string | null
          user_id: string
          verified?: boolean | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          otp_code?: string
          otp_type?: string
          phone?: string | null
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
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
      passkeys: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          id: string
          public_key: string
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          id?: string
          public_key: string
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          id?: string
          public_key?: string
          user_id?: string
        }
        Relationships: []
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
      payslips: {
        Row: {
          business_id: string
          created_at: string
          generated_at: string
          gross_amount: number
          id: string
          net_amount: number
          payslip_file_url: string | null
          period_month: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          generated_at?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          payslip_file_url?: string | null
          period_month: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          generated_at?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          payslip_file_url?: string | null
          period_month?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payslips_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_requests: {
        Row: {
          business_id: string
          created_at: string
          final_status: string | null
          from_time: string | null
          hr_approval_status: string | null
          id: string
          manager_approval_status: string | null
          permission_type: string
          reason: string | null
          request_date: string
          to_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          final_status?: string | null
          from_time?: string | null
          hr_approval_status?: string | null
          id?: string
          manager_approval_status?: string | null
          permission_type?: string
          reason?: string | null
          request_date: string
          to_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          final_status?: string | null
          from_time?: string | null
          hr_approval_status?: string | null
          id?: string
          manager_approval_status?: string | null
          permission_type?: string
          reason?: string | null
          request_date?: string
          to_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
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
      project_tasks: {
        Row: {
          assigned_employee_id: string | null
          assigned_manager_user_id: string | null
          business_id: string
          client_name: string | null
          created_at: string
          deadline: string | null
          department_id: string | null
          description: string | null
          id: string
          priority: string
          project_id: string | null
          source: string | null
          start_date: string | null
          status: string
          task_number: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_employee_id?: string | null
          assigned_manager_user_id?: string | null
          business_id: string
          client_name?: string | null
          created_at?: string
          deadline?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          priority?: string
          project_id?: string | null
          source?: string | null
          start_date?: string | null
          status?: string
          task_number?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_employee_id?: string | null
          assigned_manager_user_id?: string | null
          business_id?: string
          client_name?: string | null
          created_at?: string
          deadline?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          priority?: string
          project_id?: string | null
          source?: string | null
          start_date?: string | null
          status?: string
          task_number?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "client_projects"
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
      proposal_activity: {
        Row: {
          activity_type: string
          business_id: string
          created_at: string
          customer_user_id: string | null
          device_type: string | null
          duration_seconds: number | null
          id: string
          proposal_id: string
          section_viewed: string | null
        }
        Insert: {
          activity_type: string
          business_id: string
          created_at?: string
          customer_user_id?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          proposal_id: string
          section_viewed?: string | null
        }
        Update: {
          activity_type?: string
          business_id?: string
          created_at?: string
          customer_user_id?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          proposal_id?: string
          section_viewed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_activity_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_activity_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "deal_room_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_automations: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          lead_id: string | null
          lead_name: string | null
          proposal_content_json: Json | null
          proposed_price: number | null
          sent_at: string | null
          service_type: string | null
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          proposal_content_json?: Json | null
          proposed_price?: number | null
          sent_at?: string | null
          service_type?: string | null
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          proposal_content_json?: Json | null
          proposed_price?: number | null
          sent_at?: string | null
          service_type?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_automations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_line_items: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          item_name: string
          proposal_id: string
          quantity: number | null
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          item_name: string
          proposal_id: string
          quantity?: number | null
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          item_name?: string
          proposal_id?: string
          quantity?: number | null
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_line_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_line_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_requests: {
        Row: {
          budget_range: string | null
          business_id: string
          client_id: string | null
          client_name: string
          created_at: string
          id: string
          lead_id: string | null
          notes: string | null
          requested_by_sales_id: string
          service_details: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget_range?: string | null
          business_id: string
          client_id?: string | null
          client_name: string
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          requested_by_sales_id: string
          service_details?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget_range?: string | null
          business_id?: string
          client_id?: string | null
          client_name?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          requested_by_sales_id?: string
          service_details?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
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
      provider_access_logs: {
        Row: {
          action: string
          business_id: string
          created_at: string | null
          id: string
          ip: string | null
          performed_by: string
          provider_connection_id: string
          user_agent: string | null
        }
        Insert: {
          action: string
          business_id: string
          created_at?: string | null
          id?: string
          ip?: string | null
          performed_by: string
          provider_connection_id: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          business_id?: string
          created_at?: string | null
          id?: string
          ip?: string | null
          performed_by?: string
          provider_connection_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_access_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_access_logs_provider_connection_id_fkey"
            columns: ["provider_connection_id"]
            isOneToOne: false
            referencedRelation: "provider_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_connections: {
        Row: {
          business_id: string
          created_at: string | null
          display_label: string | null
          id: string
          last_tested_at: string | null
          provider_name: string
          provider_type: string
          status: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          display_label?: string | null
          id?: string
          last_tested_at?: string | null
          provider_name: string
          provider_type: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          display_label?: string | null
          id?: string
          last_tested_at?: string | null
          provider_name?: string
          provider_type?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_connections_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_credentials_vault: {
        Row: {
          business_id: string
          created_at: string | null
          encrypted_value: string
          id: string
          key_name: string
          masked_value: string | null
          provider_connection_id: string
          rotation_due_at: string | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          encrypted_value: string
          id?: string
          key_name: string
          masked_value?: string | null
          provider_connection_id: string
          rotation_due_at?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          encrypted_value?: string
          id?: string
          key_name?: string
          masked_value?: string | null
          provider_connection_id?: string
          rotation_due_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_credentials_vault_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_credentials_vault_provider_connection_id_fkey"
            columns: ["provider_connection_id"]
            isOneToOne: false
            referencedRelation: "provider_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          business_id: string
          created_at: string
          id: string
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          platform?: string
          token: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
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
      referral_tracking: {
        Row: {
          browser: string | null
          business_id: string
          campaign_id: string
          channel: string | null
          click_timestamp: string
          created_at: string
          device: string | null
          id: string
          lead_generated: boolean
          lead_id: string | null
          location: string | null
          referrer_id: string
          referrer_type: string
          referrer_user_id: string | null
          sale_generated: boolean
          visitor_ip: string | null
        }
        Insert: {
          browser?: string | null
          business_id: string
          campaign_id: string
          channel?: string | null
          click_timestamp?: string
          created_at?: string
          device?: string | null
          id?: string
          lead_generated?: boolean
          lead_id?: string | null
          location?: string | null
          referrer_id: string
          referrer_type?: string
          referrer_user_id?: string | null
          sale_generated?: boolean
          visitor_ip?: string | null
        }
        Update: {
          browser?: string | null
          business_id?: string
          campaign_id?: string
          channel?: string | null
          click_timestamp?: string
          created_at?: string
          device?: string | null
          id?: string
          lead_generated?: boolean
          lead_id?: string | null
          location?: string | null
          referrer_id?: string
          referrer_type?: string
          referrer_user_id?: string | null
          sale_generated?: boolean
          visitor_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_tracking_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_tracking_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "advocacy_campaigns"
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
      releases: {
        Row: {
          created_at: string
          deployed_at: string | null
          deployed_by: string | null
          environment: string
          id: string
          status: string
          version: string
        }
        Insert: {
          created_at?: string
          deployed_at?: string | null
          deployed_by?: string | null
          environment?: string
          id?: string
          status?: string
          version: string
        }
        Update: {
          created_at?: string
          deployed_at?: string | null
          deployed_by?: string | null
          environment?: string
          id?: string
          status?: string
          version?: string
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
      renewal_reminders: {
        Row: {
          assigned_accounts_user_id: string | null
          assigned_sales_rep_id: string | null
          business_id: string
          client_id: string
          contract_id: string | null
          created_at: string
          id: string
          notes: string | null
          reminder_date: string
          reminder_type: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_accounts_user_id?: string | null
          assigned_sales_rep_id?: string | null
          business_id: string
          client_id: string
          contract_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          reminder_date: string
          reminder_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_accounts_user_id?: string | null
          assigned_sales_rep_id?: string | null
          business_id?: string
          client_id?: string
          contract_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          reminder_date?: string
          reminder_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "renewal_reminders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewal_reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      renewals: {
        Row: {
          account_id: string | null
          assigned_to: string | null
          business_id: string
          client_id: string | null
          contract_id: string | null
          created_at: string
          id: string
          notes: string | null
          renewal_due_date: string | null
          renewal_status: string | null
          renewal_value: number | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          assigned_to?: string | null
          business_id: string
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          renewal_due_date?: string | null
          renewal_status?: string | null
          renewal_value?: number | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          assigned_to?: string | null
          business_id?: string
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          renewal_due_date?: string | null
          renewal_status?: string | null
          renewal_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "renewals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
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
      revenue_alert_rules: {
        Row: {
          business_id: string
          created_at: string
          enabled: boolean
          id: string
          recipients_json: Json | null
          rule_type: string
          threshold_json: Json | null
        }
        Insert: {
          business_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          recipients_json?: Json | null
          rule_type?: string
          threshold_json?: Json | null
        }
        Update: {
          business_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          recipients_json?: Json | null
          rule_type?: string
          threshold_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_alert_rules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_ledger_entries: {
        Row: {
          amount_gross: number
          amount_net: number
          business_id: string
          created_at: string
          currency: string
          customer_id: string | null
          customer_type: string
          due_date: string | null
          entity_id: string | null
          entity_type: string
          id: string
          invoice_date: string | null
          is_demo: boolean
          job_id: string | null
          ledger_scope: string
          paid_at: string | null
          project_id: string | null
          provider: string | null
          service_id: string | null
          status: string
          tax_amount: number
          transaction_reference: string | null
        }
        Insert: {
          amount_gross?: number
          amount_net?: number
          business_id: string
          created_at?: string
          currency?: string
          customer_id?: string | null
          customer_type?: string
          due_date?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          invoice_date?: string | null
          is_demo?: boolean
          job_id?: string | null
          ledger_scope?: string
          paid_at?: string | null
          project_id?: string | null
          provider?: string | null
          service_id?: string | null
          status?: string
          tax_amount?: number
          transaction_reference?: string | null
        }
        Update: {
          amount_gross?: number
          amount_net?: number
          business_id?: string
          created_at?: string
          currency?: string
          customer_id?: string | null
          customer_type?: string
          due_date?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          invoice_date?: string | null
          is_demo?: boolean
          job_id?: string | null
          ledger_scope?: string
          paid_at?: string | null
          project_id?: string | null
          provider?: string | null
          service_id?: string | null
          status?: string
          tax_amount?: number
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_ledger_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      review_auto_settings: {
        Row: {
          business_id: string
          channel: string
          created_at: string
          delay_hours: number
          id: string
          is_enabled: boolean
          message_template: string | null
          min_job_value: number | null
          review_link: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          channel?: string
          created_at?: string
          delay_hours?: number
          id?: string
          is_enabled?: boolean
          message_template?: string | null
          min_job_value?: number | null
          review_link?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          channel?: string
          created_at?: string
          delay_hours?: number
          id?: string
          is_enabled?: boolean
          message_template?: string | null
          min_job_value?: number | null
          review_link?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_auto_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      review_requests: {
        Row: {
          auto_sent: boolean | null
          business_id: string
          channel: string | null
          created_at: string
          id: string
          job_id: string | null
          review_url: string | null
          sent_at: string
          status: string
          tenant_customer_id: string | null
        }
        Insert: {
          auto_sent?: boolean | null
          business_id: string
          channel?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          review_url?: string | null
          sent_at?: string
          status?: string
          tenant_customer_id?: string | null
        }
        Update: {
          auto_sent?: boolean | null
          business_id?: string
          channel?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          review_url?: string | null
          sent_at?: string
          status?: string
          tenant_customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_tenant_customer_id_fkey"
            columns: ["tenant_customer_id"]
            isOneToOne: false
            referencedRelation: "tenant_customers"
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
      role_module_permissions: {
        Row: {
          business_id: string
          can_approve: boolean
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_export: boolean
          can_view: boolean
          created_at: string
          id: string
          module_key: string
          role_name: string
          updated_at: string
        }
        Insert: {
          business_id: string
          can_approve?: boolean
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_export?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module_key: string
          role_name: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          can_approve?: boolean
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_export?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module_key?: string
          role_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_module_permissions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_plans: {
        Row: {
          created_at: string
          description: string | null
          features_json: Json | null
          id: string
          is_active: boolean
          monthly_price: number
          name: string
          project_limit: number
          slug: string
          sort_order: number
          storage_limit_gb: number
          updated_at: string
          user_limit: number
          yearly_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          features_json?: Json | null
          id?: string
          is_active?: boolean
          monthly_price?: number
          name: string
          project_limit?: number
          slug: string
          sort_order?: number
          storage_limit_gb?: number
          updated_at?: string
          user_limit?: number
          yearly_price?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          features_json?: Json | null
          id?: string
          is_active?: boolean
          monthly_price?: number
          name?: string
          project_limit?: number
          slug?: string
          sort_order?: number
          storage_limit_gb?: number
          updated_at?: string
          user_limit?: number
          yearly_price?: number
        }
        Relationships: []
      }
      salary_profiles: {
        Row: {
          allowances_json: Json | null
          bank_details_json: Json | null
          base_salary: number
          business_id: string
          created_at: string
          deductions_json: Json | null
          id: string
          pay_frequency: string
          user_id: string
        }
        Insert: {
          allowances_json?: Json | null
          bank_details_json?: Json | null
          base_salary?: number
          business_id: string
          created_at?: string
          deductions_json?: Json | null
          id?: string
          pay_frequency?: string
          user_id: string
        }
        Update: {
          allowances_json?: Json | null
          bank_details_json?: Json | null
          base_salary?: number
          business_id?: string
          created_at?: string
          deductions_json?: Json | null
          id?: string
          pay_frequency?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_callbacks: {
        Row: {
          business_id: string
          callback_date: string
          callback_time: string | null
          client_id: string | null
          created_at: string
          id: string
          lead_id: string | null
          next_step: string | null
          notes: string | null
          result: string | null
          sales_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          callback_date: string
          callback_time?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          next_step?: string | null
          notes?: string | null
          result?: string | null
          sales_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          callback_date?: string
          callback_time?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          next_step?: string | null
          notes?: string | null
          result?: string | null
          sales_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_callbacks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_callbacks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_callbacks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_commissions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          business_id: string
          client_id: string
          commission_amount: number
          commission_rate: number
          created_at: string
          deal_value: number
          id: string
          notes: string | null
          payment_received_at: string | null
          sales_rep_id: string | null
          sales_rep_name: string | null
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          business_id: string
          client_id: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          deal_value?: number
          id?: string
          notes?: string | null
          payment_received_at?: string | null
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          business_id?: string
          client_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          deal_value?: number
          id?: string
          notes?: string | null
          payment_received_at?: string | null
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_commissions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_commissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      satisfaction_surveys: {
        Row: {
          business_id: string
          created_at: string
          id: string
          name: string
          questions_json: Json | null
          status: string
          survey_type: string
          trigger_event: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          name: string
          questions_json?: Json | null
          status?: string
          survey_type?: string
          trigger_event?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          questions_json?: Json | null
          status?: string
          survey_type?: string
          trigger_event?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "satisfaction_surveys_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_items: {
        Row: {
          business_id: string
          created_at: string
          id: string
          json_ld: Json
          schema_type: string
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          json_ld?: Json
          schema_type: string
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          json_ld?: Json
          schema_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "schema_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      secrets_registry: {
        Row: {
          business_id: string | null
          created_at: string
          id: string
          last_rotated_at: string | null
          provider: string
          scope_level: string
          secret_type: string
          status: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          id?: string
          last_rotated_at?: string | null
          provider: string
          scope_level?: string
          secret_type: string
          status?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          id?: string
          last_rotated_at?: string | null
          provider?: string
          scope_level?: string
          secret_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "secrets_registry_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
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
          seo_project_id: string | null
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
          seo_project_id?: string | null
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
          seo_project_id?: string | null
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
          {
            foreignKeyName: "seo_access_checklist_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_ai_recommendations: {
        Row: {
          business_id: string
          campaign_id: string | null
          created_at: string
          estimated_impact: string | null
          id: string
          page_url: string | null
          recommendation_type: string
          recommendations_json: Json | null
          status: string | null
          suggested_action: string | null
        }
        Insert: {
          business_id: string
          campaign_id?: string | null
          created_at?: string
          estimated_impact?: string | null
          id?: string
          page_url?: string | null
          recommendation_type: string
          recommendations_json?: Json | null
          status?: string | null
          suggested_action?: string | null
        }
        Update: {
          business_id?: string
          campaign_id?: string | null
          created_at?: string
          estimated_impact?: string | null
          id?: string
          page_url?: string | null
          recommendation_type?: string
          recommendations_json?: Json | null
          status?: string | null
          suggested_action?: string | null
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
      seo_autopilot_tasks: {
        Row: {
          business_id: string
          campaign_id: string | null
          created_at: string | null
          description: string | null
          id: string
          keyword: string | null
          output_json: Json | null
          status: string
          task_type: string
          title: string | null
        }
        Insert: {
          business_id: string
          campaign_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          keyword?: string | null
          output_json?: Json | null
          status?: string
          task_type?: string
          title?: string | null
        }
        Update: {
          business_id?: string
          campaign_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          keyword?: string | null
          output_json?: Json | null
          status?: string
          task_type?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_autopilot_tasks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_backlink_outreach: {
        Row: {
          assigned_employee_id: string | null
          business_id: string
          client_id: string | null
          contact_source: string | null
          created_at: string
          id: string
          outreach_type: string
          pitch_body: string | null
          pitch_subject: string | null
          response_notes: string | null
          seo_project_id: string | null
          status: string
          target_contact_name: string | null
          target_domain: string
          target_email: string | null
          updated_at: string
        }
        Insert: {
          assigned_employee_id?: string | null
          business_id: string
          client_id?: string | null
          contact_source?: string | null
          created_at?: string
          id?: string
          outreach_type?: string
          pitch_body?: string | null
          pitch_subject?: string | null
          response_notes?: string | null
          seo_project_id?: string | null
          status?: string
          target_contact_name?: string | null
          target_domain: string
          target_email?: string | null
          updated_at?: string
        }
        Update: {
          assigned_employee_id?: string | null
          business_id?: string
          client_id?: string | null
          contact_source?: string | null
          created_at?: string
          id?: string
          outreach_type?: string
          pitch_body?: string | null
          pitch_subject?: string | null
          response_notes?: string | null
          seo_project_id?: string | null
          status?: string
          target_contact_name?: string | null
          target_domain?: string
          target_email?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_backlink_outreach_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_backlink_outreach_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_backlink_outreach_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_backlinks: {
        Row: {
          anchor_text: string | null
          business_id: string
          client_id: string | null
          created_at: string | null
          date_found: string | null
          domain_authority: number | null
          id: string
          last_checked: string | null
          link_type: string | null
          seo_project_id: string | null
          source_url: string
          status: string | null
          target_url: string | null
        }
        Insert: {
          anchor_text?: string | null
          business_id: string
          client_id?: string | null
          created_at?: string | null
          date_found?: string | null
          domain_authority?: number | null
          id?: string
          last_checked?: string | null
          link_type?: string | null
          seo_project_id?: string | null
          source_url: string
          status?: string | null
          target_url?: string | null
        }
        Update: {
          anchor_text?: string | null
          business_id?: string
          client_id?: string | null
          created_at?: string | null
          date_found?: string | null
          domain_authority?: number | null
          id?: string
          last_checked?: string | null
          link_type?: string | null
          seo_project_id?: string | null
          source_url?: string
          status?: string | null
          target_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_backlinks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_backlinks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_backlinks_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_blogs: {
        Row: {
          author_employee_id: string | null
          blog_title: string
          blog_topic: string | null
          business_id: string
          client_id: string | null
          content_text: string | null
          created_at: string
          id: string
          publish_date: string | null
          seo_project_id: string
          seo_score: number | null
          status: string
          target_keywords_json: Json | null
        }
        Insert: {
          author_employee_id?: string | null
          blog_title: string
          blog_topic?: string | null
          business_id: string
          client_id?: string | null
          content_text?: string | null
          created_at?: string
          id?: string
          publish_date?: string | null
          seo_project_id: string
          seo_score?: number | null
          status?: string
          target_keywords_json?: Json | null
        }
        Update: {
          author_employee_id?: string | null
          blog_title?: string
          blog_topic?: string | null
          business_id?: string
          client_id?: string | null
          content_text?: string | null
          created_at?: string
          id?: string
          publish_date?: string | null
          seo_project_id?: string
          seo_score?: number | null
          status?: string
          target_keywords_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_blogs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_blogs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_blogs_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_campaigns: {
        Row: {
          assigned_content_writer_user_id: string | null
          assigned_seo_executive_user_id: string | null
          assigned_seo_manager_user_id: string | null
          billing_type: string
          business_id: string
          business_name: string | null
          client_id: string | null
          competitors_json: Json | null
          contract_duration_months: number | null
          created_at: string
          id: string
          monthly_fee: number | null
          onboarding_notes: string | null
          onboarding_status: string
          package_type: string
          payment_status: string
          previous_seo_done: boolean | null
          primary_domain: string | null
          project_id: string | null
          renewal_date: string | null
          service_areas_json: Json | null
          start_date: string | null
          status: string
          target_locations_json: Json | null
          target_radius_km: number | null
          target_services_json: Json | null
          updated_at: string
          yearly_fee: number | null
        }
        Insert: {
          assigned_content_writer_user_id?: string | null
          assigned_seo_executive_user_id?: string | null
          assigned_seo_manager_user_id?: string | null
          billing_type?: string
          business_id: string
          business_name?: string | null
          client_id?: string | null
          competitors_json?: Json | null
          contract_duration_months?: number | null
          created_at?: string
          id?: string
          monthly_fee?: number | null
          onboarding_notes?: string | null
          onboarding_status?: string
          package_type?: string
          payment_status?: string
          previous_seo_done?: boolean | null
          primary_domain?: string | null
          project_id?: string | null
          renewal_date?: string | null
          service_areas_json?: Json | null
          start_date?: string | null
          status?: string
          target_locations_json?: Json | null
          target_radius_km?: number | null
          target_services_json?: Json | null
          updated_at?: string
          yearly_fee?: number | null
        }
        Update: {
          assigned_content_writer_user_id?: string | null
          assigned_seo_executive_user_id?: string | null
          assigned_seo_manager_user_id?: string | null
          billing_type?: string
          business_id?: string
          business_name?: string | null
          client_id?: string | null
          competitors_json?: Json | null
          contract_duration_months?: number | null
          created_at?: string
          id?: string
          monthly_fee?: number | null
          onboarding_notes?: string | null
          onboarding_status?: string
          package_type?: string
          payment_status?: string
          previous_seo_done?: boolean | null
          primary_domain?: string | null
          project_id?: string | null
          renewal_date?: string | null
          service_areas_json?: Json | null
          start_date?: string | null
          status?: string
          target_locations_json?: Json | null
          target_radius_km?: number | null
          target_services_json?: Json | null
          updated_at?: string
          yearly_fee?: number | null
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
      seo_client_messages: {
        Row: {
          attachment_url: string | null
          business_id: string
          client_id: string | null
          created_at: string
          id: string
          message_text: string
          sent_by_role: string
          seo_project_id: string
          status: string
        }
        Insert: {
          attachment_url?: string | null
          business_id: string
          client_id?: string | null
          created_at?: string
          id?: string
          message_text: string
          sent_by_role?: string
          seo_project_id: string
          status?: string
        }
        Update: {
          attachment_url?: string | null
          business_id?: string
          client_id?: string | null
          created_at?: string
          id?: string
          message_text?: string
          sent_by_role?: string
          seo_project_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_client_messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_client_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_client_messages_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
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
      seo_cms_connections: {
        Row: {
          api_endpoint: string | null
          business_id: string
          client_id: string | null
          created_at: string
          id: string
          platform: string
          site_url: string | null
          status: string
        }
        Insert: {
          api_endpoint?: string | null
          business_id: string
          client_id?: string | null
          created_at?: string
          id?: string
          platform?: string
          site_url?: string | null
          status?: string
        }
        Update: {
          api_endpoint?: string | null
          business_id?: string
          client_id?: string | null
          created_at?: string
          id?: string
          platform?: string
          site_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_cms_connections_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_cms_connections_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_communication_logs: {
        Row: {
          assigned_to_user_id: string | null
          attachment_url: string | null
          business_id: string
          campaign_id: string
          communication_type: string
          created_at: string
          follow_up_date: string | null
          id: string
          seo_project_id: string | null
          summary: string | null
        }
        Insert: {
          assigned_to_user_id?: string | null
          attachment_url?: string | null
          business_id: string
          campaign_id: string
          communication_type?: string
          created_at?: string
          follow_up_date?: string | null
          id?: string
          seo_project_id?: string | null
          summary?: string | null
        }
        Update: {
          assigned_to_user_id?: string | null
          attachment_url?: string | null
          business_id?: string
          campaign_id?: string
          communication_type?: string
          created_at?: string
          follow_up_date?: string | null
          id?: string
          seo_project_id?: string | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_communication_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_communication_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "seo_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_communication_logs_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_competitor_fetch_logs: {
        Row: {
          business_id: string
          created_at: string
          error_message: string | null
          fetch_time: string
          id: string
          results_count: number
          seo_project_id: string
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string
          error_message?: string | null
          fetch_time?: string
          id?: string
          results_count?: number
          seo_project_id: string
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          error_message?: string | null
          fetch_time?: string
          id?: string
          results_count?: number
          seo_project_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_competitor_fetch_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_competitor_gap: {
        Row: {
          business_id: string
          client_id: string | null
          client_rank: number | null
          competitor_id: string | null
          competitor_rank: number | null
          created_at: string | null
          gap_type: string | null
          id: string
          keyword: string | null
          opportunity_score: number | null
          recommendation: string | null
          seo_project_id: string | null
        }
        Insert: {
          business_id: string
          client_id?: string | null
          client_rank?: number | null
          competitor_id?: string | null
          competitor_rank?: number | null
          created_at?: string | null
          gap_type?: string | null
          id?: string
          keyword?: string | null
          opportunity_score?: number | null
          recommendation?: string | null
          seo_project_id?: string | null
        }
        Update: {
          business_id?: string
          client_id?: string | null
          client_rank?: number | null
          competitor_id?: string | null
          competitor_rank?: number | null
          created_at?: string | null
          gap_type?: string | null
          id?: string
          keyword?: string | null
          opportunity_score?: number | null
          recommendation?: string | null
          seo_project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_competitor_gap_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_competitor_gap_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_competitor_gap_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "seo_competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_competitor_gap_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_competitors: {
        Row: {
          business_id: string
          client_id: string | null
          competitor_domain: string
          competitor_name: string | null
          competitor_title: string | null
          created_at: string
          discovered_date: string | null
          id: string
          ranking_position: number | null
          seo_project_id: string
        }
        Insert: {
          business_id: string
          client_id?: string | null
          competitor_domain: string
          competitor_name?: string | null
          competitor_title?: string | null
          created_at?: string
          discovered_date?: string | null
          id?: string
          ranking_position?: number | null
          seo_project_id: string
        }
        Update: {
          business_id?: string
          client_id?: string | null
          competitor_domain?: string
          competitor_name?: string | null
          competitor_title?: string | null
          created_at?: string
          discovered_date?: string | null
          id?: string
          ranking_position?: number | null
          seo_project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_competitors_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_competitors_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_competitors_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_content_generation: {
        Row: {
          business_id: string
          client_id: string | null
          content_type: string
          created_at: string | null
          created_by: string | null
          generated_content: string | null
          id: string
          secondary_keywords_json: Json | null
          seo_project_id: string | null
          seo_score: number | null
          status: string | null
          target_keyword: string | null
          title: string
          tone: string | null
        }
        Insert: {
          business_id: string
          client_id?: string | null
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          generated_content?: string | null
          id?: string
          secondary_keywords_json?: Json | null
          seo_project_id?: string | null
          seo_score?: number | null
          status?: string | null
          target_keyword?: string | null
          title: string
          tone?: string | null
        }
        Update: {
          business_id?: string
          client_id?: string | null
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          generated_content?: string | null
          id?: string
          secondary_keywords_json?: Json | null
          seo_project_id?: string | null
          seo_score?: number | null
          status?: string | null
          target_keyword?: string | null
          title?: string
          tone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_content_generation_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_content_generation_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_content_generation_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
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
          client_approval_status: string
          created_at: string
          draft_link: string | null
          due_at: string | null
          id: string
          live_url: string | null
          publish_date: string | null
          seo_project_id: string | null
          status: string
          target_keyword: string | null
          target_url: string | null
          title: string
          type: string
          word_count: number | null
        }
        Insert: {
          assigned_writer_user_id?: string | null
          brief?: string | null
          business_id: string
          campaign_id: string
          client_approval_status?: string
          created_at?: string
          draft_link?: string | null
          due_at?: string | null
          id?: string
          live_url?: string | null
          publish_date?: string | null
          seo_project_id?: string | null
          status?: string
          target_keyword?: string | null
          target_url?: string | null
          title: string
          type?: string
          word_count?: number | null
        }
        Update: {
          assigned_writer_user_id?: string | null
          brief?: string | null
          business_id?: string
          campaign_id?: string
          client_approval_status?: string
          created_at?: string
          draft_link?: string | null
          due_at?: string | null
          id?: string
          live_url?: string | null
          publish_date?: string | null
          seo_project_id?: string | null
          status?: string
          target_keyword?: string | null
          target_url?: string | null
          title?: string
          type?: string
          word_count?: number | null
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
          {
            foreignKeyName: "seo_content_items_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_content_workflow: {
        Row: {
          approval_status: string
          approved_by: string | null
          business_id: string
          client_id: string | null
          content_type: string
          created_at: string
          created_by: string | null
          edited_content: string | null
          generated_content: string | null
          id: string
          publish_platform: string | null
          publish_status: string
          publish_url: string | null
          seo_project_id: string | null
          target_keyword: string | null
          title: string
          updated_at: string
        }
        Insert: {
          approval_status?: string
          approved_by?: string | null
          business_id: string
          client_id?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          edited_content?: string | null
          generated_content?: string | null
          id?: string
          publish_platform?: string | null
          publish_status?: string
          publish_url?: string | null
          seo_project_id?: string | null
          target_keyword?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          approval_status?: string
          approved_by?: string | null
          business_id?: string
          client_id?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          edited_content?: string | null
          generated_content?: string | null
          id?: string
          publish_platform?: string | null
          publish_status?: string
          publish_url?: string | null
          seo_project_id?: string | null
          target_keyword?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_content_workflow_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_content_workflow_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_content_workflow_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_domain_analyses: {
        Row: {
          analysis_json: Json | null
          business_id: string
          completed_at: string | null
          created_at: string
          domain: string
          estimated_traffic: number | null
          id: string
          seo_project_id: string | null
          seo_score: number | null
          started_at: string | null
          status: string
          total_backlinks_est: number | null
          total_keywords: number | null
          total_pages_crawled: number | null
        }
        Insert: {
          analysis_json?: Json | null
          business_id: string
          completed_at?: string | null
          created_at?: string
          domain: string
          estimated_traffic?: number | null
          id?: string
          seo_project_id?: string | null
          seo_score?: number | null
          started_at?: string | null
          status?: string
          total_backlinks_est?: number | null
          total_keywords?: number | null
          total_pages_crawled?: number | null
        }
        Update: {
          analysis_json?: Json | null
          business_id?: string
          completed_at?: string | null
          created_at?: string
          domain?: string
          estimated_traffic?: number | null
          id?: string
          seo_project_id?: string | null
          seo_score?: number | null
          started_at?: string | null
          status?: string
          total_backlinks_est?: number | null
          total_keywords?: number | null
          total_pages_crawled?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_domain_analyses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_domain_analyses_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
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
      seo_gbp_profiles: {
        Row: {
          business_id: string
          campaign_id: string
          created_at: string
          existing_listing: boolean | null
          gmb_posts_count: number | null
          id: string
          last_optimisation_date: string | null
          last_post_date: string | null
          listing_url: string | null
          nap_consistency_check: boolean | null
          rating_avg: number | null
          reviews_count: number | null
          seo_project_id: string | null
          status: string
          verification_status: string
        }
        Insert: {
          business_id: string
          campaign_id: string
          created_at?: string
          existing_listing?: boolean | null
          gmb_posts_count?: number | null
          id?: string
          last_optimisation_date?: string | null
          last_post_date?: string | null
          listing_url?: string | null
          nap_consistency_check?: boolean | null
          rating_avg?: number | null
          reviews_count?: number | null
          seo_project_id?: string | null
          status?: string
          verification_status?: string
        }
        Update: {
          business_id?: string
          campaign_id?: string
          created_at?: string
          existing_listing?: boolean | null
          gmb_posts_count?: number | null
          id?: string
          last_optimisation_date?: string | null
          last_post_date?: string | null
          listing_url?: string | null
          nap_consistency_check?: boolean | null
          rating_avg?: number | null
          reviews_count?: number | null
          seo_project_id?: string | null
          status?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_gbp_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_gbp_profiles_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "seo_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_gbp_profiles_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_internal_link_suggestions: {
        Row: {
          anchor_text: string | null
          business_id: string
          client_id: string | null
          created_at: string
          id: string
          link_context: string | null
          seo_project_id: string | null
          source_page_url: string
          status: string
          target_page_url: string
        }
        Insert: {
          anchor_text?: string | null
          business_id: string
          client_id?: string | null
          created_at?: string
          id?: string
          link_context?: string | null
          seo_project_id?: string | null
          source_page_url: string
          status?: string
          target_page_url: string
        }
        Update: {
          anchor_text?: string | null
          business_id?: string
          client_id?: string | null
          created_at?: string
          id?: string
          link_context?: string | null
          seo_project_id?: string | null
          source_page_url?: string
          status?: string
          target_page_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_internal_link_suggestions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_internal_link_suggestions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_internal_link_suggestions_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_internal_links: {
        Row: {
          anchor_text: string | null
          business_id: string
          created_at: string
          id: string
          is_suggestion: boolean | null
          link_type: string | null
          seo_project_id: string | null
          source_url: string
          status: string | null
          target_url: string
        }
        Insert: {
          anchor_text?: string | null
          business_id: string
          created_at?: string
          id?: string
          is_suggestion?: boolean | null
          link_type?: string | null
          seo_project_id?: string | null
          source_url: string
          status?: string | null
          target_url: string
        }
        Update: {
          anchor_text?: string | null
          business_id?: string
          created_at?: string
          id?: string
          is_suggestion?: boolean | null
          link_type?: string | null
          seo_project_id?: string | null
          source_url?: string
          status?: string | null
          target_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_internal_links_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_internal_links_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_keyword_intelligence: {
        Row: {
          business_id: string
          cluster_group: string | null
          created_at: string
          current_position: number | null
          difficulty_score: number | null
          domain_analysis_id: string | null
          estimated_volume: string | null
          id: string
          intent: string | null
          is_branded: boolean | null
          keyword: string
          keyword_type: string | null
          opportunity_score: number | null
          ranking_url: string | null
          seo_project_id: string | null
        }
        Insert: {
          business_id: string
          cluster_group?: string | null
          created_at?: string
          current_position?: number | null
          difficulty_score?: number | null
          domain_analysis_id?: string | null
          estimated_volume?: string | null
          id?: string
          intent?: string | null
          is_branded?: boolean | null
          keyword: string
          keyword_type?: string | null
          opportunity_score?: number | null
          ranking_url?: string | null
          seo_project_id?: string | null
        }
        Update: {
          business_id?: string
          cluster_group?: string | null
          created_at?: string
          current_position?: number | null
          difficulty_score?: number | null
          domain_analysis_id?: string | null
          estimated_volume?: string | null
          id?: string
          intent?: string | null
          is_branded?: boolean | null
          keyword?: string
          keyword_type?: string | null
          opportunity_score?: number | null
          ranking_url?: string | null
          seo_project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_keyword_intelligence_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_keyword_intelligence_domain_analysis_id_fkey"
            columns: ["domain_analysis_id"]
            isOneToOne: false
            referencedRelation: "seo_domain_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_keyword_intelligence_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_keywords: {
        Row: {
          business_id: string
          campaign_id: string | null
          created_at: string
          current_ranking: number | null
          difficulty: number | null
          id: string
          keyword: string
          keyword_type: string
          location: string | null
          previous_ranking: number | null
          priority: string
          search_volume: number | null
          seo_project_id: string | null
          status: string
          target_rank: number | null
          target_url: string | null
        }
        Insert: {
          business_id: string
          campaign_id?: string | null
          created_at?: string
          current_ranking?: number | null
          difficulty?: number | null
          id?: string
          keyword: string
          keyword_type?: string
          location?: string | null
          previous_ranking?: number | null
          priority?: string
          search_volume?: number | null
          seo_project_id?: string | null
          status?: string
          target_rank?: number | null
          target_url?: string | null
        }
        Update: {
          business_id?: string
          campaign_id?: string | null
          created_at?: string
          current_ranking?: number | null
          difficulty?: number | null
          id?: string
          keyword?: string
          keyword_type?: string
          location?: string | null
          previous_ranking?: number | null
          priority?: string
          search_volume?: number | null
          seo_project_id?: string | null
          status?: string
          target_rank?: number | null
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
          {
            foreignKeyName: "seo_keywords_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_monthly_reports: {
        Row: {
          business_id: string
          client_id: string | null
          created_at: string
          generated_at: string
          id: string
          report_data_json: Json | null
          report_month: string
          report_pdf_url: string | null
          seo_project_id: string
        }
        Insert: {
          business_id: string
          client_id?: string | null
          created_at?: string
          generated_at?: string
          id?: string
          report_data_json?: Json | null
          report_month: string
          report_pdf_url?: string | null
          seo_project_id: string
        }
        Update: {
          business_id?: string
          client_id?: string | null
          created_at?: string
          generated_at?: string
          id?: string
          report_data_json?: Json | null
          report_month?: string
          report_pdf_url?: string | null
          seo_project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_monthly_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_monthly_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_monthly_reports_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_offpage_items: {
        Row: {
          anchor_text: string | null
          business_id: string
          campaign_id: string
          created_at: string
          da_score: number | null
          follow_type: string
          id: string
          seo_project_id: string | null
          source_url: string | null
          status: string
          target_url: string | null
          type: string
          website_name: string | null
        }
        Insert: {
          anchor_text?: string | null
          business_id: string
          campaign_id: string
          created_at?: string
          da_score?: number | null
          follow_type?: string
          id?: string
          seo_project_id?: string | null
          source_url?: string | null
          status?: string
          target_url?: string | null
          type?: string
          website_name?: string | null
        }
        Update: {
          anchor_text?: string | null
          business_id?: string
          campaign_id?: string
          created_at?: string
          da_score?: number | null
          follow_type?: string
          id?: string
          seo_project_id?: string | null
          source_url?: string | null
          status?: string
          target_url?: string | null
          type?: string
          website_name?: string | null
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
          {
            foreignKeyName: "seo_offpage_items_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
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
          seo_project_id: string | null
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
          seo_project_id?: string | null
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
          seo_project_id?: string | null
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
          {
            foreignKeyName: "seo_onpage_tasks_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_outreach_templates: {
        Row: {
          body_template: string | null
          business_id: string
          created_at: string
          id: string
          subject_template: string | null
          template_name: string
          template_type: string
        }
        Insert: {
          body_template?: string | null
          business_id: string
          created_at?: string
          id?: string
          subject_template?: string | null
          template_name: string
          template_type?: string
        }
        Update: {
          body_template?: string | null
          business_id?: string
          created_at?: string
          id?: string
          subject_template?: string | null
          template_name?: string
          template_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_outreach_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_page_audits: {
        Row: {
          audit_date: string
          broken_links_count: number | null
          business_id: string
          canonical_url: string | null
          client_id: string | null
          created_at: string
          external_links_count: number | null
          h1_tag: string | null
          id: string
          image_count: number | null
          internal_links_count: number | null
          issues_json: Json | null
          meta_description: string | null
          missing_alt_tags_count: number | null
          mobile_friendly: boolean | null
          page_speed_score: number | null
          page_url: string
          schema_present: boolean | null
          seo_project_id: string | null
          seo_score: number | null
          title_tag: string | null
          word_count: number | null
        }
        Insert: {
          audit_date?: string
          broken_links_count?: number | null
          business_id: string
          canonical_url?: string | null
          client_id?: string | null
          created_at?: string
          external_links_count?: number | null
          h1_tag?: string | null
          id?: string
          image_count?: number | null
          internal_links_count?: number | null
          issues_json?: Json | null
          meta_description?: string | null
          missing_alt_tags_count?: number | null
          mobile_friendly?: boolean | null
          page_speed_score?: number | null
          page_url: string
          schema_present?: boolean | null
          seo_project_id?: string | null
          seo_score?: number | null
          title_tag?: string | null
          word_count?: number | null
        }
        Update: {
          audit_date?: string
          broken_links_count?: number | null
          business_id?: string
          canonical_url?: string | null
          client_id?: string | null
          created_at?: string
          external_links_count?: number | null
          h1_tag?: string | null
          id?: string
          image_count?: number | null
          internal_links_count?: number | null
          issues_json?: Json | null
          meta_description?: string | null
          missing_alt_tags_count?: number | null
          mobile_friendly?: boolean | null
          page_speed_score?: number | null
          page_url?: string
          schema_present?: boolean | null
          seo_project_id?: string | null
          seo_score?: number | null
          title_tag?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_page_audits_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_page_audits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_page_audits_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_page_scores: {
        Row: {
          alt_tags_count: number | null
          business_id: string
          client_id: string | null
          content_length: number | null
          content_score: number | null
          created_at: string | null
          id: string
          images_count: number | null
          internal_links_count: number | null
          keyword_density: number | null
          last_scanned_at: string | null
          local_seo_score: number | null
          meta_score: number | null
          page_title: string | null
          page_url: string
          primary_keyword: string | null
          readability_score: number | null
          recommendations_json: Json | null
          seo_project_id: string | null
          seo_score: number | null
          technical_score: number | null
        }
        Insert: {
          alt_tags_count?: number | null
          business_id: string
          client_id?: string | null
          content_length?: number | null
          content_score?: number | null
          created_at?: string | null
          id?: string
          images_count?: number | null
          internal_links_count?: number | null
          keyword_density?: number | null
          last_scanned_at?: string | null
          local_seo_score?: number | null
          meta_score?: number | null
          page_title?: string | null
          page_url: string
          primary_keyword?: string | null
          readability_score?: number | null
          recommendations_json?: Json | null
          seo_project_id?: string | null
          seo_score?: number | null
          technical_score?: number | null
        }
        Update: {
          alt_tags_count?: number | null
          business_id?: string
          client_id?: string | null
          content_length?: number | null
          content_score?: number | null
          created_at?: string | null
          id?: string
          images_count?: number | null
          internal_links_count?: number | null
          keyword_density?: number | null
          last_scanned_at?: string | null
          local_seo_score?: number | null
          meta_score?: number | null
          page_title?: string | null
          page_url?: string
          primary_keyword?: string | null
          readability_score?: number | null
          recommendations_json?: Json | null
          seo_project_id?: string | null
          seo_score?: number | null
          technical_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_page_scores_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_page_scores_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_page_scores_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_projects: {
        Row: {
          assigned_content_writer_id: string | null
          billing_type: string
          business_id: string
          client_id: string | null
          competitors_json: Json | null
          contract_end: string | null
          contract_start: string | null
          created_at: string
          id: string
          monthly_fee: number | null
          onboarding_notes: string | null
          onboarding_status: string
          payment_status: string
          previous_seo_done: boolean | null
          primary_keyword: string | null
          project_name: string
          project_status: string
          renewal_date: string | null
          seo_manager_id: string | null
          seo_specialist_id: string | null
          service_package: string | null
          target_keywords_json: Json | null
          target_location: string | null
          target_locations_json: Json | null
          target_radius_km: number | null
          updated_at: string
          website_domain: string
        }
        Insert: {
          assigned_content_writer_id?: string | null
          billing_type?: string
          business_id: string
          client_id?: string | null
          competitors_json?: Json | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          id?: string
          monthly_fee?: number | null
          onboarding_notes?: string | null
          onboarding_status?: string
          payment_status?: string
          previous_seo_done?: boolean | null
          primary_keyword?: string | null
          project_name: string
          project_status?: string
          renewal_date?: string | null
          seo_manager_id?: string | null
          seo_specialist_id?: string | null
          service_package?: string | null
          target_keywords_json?: Json | null
          target_location?: string | null
          target_locations_json?: Json | null
          target_radius_km?: number | null
          updated_at?: string
          website_domain: string
        }
        Update: {
          assigned_content_writer_id?: string | null
          billing_type?: string
          business_id?: string
          client_id?: string | null
          competitors_json?: Json | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          id?: string
          monthly_fee?: number | null
          onboarding_notes?: string | null
          onboarding_status?: string
          payment_status?: string
          previous_seo_done?: boolean | null
          primary_keyword?: string | null
          project_name?: string
          project_status?: string
          renewal_date?: string | null
          seo_manager_id?: string | null
          seo_specialist_id?: string | null
          service_package?: string | null
          target_keywords_json?: Json | null
          target_location?: string | null
          target_locations_json?: Json | null
          target_radius_km?: number | null
          updated_at?: string
          website_domain?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_projects_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
          seo_project_id: string | null
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
          seo_project_id?: string | null
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
          seo_project_id?: string | null
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
          {
            foreignKeyName: "seo_reports_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_roadmap_items: {
        Row: {
          assigned_to: string | null
          business_id: string
          category: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_impact: string | null
          id: string
          priority: string | null
          seo_project_id: string | null
          status: string | null
          title: string
        }
        Insert: {
          assigned_to?: string | null
          business_id: string
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_impact?: string | null
          id?: string
          priority?: string | null
          seo_project_id?: string | null
          status?: string | null
          title: string
        }
        Update: {
          assigned_to?: string | null
          business_id?: string
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_impact?: string | null
          id?: string
          priority?: string | null
          seo_project_id?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_roadmap_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_roadmap_items_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_roadmaps: {
        Row: {
          business_id: string
          client_id: string | null
          created_at: string
          generated_by: string | null
          id: string
          roadmap_content_json: Json | null
          roadmap_title: string
          roadmap_type: string
          seo_project_id: string | null
        }
        Insert: {
          business_id: string
          client_id?: string | null
          created_at?: string
          generated_by?: string | null
          id?: string
          roadmap_content_json?: Json | null
          roadmap_title: string
          roadmap_type?: string
          seo_project_id?: string | null
        }
        Update: {
          business_id?: string
          client_id?: string | null
          created_at?: string
          generated_by?: string | null
          id?: string
          roadmap_content_json?: Json | null
          roadmap_title?: string
          roadmap_type?: string
          seo_project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_roadmaps_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_roadmaps_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_roadmaps_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_tasks: {
        Row: {
          assigned_to_employee_id: string | null
          business_id: string
          client_id: string | null
          created_at: string
          deadline: string | null
          id: string
          is_visible_to_client: boolean | null
          priority: string
          progress_percent: number | null
          result_notes: string | null
          seo_project_id: string
          status: string
          task_category: string
          task_description: string | null
          task_title: string
          updated_at: string
        }
        Insert: {
          assigned_to_employee_id?: string | null
          business_id: string
          client_id?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          is_visible_to_client?: boolean | null
          priority?: string
          progress_percent?: number | null
          result_notes?: string | null
          seo_project_id: string
          status?: string
          task_category?: string
          task_description?: string | null
          task_title: string
          updated_at?: string
        }
        Update: {
          assigned_to_employee_id?: string | null
          business_id?: string
          client_id?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          is_visible_to_client?: boolean | null
          priority?: string
          progress_percent?: number | null
          result_notes?: string | null
          seo_project_id?: string
          status?: string
          task_category?: string
          task_description?: string | null
          task_title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_tasks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_tasks_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_technical_audits: {
        Row: {
          broken_links_count: number | null
          business_id: string
          campaign_id: string
          core_web_vitals_json: Json | null
          created_at: string
          desktop_speed: number | null
          id: string
          last_audit_date: string | null
          mobile_speed: number | null
          notes: string | null
          robots_txt_checked: boolean | null
          schema_added: boolean | null
          seo_project_id: string | null
          sitemap_submitted: boolean | null
          ssl_active: boolean | null
          updated_at: string
        }
        Insert: {
          broken_links_count?: number | null
          business_id: string
          campaign_id: string
          core_web_vitals_json?: Json | null
          created_at?: string
          desktop_speed?: number | null
          id?: string
          last_audit_date?: string | null
          mobile_speed?: number | null
          notes?: string | null
          robots_txt_checked?: boolean | null
          schema_added?: boolean | null
          seo_project_id?: string | null
          sitemap_submitted?: boolean | null
          ssl_active?: boolean | null
          updated_at?: string
        }
        Update: {
          broken_links_count?: number | null
          business_id?: string
          campaign_id?: string
          core_web_vitals_json?: Json | null
          created_at?: string
          desktop_speed?: number | null
          id?: string
          last_audit_date?: string | null
          mobile_speed?: number | null
          notes?: string | null
          robots_txt_checked?: boolean | null
          schema_added?: boolean | null
          seo_project_id?: string | null
          sitemap_submitted?: boolean | null
          ssl_active?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_technical_audits_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_technical_audits_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "seo_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_technical_audits_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_traffic_estimates: {
        Row: {
          branded_traffic_pct: number | null
          business_id: string
          created_at: string
          domain: string
          estimated_at: string
          estimated_monthly_traffic: number | null
          estimated_organic_value: number | null
          id: string
          seo_project_id: string | null
          top_pages_json: Json | null
          trend_json: Json | null
          visibility_score: number | null
        }
        Insert: {
          branded_traffic_pct?: number | null
          business_id: string
          created_at?: string
          domain: string
          estimated_at?: string
          estimated_monthly_traffic?: number | null
          estimated_organic_value?: number | null
          id?: string
          seo_project_id?: string | null
          top_pages_json?: Json | null
          trend_json?: Json | null
          visibility_score?: number | null
        }
        Update: {
          branded_traffic_pct?: number | null
          business_id?: string
          created_at?: string
          domain?: string
          estimated_at?: string
          estimated_monthly_traffic?: number | null
          estimated_organic_value?: number | null
          id?: string
          seo_project_id?: string | null
          top_pages_json?: Json | null
          trend_json?: Json | null
          visibility_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_traffic_estimates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_traffic_estimates_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_updates: {
        Row: {
          business_id: string
          client_id: string | null
          created_at: string
          created_by_employee_id: string | null
          description: string | null
          id: string
          metrics_json: Json | null
          seo_project_id: string
          title: string
          update_type: string
          visible_to_client: boolean | null
        }
        Insert: {
          business_id: string
          client_id?: string | null
          created_at?: string
          created_by_employee_id?: string | null
          description?: string | null
          id?: string
          metrics_json?: Json | null
          seo_project_id: string
          title: string
          update_type?: string
          visible_to_client?: boolean | null
        }
        Update: {
          business_id?: string
          client_id?: string | null
          created_at?: string
          created_by_employee_id?: string | null
          description?: string | null
          id?: string
          metrics_json?: Json | null
          seo_project_id?: string
          title?: string
          update_type?: string
          visible_to_client?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_updates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_updates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_updates_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
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
      sla_events: {
        Row: {
          business_id: string
          created_at: string
          entity_id: string
          entity_type: string
          event_type: string
          id: string
          triggered_at: string
          triggered_to_user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          event_type: string
          id?: string
          triggered_at?: string
          triggered_to_user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: string
          triggered_at?: string
          triggered_to_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sla_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_policies: {
        Row: {
          business_id: string
          created_at: string
          entity_type: string
          escalation_levels_json: Json | null
          first_response_minutes: number
          id: string
          priority: string
          resolution_minutes: number
        }
        Insert: {
          business_id: string
          created_at?: string
          entity_type: string
          escalation_levels_json?: Json | null
          first_response_minutes?: number
          id?: string
          priority?: string
          resolution_minutes?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          entity_type?: string
          escalation_levels_json?: Json | null
          first_response_minutes?: number
          id?: string
          priority?: string
          resolution_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "sla_policies_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_tracking: {
        Row: {
          breached_at: string | null
          business_id: string
          created_at: string
          deadline_at: string
          department_id: string | null
          id: string
          project_id: string | null
          sla_hours: number
          started_at: string
          status: string
          task_id: string | null
        }
        Insert: {
          breached_at?: string | null
          business_id: string
          created_at?: string
          deadline_at: string
          department_id?: string | null
          id?: string
          project_id?: string | null
          sla_hours?: number
          started_at?: string
          status?: string
          task_id?: string | null
        }
        Update: {
          breached_at?: string | null
          business_id?: string
          created_at?: string
          deadline_at?: string
          department_id?: string | null
          id?: string
          project_id?: string | null
          sla_hours?: number
          started_at?: string
          status?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sla_tracking_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_tracking_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_tracking_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "client_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_tracking_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_tasks: {
        Row: {
          assigned_employee_id: string | null
          business_id: string
          client_id: string | null
          created_at: string
          hashtags: string | null
          id: string
          image_url: string | null
          platform: string
          post_caption: string | null
          post_date: string | null
          seo_project_id: string | null
          status: string
        }
        Insert: {
          assigned_employee_id?: string | null
          business_id: string
          client_id?: string | null
          created_at?: string
          hashtags?: string | null
          id?: string
          image_url?: string | null
          platform?: string
          post_caption?: string | null
          post_date?: string | null
          seo_project_id?: string | null
          status?: string
        }
        Update: {
          assigned_employee_id?: string | null
          business_id?: string
          client_id?: string | null
          created_at?: string
          hashtags?: string | null
          id?: string
          image_url?: string | null
          platform?: string
          post_caption?: string | null
          post_date?: string | null
          seo_project_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_media_tasks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_media_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_media_tasks_seo_project_id_fkey"
            columns: ["seo_project_id"]
            isOneToOne: false
            referencedRelation: "seo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_customers: {
        Row: {
          business_id: string
          created_at: string | null
          customer_id: string
          email: string | null
          id: string
          name: string
          phone: string | null
          role: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          customer_id: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          role?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          customer_id?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_customers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "tenant_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_metrics_daily: {
        Row: {
          arr: number
          business_id: string
          churned_mrr: number
          contraction_mrr: number
          created_at: string
          date: string
          expansion_mrr: number
          id: string
          mrr: number
          net_mrr_change: number
          new_mrr: number
        }
        Insert: {
          arr?: number
          business_id: string
          churned_mrr?: number
          contraction_mrr?: number
          created_at?: string
          date: string
          expansion_mrr?: number
          id?: string
          mrr?: number
          net_mrr_change?: number
          new_mrr?: number
        }
        Update: {
          arr?: number
          business_id?: string
          churned_mrr?: number
          contraction_mrr?: number
          created_at?: string
          date?: string
          expansion_mrr?: number
          id?: string
          mrr?: number
          net_mrr_change?: number
          new_mrr?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscription_metrics_daily_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
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
      subscriptions: {
        Row: {
          billing_cycle: string
          business_id: string
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          business_id: string
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          business_id?: string
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "saas_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          ai_summary: string | null
          ai_tags: string[] | null
          assigned_to_user_id: string | null
          auto_reply_sent: boolean | null
          business_id: string
          category: string
          channel: string | null
          client_id: string | null
          client_match_status: string
          closed_at: string | null
          company_account_id: string | null
          created_at: string
          created_by_user_id: string
          csat_score: number | null
          department: string | null
          description: string | null
          email_from: string | null
          email_thread_id: string | null
          email_to: string | null
          escalated_at: string | null
          first_response_at: string | null
          id: string
          in_reply_to: string | null
          linked_at: string | null
          linked_by_user_id: string | null
          message_id: string | null
          original_html: string | null
          priority: string
          resolved_at: string | null
          sender_email: string | null
          sender_name: string | null
          sentiment: string | null
          sla_due_at: string | null
          source_type: string
          status: string
          subject: string
          suggested_client_ids: string[] | null
          ticket_number: string
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          ai_tags?: string[] | null
          assigned_to_user_id?: string | null
          auto_reply_sent?: boolean | null
          business_id: string
          category?: string
          channel?: string | null
          client_id?: string | null
          client_match_status?: string
          closed_at?: string | null
          company_account_id?: string | null
          created_at?: string
          created_by_user_id: string
          csat_score?: number | null
          department?: string | null
          description?: string | null
          email_from?: string | null
          email_thread_id?: string | null
          email_to?: string | null
          escalated_at?: string | null
          first_response_at?: string | null
          id?: string
          in_reply_to?: string | null
          linked_at?: string | null
          linked_by_user_id?: string | null
          message_id?: string | null
          original_html?: string | null
          priority?: string
          resolved_at?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sentiment?: string | null
          sla_due_at?: string | null
          source_type?: string
          status?: string
          subject: string
          suggested_client_ids?: string[] | null
          ticket_number?: string
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          ai_tags?: string[] | null
          assigned_to_user_id?: string | null
          auto_reply_sent?: boolean | null
          business_id?: string
          category?: string
          channel?: string | null
          client_id?: string | null
          client_match_status?: string
          closed_at?: string | null
          company_account_id?: string | null
          created_at?: string
          created_by_user_id?: string
          csat_score?: number | null
          department?: string | null
          description?: string | null
          email_from?: string | null
          email_thread_id?: string | null
          email_to?: string | null
          escalated_at?: string | null
          first_response_at?: string | null
          id?: string
          in_reply_to?: string | null
          linked_at?: string | null
          linked_by_user_id?: string | null
          message_id?: string | null
          original_html?: string | null
          priority?: string
          resolved_at?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sentiment?: string | null
          sla_due_at?: string | null
          source_type?: string
          status?: string
          subject?: string
          suggested_client_ids?: string[] | null
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_company_account_id_fkey"
            columns: ["company_account_id"]
            isOneToOne: false
            referencedRelation: "company_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          business_id: string
          comment: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          id: string
          score: number | null
          survey_id: string | null
          ticket_id: string | null
        }
        Insert: {
          business_id: string
          comment?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          score?: number | null
          survey_id?: string | null
          ticket_id?: string | null
        }
        Update: {
          business_id?: string
          comment?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          score?: number | null
          survey_id?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "satisfaction_surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
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
      system_health_checks: {
        Row: {
          error_message: string | null
          id: string
          last_checked_at: string
          latency_ms: number | null
          service_name: string
          status: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          last_checked_at?: string
          latency_ms?: number | null
          service_name: string
          status?: string
        }
        Update: {
          error_message?: string | null
          id?: string
          last_checked_at?: string
          latency_ms?: number | null
          service_name?: string
          status?: string
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          business_id: string
          content: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          business_id: string
          content: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          business_id?: string
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_conversations: {
        Row: {
          business_id: string
          conversation_type: string
          created_at: string | null
          id: string
          message: string
          sender_name: string | null
          sender_user_id: string
          task_id: string
        }
        Insert: {
          business_id: string
          conversation_type?: string
          created_at?: string | null
          id?: string
          message: string
          sender_name?: string | null
          sender_user_id: string
          task_id: string
        }
        Update: {
          business_id?: string
          conversation_type?: string
          created_at?: string | null
          id?: string
          message?: string
          sender_name?: string | null
          sender_user_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_conversations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          business_id: string
          created_at: string | null
          depends_on_task_id: string
          id: string
          task_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          depends_on_task_id: string
          id?: string
          task_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          depends_on_task_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_customers: {
        Row: {
          address_json: Json | null
          business_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          tags: string[] | null
        }
        Insert: {
          address_json?: Json | null
          business_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          tags?: string[] | null
        }
        Update: {
          address_json?: Json | null
          business_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
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
      tenant_websites: {
        Row: {
          api_key_hash: string | null
          api_key_last4: string | null
          api_key_plain: string | null
          approved_at: string | null
          approved_by: string | null
          business_id: string
          call_allowed_end_time: string | null
          call_allowed_start_time: string | null
          created_at: string
          created_by: string | null
          default_lead_owner_employee_id: string | null
          domain: string
          id: string
          status: string
          timezone: string | null
          updated_at: string
          website_name: string
        }
        Insert: {
          api_key_hash?: string | null
          api_key_last4?: string | null
          api_key_plain?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_id: string
          call_allowed_end_time?: string | null
          call_allowed_start_time?: string | null
          created_at?: string
          created_by?: string | null
          default_lead_owner_employee_id?: string | null
          domain: string
          id?: string
          status?: string
          timezone?: string | null
          updated_at?: string
          website_name: string
        }
        Update: {
          api_key_hash?: string | null
          api_key_last4?: string | null
          api_key_plain?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_id?: string
          call_allowed_end_time?: string | null
          call_allowed_start_time?: string | null
          created_at?: string
          created_by?: string | null
          default_lead_owner_employee_id?: string | null
          domain?: string
          id?: string
          status?: string
          timezone?: string | null
          updated_at?: string
          website_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_websites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_settings: {
        Row: {
          accent_color: string
          business_id: string
          created_at: string
          id: string
          mode: string
          primary_color: string
          secondary_color: string
          theme_name: string
        }
        Insert: {
          accent_color?: string
          business_id: string
          created_at?: string
          id?: string
          mode?: string
          primary_color?: string
          secondary_color?: string
          theme_name?: string
        }
        Update: {
          accent_color?: string
          business_id?: string
          created_at?: string
          id?: string
          mode?: string
          primary_color?: string
          secondary_color?: string
          theme_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "theme_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_attachments: {
        Row: {
          business_id: string
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          message_id: string | null
          storage_path: string
          ticket_id: string
          uploaded_by_user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          message_id?: string | null
          storage_path: string
          ticket_id: string
          uploaded_by_user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          message_id?: string | null
          storage_path?: string
          ticket_id?: string
          uploaded_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_attachments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ticket_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_audit_log: {
        Row: {
          action_type: string
          business_id: string
          created_at: string
          details: string | null
          id: string
          new_value: string | null
          old_value: string | null
          ticket_id: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action_type: string
          business_id: string
          created_at?: string
          details?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          ticket_id: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action_type?: string
          business_id?: string
          created_at?: string
          details?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          ticket_id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_audit_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_audit_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          is_internal: boolean
          sender_email: string | null
          sender_name: string | null
          source: string | null
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          is_internal?: boolean
          sender_email?: string | null
          sender_name?: string | null
          source?: string | null
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          sender_email?: string | null
          sender_name?: string | null
          source?: string | null
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_email_logs: {
        Row: {
          body_snapshot: string | null
          business_id: string
          direction: string | null
          email_type: string
          id: string
          message_id: string | null
          recipient_email: string | null
          sender_email: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          ticket_id: string
        }
        Insert: {
          body_snapshot?: string | null
          business_id: string
          direction?: string | null
          email_type: string
          id?: string
          message_id?: string | null
          recipient_email?: string | null
          sender_email?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          ticket_id: string
        }
        Update: {
          body_snapshot?: string | null
          business_id?: string
          direction?: string | null
          email_type?: string
          id?: string
          message_id?: string | null
          recipient_email?: string | null
          sender_email?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_email_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_email_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          business_id: string
          content: string
          content_html: string | null
          created_at: string
          id: string
          in_reply_to: string | null
          is_internal: boolean | null
          message_id: string | null
          sender_email: string | null
          sender_name: string | null
          sender_type: string
          sender_user_id: string | null
          ticket_id: string
        }
        Insert: {
          business_id: string
          content: string
          content_html?: string | null
          created_at?: string
          id?: string
          in_reply_to?: string | null
          is_internal?: boolean | null
          message_id?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sender_type?: string
          sender_user_id?: string | null
          ticket_id: string
        }
        Update: {
          business_id?: string
          content?: string
          content_html?: string | null
          created_at?: string
          id?: string
          in_reply_to?: string | null
          is_internal?: boolean | null
          message_id?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sender_type?: string
          sender_user_id?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_sla_policies: {
        Row: {
          business_id: string
          created_at: string
          first_response_minutes: number
          id: string
          is_active: boolean | null
          priority: string
          resolution_minutes: number
        }
        Insert: {
          business_id: string
          created_at?: string
          first_response_minutes?: number
          id?: string
          is_active?: boolean | null
          priority: string
          resolution_minutes?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          first_response_minutes?: number
          id?: string
          is_active?: boolean | null
          priority?: string
          resolution_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_sla_policies_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_status_history: {
        Row: {
          business_id: string
          changed_at: string
          changed_by: string | null
          id: string
          new_status: string
          notes: string | null
          old_status: string | null
          ticket_id: string
        }
        Insert: {
          business_id: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status: string
          notes?: string | null
          old_status?: string | null
          ticket_id: string
        }
        Update: {
          business_id?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_status_history_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_status_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_feedback: {
        Row: {
          business_id: string
          created_at: string
          employee_user_id: string
          feedback_text: string | null
          feedback_type: string | null
          id: string
          related_call_id: string | null
          related_ticket_id: string | null
          score: number | null
          trainer_user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          employee_user_id: string
          feedback_text?: string | null
          feedback_type?: string | null
          id?: string
          related_call_id?: string | null
          related_ticket_id?: string | null
          score?: number | null
          trainer_user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          employee_user_id?: string
          feedback_text?: string | null
          feedback_type?: string | null
          id?: string
          related_call_id?: string | null
          related_ticket_id?: string | null
          score?: number | null
          trainer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_feedback_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      upsell_opportunities: {
        Row: {
          account_id: string | null
          assigned_to: string | null
          business_id: string
          client_id: string | null
          contact_id: string | null
          created_at: string
          created_from_contract_id: string | null
          id: string
          notes: string | null
          opportunity_value: number | null
          service_suggested: string | null
          stage: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          assigned_to?: string | null
          business_id: string
          client_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_from_contract_id?: string | null
          id?: string
          notes?: string | null
          opportunity_value?: number | null
          service_suggested?: string | null
          stage?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          assigned_to?: string | null
          business_id?: string
          client_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_from_contract_id?: string | null
          id?: string
          notes?: string | null
          opportunity_value?: number | null
          service_suggested?: string | null
          stage?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "upsell_opportunities_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_opportunities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_opportunities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_opportunities_created_from_contract_id_fkey"
            columns: ["created_from_contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
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
      usage_activity_logs: {
        Row: {
          activity_type: string
          business_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          module: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          business_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          module?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          business_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          module?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_activity_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          business_id: string
          created_at: string
          event_meta_json: Json | null
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          event_meta_json?: Json | null
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          event_meta_json?: Json | null
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_sessions: {
        Row: {
          app_type: string
          business_id: string
          created_at: string
          device_info_json: Json | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          app_type?: string
          business_id: string
          created_at?: string
          device_info_json?: Json | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          app_type?: string
          business_id?: string
          created_at?: string
          device_info_json?: Json | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_sessions_business_id_fkey"
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
      vault_access_logs: {
        Row: {
          accessed_by_user_id: string
          action: string
          created_at: string
          device_info_json: Json | null
          id: string
          ip_address: string | null
          vault_item_id: string
        }
        Insert: {
          accessed_by_user_id: string
          action: string
          created_at?: string
          device_info_json?: Json | null
          id?: string
          ip_address?: string | null
          vault_item_id: string
        }
        Update: {
          accessed_by_user_id?: string
          action?: string
          created_at?: string
          device_info_json?: Json | null
          id?: string
          ip_address?: string | null
          vault_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_access_logs_vault_item_id_fkey"
            columns: ["vault_item_id"]
            isOneToOne: false
            referencedRelation: "vault_items"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_items: {
        Row: {
          business_id: string
          category: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          scope: string
          secret_encrypted: string | null
          title: string
          updated_at: string
          url: string | null
          username: string | null
          visibility_role_min: string
        }
        Insert: {
          business_id: string
          category: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          scope?: string
          secret_encrypted?: string | null
          title: string
          updated_at?: string
          url?: string | null
          username?: string | null
          visibility_role_min?: string
        }
        Update: {
          business_id?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          scope?: string
          secret_encrypted?: string | null
          title?: string
          updated_at?: string
          url?: string | null
          username?: string | null
          visibility_role_min?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_policy_settings: {
        Row: {
          allowed_roles_json: Json | null
          business_id: string
          created_at: string
          id: string
          max_views_per_day: number | null
          require_reauth_on_view: boolean
        }
        Insert: {
          allowed_roles_json?: Json | null
          business_id: string
          created_at?: string
          id?: string
          max_views_per_day?: number | null
          require_reauth_on_view?: boolean
        }
        Update: {
          allowed_roles_json?: Json | null
          business_id?: string
          created_at?: string
          id?: string
          max_views_per_day?: number | null
          require_reauth_on_view?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "vault_policy_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_agent_events: {
        Row: {
          business_id: string
          created_at: string | null
          event_source: string
          event_type: string
          id: string
          payload_json: Json | null
          session_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          event_source?: string
          event_type: string
          id?: string
          payload_json?: Json | null
          session_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          event_source?: string
          event_type?: string
          id?: string
          payload_json?: Json | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_agent_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_agent_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "voice_agent_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_agent_extractions: {
        Row: {
          budget_range: string | null
          business_id: string
          business_name: string | null
          call_outcome: string | null
          call_summary: string | null
          confirmed_followup_date: string | null
          confirmed_followup_time: string | null
          consent_confirmed: boolean | null
          created_at: string | null
          email: string | null
          id: string
          lead_name: string | null
          next_action: string | null
          phone: string | null
          requirement_summary: string | null
          service_interest: string | null
          session_id: string
          timeframe_end: string | null
          timeframe_start: string | null
          timezone: string | null
        }
        Insert: {
          budget_range?: string | null
          business_id: string
          business_name?: string | null
          call_outcome?: string | null
          call_summary?: string | null
          confirmed_followup_date?: string | null
          confirmed_followup_time?: string | null
          consent_confirmed?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          lead_name?: string | null
          next_action?: string | null
          phone?: string | null
          requirement_summary?: string | null
          service_interest?: string | null
          session_id: string
          timeframe_end?: string | null
          timeframe_start?: string | null
          timezone?: string | null
        }
        Update: {
          budget_range?: string | null
          business_id?: string
          business_name?: string | null
          call_outcome?: string | null
          call_summary?: string | null
          confirmed_followup_date?: string | null
          confirmed_followup_time?: string | null
          consent_confirmed?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          lead_name?: string | null
          next_action?: string | null
          phone?: string | null
          requirement_summary?: string | null
          service_interest?: string | null
          session_id?: string
          timeframe_end?: string | null
          timeframe_start?: string | null
          timezone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_agent_extractions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_agent_extractions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "voice_agent_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_agent_policies: {
        Row: {
          business_id: string
          call_timezone: string | null
          call_window_end: string | null
          call_window_start: string | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          max_attempts: number | null
          require_consent: boolean | null
          retry_minutes: number | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          call_timezone?: string | null
          call_window_end?: string | null
          call_window_start?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          max_attempts?: number | null
          require_consent?: boolean | null
          retry_minutes?: number | null
          trigger_type?: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          call_timezone?: string | null
          call_window_end?: string | null
          call_window_start?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          max_attempts?: number | null
          require_consent?: boolean | null
          retry_minutes?: number | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_agent_policies_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_agent_scripts: {
        Row: {
          business_id: string | null
          created_at: string | null
          id: string
          language: string | null
          name: string
          script_json: Json
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          language?: string | null
          name: string
          script_json?: Json
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          language?: string | null
          name?: string
          script_json?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_agent_scripts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_agent_sessions: {
        Row: {
          agent_id: string | null
          agent_version_id: string | null
          ai_summary: string | null
          attempt_number: number | null
          business_id: string
          call_duration_seconds: number | null
          created_at: string | null
          ended_at: string | null
          error_message: string | null
          extracted_json: Json | null
          followup_calendar_event_id: string | null
          id: string
          inquiry_id: string | null
          lead_id: string | null
          plivo_call_uuid: string | null
          recording_url: string | null
          scheduled_call_at: string | null
          started_at: string | null
          status: string
          thread_id: string | null
          transcript_text: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          agent_version_id?: string | null
          ai_summary?: string | null
          attempt_number?: number | null
          business_id: string
          call_duration_seconds?: number | null
          created_at?: string | null
          ended_at?: string | null
          error_message?: string | null
          extracted_json?: Json | null
          followup_calendar_event_id?: string | null
          id?: string
          inquiry_id?: string | null
          lead_id?: string | null
          plivo_call_uuid?: string | null
          recording_url?: string | null
          scheduled_call_at?: string | null
          started_at?: string | null
          status?: string
          thread_id?: string | null
          transcript_text?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          agent_version_id?: string | null
          ai_summary?: string | null
          attempt_number?: number | null
          business_id?: string
          call_duration_seconds?: number | null
          created_at?: string | null
          ended_at?: string | null
          error_message?: string | null
          extracted_json?: Json | null
          followup_calendar_event_id?: string | null
          id?: string
          inquiry_id?: string | null
          lead_id?: string | null
          plivo_call_uuid?: string | null
          recording_url?: string | null
          scheduled_call_at?: string | null
          started_at?: string | null
          status?: string
          thread_id?: string | null
          transcript_text?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_agent_sessions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_agent_sessions_agent_version_id_fkey"
            columns: ["agent_version_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_agent_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_agent_sessions_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "conversation_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_call_jobs: {
        Row: {
          business_id: string
          completed_at: string | null
          created_at: string
          id: string
          inquiry_id: string | null
          outcome_json: Json | null
          scheduled_at: string | null
          status: string
          transcript_url: string | null
        }
        Insert: {
          business_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          inquiry_id?: string | null
          outcome_json?: Json | null
          scheduled_at?: string | null
          status?: string
          transcript_url?: string | null
        }
        Update: {
          business_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          inquiry_id?: string | null
          outcome_json?: Json | null
          scheduled_at?: string | null
          status?: string
          transcript_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_call_jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
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
      webhook_endpoints: {
        Row: {
          api_key_hash: string | null
          business_id: string
          created_at: string | null
          endpoint_type: string
          id: string
          is_active: boolean | null
          name: string
          rate_limit_per_minute: number | null
          signature_secret_encrypted: string | null
        }
        Insert: {
          api_key_hash?: string | null
          business_id: string
          created_at?: string | null
          endpoint_type?: string
          id?: string
          is_active?: boolean | null
          name: string
          rate_limit_per_minute?: number | null
          signature_secret_encrypted?: string | null
        }
        Update: {
          api_key_hash?: string | null
          business_id?: string
          created_at?: string | null
          endpoint_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          rate_limit_per_minute?: number | null
          signature_secret_encrypted?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_endpoints_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          business_id: string
          endpoint_id: string
          error_message: string | null
          event_type: string | null
          external_event_id: string | null
          id: string
          payload_json: Json | null
          processed_at: string | null
          received_at: string | null
          status: string
        }
        Insert: {
          business_id: string
          endpoint_id: string
          error_message?: string | null
          event_type?: string | null
          external_event_id?: string | null
          id?: string
          payload_json?: Json | null
          processed_at?: string | null
          received_at?: string | null
          status?: string
        }
        Update: {
          business_id?: string
          endpoint_id?: string
          error_message?: string | null
          event_type?: string | null
          external_event_id?: string | null
          id?: string
          payload_json?: Json | null
          processed_at?: string | null
          received_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_events_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      website_project_stages: {
        Row: {
          actual_launch_date: string | null
          assigned_team_lead: string | null
          business_id: string
          client_id: string
          created_at: string
          current_stage: string
          id: string
          notes: string | null
          project_name: string
          stage_history: Json
          start_date: string | null
          target_launch_date: string | null
          updated_at: string
          website_id: string | null
        }
        Insert: {
          actual_launch_date?: string | null
          assigned_team_lead?: string | null
          business_id: string
          client_id: string
          created_at?: string
          current_stage?: string
          id?: string
          notes?: string | null
          project_name: string
          stage_history?: Json
          start_date?: string | null
          target_launch_date?: string | null
          updated_at?: string
          website_id?: string | null
        }
        Update: {
          actual_launch_date?: string | null
          assigned_team_lead?: string | null
          business_id?: string
          client_id?: string
          created_at?: string
          current_stage?: string
          id?: string
          notes?: string | null
          project_name?: string
          stage_history?: Json
          start_date?: string | null
          target_launch_date?: string | null
          updated_at?: string
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_project_stages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_project_stages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_project_stages_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "client_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      website_services: {
        Row: {
          business_id: string
          created_at: string
          id: string
          is_active: boolean
          service_category: string | null
          service_description: string | null
          service_name: string
          updated_at: string
          website_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          service_category?: string | null
          service_description?: string | null
          service_name: string
          updated_at?: string
          website_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          service_category?: string | null
          service_description?: string | null
          service_name?: string
          updated_at?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_services_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "tenant_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      white_label_settings: {
        Row: {
          business_id: string
          company_display_name: string | null
          created_at: string
          custom_domain: string | null
          custom_favicon_url: string | null
          custom_logo_url: string | null
          domain_verified: boolean
          email_footer_html: string | null
          hide_platform_branding: boolean
          id: string
          login_page_html: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          company_display_name?: string | null
          created_at?: string
          custom_domain?: string | null
          custom_favicon_url?: string | null
          custom_logo_url?: string | null
          domain_verified?: boolean
          email_footer_html?: string | null
          hide_platform_branding?: boolean
          id?: string
          login_page_html?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          company_display_name?: string | null
          created_at?: string
          custom_domain?: string | null
          custom_favicon_url?: string | null
          custom_logo_url?: string | null
          domain_verified?: boolean
          email_footer_html?: string | null
          hide_platform_branding?: boolean
          id?: string
          login_page_html?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "white_label_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      xero_connections: {
        Row: {
          access_token: string | null
          access_token_encrypted: string | null
          business_id: string
          created_at: string | null
          id: string
          is_connected: boolean | null
          last_sync_at: string | null
          redirect_url: string | null
          refresh_token: string | null
          refresh_token_encrypted: string | null
          token_expires_at: string | null
          updated_at: string | null
          xero_tenant_id: string | null
        }
        Insert: {
          access_token?: string | null
          access_token_encrypted?: string | null
          business_id: string
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          last_sync_at?: string | null
          redirect_url?: string | null
          refresh_token?: string | null
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          xero_tenant_id?: string | null
        }
        Update: {
          access_token?: string | null
          access_token_encrypted?: string | null
          business_id?: string
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          last_sync_at?: string | null
          redirect_url?: string | null
          refresh_token?: string | null
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          xero_tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xero_connections_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      xero_expenses: {
        Row: {
          amount: number
          business_id: string
          category: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          expense_date: string | null
          id: string
          line_items_json: Json | null
          status: string | null
          supplier_name: string | null
          synced_at: string | null
          xero_expense_id: string
        }
        Insert: {
          amount?: number
          business_id: string
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string
          line_items_json?: Json | null
          status?: string | null
          supplier_name?: string | null
          synced_at?: string | null
          xero_expense_id: string
        }
        Update: {
          amount?: number
          business_id?: string
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string
          line_items_json?: Json | null
          status?: string | null
          supplier_name?: string | null
          synced_at?: string | null
          xero_expense_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xero_expenses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      xero_invoices: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          business_id: string
          client_id: string | null
          contact_name: string | null
          created_at: string | null
          currency: string | null
          department_category: string | null
          due_date: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          line_items_json: Json | null
          reference: string | null
          status: string | null
          synced_at: string | null
          total_amount: number | null
          xero_contact_id: string | null
          xero_invoice_id: string
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          business_id: string
          client_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          currency?: string | null
          department_category?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          line_items_json?: Json | null
          reference?: string | null
          status?: string | null
          synced_at?: string | null
          total_amount?: number | null
          xero_contact_id?: string | null
          xero_invoice_id: string
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          business_id?: string
          client_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          currency?: string | null
          department_category?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          line_items_json?: Json | null
          reference?: string | null
          status?: string | null
          synced_at?: string | null
          total_amount?: number | null
          xero_contact_id?: string | null
          xero_invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xero_invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xero_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      xero_payments: {
        Row: {
          business_id: string
          client_id: string | null
          created_at: string | null
          id: string
          invoice_id: string | null
          payment_amount: number | null
          payment_date: string | null
          payment_method: string | null
          synced_at: string | null
          transaction_reference: string | null
          xero_contact_id: string | null
          xero_invoice_id: string | null
          xero_payment_id: string
        }
        Insert: {
          business_id: string
          client_id?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          payment_amount?: number | null
          payment_date?: string | null
          payment_method?: string | null
          synced_at?: string | null
          transaction_reference?: string | null
          xero_contact_id?: string | null
          xero_invoice_id?: string | null
          xero_payment_id: string
        }
        Update: {
          business_id?: string
          client_id?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          payment_amount?: number | null
          payment_date?: string | null
          payment_method?: string | null
          synced_at?: string | null
          transaction_reference?: string | null
          xero_contact_id?: string | null
          xero_invoice_id?: string | null
          xero_payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xero_payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xero_payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xero_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "xero_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      xero_sync_logs: {
        Row: {
          business_id: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          records_synced: number | null
          started_at: string | null
          status: string
          sync_type: string
        }
        Insert: {
          business_id: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          records_synced?: number | null
          started_at?: string | null
          status?: string
          sync_type: string
        }
        Update: {
          business_id?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          records_synced?: number | null
          started_at?: string | null
          status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "xero_sync_logs_business_id_fkey"
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
      find_client_by_email: {
        Args: { _business_id: string; _email: string }
        Returns: string
      }
      get_system_mode: { Args: { _business_id: string }; Returns: string }
      get_user_business_id: { Args: { _user_id: string }; Returns: string }
      handle_business_registration: {
        Args: {
          _address?: string
          _business_name: string
          _city?: string
          _cms_platform?: string
          _competitors?: string[]
          _country?: string
          _domain_name?: string
          _email: string
          _hosting_provider?: string
          _industry?: string
          _owner_name: string
          _phone: string
          _postcode?: string
          _registered_by_user_id?: string
          _registration_method?: string
          _services_offered?: string[]
          _social_facebook?: string
          _social_gbp?: string
          _social_instagram?: string
          _social_linkedin?: string
          _social_youtube?: string
          _state?: string
          _sub_industry?: string
          _subscribed_services?: string[]
          _target_locations?: string[]
          _website_url?: string
        }
        Returns: string
      }
      handle_company_signup: {
        Args: {
          _business_slug: string
          _email: string
          _full_name: string
          _user_id: string
        }
        Returns: string
      }
      handle_full_signup: {
        Args: {
          _address?: string
          _business_name: string
          _city?: string
          _cms_platform?: string
          _competitors?: string[]
          _country?: string
          _domain_name?: string
          _email: string
          _hosting_provider?: string
          _industry?: string
          _owner_name?: string
          _phone?: string
          _postcode?: string
          _services_offered?: string[]
          _social_facebook?: string
          _social_gbp?: string
          _social_instagram?: string
          _social_linkedin?: string
          _social_youtube?: string
          _state?: string
          _sub_industry?: string
          _subscribed_services?: string[]
          _target_locations?: string[]
          _user_id: string
          _website_url?: string
        }
        Returns: string
      }
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
      agent_action_status: "PLANNED" | "EXECUTED" | "SKIPPED" | "FAILED"
      agent_approval_status: "PENDING" | "APPROVED" | "REJECTED"
      agent_mode: "SUGGEST" | "EXECUTE" | "HYBRID"
      agent_run_status:
        | "QUEUED"
        | "RUNNING"
        | "NEEDS_APPROVAL"
        | "COMPLETED"
        | "FAILED"
        | "CANCELED"
      agent_type: "SALES" | "MARKETING" | "SUPPORT" | "FINANCE"
      app_role:
        | "super_admin"
        | "business_admin"
        | "manager"
        | "employee"
        | "client"
        | "hr_manager"
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
      client_user_role: "owner" | "marketing_manager" | "viewer"
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
      guardrail_enforcement: "BLOCK" | "REQUIRE_APPROVAL" | "WARN"
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
      lead_assignment_mode:
        | "round_robin"
        | "territory"
        | "priority"
        | "ai_score"
        | "manual"
      lead_source:
        | "inquiry"
        | "cold_call"
        | "referral"
        | "manual"
        | "other"
        | "website_form"
      lead_stage:
        | "new"
        | "contacted"
        | "meeting_booked"
        | "proposal_requested"
        | "negotiation"
        | "conversion_requested"
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
      risk_level: "LOW" | "MEDIUM" | "HIGH"
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
      agent_action_status: ["PLANNED", "EXECUTED", "SKIPPED", "FAILED"],
      agent_approval_status: ["PENDING", "APPROVED", "REJECTED"],
      agent_mode: ["SUGGEST", "EXECUTE", "HYBRID"],
      agent_run_status: [
        "QUEUED",
        "RUNNING",
        "NEEDS_APPROVAL",
        "COMPLETED",
        "FAILED",
        "CANCELED",
      ],
      agent_type: ["SALES", "MARKETING", "SUPPORT", "FINANCE"],
      app_role: [
        "super_admin",
        "business_admin",
        "manager",
        "employee",
        "client",
        "hr_manager",
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
      client_user_role: ["owner", "marketing_manager", "viewer"],
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
      guardrail_enforcement: ["BLOCK", "REQUIRE_APPROVAL", "WARN"],
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
      lead_assignment_mode: [
        "round_robin",
        "territory",
        "priority",
        "ai_score",
        "manual",
      ],
      lead_source: [
        "inquiry",
        "cold_call",
        "referral",
        "manual",
        "other",
        "website_form",
      ],
      lead_stage: [
        "new",
        "contacted",
        "meeting_booked",
        "proposal_requested",
        "negotiation",
        "conversion_requested",
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
      risk_level: ["LOW", "MEDIUM", "HIGH"],
    },
  },
} as const
