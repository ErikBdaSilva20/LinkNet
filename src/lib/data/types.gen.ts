// PROTEGIDO — não editável pela IA (masi.template.json, editable.protect).
// Gerado a partir de supabase/migrations/0001_business_schema.sql (Bloco 2). Se o schema mudar,
// regenerar este arquivo — não editar tipos aqui sem editar a migration primeiro.

export type ThumbnailType = "none" | "upload" | "icon";
export type LinkType = "link" | "header";
export type BackgroundType = "color" | "gradient" | "image";

export interface LeadFormField {
  id: string;
  type: string;
  label: string;
  enabled: boolean;
  required: boolean;
}

export interface Database {
  public: {
    Tables: {
      pages: {
        Row: {
          id: string;
          owner_id: string;
          handle: string;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          is_public: boolean;
          title: string | null;
          description: string | null;
          og_image_url: string | null;
          custom_domain: string | null;
          lead_form_enabled: boolean;
          lead_form_title: string | null;
          lead_form_description: string | null;
          lead_form_fields: LeadFormField[];
          created_at: string;
          updated_at: string;
        };
      };
      links: {
        Row: {
          id: string;
          owner_id: string;
          page_id: string;
          title: string;
          url: string | null;
          link_type: LinkType;
          thumbnail_type: ThumbnailType;
          thumbnail_url: string | null;
          icon_name: string | null;
          position: number;
          is_active: boolean;
          is_featured: boolean;
          schedule_enabled: boolean;
          starts_at: string | null;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      themes: {
        Row: {
          id: string;
          owner_id: string;
          page_id: string;
          theme_id: string;
          button_style: string;
          font_family: string;
          custom_primary_color: string | null;
          custom_secondary_color: string | null;
          custom_background_url: string | null;
          background_type: BackgroundType;
          background_value: string | null;
          button_radius: number;
          text_color: string | null;
          accent_color: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      integrations: {
        Row: {
          id: string;
          owner_id: string;
          page_id: string;
          google_analytics_measurement_id: string | null;
          meta_pixel_id: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      leads: {
        Row: {
          id: string;
          owner_id: string;
          page_id: string;
          email: string;
          name: string | null;
          phone: string | null;
          custom_fields: Record<string, string>;
          created_at: string;
        };
      };
      short_links: {
        Row: {
          id: string;
          owner_id: string;
          page_id: string;
          link_id: string | null;
          slug: string;
          destination_url: string;
          created_at: string;
        };
      };
      link_clicks: {
        Row: {
          id: string;
          owner_id: string;
          link_id: string;
          short_link_id: string | null;
          clicked_at: string;
          referrer: string | null;
          user_agent: string | null;
          ip_hash: string | null;
          country: string | null;
          city: string | null;
          device_type: string | null;
          browser: string | null;
        };
      };
      page_views: {
        Row: {
          id: string;
          owner_id: string;
          page_id: string;
          referrer: string | null;
          user_agent: string | null;
          ip_hash: string | null;
          country: string | null;
          city: string | null;
          device_type: string | null;
          browser: string | null;
          created_at: string;
        };
      };
    };
    Enums: {
      thumbnail_type: ThumbnailType;
      link_type: LinkType;
      background_type: BackgroundType;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
