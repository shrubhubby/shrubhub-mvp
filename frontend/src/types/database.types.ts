// Database types generated from Supabase schema
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      gardeners: {
        Row: {
          id: string
          auth_user_id: string
          email: string
          display_name: string | null
          bio: string | null
          avatar_url: string | null
          location_lat: number | null
          location_lng: number | null
          location_description: string | null
          hardiness_zone: string | null
          timezone: string
          measurement_system: 'imperial' | 'metric'
          notification_preferences: Json
          bot_personality_settings: Json
          created_at: string
          updated_at: string
          last_active_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['gardeners']['Row'], 'id' | 'created_at' | 'updated_at' | 'last_active_at'>
        Update: Partial<Database['public']['Tables']['gardeners']['Insert']>
      }
      gardens: {
        Row: {
          id: string
          gardener_id: string
          name: string
          description: string | null
          garden_type: 'indoor' | 'outdoor' | 'container' | 'raised_bed' | 'in_ground' | 'greenhouse' | 'community_plot' | 'mixed'
          location_lat: number | null
          location_lng: number | null
          location_description: string | null
          sun_exposure: 'full_sun' | 'partial_shade' | 'full_shade' | 'varies' | null
          soil_type: string | null
          is_primary: boolean
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['gardens']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['gardens']['Insert']>
      }
      plants_master: {
        Row: {
          id: string
          scientific_name: string
          common_names: string[]
          family: string | null
          plant_type: 'vegetable' | 'herb' | 'fruit' | 'flower' | 'tree' | 'shrub' | 'succulent' | 'vine' | 'grass' | 'fern' | 'other' | null
          care_guide: Json | null
          hardiness_zones: string[] | null
          growth_rate: 'slow' | 'moderate' | 'fast' | null
          mature_height_inches: number | null
          mature_width_inches: number | null
          native_region: string | null
          edibility: boolean
          data_sources: Json | null
          external_ids: Json | null
          default_image_url: string | null
          created_at: string
          updated_at: string
          last_verified_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['plants_master']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['plants_master']['Insert']>
      }
      plants: {
        Row: {
          id: string
          garden_id: string
          plant_master_id: string | null
          parent_plant_id: string | null
          common_name: string
          custom_name: string | null
          location_in_garden: string | null
          location_lat: number | null
          location_lng: number | null
          acquired_date: string
          acquisition_source: 'seed' | 'seedling_purchased' | 'mature_purchased' | 'gift' | 'propagation' | 'field_extraction' | 'volunteer' | 'unknown'
          acquisition_location: string | null
          acquisition_notes: string | null
          status: 'seed' | 'germinating' | 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'dormant' | 'alive' | 'struggling' | 'dead' | 'harvested' | 'adopted_out'
          health_status: 'healthy' | 'needs_attention' | 'sick' | 'pest_issue' | 'dead'
          planted_date: string | null
          first_bloom_date: string | null
          first_harvest_date: string | null
          care_override: Json | null
          field_extraction_data: Json | null
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['plants']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['plants']['Insert']>
      }
      plant_photos: {
        Row: {
          id: string
          plant_id: string
          storage_bucket: string
          storage_path: string
          thumbnail_path: string | null
          taken_at: string
          uploaded_at: string
          file_size_bytes: number | null
          mime_type: string | null
          photo_type: 'identification' | 'general' | 'progress' | 'issue' | 'bloom' | 'harvest' | 'before_after'
          caption: string | null
          identification_data: Json | null
          is_primary: boolean
          display_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['plant_photos']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['plant_photos']['Insert']>
      }
      activities: {
        Row: {
          id: string
          plant_id: string
          activity_type: 'watering' | 'fertilizing' | 'pruning' | 'repotting' | 'transplanting' | 'harvesting' | 'treating_pests' | 'treating_disease' | 'staking' | 'mulching' | 'soil_amendment' | 'deadheading' | 'thinning' | 'germination' | 'other'
          notes: string | null
          quantity: number | null
          quantity_unit: string | null
          product_used: string | null
          performed_at: string
          duration_minutes: number | null
          created_via: 'manual' | 'bot' | 'reminder' | 'auto' | 'import'
          reminder_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['activities']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['activities']['Insert']>
      }
      observations: {
        Row: {
          id: string
          plant_id: string
          observation_text: string
          sentiment: 'positive' | 'neutral' | 'concerned' | 'negative' | null
          photo_id: string | null
          tags: string[] | null
          observed_at: string
          created_via: 'manual' | 'bot' | 'prompt'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['observations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['observations']['Insert']>
      }
      care_reminders: {
        Row: {
          id: string
          plant_id: string
          reminder_type: 'watering' | 'fertilizing' | 'pruning' | 'repotting' | 'checking' | 'harvesting' | 'custom'
          title: string
          description: string | null
          due_date: string | null
          due_time: string | null
          recurrence_rule: string | null
          priority: 'low' | 'normal' | 'high' | 'urgent'
          status: 'pending' | 'completed' | 'snoozed' | 'dismissed' | 'expired'
          completed_at: string | null
          completed_activity_id: string | null
          created_by: 'system' | 'user' | 'weather' | 'issue'
          conditions: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['care_reminders']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['care_reminders']['Insert']>
      }
      conversation_history: {
        Row: {
          id: string
          gardener_id: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          message_text: string
          context_data: Json | null
          function_calls: Json | null
          created_at: string
          tokens_used: number | null
          model_used: string | null
        }
        Insert: Omit<Database['public']['Tables']['conversation_history']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['conversation_history']['Insert']>
      }
    }
  }
}
