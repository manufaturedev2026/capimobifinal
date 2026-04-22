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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_managers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ad_requests: {
        Row: {
          created_at: string
          daily_budget: number
          details: string | null
          duration_days: number
          id: string
          item_id: string | null
          platform: string
          seller_id: string
          service_fee: number
          status: string
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_budget: number
          details?: string | null
          duration_days: number
          id?: string
          item_id?: string | null
          platform: string
          seller_id: string
          service_fee?: number
          status?: string
          subtotal: number
          tax_amount?: number
          total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_budget?: number
          details?: string | null
          duration_days?: number
          id?: string
          item_id?: string | null
          platform?: string
          seller_id?: string
          service_fee?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_requests_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "seller_items"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_bots: {
        Row: {
          attendant_avatar: string | null
          attendant_name: string
          created_at: string
          id: string
          is_active: boolean
          item_id: string | null
          min_interval_minutes: number
          name: string
          opening_message: string | null
          seller_id: string
          slug: string
          success_cta_label: string
          success_cta_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attendant_avatar?: string | null
          attendant_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          item_id?: string | null
          min_interval_minutes?: number
          name?: string
          opening_message?: string | null
          seller_id: string
          slug: string
          success_cta_label?: string
          success_cta_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attendant_avatar?: string | null
          attendant_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          item_id?: string | null
          min_interval_minutes?: number
          name?: string
          opening_message?: string | null
          seller_id?: string
          slug?: string
          success_cta_label?: string
          success_cta_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_bots_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "seller_items"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_credit_transactions: {
        Row: {
          amount: number
          created_at: string
          external_reference: string | null
          id: string
          metadata: Json
          notes: string | null
          seller_id: string | null
          status: string
          tool_key: string
          transaction_type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          external_reference?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          seller_id?: string | null
          status?: string
          tool_key: string
          transaction_type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          external_reference?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          seller_id?: string | null
          status?: string
          tool_key?: string
          transaction_type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_credit_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "ai_credit_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_credit_wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          last_monthly_reset_at: string | null
          monthly_plan_credits: number
          seller_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          last_monthly_reset_at?: string | null
          monthly_plan_credits?: number
          seller_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          last_monthly_reset_at?: string | null
          monthly_plan_credits?: number
          seller_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_text_generations_log: {
        Row: {
          action: string
          created_at: string
          id: string
          seller_id: string
          user_id: string
        }
        Insert: {
          action?: string
          created_at?: string
          id?: string
          seller_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          seller_id?: string
          user_id?: string
        }
        Relationships: []
      }
      apify_search_runs: {
        Row: {
          actor_id: string | null
          apify_run_id: string | null
          cidade: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          estado: string | null
          finished_at: string | null
          id: string
          palavra_chave: string | null
          quantidade_duplicada: number
          quantidade_importada: number
          quantidade_retornada: number
          quantidade_solicitada: number
          status: string
          tipo_lead: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          apify_run_id?: string | null
          cidade?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          estado?: string | null
          finished_at?: string | null
          id?: string
          palavra_chave?: string | null
          quantidade_duplicada?: number
          quantidade_importada?: number
          quantidade_retornada?: number
          quantidade_solicitada?: number
          status?: string
          tipo_lead?: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          apify_run_id?: string | null
          cidade?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          estado?: string | null
          finished_at?: string | null
          id?: string
          palavra_chave?: string | null
          quantidade_duplicada?: number
          quantidade_importada?: number
          quantidade_retornada?: number
          quantidade_solicitada?: number
          status?: string
          tipo_lead?: string
          user_id?: string
        }
        Relationships: []
      }
      broadcast_sends: {
        Row: {
          batch_id: string
          error_message: string | null
          id: string
          profile_id: string | null
          sent_at: string
          status: string
          subject: string
          tier_filter: string | null
          to_email: string
        }
        Insert: {
          batch_id: string
          error_message?: string | null
          id?: string
          profile_id?: string | null
          sent_at?: string
          status?: string
          subject: string
          tier_filter?: string | null
          to_email: string
        }
        Update: {
          batch_id?: string
          error_message?: string | null
          id?: string
          profile_id?: string | null
          sent_at?: string
          status?: string
          subject?: string
          tier_filter?: string | null
          to_email?: string
        }
        Relationships: []
      }
      broadcast_templates: {
        Row: {
          content_html: string
          created_at: string
          id: string
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          content_html: string
          created_at?: string
          id?: string
          name: string
          subject: string
          updated_at?: string
        }
        Update: {
          content_html?: string
          created_at?: string
          id?: string
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      capture_bots: {
        Row: {
          attendant_avatar: string | null
          attendant_name: string
          bot_type: string
          created_at: string
          form_messages: Json | null
          id: string
          is_active: boolean
          name: string
          opening_message: string | null
          seller_id: string
          slug: string
          success_cta_label: string
          success_cta_url: string | null
          updated_at: string
          use_ai: boolean
          user_id: string
          whatsapp_group_url: string | null
        }
        Insert: {
          attendant_avatar?: string | null
          attendant_name?: string
          bot_type?: string
          created_at?: string
          form_messages?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          opening_message?: string | null
          seller_id: string
          slug: string
          success_cta_label?: string
          success_cta_url?: string | null
          updated_at?: string
          use_ai?: boolean
          user_id: string
          whatsapp_group_url?: string | null
        }
        Update: {
          attendant_avatar?: string | null
          attendant_name?: string
          bot_type?: string
          created_at?: string
          form_messages?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          opening_message?: string | null
          seller_id?: string
          slug?: string
          success_cta_label?: string
          success_cta_url?: string | null
          updated_at?: string
          use_ai?: boolean
          user_id?: string
          whatsapp_group_url?: string | null
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount: number
          created_at: string
          id: string
          referred_id: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          referred_id: string
          status?: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          referred_id?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_activity_log: {
        Row: {
          action_type: string
          contact_id: string
          created_at: string
          description: string
          id: string
          new_value: string | null
          old_value: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          contact_id: string
          created_at?: string
          description: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          contact_id?: string
          created_at?: string
          description?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string
        }
        Relationships: []
      }
      crm_contacts: {
        Row: {
          created_at: string
          email: string
          full_name: string
          funnel_stage: string
          id: string
          last_contacted_at: string | null
          notes: string | null
          phone: string | null
          profile_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          funnel_stage?: string
          id?: string
          last_contacted_at?: string | null
          notes?: string | null
          phone?: string | null
          profile_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          funnel_stage?: string
          id?: string
          last_contacted_at?: string | null
          notes?: string | null
          phone?: string | null
          profile_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_funnel_stages: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      crm_templates: {
        Row: {
          created_at: string
          id: string
          message: string
          name: string
          sort_order: number
          stage: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          name: string
          sort_order?: number
          stage: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          name?: string
          sort_order?: number
          stage?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          context: string | null
          created_at: string
          error_message: string | null
          id: string
          message: string | null
          status: string
          subject: string
          to_email: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string | null
          status?: string
          subject: string
          to_email: string
        }
        Update: {
          context?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string | null
          status?: string
          subject?: string
          to_email?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "seller_items"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_excluded_emails: {
        Row: {
          created_at: string
          email: string
          excluded_by: string | null
          id: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          email: string
          excluded_by?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          excluded_by?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      funnel_sends: {
        Row: {
          day_offset: number
          error_message: string | null
          id: string
          profile_id: string
          sent_at: string
          status: string
          step_id: string
          to_email: string
          user_id: string
        }
        Insert: {
          day_offset: number
          error_message?: string | null
          id?: string
          profile_id: string
          sent_at?: string
          status?: string
          step_id: string
          to_email: string
          user_id: string
        }
        Update: {
          day_offset?: number
          error_message?: string | null
          id?: string
          profile_id?: string
          sent_at?: string
          status?: string
          step_id?: string
          to_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_sends_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "funnel_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_steps: {
        Row: {
          content_html: string
          created_at: string
          day_offset: number
          id: string
          is_active: boolean
          subject: string
          updated_at: string
        }
        Insert: {
          content_html: string
          created_at?: string
          day_offset: number
          id?: string
          is_active?: boolean
          subject: string
          updated_at?: string
        }
        Update: {
          content_html?: string
          created_at?: string
          day_offset?: number
          id?: string
          is_active?: boolean
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      generated_contracts: {
        Row: {
          content: string
          created_at: string
          id: string
          seller_id: string
          signature_locador: string | null
          signature_locatario: string | null
          template_type: string
          title: string
          updated_at: string
          user_id: string
          variables: Json | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          seller_id: string
          signature_locador?: string | null
          signature_locatario?: string | null
          template_type: string
          title: string
          updated_at?: string
          user_id: string
          variables?: Json | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          seller_id?: string
          signature_locador?: string | null
          signature_locatario?: string | null
          template_type?: string
          title?: string
          updated_at?: string
          user_id?: string
          variables?: Json | null
        }
        Relationships: []
      }
      invite_funnel_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          referrer: string | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          referrer?: string | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      lead_campaign_sends: {
        Row: {
          campaign_id: string
          error_message: string | null
          id: string
          lead_id: string | null
          sent_at: string
          status: string
          to_email: string
        }
        Insert: {
          campaign_id: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          sent_at?: string
          status?: string
          to_email: string
        }
        Update: {
          campaign_id?: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          sent_at?: string
          status?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_campaign_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "lead_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_campaign_sends_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_imobiliarios"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_campaigns: {
        Row: {
          content_html: string
          created_at: string
          failed_count: number
          finished_at: string | null
          id: string
          name: string
          scheduled_for: string | null
          segment_filter: Json | null
          sent_count: number
          started_at: string | null
          status: string
          subject: string
          total_recipients: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content_html: string
          created_at?: string
          failed_count?: number
          finished_at?: string | null
          id?: string
          name: string
          scheduled_for?: string | null
          segment_filter?: Json | null
          sent_count?: number
          started_at?: string | null
          status?: string
          subject: string
          total_recipients?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content_html?: string
          created_at?: string
          failed_count?: number
          finished_at?: string | null
          id?: string
          name?: string
          scheduled_for?: string | null
          segment_filter?: Json | null
          sent_count?: number
          started_at?: string | null
          status?: string
          subject?: string
          total_recipients?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads_imobiliarios: {
        Row: {
          apify_run_id: string | null
          cep: string | null
          cidade: string | null
          created_at: string
          data_captacao: string
          email: string | null
          empresa: string | null
          endereco: string | null
          estado: string | null
          google_place_id: string | null
          id: string
          instagram: string | null
          nome: string
          observacoes: string | null
          origem: string
          rating: number | null
          raw_data: Json | null
          reviews_count: number | null
          site: string | null
          status: string
          telefone: string | null
          tipo_lead: string
          ultima_atualizacao: string
          whatsapp: string | null
        }
        Insert: {
          apify_run_id?: string | null
          cep?: string | null
          cidade?: string | null
          created_at?: string
          data_captacao?: string
          email?: string | null
          empresa?: string | null
          endereco?: string | null
          estado?: string | null
          google_place_id?: string | null
          id?: string
          instagram?: string | null
          nome: string
          observacoes?: string | null
          origem?: string
          rating?: number | null
          raw_data?: Json | null
          reviews_count?: number | null
          site?: string | null
          status?: string
          telefone?: string | null
          tipo_lead?: string
          ultima_atualizacao?: string
          whatsapp?: string | null
        }
        Update: {
          apify_run_id?: string | null
          cep?: string | null
          cidade?: string | null
          created_at?: string
          data_captacao?: string
          email?: string | null
          empresa?: string | null
          endereco?: string | null
          estado?: string | null
          google_place_id?: string | null
          id?: string
          instagram?: string | null
          nome?: string
          observacoes?: string | null
          origem?: string
          rating?: number | null
          raw_data?: Json | null
          reviews_count?: number | null
          site?: string | null
          status?: string
          telefone?: string | null
          tipo_lead?: string
          ultima_atualizacao?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      measured_properties: {
        Row: {
          address: string | null
          asking_price: number | null
          bathrooms: number | null
          bedrooms: number | null
          cep: string | null
          city: string
          complement: string | null
          condominium_fee: number | null
          created_at: string
          external_area_manual: number | null
          external_base: number | null
          external_height: number | null
          external_length: number | null
          external_shape: string | null
          external_side_a: number | null
          external_side_b: number | null
          external_width: number | null
          id: string
          iptu: number | null
          land_area_manual: number | null
          land_length: number | null
          land_width: number | null
          measured_by: string | null
          measurement_mode: string
          name: string
          neighborhood: string
          notes: string | null
          number: string | null
          parking_spaces: number | null
          property_type: string
          reference_point: string | null
          state: string | null
          street: string | null
          total_area: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          asking_price?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          cep?: string | null
          city: string
          complement?: string | null
          condominium_fee?: number | null
          created_at?: string
          external_area_manual?: number | null
          external_base?: number | null
          external_height?: number | null
          external_length?: number | null
          external_shape?: string | null
          external_side_a?: number | null
          external_side_b?: number | null
          external_width?: number | null
          id?: string
          iptu?: number | null
          land_area_manual?: number | null
          land_length?: number | null
          land_width?: number | null
          measured_by?: string | null
          measurement_mode?: string
          name: string
          neighborhood: string
          notes?: string | null
          number?: string | null
          parking_spaces?: number | null
          property_type?: string
          reference_point?: string | null
          state?: string | null
          street?: string | null
          total_area?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          asking_price?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          cep?: string | null
          city?: string
          complement?: string | null
          condominium_fee?: number | null
          created_at?: string
          external_area_manual?: number | null
          external_base?: number | null
          external_height?: number | null
          external_length?: number | null
          external_shape?: string | null
          external_side_a?: number | null
          external_side_b?: number | null
          external_width?: number | null
          id?: string
          iptu?: number | null
          land_area_manual?: number | null
          land_length?: number | null
          land_width?: number | null
          measured_by?: string | null
          measurement_mode?: string
          name?: string
          neighborhood?: string
          notes?: string | null
          number?: string | null
          parking_spaces?: number | null
          property_type?: string
          reference_point?: string | null
          state?: string | null
          street?: string | null
          total_area?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      measured_property_photos: {
        Row: {
          category: string
          created_at: string
          id: string
          image_url: string
          property_id: string
          room_id: string | null
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          image_url: string
          property_id: string
          room_id?: string | null
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string
          property_id?: string
          room_id?: string | null
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "measured_property_photos_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "measured_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measured_property_photos_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "measured_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      measured_rooms: {
        Row: {
          area: number
          area_type: string
          base: number | null
          created_at: string
          height: number | null
          id: string
          length: number | null
          name: string
          notes: string | null
          property_id: string
          room_type: string
          shape: string
          side_a: number | null
          side_b: number | null
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          area?: number
          area_type?: string
          base?: number | null
          created_at?: string
          height?: number | null
          id?: string
          length?: number | null
          name: string
          notes?: string | null
          property_id: string
          room_type: string
          shape?: string
          side_a?: number | null
          side_b?: number | null
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          area?: number
          area_type?: string
          base?: number | null
          created_at?: string
          height?: number | null
          id?: string
          length?: number | null
          name?: string
          notes?: string | null
          property_id?: string
          room_type?: string
          shape?: string
          side_a?: number | null
          side_b?: number | null
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "measured_rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "measured_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_store_listings: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          item_id: string
          partner_profile_id: string
          partner_user_id: string
          partnership_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          item_id: string
          partner_profile_id: string
          partner_user_id: string
          partnership_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          item_id?: string
          partner_profile_id?: string
          partner_user_id?: string
          partnership_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_store_listings_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "property_partnerships"
            referencedColumns: ["id"]
          },
        ]
      }
      partnership_requests: {
        Row: {
          agency_profile_id: string
          agency_user_id: string
          created_at: string
          id: string
          message: string | null
          requester_profile_id: string
          requester_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          agency_profile_id: string
          agency_user_id: string
          created_at?: string
          id?: string
          message?: string | null
          requester_profile_id: string
          requester_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          agency_profile_id?: string
          agency_user_id?: string
          created_at?: string
          id?: string
          message?: string | null
          requester_profile_id?: string
          requester_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partnership_requests_agency_profile_id_fkey"
            columns: ["agency_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partnership_requests_requester_profile_id_fkey"
            columns: ["requester_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_manager: string | null
          address: string | null
          bio: string | null
          capture_video_title: string | null
          capture_video_url: string | null
          cep: string | null
          city: string | null
          cnpj: string | null
          company_name: string | null
          cover_color: string | null
          created_at: string
          creci: string | null
          destaque_item_ids: string[] | null
          email: string
          featured_item_id: string | null
          full_name: string
          hero_item_ids: string[] | null
          id: string
          instagram: string | null
          item_order: string[] | null
          logo_url: string | null
          manager_phone: string | null
          manager_photo: string | null
          must_change_password: boolean
          open_for_partnerships: boolean
          phone: string | null
          professional_title: string | null
          referral_balance: number
          referral_code: string | null
          referral_total_earned: number
          referred_by: string | null
          seller_category: Database["public"]["Enums"]["seller_category"] | null
          seller_type: Database["public"]["Enums"]["seller_type"]
          show_floating_whatsapp: boolean
          show_location: boolean
          slug: string | null
          state: string | null
          store_layout: string | null
          store_theme: string | null
          store_video_button_text: string | null
          store_video_button_url: string | null
          store_video_description: string | null
          store_video_property_label: string | null
          store_video_title: string | null
          store_video_url: string | null
          updated_at: string
          user_id: string
          video_description: string | null
          video_title: string | null
          video_url: string | null
          whatsapp_mode: string
        }
        Insert: {
          account_manager?: string | null
          address?: string | null
          bio?: string | null
          capture_video_title?: string | null
          capture_video_url?: string | null
          cep?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string | null
          cover_color?: string | null
          created_at?: string
          creci?: string | null
          destaque_item_ids?: string[] | null
          email: string
          featured_item_id?: string | null
          full_name: string
          hero_item_ids?: string[] | null
          id?: string
          instagram?: string | null
          item_order?: string[] | null
          logo_url?: string | null
          manager_phone?: string | null
          manager_photo?: string | null
          must_change_password?: boolean
          open_for_partnerships?: boolean
          phone?: string | null
          professional_title?: string | null
          referral_balance?: number
          referral_code?: string | null
          referral_total_earned?: number
          referred_by?: string | null
          seller_category?:
            | Database["public"]["Enums"]["seller_category"]
            | null
          seller_type?: Database["public"]["Enums"]["seller_type"]
          show_floating_whatsapp?: boolean
          show_location?: boolean
          slug?: string | null
          state?: string | null
          store_layout?: string | null
          store_theme?: string | null
          store_video_button_text?: string | null
          store_video_button_url?: string | null
          store_video_description?: string | null
          store_video_property_label?: string | null
          store_video_title?: string | null
          store_video_url?: string | null
          updated_at?: string
          user_id: string
          video_description?: string | null
          video_title?: string | null
          video_url?: string | null
          whatsapp_mode?: string
        }
        Update: {
          account_manager?: string | null
          address?: string | null
          bio?: string | null
          capture_video_title?: string | null
          capture_video_url?: string | null
          cep?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string | null
          cover_color?: string | null
          created_at?: string
          creci?: string | null
          destaque_item_ids?: string[] | null
          email?: string
          featured_item_id?: string | null
          full_name?: string
          hero_item_ids?: string[] | null
          id?: string
          instagram?: string | null
          item_order?: string[] | null
          logo_url?: string | null
          manager_phone?: string | null
          manager_photo?: string | null
          must_change_password?: boolean
          open_for_partnerships?: boolean
          phone?: string | null
          professional_title?: string | null
          referral_balance?: number
          referral_code?: string | null
          referral_total_earned?: number
          referred_by?: string | null
          seller_category?:
            | Database["public"]["Enums"]["seller_category"]
            | null
          seller_type?: Database["public"]["Enums"]["seller_type"]
          show_floating_whatsapp?: boolean
          show_location?: boolean
          slug?: string | null
          state?: string | null
          store_layout?: string | null
          store_theme?: string | null
          store_video_button_text?: string | null
          store_video_button_url?: string | null
          store_video_description?: string | null
          store_video_property_label?: string | null
          store_video_title?: string | null
          store_video_url?: string | null
          updated_at?: string
          user_id?: string
          video_description?: string | null
          video_title?: string | null
          video_url?: string | null
          whatsapp_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_featured_item_id_fkey"
            columns: ["featured_item_id"]
            isOneToOne: false
            referencedRelation: "seller_items"
            referencedColumns: ["id"]
          },
        ]
      }
      property_capture_leads: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          desired_price: number | null
          full_name: string
          id: string
          notes: string | null
          phone: string
          photos: string[] | null
          property_type: string
          seller_id: string
          seller_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          desired_price?: number | null
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          photos?: string[] | null
          property_type?: string
          seller_id: string
          seller_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          desired_price?: number | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          photos?: string[] | null
          property_type?: string
          seller_id?: string
          seller_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      property_captures: {
        Row: {
          broker_id: string
          broker_user_id: string
          captured_at: string
          created_at: string
          id: string
          item_id: string
          notes: string | null
          status: Database["public"]["Enums"]["capture_status"]
          updated_at: string
        }
        Insert: {
          broker_id: string
          broker_user_id: string
          captured_at?: string
          created_at?: string
          id?: string
          item_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["capture_status"]
          updated_at?: string
        }
        Update: {
          broker_id?: string
          broker_user_id?: string
          captured_at?: string
          created_at?: string
          id?: string
          item_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["capture_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_captures_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_captures_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "seller_items"
            referencedColumns: ["id"]
          },
        ]
      }
      property_partnerships: {
        Row: {
          created_at: string
          id: string
          item_id: string
          message: string | null
          owner_user_id: string
          requester_profile_id: string
          requester_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          message?: string | null
          owner_user_id: string
          requester_profile_id: string
          requester_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          message?: string | null
          owner_user_id?: string
          requester_profile_id?: string
          requester_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_partnerships_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "seller_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_partnerships_requester_profile_id_fkey"
            columns: ["requester_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_valuations: {
        Row: {
          acabamento: string | null
          ajuste_total_pct: number | null
          aluguel_estimado: number | null
          area_coberta_externa: number | null
          area_construida: number | null
          area_construida_superior: number | null
          area_construida_terreo: number | null
          area_risco: boolean | null
          area_servico: boolean | null
          area_terreno: number | null
          area_total: number | null
          area_util: number | null
          bairro: string
          banheiro_qualidade: string | null
          banheiros: number | null
          breakdown: Json | null
          cep: string | null
          cidade: string
          closet: boolean | null
          comparaveis: Json | null
          conservacao: string | null
          copa: boolean | null
          cozinha_qualidade: string | null
          cozinhas: number | null
          created_at: string
          despensa: boolean | null
          documentacao: string[] | null
          eletrica_qualidade: string | null
          escritorios: number | null
          esquadrias_qualidade: string | null
          estado: string
          extras: string[] | null
          faixa_max: number | null
          faixa_min: number | null
          financiavel: boolean | null
          garagem: number | null
          habite_se: boolean | null
          id: string
          inputs: Json | null
          justificativa: string | null
          lavabos: number | null
          lavanderia: boolean | null
          liquidez_mercado: string | null
          measured_property_id: string | null
          modo_avaliacao: string | null
          numero: string | null
          pintura_qualidade: string | null
          piso_qualidade: string | null
          pontos_atencao: Json | null
          pontos_fortes: Json | null
          preco_m2_usado: number | null
          proximo_comercio: boolean | null
          proximo_escola: boolean | null
          proximo_hospital: boolean | null
          quartos: number | null
          regiao_valorizada: boolean | null
          rua: string | null
          rua_tranquila: boolean | null
          sala_estar: boolean | null
          sala_jantar: boolean | null
          sala_tv: boolean | null
          salas: number | null
          score_acabamento: number | null
          score_diferenciais: number | null
          score_documentacao: number | null
          score_estrutura: number | null
          score_geral: number | null
          score_liquidez: number | null
          score_localizacao: number | null
          sem_pendencias: boolean | null
          sugestoes_valorizacao: Json | null
          suites: number | null
          telhado_qualidade: string | null
          tempo_medio_venda_dias: number | null
          tipo: string
          tipo_estrutura: string | null
          user_id: string | null
          valor_base: number | null
          valor_estimado: number
          varanda_interna: boolean | null
          venda_premium: number | null
          venda_rapida: number | null
          vista_privilegiada: boolean | null
        }
        Insert: {
          acabamento?: string | null
          ajuste_total_pct?: number | null
          aluguel_estimado?: number | null
          area_coberta_externa?: number | null
          area_construida?: number | null
          area_construida_superior?: number | null
          area_construida_terreo?: number | null
          area_risco?: boolean | null
          area_servico?: boolean | null
          area_terreno?: number | null
          area_total?: number | null
          area_util?: number | null
          bairro: string
          banheiro_qualidade?: string | null
          banheiros?: number | null
          breakdown?: Json | null
          cep?: string | null
          cidade: string
          closet?: boolean | null
          comparaveis?: Json | null
          conservacao?: string | null
          copa?: boolean | null
          cozinha_qualidade?: string | null
          cozinhas?: number | null
          created_at?: string
          despensa?: boolean | null
          documentacao?: string[] | null
          eletrica_qualidade?: string | null
          escritorios?: number | null
          esquadrias_qualidade?: string | null
          estado: string
          extras?: string[] | null
          faixa_max?: number | null
          faixa_min?: number | null
          financiavel?: boolean | null
          garagem?: number | null
          habite_se?: boolean | null
          id?: string
          inputs?: Json | null
          justificativa?: string | null
          lavabos?: number | null
          lavanderia?: boolean | null
          liquidez_mercado?: string | null
          measured_property_id?: string | null
          modo_avaliacao?: string | null
          numero?: string | null
          pintura_qualidade?: string | null
          piso_qualidade?: string | null
          pontos_atencao?: Json | null
          pontos_fortes?: Json | null
          preco_m2_usado?: number | null
          proximo_comercio?: boolean | null
          proximo_escola?: boolean | null
          proximo_hospital?: boolean | null
          quartos?: number | null
          regiao_valorizada?: boolean | null
          rua?: string | null
          rua_tranquila?: boolean | null
          sala_estar?: boolean | null
          sala_jantar?: boolean | null
          sala_tv?: boolean | null
          salas?: number | null
          score_acabamento?: number | null
          score_diferenciais?: number | null
          score_documentacao?: number | null
          score_estrutura?: number | null
          score_geral?: number | null
          score_liquidez?: number | null
          score_localizacao?: number | null
          sem_pendencias?: boolean | null
          sugestoes_valorizacao?: Json | null
          suites?: number | null
          telhado_qualidade?: string | null
          tempo_medio_venda_dias?: number | null
          tipo: string
          tipo_estrutura?: string | null
          user_id?: string | null
          valor_base?: number | null
          valor_estimado: number
          varanda_interna?: boolean | null
          venda_premium?: number | null
          venda_rapida?: number | null
          vista_privilegiada?: boolean | null
        }
        Update: {
          acabamento?: string | null
          ajuste_total_pct?: number | null
          aluguel_estimado?: number | null
          area_coberta_externa?: number | null
          area_construida?: number | null
          area_construida_superior?: number | null
          area_construida_terreo?: number | null
          area_risco?: boolean | null
          area_servico?: boolean | null
          area_terreno?: number | null
          area_total?: number | null
          area_util?: number | null
          bairro?: string
          banheiro_qualidade?: string | null
          banheiros?: number | null
          breakdown?: Json | null
          cep?: string | null
          cidade?: string
          closet?: boolean | null
          comparaveis?: Json | null
          conservacao?: string | null
          copa?: boolean | null
          cozinha_qualidade?: string | null
          cozinhas?: number | null
          created_at?: string
          despensa?: boolean | null
          documentacao?: string[] | null
          eletrica_qualidade?: string | null
          escritorios?: number | null
          esquadrias_qualidade?: string | null
          estado?: string
          extras?: string[] | null
          faixa_max?: number | null
          faixa_min?: number | null
          financiavel?: boolean | null
          garagem?: number | null
          habite_se?: boolean | null
          id?: string
          inputs?: Json | null
          justificativa?: string | null
          lavabos?: number | null
          lavanderia?: boolean | null
          liquidez_mercado?: string | null
          measured_property_id?: string | null
          modo_avaliacao?: string | null
          numero?: string | null
          pintura_qualidade?: string | null
          piso_qualidade?: string | null
          pontos_atencao?: Json | null
          pontos_fortes?: Json | null
          preco_m2_usado?: number | null
          proximo_comercio?: boolean | null
          proximo_escola?: boolean | null
          proximo_hospital?: boolean | null
          quartos?: number | null
          regiao_valorizada?: boolean | null
          rua?: string | null
          rua_tranquila?: boolean | null
          sala_estar?: boolean | null
          sala_jantar?: boolean | null
          sala_tv?: boolean | null
          salas?: number | null
          score_acabamento?: number | null
          score_diferenciais?: number | null
          score_documentacao?: number | null
          score_estrutura?: number | null
          score_geral?: number | null
          score_liquidez?: number | null
          score_localizacao?: number | null
          sem_pendencias?: boolean | null
          sugestoes_valorizacao?: Json | null
          suites?: number | null
          telhado_qualidade?: string | null
          tempo_medio_venda_dias?: number | null
          tipo?: string
          tipo_estrutura?: string | null
          user_id?: string | null
          valor_base?: number | null
          valor_estimado?: number
          varanda_interna?: boolean | null
          venda_premium?: number | null
          venda_rapida?: number | null
          vista_privilegiada?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "property_valuations_measured_property_id_fkey"
            columns: ["measured_property_id"]
            isOneToOne: false
            referencedRelation: "measured_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      push_notifications_log: {
        Row: {
          body: string
          created_at: string
          failed_count: number
          id: string
          seller_id: string
          sent_count: number
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          failed_count?: number
          id?: string
          seller_id: string
          sent_count?: number
          title: string
          url?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          failed_count?: number
          id?: string
          seller_id?: string
          sent_count?: number
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          seller_id: string
          user_agent: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          seller_id: string
          user_agent?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          seller_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      rental_contracts: {
        Row: {
          created_at: string
          daily_interest_percent: number | null
          due_day: number
          end_date: string | null
          id: string
          item_id: string | null
          item_label: string | null
          late_fee_percent: number | null
          notes: string | null
          owner_name: string | null
          owner_phone: string | null
          rent_amount: number
          seller_id: string
          start_date: string
          status: Database["public"]["Enums"]["rental_contract_status"]
          tenant_cpf_cnpj: string | null
          tenant_email: string | null
          tenant_name: string
          tenant_phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_interest_percent?: number | null
          due_day?: number
          end_date?: string | null
          id?: string
          item_id?: string | null
          item_label?: string | null
          late_fee_percent?: number | null
          notes?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          rent_amount?: number
          seller_id: string
          start_date: string
          status?: Database["public"]["Enums"]["rental_contract_status"]
          tenant_cpf_cnpj?: string | null
          tenant_email?: string | null
          tenant_name: string
          tenant_phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_interest_percent?: number | null
          due_day?: number
          end_date?: string | null
          id?: string
          item_id?: string | null
          item_label?: string | null
          late_fee_percent?: number | null
          notes?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          rent_amount?: number
          seller_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["rental_contract_status"]
          tenant_cpf_cnpj?: string | null
          tenant_email?: string | null
          tenant_name?: string
          tenant_phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rental_payments: {
        Row: {
          amount_due: number
          amount_paid: number | null
          contract_id: string
          created_at: string
          due_date: string
          id: string
          interest: number | null
          late_fee: number | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          reference_month: string
          status: Database["public"]["Enums"]["rental_payment_status"]
          total_due: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_due?: number
          amount_paid?: number | null
          contract_id: string
          created_at?: string
          due_date: string
          id?: string
          interest?: number | null
          late_fee?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          reference_month: string
          status?: Database["public"]["Enums"]["rental_payment_status"]
          total_due?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number | null
          contract_id?: string
          created_at?: string
          due_date?: string
          id?: string
          interest?: number | null
          late_fee?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          reference_month?: string
          status?: Database["public"]["Enums"]["rental_payment_status"]
          total_due?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "rental_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_properties: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          owner_name: string | null
          owner_phone: string | null
          photo_url: string | null
          seller_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          photo_url?: string | null
          seller_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          photo_url?: string | null
          seller_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rental_reminders: {
        Row: {
          channel: string
          contract_id: string
          created_at: string
          id: string
          is_sent: boolean
          message: string | null
          payment_id: string | null
          reminder_type: Database["public"]["Enums"]["rental_reminder_type"]
          sent_at: string | null
          user_id: string
        }
        Insert: {
          channel?: string
          contract_id: string
          created_at?: string
          id?: string
          is_sent?: boolean
          message?: string | null
          payment_id?: string | null
          reminder_type: Database["public"]["Enums"]["rental_reminder_type"]
          sent_at?: string | null
          user_id: string
        }
        Update: {
          channel?: string
          contract_id?: string
          created_at?: string
          id?: string
          is_sent?: boolean
          message?: string | null
          payment_id?: string | null
          reminder_type?: Database["public"]["Enums"]["rental_reminder_type"]
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_reminders_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "rental_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_reminders_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "rental_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_analytics: {
        Row: {
          created_at: string
          event_type: string
          id: string
          item_id: string | null
          seller_id: string
          team_member_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          item_id?: string | null
          seller_id: string
          team_member_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          item_id?: string | null
          seller_id?: string
          team_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_analytics_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_crm_contacts: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          created_at: string
          email: string | null
          follow_up_date: string | null
          full_name: string
          funnel_stage: string
          id: string
          interested_item_id: string | null
          last_contacted_at: string | null
          lead_source: string | null
          notes: string | null
          phone: string | null
          seller_id: string
          team_member_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          email?: string | null
          follow_up_date?: string | null
          full_name: string
          funnel_stage?: string
          id?: string
          interested_item_id?: string | null
          last_contacted_at?: string | null
          lead_source?: string | null
          notes?: string | null
          phone?: string | null
          seller_id: string
          team_member_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          email?: string | null
          follow_up_date?: string | null
          full_name?: string
          funnel_stage?: string
          id?: string
          interested_item_id?: string | null
          last_contacted_at?: string | null
          lead_source?: string | null
          notes?: string | null
          phone?: string | null
          seller_id?: string
          team_member_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_crm_contacts_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_items: {
        Row: {
          accepts_financing: boolean | null
          address: string | null
          area: number | null
          backyard: boolean | null
          balcony: boolean | null
          barbecue: boolean | null
          bathrooms: number | null
          bedrooms: number | null
          brand: string | null
          built_area: number | null
          capture_status: Database["public"]["Enums"]["capture_status"] | null
          category: Database["public"]["Enums"]["item_category"]
          ceiling_height: number | null
          cep: string | null
          city: string | null
          color: string | null
          commission_percent: number | null
          condo_fee: number | null
          created_at: string
          description: string | null
          documentation: string | null
          doorman_24h: boolean | null
          finality: string | null
          floor_number: number | null
          foot_traffic: string | null
          fuel: string | null
          furnished: boolean | null
          garden: boolean | null
          has_ac: boolean | null
          has_dock: boolean | null
          has_elevator: boolean | null
          has_showcase: boolean | null
          id: string
          ideal_for: string | null
          infrastructure: string[] | null
          internal_office: boolean | null
          iptu: number | null
          is_owner_listing: boolean | null
          kitchen_type: string | null
          leisure_amenities: string[] | null
          listing_status: Database["public"]["Enums"]["listing_status"]
          living_rooms: number | null
          lot_depth: number | null
          lot_front: number | null
          mileage: number | null
          model: string | null
          neighborhood: string | null
          owner_phone: string | null
          parking_spots: number | null
          partner_percent: number | null
          partnership_enabled: boolean
          photos: string[] | null
          pool: boolean | null
          price: number | null
          property_subtype: string | null
          security: string | null
          seller_id: string
          seller_type: Database["public"]["Enums"]["seller_type"]
          service_area: boolean | null
          show_financing: boolean | null
          show_street_view: boolean
          slug: string | null
          sold_at: string | null
          state: string | null
          status: Database["public"]["Enums"]["item_status"]
          suites: number | null
          tags: Database["public"]["Enums"]["item_tag"][] | null
          three_phase_power: boolean | null
          title: string
          topography: string | null
          transmission: string | null
          truck_access: boolean | null
          updated_at: string
          user_id: string
          video_url: string | null
          views_count: number | null
          year: number | null
          zoning: string | null
        }
        Insert: {
          accepts_financing?: boolean | null
          address?: string | null
          area?: number | null
          backyard?: boolean | null
          balcony?: boolean | null
          barbecue?: boolean | null
          bathrooms?: number | null
          bedrooms?: number | null
          brand?: string | null
          built_area?: number | null
          capture_status?: Database["public"]["Enums"]["capture_status"] | null
          category: Database["public"]["Enums"]["item_category"]
          ceiling_height?: number | null
          cep?: string | null
          city?: string | null
          color?: string | null
          commission_percent?: number | null
          condo_fee?: number | null
          created_at?: string
          description?: string | null
          documentation?: string | null
          doorman_24h?: boolean | null
          finality?: string | null
          floor_number?: number | null
          foot_traffic?: string | null
          fuel?: string | null
          furnished?: boolean | null
          garden?: boolean | null
          has_ac?: boolean | null
          has_dock?: boolean | null
          has_elevator?: boolean | null
          has_showcase?: boolean | null
          id?: string
          ideal_for?: string | null
          infrastructure?: string[] | null
          internal_office?: boolean | null
          iptu?: number | null
          is_owner_listing?: boolean | null
          kitchen_type?: string | null
          leisure_amenities?: string[] | null
          listing_status?: Database["public"]["Enums"]["listing_status"]
          living_rooms?: number | null
          lot_depth?: number | null
          lot_front?: number | null
          mileage?: number | null
          model?: string | null
          neighborhood?: string | null
          owner_phone?: string | null
          parking_spots?: number | null
          partner_percent?: number | null
          partnership_enabled?: boolean
          photos?: string[] | null
          pool?: boolean | null
          price?: number | null
          property_subtype?: string | null
          security?: string | null
          seller_id: string
          seller_type: Database["public"]["Enums"]["seller_type"]
          service_area?: boolean | null
          show_financing?: boolean | null
          show_street_view?: boolean
          slug?: string | null
          sold_at?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          suites?: number | null
          tags?: Database["public"]["Enums"]["item_tag"][] | null
          three_phase_power?: boolean | null
          title: string
          topography?: string | null
          transmission?: string | null
          truck_access?: boolean | null
          updated_at?: string
          user_id: string
          video_url?: string | null
          views_count?: number | null
          year?: number | null
          zoning?: string | null
        }
        Update: {
          accepts_financing?: boolean | null
          address?: string | null
          area?: number | null
          backyard?: boolean | null
          balcony?: boolean | null
          barbecue?: boolean | null
          bathrooms?: number | null
          bedrooms?: number | null
          brand?: string | null
          built_area?: number | null
          capture_status?: Database["public"]["Enums"]["capture_status"] | null
          category?: Database["public"]["Enums"]["item_category"]
          ceiling_height?: number | null
          cep?: string | null
          city?: string | null
          color?: string | null
          commission_percent?: number | null
          condo_fee?: number | null
          created_at?: string
          description?: string | null
          documentation?: string | null
          doorman_24h?: boolean | null
          finality?: string | null
          floor_number?: number | null
          foot_traffic?: string | null
          fuel?: string | null
          furnished?: boolean | null
          garden?: boolean | null
          has_ac?: boolean | null
          has_dock?: boolean | null
          has_elevator?: boolean | null
          has_showcase?: boolean | null
          id?: string
          ideal_for?: string | null
          infrastructure?: string[] | null
          internal_office?: boolean | null
          iptu?: number | null
          is_owner_listing?: boolean | null
          kitchen_type?: string | null
          leisure_amenities?: string[] | null
          listing_status?: Database["public"]["Enums"]["listing_status"]
          living_rooms?: number | null
          lot_depth?: number | null
          lot_front?: number | null
          mileage?: number | null
          model?: string | null
          neighborhood?: string | null
          owner_phone?: string | null
          parking_spots?: number | null
          partner_percent?: number | null
          partnership_enabled?: boolean
          photos?: string[] | null
          pool?: boolean | null
          price?: number | null
          property_subtype?: string | null
          security?: string | null
          seller_id?: string
          seller_type?: Database["public"]["Enums"]["seller_type"]
          service_area?: boolean | null
          show_financing?: boolean | null
          show_street_view?: boolean
          slug?: string | null
          sold_at?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          suites?: number | null
          tags?: Database["public"]["Enums"]["item_tag"][] | null
          three_phase_power?: boolean | null
          title?: string
          topography?: string | null
          transmission?: string | null
          truck_access?: boolean | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
          views_count?: number | null
          year?: number | null
          zoning?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_rewards: {
        Row: {
          claimed: boolean
          created_at: string
          expires_at: string
          granted_at: string
          id: string
          is_active: boolean
          reward_type: string
          seller_id: string
          trigger_type: string
          trigger_value: string | null
          user_id: string
        }
        Insert: {
          claimed?: boolean
          created_at?: string
          expires_at: string
          granted_at?: string
          id?: string
          is_active?: boolean
          reward_type: string
          seller_id: string
          trigger_type: string
          trigger_value?: string | null
          user_id: string
        }
        Update: {
          claimed?: boolean
          created_at?: string
          expires_at?: string
          granted_at?: string
          id?: string
          is_active?: boolean
          reward_type?: string
          seller_id?: string
          trigger_type?: string
          trigger_value?: string | null
          user_id?: string
        }
        Relationships: []
      }
      seller_stories: {
        Row: {
          button_text: string | null
          button_url: string | null
          created_at: string
          description: string | null
          expires_at: string
          id: string
          image_url: string
          is_active: boolean
          is_auto: boolean
          item_id: string | null
          seller_id: string
          team_member_id: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          button_text?: string | null
          button_url?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          is_auto?: boolean
          item_id?: string | null
          seller_id: string
          team_member_id?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          button_text?: string | null
          button_url?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          is_auto?: boolean
          item_id?: string | null
          seller_id?: string
          team_member_id?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_stories_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_subscriptions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          max_items: number
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          seller_id: string
          started_at: string
          tier: Database["public"]["Enums"]["package_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          max_items?: number
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          seller_id: string
          started_at?: string
          tier?: Database["public"]["Enums"]["package_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          max_items?: number
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          seller_id?: string
          started_at?: string
          tier?: Database["public"]["Enums"]["package_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      smtp_settings: {
        Row: {
          created_at: string
          enabled: boolean
          host: string
          id: string
          last_test_at: string | null
          last_test_error: string | null
          last_test_status: string | null
          password_encrypted: string | null
          port: number
          reply_to: string | null
          security: string
          sender_email: string
          sender_name: string
          updated_at: string
          use_for_recovery: boolean
          use_for_signup: boolean
          username: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          host?: string
          id?: string
          last_test_at?: string | null
          last_test_error?: string | null
          last_test_status?: string | null
          password_encrypted?: string | null
          port?: number
          reply_to?: string | null
          security?: string
          sender_email?: string
          sender_name?: string
          updated_at?: string
          use_for_recovery?: boolean
          use_for_signup?: boolean
          username?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          host?: string
          id?: string
          last_test_at?: string | null
          last_test_error?: string | null
          last_test_status?: string | null
          password_encrypted?: string | null
          port?: number
          reply_to?: string | null
          security?: string
          sender_email?: string
          sender_name?: string
          updated_at?: string
          use_for_recovery?: boolean
          use_for_signup?: boolean
          username?: string
        }
        Relationships: []
      }
      store_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          is_active: boolean
          seller_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          is_active?: boolean
          seller_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          is_active?: boolean
          seller_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_effects: {
        Row: {
          activated_at: string
          created_at: string
          effect_type: string
          expires_at: string
          id: string
          is_active: boolean
          is_free: boolean
          seller_id: string
          user_id: string
        }
        Insert: {
          activated_at?: string
          created_at?: string
          effect_type: string
          expires_at?: string
          id?: string
          is_active?: boolean
          is_free?: boolean
          seller_id: string
          user_id: string
        }
        Update: {
          activated_at?: string
          created_at?: string
          effect_type?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          is_free?: boolean
          seller_id?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          ai_generations_per_day: number
          badge_color: string
          benefits: Json
          border_color: string
          category: string
          color: string
          created_at: string
          id: string
          is_active: boolean
          is_popular: boolean
          max_items: number
          name: string
          price: number
          setup_fee: number
          sort_order: number
          tier: string
          updated_at: string
        }
        Insert: {
          ai_generations_per_day?: number
          badge_color?: string
          benefits?: Json
          border_color?: string
          category?: string
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_popular?: boolean
          max_items?: number
          name: string
          price?: number
          setup_fee?: number
          sort_order?: number
          tier: string
          updated_at?: string
        }
        Update: {
          ai_generations_per_day?: number
          badge_color?: string
          benefits?: Json
          border_color?: string
          category?: string
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_popular?: boolean
          max_items?: number
          name?: string
          price?: number
          setup_fee?: number
          sort_order?: number
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio: string | null
          company_id: string
          created_at: string
          creci: string | null
          email: string | null
          full_name: string
          id: string
          instagram: string | null
          is_active: boolean
          linked_profile_id: string | null
          origin: string
          phone: string | null
          photo_url: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          company_id: string
          created_at?: string
          creci?: string | null
          email?: string | null
          full_name: string
          id?: string
          instagram?: string | null
          is_active?: boolean
          linked_profile_id?: string | null
          origin?: string
          phone?: string | null
          photo_url?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          company_id?: string
          created_at?: string
          creci?: string | null
          email?: string | null
          full_name?: string
          id?: string
          instagram?: string | null
          is_active?: boolean
          linked_profile_id?: string | null
          origin?: string
          phone?: string | null
          photo_url?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_linked_profile_id_fkey"
            columns: ["linked_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bans: {
        Row: {
          banned_at: string
          banned_by: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          is_permanent: boolean
          reason: string | null
          user_id: string
        }
        Insert: {
          banned_at?: string
          banned_by: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_permanent?: boolean
          reason?: string | null
          user_id: string
        }
        Update: {
          banned_at?: string
          banned_by?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_permanent?: boolean
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      valuation_price_table: {
        Row: {
          bairro: string | null
          cidade: string | null
          created_at: string
          estado: string
          id: string
          notes: string | null
          preco_m2: number
          tipo: string
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cidade?: string | null
          created_at?: string
          estado: string
          id?: string
          notes?: string | null
          preco_m2: number
          tipo: string
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cidade?: string | null
          created_at?: string
          estado?: string
          id?: string
          notes?: string | null
          preco_m2?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      visit_appointments: {
        Row: {
          address: string | null
          ai_match_confidence: number | null
          ai_property_guess: string | null
          city: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          id: string
          item_id: string | null
          notes: string | null
          outcome: string | null
          property_code: string | null
          property_type: string | null
          push_created_sent_at: string | null
          push_hour_before_sent_at: string | null
          push_morning_sent_at: string | null
          responsible_name: string | null
          seller_id: string
          source: string
          status: Database["public"]["Enums"]["visit_status"]
          team_member_id: string | null
          updated_at: string
          user_id: string
          visit_date: string
          visit_time: string
        }
        Insert: {
          address?: string | null
          ai_match_confidence?: number | null
          ai_property_guess?: string | null
          city?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          id?: string
          item_id?: string | null
          notes?: string | null
          outcome?: string | null
          property_code?: string | null
          property_type?: string | null
          push_created_sent_at?: string | null
          push_hour_before_sent_at?: string | null
          push_morning_sent_at?: string | null
          responsible_name?: string | null
          seller_id: string
          source?: string
          status?: Database["public"]["Enums"]["visit_status"]
          team_member_id?: string | null
          updated_at?: string
          user_id: string
          visit_date: string
          visit_time: string
        }
        Update: {
          address?: string | null
          ai_match_confidence?: number | null
          ai_property_guess?: string | null
          city?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          id?: string
          item_id?: string | null
          notes?: string | null
          outcome?: string | null
          property_code?: string | null
          property_type?: string | null
          push_created_sent_at?: string | null
          push_hour_before_sent_at?: string | null
          push_morning_sent_at?: string | null
          responsible_name?: string | null
          seller_id?: string
          source?: string
          status?: Database["public"]["Enums"]["visit_status"]
          team_member_id?: string | null
          updated_at?: string
          user_id?: string
          visit_date?: string
          visit_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_appointments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "seller_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_appointments_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          id: string
          pix_key: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          pix_key: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          pix_key?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_ai_credits: {
        Args: {
          p_amount: number
          p_external_reference?: string
          p_metadata?: Json
          p_notes?: string
          p_seller_id?: string
          p_tool_key?: string
          p_transaction_type: string
          p_user_id: string
        }
        Returns: number
      }
      consume_ai_credits: {
        Args: {
          p_amount: number
          p_external_reference?: string
          p_metadata?: Json
          p_notes?: string
          p_seller_id?: string
          p_tool_key: string
          p_user_id: string
        }
        Returns: Json
      }
      decrypt_smtp_password: {
        Args: { p_encrypted: string; p_key: string }
        Returns: string
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      encrypt_smtp_password: {
        Args: { p_key: string; p_password: string }
        Returns: string
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      ensure_ai_credit_wallet: {
        Args: { p_seller_id?: string; p_user_id: string }
        Returns: string
      }
      generate_item_slug: {
        Args: { p_item_id: string; p_title: string }
        Returns: string
      }
      generate_seller_slug: {
        Args: { p_name: string; p_profile_id: string }
        Returns: string
      }
      get_ai_monthly_credits_for_tier: {
        Args: { p_tier: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      refresh_ai_monthly_credits: {
        Args: { p_seller_id?: string; p_user_id: string }
        Returns: Json
      }
      refund_ai_credits: {
        Args: {
          p_amount: number
          p_external_reference?: string
          p_metadata?: Json
          p_notes?: string
          p_seller_id?: string
          p_tool_key: string
          p_user_id: string
        }
        Returns: number
      }
      resolve_price_per_sqm: {
        Args: {
          p_bairro: string
          p_cidade: string
          p_estado: string
          p_tipo: string
        }
        Returns: {
          preco_m2: number
          source: string
        }[]
      }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      capture_status: "disponivel" | "em_negociacao" | "vendido"
      item_category:
        | "casa"
        | "apartamento"
        | "terreno"
        | "comercial"
        | "galpao"
        | "flat"
        | "aluguel"
        | "carro"
        | "moto"
        | "caminhao"
        | "van"
        | "utilitario"
        | "outros"
      item_status: "ativo" | "inativo" | "vendido"
      item_tag:
        | "premium"
        | "luxo"
        | "prime"
        | "novo"
        | "em_destaque"
        | "oferta"
        | "exclusivo"
        | "top"
        | "limited"
        | "lancamento"
        | "pronto_para_morar"
        | "cobertura"
        | "vista_panoramica"
        | "aluguel_flex"
        | "alto_padrao"
        | "oportunidade"
        | "ultimas_unidades"
        | "area_lazer"
        | "piscina_tag"
        | "aceita_financiamento_tag"
      listing_status:
        | "publicado"
        | "vendido"
        | "alugado"
        | "demo"
        | "teste"
        | "rascunho"
        | "oculto"
      package_tier:
        | "start"
        | "basico"
        | "premium"
        | "vip"
        | "essencial_empresa"
        | "premium_empresa"
        | "prime_empresa"
        | "black"
      rental_contract_status: "ativo" | "encerrado" | "cancelado" | "renovacao"
      rental_payment_status: "pago" | "pendente" | "atrasado" | "parcial"
      rental_reminder_type: "antes_vencimento" | "no_vencimento" | "atrasado"
      seller_category:
        | "imobiliaria"
        | "corretor"
        | "proprietario"
        | "loja_veiculos"
        | "autonomo"
        | "concessionaria"
        | "construtora"
      seller_type: "imoveis" | "automoveis"
      visit_status:
        | "confirmada"
        | "pendente"
        | "reagendada"
        | "cancelada"
        | "fechada"
        | "pendente_confirmacao"
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
      app_role: ["admin", "moderator", "user"],
      capture_status: ["disponivel", "em_negociacao", "vendido"],
      item_category: [
        "casa",
        "apartamento",
        "terreno",
        "comercial",
        "galpao",
        "flat",
        "aluguel",
        "carro",
        "moto",
        "caminhao",
        "van",
        "utilitario",
        "outros",
      ],
      item_status: ["ativo", "inativo", "vendido"],
      item_tag: [
        "premium",
        "luxo",
        "prime",
        "novo",
        "em_destaque",
        "oferta",
        "exclusivo",
        "top",
        "limited",
        "lancamento",
        "pronto_para_morar",
        "cobertura",
        "vista_panoramica",
        "aluguel_flex",
        "alto_padrao",
        "oportunidade",
        "ultimas_unidades",
        "area_lazer",
        "piscina_tag",
        "aceita_financiamento_tag",
      ],
      listing_status: [
        "publicado",
        "vendido",
        "alugado",
        "demo",
        "teste",
        "rascunho",
        "oculto",
      ],
      package_tier: [
        "start",
        "basico",
        "premium",
        "vip",
        "essencial_empresa",
        "premium_empresa",
        "prime_empresa",
        "black",
      ],
      rental_contract_status: ["ativo", "encerrado", "cancelado", "renovacao"],
      rental_payment_status: ["pago", "pendente", "atrasado", "parcial"],
      rental_reminder_type: ["antes_vencimento", "no_vencimento", "atrasado"],
      seller_category: [
        "imobiliaria",
        "corretor",
        "proprietario",
        "loja_veiculos",
        "autonomo",
        "concessionaria",
        "construtora",
      ],
      seller_type: ["imoveis", "automoveis"],
      visit_status: [
        "confirmada",
        "pendente",
        "reagendada",
        "cancelada",
        "fechada",
        "pendente_confirmacao",
      ],
    },
  },
} as const
