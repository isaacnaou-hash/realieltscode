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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      certificates: {
        Row: {
          certificate_id: string
          created_at: string | null
          id: string
          issued_at: string | null
          test_attempt_id: string
          user_id: string
        }
        Insert: {
          certificate_id: string
          created_at?: string | null
          id?: string
          issued_at?: string | null
          test_attempt_id: string
          user_id: string
        }
        Update: {
          certificate_id?: string
          created_at?: string | null
          id?: string
          issued_at?: string | null
          test_attempt_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_test_attempt_id_fkey"
            columns: ["test_attempt_id"]
            isOneToOne: true
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_rubric: {
        Row: {
          cefr_level: string
          created_at: string | null
          id: string
          ielts_band: string
          max_score: number
          min_score: number
          performance_summary: string
          total_marks: number
        }
        Insert: {
          cefr_level: string
          created_at?: string | null
          id?: string
          ielts_band: string
          max_score: number
          min_score: number
          performance_summary: string
          total_marks: number
        }
        Update: {
          cefr_level?: string
          created_at?: string | null
          id?: string
          ielts_band?: string
          max_score?: number
          min_score?: number
          performance_summary?: string
          total_marks?: number
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          paystack_response: Json | null
          purpose: string
          reference: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          paystack_response?: Json | null
          purpose: string
          reference: string
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          paystack_response?: Json | null
          purpose?: string
          reference?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone_number: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          phone_number: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone_number?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      test_attempts: {
        Row: {
          answers: Json | null
          attempt_number: number
          created_at: string | null
          id: string
          listening_cefr: string | null
          listening_ielts_band: string | null
          listening_score: number | null
          overall_cefr: string | null
          overall_ielts_band: string | null
          overall_score: number | null
          reading_cefr: string | null
          reading_ielts_band: string | null
          reading_score: number | null
          speaking_cefr: string | null
          speaking_ielts_band: string | null
          speaking_score: number | null
          status: string
          test_date: string | null
          updated_at: string | null
          user_id: string
          writing_cefr: string | null
          writing_ielts_band: string | null
          writing_score: number | null
        }
        Insert: {
          answers?: Json | null
          attempt_number: number
          created_at?: string | null
          id?: string
          listening_cefr?: string | null
          listening_ielts_band?: string | null
          listening_score?: number | null
          overall_cefr?: string | null
          overall_ielts_band?: string | null
          overall_score?: number | null
          reading_cefr?: string | null
          reading_ielts_band?: string | null
          reading_score?: number | null
          speaking_cefr?: string | null
          speaking_ielts_band?: string | null
          speaking_score?: number | null
          status: string
          test_date?: string | null
          updated_at?: string | null
          user_id: string
          writing_cefr?: string | null
          writing_ielts_band?: string | null
          writing_score?: number | null
        }
        Update: {
          answers?: Json | null
          attempt_number?: number
          created_at?: string | null
          id?: string
          listening_cefr?: string | null
          listening_ielts_band?: string | null
          listening_score?: number | null
          overall_cefr?: string | null
          overall_ielts_band?: string | null
          overall_score?: number | null
          reading_cefr?: string | null
          reading_ielts_band?: string | null
          reading_score?: number | null
          speaking_cefr?: string | null
          speaking_ielts_band?: string | null
          speaking_score?: number | null
          status?: string
          test_date?: string | null
          updated_at?: string | null
          user_id?: string
          writing_cefr?: string | null
          writing_ielts_band?: string | null
          writing_score?: number | null
        }
        Relationships: []
      }
      test_questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          id: string
          options: Json | null
          points: number
          question_text: string
          question_type: string
          section: string
          updated_at: string | null
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          id: string
          options?: Json | null
          points?: number
          question_text: string
          question_type: string
          section: string
          updated_at?: string | null
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          id?: string
          options?: Json | null
          points?: number
          question_text?: string
          question_type?: string
          section?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      writing_grading_criteria: {
        Row: {
          created_at: string | null
          criterion_description: string
          criterion_name: string
          id: string
          weight_percentage: number
        }
        Insert: {
          created_at?: string | null
          criterion_description: string
          criterion_name: string
          id?: string
          weight_percentage?: number
        }
        Update: {
          created_at?: string | null
          criterion_description?: string
          criterion_name?: string
          id?: string
          weight_percentage?: number
        }
        Relationships: []
      }
      writing_ielts_cefr_mapping: {
        Row: {
          cefr_level: string
          created_at: string | null
          description: string
          id: string
          ielts_band_max: number
          ielts_band_min: number
        }
        Insert: {
          cefr_level: string
          created_at?: string | null
          description: string
          id?: string
          ielts_band_max: number
          ielts_band_min: number
        }
        Update: {
          cefr_level?: string
          created_at?: string | null
          description?: string
          id?: string
          ielts_band_max?: number
          ielts_band_min?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_overall_cefr: {
        Args: {
          listening_score: number
          reading_score: number
          speaking_score: number
          writing_score: number
        }
        Returns: {
          overall_cefr: string
          overall_ielts_band: string
          overall_performance: string
        }[]
      }
      get_cefr_level: {
        Args: { score: number; total_marks?: number }
        Returns: {
          cefr_level: string
          ielts_band: string
          performance_summary: string
        }[]
      }
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
