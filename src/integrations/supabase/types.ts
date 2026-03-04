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
          business_id: string
          created_at: string
          created_by_user_id: string | null
          description: string | null
          id: string
          job_title: string
          scheduled_end_at: string | null
          scheduled_start_at: string | null
          status: string
          tenant_customer_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          job_title: string
          scheduled_end_at?: string | null
          scheduled_start_at?: string | null
          status?: string
          tenant_customer_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          job_title?: string
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
          ai_priority: string | null
          ai_recommended_action: string | null
          ai_score: number | null
          assigned_to_user_id: string | null
          business_id: string
          business_name: string | null
          created_at: string
          email: string
          estimated_budget: number | null
          fbclid: string | null
          gclid: string | null
          id: string
          inquiry_id: string | null
          landing_page_url: string | null
          last_contacted_at: string | null
          name: string
          next_follow_up_at: string | null
          notes: string | null
          phone: string | null
          referrer_url: string | null
          services_needed: string | null
          source: Database["public"]["Enums"]["lead_source"]
          stage: Database["public"]["Enums"]["lead_stage"]
          status: Database["public"]["Enums"]["lead_status"]
          suburb: string | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
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
          fbclid?: string | null
          gclid?: string | null
          id?: string
          inquiry_id?: string | null
          landing_page_url?: string | null
          last_contacted_at?: string | null
          name: string
          next_follow_up_at?: string | null
          notes?: string | null
          phone?: string | null
          referrer_url?: string | null
          services_needed?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          stage?: Database["public"]["Enums"]["lead_stage"]
          status?: Database["public"]["Enums"]["lead_status"]
          suburb?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
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
          fbclid?: string | null
          gclid?: string | null
          id?: string
          inquiry_id?: string | null
          landing_page_url?: string | null
          last_contacted_at?: string | null
          name?: string
          next_follow_up_at?: string | null
          notes?: string | null
          phone?: string | null
          referrer_url?: string | null
          services_needed?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          stage?: Database["public"]["Enums"]["lead_stage"]
          status?: Database["public"]["Enums"]["lead_status"]
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
      review_requests: {
        Row: {
          business_id: string
          created_at: string
          id: string
          job_id: string | null
          sent_at: string
          status: string
          tenant_customer_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          job_id?: string | null
          sent_at?: string
          status?: string
          tenant_customer_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          job_id?: string | null
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
        ]
      }
      seo_keywords: {
        Row: {
          business_id: string
          campaign_id: string
          created_at: string
          current_ranking: number | null
          id: string
          keyword: string
          keyword_type: string
          location: string | null
          previous_ranking: number | null
          priority: string
          status: string
          target_url: string | null
        }
        Insert: {
          business_id: string
          campaign_id: string
          created_at?: string
          current_ranking?: number | null
          id?: string
          keyword: string
          keyword_type?: string
          location?: string | null
          previous_ranking?: number | null
          priority?: string
          status?: string
          target_url?: string | null
        }
        Update: {
          business_id?: string
          campaign_id?: string
          created_at?: string
          current_ranking?: number | null
          id?: string
          keyword?: string
          keyword_type?: string
          location?: string | null
          previous_ranking?: number | null
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
          anchor_text: string | null
          business_id: string
          campaign_id: string
          created_at: string
          da_score: number | null
          follow_type: string
          id: string
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
      risk_level: ["LOW", "MEDIUM", "HIGH"],
    },
  },
} as const
