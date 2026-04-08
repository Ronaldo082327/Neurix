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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          badge_description: string | null
          badge_icon: string
          badge_key: string
          badge_name: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_description?: string | null
          badge_icon?: string
          badge_key: string
          badge_name: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_description?: string | null
          badge_icon?: string
          badge_key?: string
          badge_name?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      cognitive_metrics: {
        Row: {
          accuracy_rate: number | null
          avg_mastery: number | null
          avg_retention: number | null
          created_at: string
          id: string
          metric_date: string
          questions_attempted: number | null
          questions_correct: number | null
          streak_days: number | null
          topics_studied: number | null
          total_study_minutes: number | null
          user_id: string
        }
        Insert: {
          accuracy_rate?: number | null
          avg_mastery?: number | null
          avg_retention?: number | null
          created_at?: string
          id?: string
          metric_date?: string
          questions_attempted?: number | null
          questions_correct?: number | null
          streak_days?: number | null
          topics_studied?: number | null
          total_study_minutes?: number | null
          user_id: string
        }
        Update: {
          accuracy_rate?: number | null
          avg_mastery?: number | null
          avg_retention?: number | null
          created_at?: string
          id?: string
          metric_date?: string
          questions_attempted?: number | null
          questions_correct?: number | null
          streak_days?: number | null
          topics_studied?: number | null
          total_study_minutes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      cognitive_states: {
        Row: {
          concept_node_id: string
          correct_count: number
          created_at: string
          id: string
          incorrect_count: number
          last_interaction_at: string | null
          next_review_at: string | null
          p_guess: number
          p_learn: number
          p_mastery: number
          p_slip: number
          retention_score: number
          review_count: number
          stability: number
          updated_at: string
          user_id: string
        }
        Insert: {
          concept_node_id: string
          correct_count?: number
          created_at?: string
          id?: string
          incorrect_count?: number
          last_interaction_at?: string | null
          next_review_at?: string | null
          p_guess?: number
          p_learn?: number
          p_mastery?: number
          p_slip?: number
          retention_score?: number
          review_count?: number
          stability?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          concept_node_id?: string
          correct_count?: number
          created_at?: string
          id?: string
          incorrect_count?: number
          last_interaction_at?: string | null
          next_review_at?: string | null
          p_guess?: number
          p_learn?: number
          p_mastery?: number
          p_slip?: number
          retention_score?: number
          review_count?: number
          stability?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cognitive_states_concept_node_id_fkey"
            columns: ["concept_node_id"]
            isOneToOne: false
            referencedRelation: "concept_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      concept_edges: {
        Row: {
          created_at: string
          id: string
          relationship_type: string
          source_node_id: string
          target_node_id: string
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          relationship_type?: string
          source_node_id: string
          target_node_id: string
          user_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          relationship_type?: string
          source_node_id?: string
          target_node_id?: string
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "concept_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "concept_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "concept_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      concept_interactions: {
        Row: {
          concept_node_id: string
          created_at: string
          id: string
          interaction_type: string
          is_correct: boolean | null
          metadata: Json | null
          user_id: string
        }
        Insert: {
          concept_node_id: string
          created_at?: string
          id?: string
          interaction_type: string
          is_correct?: boolean | null
          metadata?: Json | null
          user_id: string
        }
        Update: {
          concept_node_id?: string
          created_at?: string
          id?: string
          interaction_type?: string
          is_correct?: boolean | null
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concept_interactions_concept_node_id_fkey"
            columns: ["concept_node_id"]
            isOneToOne: false
            referencedRelation: "concept_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      concept_nodes: {
        Row: {
          created_at: string
          description: string | null
          discipline_id: string | null
          id: string
          importance: number
          name: string
          source_type: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discipline_id?: string | null
          id?: string
          importance?: number
          name: string
          source_type?: string
          topic_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discipline_id?: string | null
          id?: string
          importance?: number
          name?: string
          source_type?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concept_nodes_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_nodes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplines: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          relevance: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          relevance?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          relevance?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_annotations: {
        Row: {
          annotation_data: Json
          created_at: string
          document_id: string
          id: string
          page_number: number
          updated_at: string
          user_id: string
        }
        Insert: {
          annotation_data?: Json
          created_at?: string
          document_id: string
          id?: string
          page_number: number
          updated_at?: string
          user_id: string
        }
        Update: {
          annotation_data?: Json
          created_at?: string
          document_id?: string
          id?: string
          page_number?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_annotations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          discipline_id: string | null
          file_path: string
          file_size: number | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discipline_id?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          discipline_id?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_reviews: {
        Row: {
          created_at: string
          flashcard_id: string
          id: string
          quality_rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          flashcard_id: string
          id?: string
          quality_rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          flashcard_id?: string
          id?: string
          quality_rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_reviews_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back_text: string
          concept_node_id: string | null
          created_at: string
          discipline_id: string | null
          ease_factor: number
          front_text: string
          id: string
          interval_days: number
          last_reviewed_at: string | null
          next_review_at: string | null
          repetitions: number
          source: string | null
          topic_id: string | null
          user_id: string
        }
        Insert: {
          back_text: string
          concept_node_id?: string | null
          created_at?: string
          discipline_id?: string | null
          ease_factor?: number
          front_text: string
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_at?: string | null
          repetitions?: number
          source?: string | null
          topic_id?: string | null
          user_id: string
        }
        Update: {
          back_text?: string
          concept_node_id?: string | null
          created_at?: string
          discipline_id?: string | null
          ease_factor?: number
          front_text?: string
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_at?: string | null
          repetitions?: number
          source?: string | null
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_concept_node_id_fkey"
            columns: ["concept_node_id"]
            isOneToOne: false
            referencedRelation: "concept_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_profiles: {
        Row: {
          created_at: string
          id: string
          last_activity_date: string | null
          level: number
          longest_streak: number
          streak_days: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          streak_days?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          streak_days?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      goals: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          target_accuracy: number | null
          target_hours_weekly: number | null
          title: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          target_accuracy?: number | null
          target_hours_weekly?: number | null
          title: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          target_accuracy?: number | null
          target_hours_weekly?: number | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string | null
          created_at: string
          discipline_id: string | null
          document_id: string | null
          id: string
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          discipline_id?: string | null
          document_id?: string | null
          id?: string
          title: string
          topic_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          discipline_id?: string | null
          document_id?: string | null
          id?: string
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_launch_signups: {
        Row: {
          created_at: string
          current_stage: string | null
          email: string
          how_found_us: string | null
          id: string
          name: string
          phone: string | null
          study_area: string | null
          wants_beta: boolean | null
        }
        Insert: {
          created_at?: string
          current_stage?: string | null
          email: string
          how_found_us?: string | null
          id?: string
          name: string
          phone?: string | null
          study_area?: string | null
          wants_beta?: boolean | null
        }
        Update: {
          created_at?: string
          current_stage?: string | null
          email?: string
          how_found_us?: string | null
          id?: string
          name?: string
          phone?: string | null
          study_area?: string | null
          wants_beta?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          daily_hours: number | null
          display_name: string | null
          exam_date: string | null
          id: string
          onboarding_completed: boolean | null
          preparation_level: string | null
          subscription_plan: string | null
          target_exam: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_hours?: number | null
          display_name?: string | null
          exam_date?: string | null
          id?: string
          onboarding_completed?: boolean | null
          preparation_level?: string | null
          subscription_plan?: string | null
          target_exam?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_hours?: number | null
          display_name?: string | null
          exam_date?: string | null
          id?: string
          onboarding_completed?: boolean | null
          preparation_level?: string | null
          subscription_plan?: string | null
          target_exam?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      question_attempts: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_option_id: string | null
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          selected_option_id?: string | null
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_option_id?: string | null
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_attempts_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "question_options"
            referencedColumns: ["id"]
          },
        ]
      }
      question_options: {
        Row: {
          id: string
          is_correct: boolean
          option_order: number
          option_text: string
          question_id: string
        }
        Insert: {
          id?: string
          is_correct?: boolean
          option_order?: number
          option_text: string
          question_id: string
        }
        Update: {
          id?: string
          is_correct?: boolean
          option_order?: number
          option_text?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          concept_node_id: string | null
          created_at: string
          difficulty: number
          discipline_id: string | null
          explanation: string | null
          id: string
          question_text: string
          source: string | null
          topic_id: string | null
          user_id: string
        }
        Insert: {
          concept_node_id?: string | null
          created_at?: string
          difficulty?: number
          discipline_id?: string | null
          explanation?: string | null
          id?: string
          question_text: string
          source?: string | null
          topic_id?: string | null
          user_id: string
        }
        Update: {
          concept_node_id?: string | null
          created_at?: string
          difficulty?: number
          discipline_id?: string | null
          explanation?: string | null
          id?: string
          question_text?: string
          source?: string | null
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_concept_node_id_fkey"
            columns: ["concept_node_id"]
            isOneToOne: false
            referencedRelation: "concept_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          interval_days: number
          quality_rating: number | null
          scheduled_at: string
          status: string
          topic_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          interval_days?: number
          quality_rating?: number | null
          scheduled_at: string
          status?: string
          topic_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          interval_days?: number
          quality_rating?: number | null
          scheduled_at?: string
          status?: string
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          created_at: string
          discipline_id: string | null
          duration_minutes: number
          ended_at: string
          id: string
          notes: string | null
          questions_attempted: number | null
          questions_correct: number | null
          started_at: string
          topic_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          discipline_id?: string | null
          duration_minutes: number
          ended_at: string
          id?: string
          notes?: string | null
          questions_attempted?: number | null
          questions_correct?: number | null
          started_at: string
          topic_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          discipline_id?: string | null
          duration_minutes?: number
          ended_at?: string
          id?: string
          notes?: string | null
          questions_attempted?: number | null
          questions_correct?: number | null
          started_at?: string
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      study_tasks: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          discipline_id: string | null
          duration_minutes: number | null
          id: string
          scheduled_date: string
          scheduled_time: string | null
          source: string | null
          title: string
          topic_id: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          discipline_id?: string | null
          duration_minutes?: number | null
          id?: string
          scheduled_date: string
          scheduled_time?: string | null
          source?: string | null
          title: string
          topic_id?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          discipline_id?: string | null
          duration_minutes?: number | null
          id?: string
          scheduled_date?: string
          scheduled_time?: string | null
          source?: string | null
          title?: string
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_tasks_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_tasks_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          discipline_id: string
          id: string
          last_studied_at: string | null
          mastery_score: number | null
          name: string
          next_review_at: string | null
          priority_score: number | null
          relevance: number | null
          retention_score: number | null
          review_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discipline_id: string
          id?: string
          last_studied_at?: string | null
          mastery_score?: number | null
          name: string
          next_review_at?: string | null
          priority_score?: number | null
          relevance?: number | null
          retention_score?: number | null
          review_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discipline_id?: string
          id?: string
          last_studied_at?: string | null
          mastery_score?: number | null
          name?: string
          next_review_at?: string | null
          priority_score?: number | null
          relevance?: number | null
          retention_score?: number | null
          review_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_events: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          user_id: string
          xp_amount: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          user_id: string
          xp_amount: number
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          user_id?: string
          xp_amount?: number
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
