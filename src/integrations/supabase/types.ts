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
      digital_products: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          file_url: string | null
          id: string
          is_active: boolean
          page_id: string
          price_cents: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          page_id: string
          price_cents: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          page_id?: string
          price_cents?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_products_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          custom_head_html: string | null
          google_analytics_measurement_id: string | null
          id: string
          meta_pixel_id: string | null
          page_id: string
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          custom_head_html?: string | null
          google_analytics_measurement_id?: string | null
          id?: string
          meta_pixel_id?: string | null
          page_id: string
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          custom_head_html?: string | null
          google_analytics_measurement_id?: string | null
          id?: string
          meta_pixel_id?: string | null
          page_id?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          custom_fields: Json | null
          email: string
          id: string
          name: string | null
          page_id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          custom_fields?: Json | null
          email: string
          id?: string
          name?: string | null
          page_id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          custom_fields?: Json | null
          email?: string
          id?: string
          name?: string | null
          page_id?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      link_clicks: {
        Row: {
          browser: string | null
          city: string | null
          clicked_at: string
          country: string | null
          device_type: string | null
          id: string
          ip_hash: string | null
          link_id: string
          referrer: string | null
          short_link_id: string | null
          user_agent: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          clicked_at?: string
          country?: string | null
          device_type?: string | null
          id?: string
          ip_hash?: string | null
          link_id: string
          referrer?: string | null
          short_link_id?: string | null
          user_agent?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          clicked_at?: string
          country?: string | null
          device_type?: string | null
          id?: string
          ip_hash?: string | null
          link_id?: string
          referrer?: string | null
          short_link_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      links: {
        Row: {
          created_at: string
          ends_at: string | null
          icon_name: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          link_type: Database["public"]["Enums"]["link_type"]
          page_id: string | null
          position: number
          schedule_enabled: boolean
          starts_at: string | null
          thumbnail_type: Database["public"]["Enums"]["thumbnail_type"]
          thumbnail_url: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          link_type?: Database["public"]["Enums"]["link_type"]
          page_id?: string | null
          position?: number
          schedule_enabled?: boolean
          starts_at?: string | null
          thumbnail_type?: Database["public"]["Enums"]["thumbnail_type"]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          link_type?: Database["public"]["Enums"]["link_type"]
          page_id?: string | null
          position?: number
          schedule_enabled?: boolean
          starts_at?: string | null
          thumbnail_type?: Database["public"]["Enums"]["thumbnail_type"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          buyer_email: string
          created_at: string
          id: string
          product_id: string
          status: Database["public"]["Enums"]["order_status"]
          stripe_session_id: string | null
        }
        Insert: {
          buyer_email: string
          created_at?: string
          id?: string
          product_id: string
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
        }
        Update: {
          buyer_email?: string
          created_at?: string
          id?: string
          product_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_hash: string | null
          page_id: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_hash?: string | null
          page_id?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_hash?: string | null
          page_id?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      pages: {
        Row: {
          created_at: string
          custom_domain: string | null
          description: string | null
          id: string
          lead_form_description: string | null
          lead_form_enabled: boolean
          lead_form_fields: Json | null
          lead_form_title: string | null
          og_image_url: string | null
          profile_id: string
          slug: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          id?: string
          lead_form_description?: string | null
          lead_form_enabled?: boolean
          lead_form_fields?: Json | null
          lead_form_title?: string | null
          og_image_url?: string | null
          profile_id: string
          slug?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          id?: string
          lead_form_description?: string | null
          lead_form_enabled?: boolean
          lead_form_fields?: Json | null
          lead_form_title?: string | null
          og_image_url?: string | null
          profile_id?: string
          slug?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          handle: string | null
          id: string
          is_public: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          id?: string
          is_public?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          id?: string
          is_public?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      short_links: {
        Row: {
          created_at: string
          destination_url: string
          id: string
          link_id: string | null
          page_id: string
          slug: string
        }
        Insert: {
          created_at?: string
          destination_url: string
          id?: string
          link_id?: string | null
          page_id: string
          slug: string
        }
        Update: {
          created_at?: string
          destination_url?: string
          id?: string
          link_id?: string | null
          page_id?: string
          slug?: string
        }
        Relationships: []
      }
      themes: {
        Row: {
          accent_color: string | null
          background_type: Database["public"]["Enums"]["background_type"]
          background_value: string | null
          button_radius: number
          button_style: string
          created_at: string
          custom_background_url: string | null
          custom_primary_color: string | null
          custom_secondary_color: string | null
          font_family: string
          id: string
          page_id: string | null
          preset: string
          text_color: string | null
          theme_id: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          background_type?: Database["public"]["Enums"]["background_type"]
          background_value?: string | null
          button_radius?: number
          button_style?: string
          created_at?: string
          custom_background_url?: string | null
          custom_primary_color?: string | null
          custom_secondary_color?: string | null
          font_family?: string
          id?: string
          page_id?: string | null
          preset?: string
          text_color?: string | null
          theme_id?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          background_type?: Database["public"]["Enums"]["background_type"]
          background_value?: string | null
          button_radius?: number
          button_style?: string
          created_at?: string
          custom_background_url?: string | null
          custom_primary_color?: string | null
          custom_secondary_color?: string | null
          font_family?: string
          id?: string
          page_id?: string | null
          preset?: string
          text_color?: string | null
          theme_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      debug_pages_insert: { Args: { p_profile_id: string }; Returns: boolean }
      generate_slug: { Args: never; Returns: string }
      generate_unique_handle: { Args: { p_email: string }; Returns: string }
      is_link_public: { Args: { p_link_id: string }; Returns: boolean }
      is_link_scheduled_active: {
        Args: {
          p_ends_at: string
          p_schedule_enabled: boolean
          p_starts_at: string
        }
        Returns: boolean
      }
      is_page_public: { Args: { p_page_id: string }; Returns: boolean }
      is_product_public: { Args: { p_product_id: string }; Returns: boolean }
      user_owns_page: { Args: { p_page_id: string }; Returns: boolean }
      user_owns_profile: { Args: { p_profile_id: string }; Returns: boolean }
    }
    Enums: {
      background_type: "color" | "gradient" | "image"
      button_style_type: "solid" | "outline" | "soft"
      link_type: "link" | "header"
      order_status: "pending" | "paid" | "failed"
      thumbnail_type: "none" | "upload" | "icon"
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
      background_type: ["color", "gradient", "image"],
      button_style_type: ["solid", "outline", "soft"],
      link_type: ["link", "header"],
      order_status: ["pending", "paid", "failed"],
      thumbnail_type: ["none", "upload", "icon"],
    },
  },
} as const
