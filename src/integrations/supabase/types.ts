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
      ad_requests: {
        Row: {
          created_at: string
          daily_budget: number
          details: string | null
          duration_days: number
          id: string
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
          phone: string | null
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
          store_video_title: string | null
          store_video_url: string | null
          updated_at: string
          user_id: string
          video_description: string | null
          video_title: string | null
          video_url: string | null
        }
        Insert: {
          account_manager?: string | null
          address?: string | null
          bio?: string | null
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
          phone?: string | null
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
          store_video_title?: string | null
          store_video_url?: string | null
          updated_at?: string
          user_id: string
          video_description?: string | null
          video_title?: string | null
          video_url?: string | null
        }
        Update: {
          account_manager?: string | null
          address?: string | null
          bio?: string | null
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
          phone?: string | null
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
          store_video_title?: string | null
          store_video_url?: string | null
          updated_at?: string
          user_id?: string
          video_description?: string | null
          video_title?: string | null
          video_url?: string | null
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
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          city: string | null
          color: string | null
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
          living_rooms: number | null
          lot_depth: number | null
          lot_front: number | null
          mileage: number | null
          model: string | null
          neighborhood: string | null
          owner_phone: string | null
          parking_spots: number | null
          photos: string[] | null
          pool: boolean | null
          price: number | null
          property_subtype: string | null
          security: string | null
          seller_id: string
          seller_type: Database["public"]["Enums"]["seller_type"]
          service_area: boolean | null
          show_financing: boolean | null
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
          city?: string | null
          color?: string | null
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
          living_rooms?: number | null
          lot_depth?: number | null
          lot_front?: number | null
          mileage?: number | null
          model?: string | null
          neighborhood?: string | null
          owner_phone?: string | null
          parking_spots?: number | null
          photos?: string[] | null
          pool?: boolean | null
          price?: number | null
          property_subtype?: string | null
          security?: string | null
          seller_id: string
          seller_type: Database["public"]["Enums"]["seller_type"]
          service_area?: boolean | null
          show_financing?: boolean | null
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
          city?: string | null
          color?: string | null
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
          living_rooms?: number | null
          lot_depth?: number | null
          lot_front?: number | null
          mileage?: number | null
          model?: string | null
          neighborhood?: string | null
          owner_phone?: string | null
          parking_spots?: number | null
          photos?: string[] | null
          pool?: boolean | null
          price?: number | null
          property_subtype?: string | null
          security?: string | null
          seller_id?: string
          seller_type?: Database["public"]["Enums"]["seller_type"]
          service_area?: boolean | null
          show_financing?: boolean | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
      package_tier:
        | "start"
        | "basico"
        | "premium"
        | "vip"
        | "essencial_empresa"
        | "premium_empresa"
        | "prime_empresa"
      seller_category:
        | "imobiliaria"
        | "corretor"
        | "proprietario"
        | "loja_veiculos"
        | "autonomo"
        | "concessionaria"
        | "construtora"
      seller_type: "imoveis" | "automoveis"
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
      package_tier: [
        "start",
        "basico",
        "premium",
        "vip",
        "essencial_empresa",
        "premium_empresa",
        "prime_empresa",
      ],
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
    },
  },
} as const
