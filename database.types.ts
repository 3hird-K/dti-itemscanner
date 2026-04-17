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
      inventory_items: {
        Row: {
          acquisition_date: string | null
          actual_user: string | null
          article: string | null
          condition: string | null
          created_at: string | null
          description: string | null
          end_user: string | null
          fund_cluster: string | null
          id: string
          location: string | null
          ngas_number: string | null
          office_center: string | null
          par_ics_pos: string | null
          par_ics_received_by: string | null
          par_ics_ro: string | null
          property_number: string | null
          property_type: string | null
          qty_physical_count: number | null
          qty_property_card: number | null
          qty_shortage_overage: number | null
          remarks: string | null
          serial_number: string | null
          status: string
          sub_location: string | null
          tagging_number: string | null
          total_cost: number | null
          unit_of_measure: string | null
          unit_value: number | null
          updated_at: string | null
          value_shortage_overage: number | null
        }
        Insert: {
          acquisition_date?: string | null
          actual_user?: string | null
          article?: string | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          end_user?: string | null
          fund_cluster?: string | null
          id?: string
          location?: string | null
          ngas_number?: string | null
          office_center?: string | null
          par_ics_pos?: string | null
          par_ics_received_by?: string | null
          par_ics_ro?: string | null
          property_number?: string | null
          property_type?: string | null
          qty_physical_count?: number | null
          qty_property_card?: number | null
          qty_shortage_overage?: number | null
          remarks?: string | null
          serial_number?: string | null
          status?: string
          sub_location?: string | null
          tagging_number?: string | null
          total_cost?: number | null
          unit_of_measure?: string | null
          unit_value?: number | null
          updated_at?: string | null
          value_shortage_overage?: number | null
        }
        Update: {
          acquisition_date?: string | null
          actual_user?: string | null
          article?: string | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          end_user?: string | null
          fund_cluster?: string | null
          id?: string
          location?: string | null
          ngas_number?: string | null
          office_center?: string | null
          par_ics_pos?: string | null
          par_ics_received_by?: string | null
          par_ics_ro?: string | null
          property_number?: string | null
          property_type?: string | null
          qty_physical_count?: number | null
          qty_property_card?: number | null
          qty_shortage_overage?: number | null
          remarks?: string | null
          serial_number?: string | null
          status?: string
          sub_location?: string | null
          tagging_number?: string | null
          total_cost?: number | null
          unit_of_measure?: string | null
          unit_value?: number | null
          updated_at?: string | null
          value_shortage_overage?: number | null
        }
        Relationships: []
      }
      pending_edits: {
        Row: {
          changes: Json
          created_at: string | null
          id: string
          item_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_by: string
        }
        Insert: {
          changes: Json
          created_at?: string | null
          id?: string
          item_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by: string
        }
        Update: {
          changes?: Json
          created_at?: string | null
          id?: string
          item_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_edits_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_edits_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_edits_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          firstname: string | null
          id: string
          lastname: string | null
          updated_at: string | null
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          firstname?: string | null
          id: string
          lastname?: string | null
          updated_at?: string | null
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          firstname?: string | null
          id?: string
          lastname?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
