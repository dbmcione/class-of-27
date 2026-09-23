/**
 * Hand-maintained mirror of supabase/schema.sql.
 * Regenerate with:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */

export type Database = {
  public: {
    Tables: {
      colleges: {
        Row: {
          id: string;
          name: string;
          country: string;
          state: string | null;
          zone: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          country?: string;
          state?: string | null;
          zone?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['colleges']['Insert']>;
        Relationships: [];
      };
      players: {
        Row: {
          id: string;
          college_id: string;
          phone: string;
          name: string | null;
          stage: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          college_id: string;
          phone: string;
          name?: string | null;
          stage?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['players']['Insert']>;
        Relationships: [];
      };
      player_answers: {
        Row: {
          player_id: string;
          question_key: string;
          answer: string;
          answered_at: string;
        };
        Insert: {
          player_id: string;
          question_key: string;
          answer: string;
          answered_at?: string;
        };
        Update: Partial<Database['public']['Tables']['player_answers']['Insert']>;
        Relationships: [];
      };
      player_seen_puzzles: {
        Row: {
          player_id: string;
          puzzle_id: string;
          seen_at: string;
        };
        Insert: {
          player_id: string;
          puzzle_id: string;
          seen_at?: string;
        };
        Update: Partial<Database['public']['Tables']['player_seen_puzzles']['Insert']>;
        Relationships: [];
      };
      puzzle_results: {
        Row: {
          id: string;
          player_id: string;
          puzzle_id: string;
          solved: boolean;
          seconds: number;
          wrong_guesses: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          puzzle_id: string;
          solved: boolean;
          seconds: number;
          wrong_guesses: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['puzzle_results']['Insert']>;
        Relationships: [];
      };
      round_scores: {
        Row: {
          id: string;
          player_id: string;
          college_id: string;
          solved: number;
          total: number;
          total_seconds: number;
          created_at: string;
          /** Share code for this round's answers page. Null for rounds
              written before play links existed. */
          code: string | null;
          detail: unknown;
        };
        Insert: {
          id?: string;
          player_id: string;
          college_id: string;
          solved: number;
          total: number;
          total_seconds: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['round_scores']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      register_player: {
        Args: { p_college_id: string; p_phone: string };
        Returns: string;
      };
      lookup_player: {
        Args: { p_phone: string };
        Returns: {
          player_id: string;
          display_name: string;
          college_id: string;
          college_name: string;
          intake_complete: boolean;
        }[];
      };
      save_intake: {
        Args: {
          p_player_id: string;
          p_name: string;
          p_stage: string;
          p_answers: Record<string, string>;
        };
        Returns: undefined;
      };
      college_leaderboard: {
        Args: { p_college_id: string; p_limit?: number };
        Returns: {
          rank: number;
          player_id: string;
          display_name: string;
          solved: number;
          total: number;
          total_seconds: number;
        }[];
      };
      save_round: {
        Args: {
          p_player_id: string;
          p_college_id: string;
          p_solved: number;
          p_total: number;
          p_total_seconds: number;
          p_results: {
            puzzleId: string;
            solved: boolean;
            seconds: number;
            wrongGuesses: number;
          }[];
        };
        /** The share code for the round just written. */
        Returns: string;
      };
      get_play: {
        Args: { p_code: string };
        Returns: {
          first_name: string | null;
          solved: number;
          total: number;
          total_seconds: number;
          detail: unknown;
          played_at: string;
        }[];
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type CollegeRow = Database['public']['Tables']['colleges']['Row'];
