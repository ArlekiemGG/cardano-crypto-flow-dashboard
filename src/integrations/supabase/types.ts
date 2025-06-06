export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      arbitrage_opportunities: {
        Row: {
          confidence_score: number | null
          dex_pair: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          price_a: number
          price_b: number
          price_diff: number
          profit_potential: number
          source_dex_a: string
          source_dex_b: string
          timestamp: string | null
          volume_available: number | null
        }
        Insert: {
          confidence_score?: number | null
          dex_pair: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          price_a: number
          price_b: number
          price_diff: number
          profit_potential: number
          source_dex_a: string
          source_dex_b: string
          timestamp?: string | null
          volume_available?: number | null
        }
        Update: {
          confidence_score?: number | null
          dex_pair?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          price_a?: number
          price_b?: number
          price_diff?: number
          profit_potential?: number
          source_dex_a?: string
          source_dex_b?: string
          timestamp?: string | null
          volume_available?: number | null
        }
        Relationships: []
      }
      dex_configs: {
        Row: {
          active: boolean | null
          api_endpoint: string | null
          config_json: Json | null
          dex_name: string
          fee_rate: number | null
          id: string
          last_updated: string | null
          websocket_url: string | null
        }
        Insert: {
          active?: boolean | null
          api_endpoint?: string | null
          config_json?: Json | null
          dex_name: string
          fee_rate?: number | null
          id?: string
          last_updated?: string | null
          websocket_url?: string | null
        }
        Update: {
          active?: boolean | null
          api_endpoint?: string | null
          config_json?: Json | null
          dex_name?: string
          fee_rate?: number | null
          id?: string
          last_updated?: string | null
          websocket_url?: string | null
        }
        Relationships: []
      }
      market_data_cache: {
        Row: {
          change_24h: number | null
          high_24h: number | null
          id: string
          low_24h: number | null
          market_cap: number | null
          pair: string
          price: number
          source_dex: string
          timestamp: string | null
          volume_24h: number | null
        }
        Insert: {
          change_24h?: number | null
          high_24h?: number | null
          id?: string
          low_24h?: number | null
          market_cap?: number | null
          pair: string
          price: number
          source_dex: string
          timestamp?: string | null
          volume_24h?: number | null
        }
        Update: {
          change_24h?: number | null
          high_24h?: number | null
          id?: string
          low_24h?: number | null
          market_cap?: number | null
          pair?: string
          price?: number
          source_dex?: string
          timestamp?: string | null
          volume_24h?: number | null
        }
        Relationships: []
      }
      market_making_positions: {
        Row: {
          apy: number
          created_at: string
          current_spread: number
          dex: string
          entry_price_a: number
          entry_price_b: number
          fees_earned: number
          id: string
          impermanent_loss: number
          last_rebalance: string | null
          liquidity_provided: number
          lp_token_amount: number | null
          pair: string
          pool_address: string | null
          status: string
          token_a_amount: number
          token_b_amount: number
          updated_at: string
          user_wallet: string
          volume_24h: number
        }
        Insert: {
          apy?: number
          created_at?: string
          current_spread?: number
          dex: string
          entry_price_a: number
          entry_price_b: number
          fees_earned?: number
          id?: string
          impermanent_loss?: number
          last_rebalance?: string | null
          liquidity_provided: number
          lp_token_amount?: number | null
          pair: string
          pool_address?: string | null
          status?: string
          token_a_amount: number
          token_b_amount: number
          updated_at?: string
          user_wallet: string
          volume_24h?: number
        }
        Update: {
          apy?: number
          created_at?: string
          current_spread?: number
          dex?: string
          entry_price_a?: number
          entry_price_b?: number
          fees_earned?: number
          id?: string
          impermanent_loss?: number
          last_rebalance?: string | null
          liquidity_provided?: number
          lp_token_amount?: number | null
          pair?: string
          pool_address?: string | null
          status?: string
          token_a_amount?: number
          token_b_amount?: number
          updated_at?: string
          user_wallet?: string
          volume_24h?: number
        }
        Relationships: []
      }
      market_making_strategies: {
        Row: {
          active: boolean
          auto_compound: boolean
          config_json: Json | null
          created_at: string
          dex: string
          id: string
          max_spread: number
          min_spread: number
          name: string
          pair: string
          rebalance_threshold: number
          strategy_type: string
          updated_at: string
          user_wallet: string
        }
        Insert: {
          active?: boolean
          auto_compound?: boolean
          config_json?: Json | null
          created_at?: string
          dex: string
          id?: string
          max_spread?: number
          min_spread?: number
          name: string
          pair: string
          rebalance_threshold?: number
          strategy_type: string
          updated_at?: string
          user_wallet: string
        }
        Update: {
          active?: boolean
          auto_compound?: boolean
          config_json?: Json | null
          created_at?: string
          dex?: string
          id?: string
          max_spread?: number
          min_spread?: number
          name?: string
          pair?: string
          rebalance_threshold?: number
          strategy_type?: string
          updated_at?: string
          user_wallet?: string
        }
        Relationships: []
      }
      market_making_transactions: {
        Row: {
          amount_a: number | null
          amount_b: number | null
          confirmed_at: string | null
          created_at: string
          error_message: string | null
          gas_fee: number | null
          id: string
          metadata_json: Json | null
          position_id: string
          price_a: number | null
          price_b: number | null
          status: string
          transaction_type: string
          tx_hash: string | null
          user_wallet: string
        }
        Insert: {
          amount_a?: number | null
          amount_b?: number | null
          confirmed_at?: string | null
          created_at?: string
          error_message?: string | null
          gas_fee?: number | null
          id?: string
          metadata_json?: Json | null
          position_id: string
          price_a?: number | null
          price_b?: number | null
          status?: string
          transaction_type: string
          tx_hash?: string | null
          user_wallet: string
        }
        Update: {
          amount_a?: number | null
          amount_b?: number | null
          confirmed_at?: string | null
          created_at?: string
          error_message?: string | null
          gas_fee?: number | null
          id?: string
          metadata_json?: Json | null
          position_id?: string
          price_a?: number | null
          price_b?: number | null
          status?: string
          transaction_type?: string
          tx_hash?: string | null
          user_wallet?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_making_transactions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "market_making_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_metrics: {
        Row: {
          assets_allocation: Json | null
          daily_pnl: number | null
          monthly_pnl: number | null
          successful_trades: number | null
          total_trades: number | null
          total_value: number | null
          updated_at: string | null
          user_wallet: string
          weekly_pnl: number | null
        }
        Insert: {
          assets_allocation?: Json | null
          daily_pnl?: number | null
          monthly_pnl?: number | null
          successful_trades?: number | null
          total_trades?: number | null
          total_value?: number | null
          updated_at?: string | null
          user_wallet: string
          weekly_pnl?: number | null
        }
        Update: {
          assets_allocation?: Json | null
          daily_pnl?: number | null
          monthly_pnl?: number | null
          successful_trades?: number | null
          total_trades?: number | null
          total_value?: number | null
          updated_at?: string | null
          user_wallet?: string
          weekly_pnl?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_metrics_user_wallet_fkey"
            columns: ["user_wallet"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["wallet_address"]
          },
        ]
      }
      trade_history: {
        Row: {
          amount: number
          dex_name: string | null
          gas_fee: number | null
          id: string
          metadata_json: Json | null
          pair: string
          profit_loss: number | null
          status: Database["public"]["Enums"]["trade_status"] | null
          timestamp: string | null
          trade_type: Database["public"]["Enums"]["trade_type"]
          tx_hash: string | null
          user_wallet: string | null
        }
        Insert: {
          amount: number
          dex_name?: string | null
          gas_fee?: number | null
          id?: string
          metadata_json?: Json | null
          pair: string
          profit_loss?: number | null
          status?: Database["public"]["Enums"]["trade_status"] | null
          timestamp?: string | null
          trade_type: Database["public"]["Enums"]["trade_type"]
          tx_hash?: string | null
          user_wallet?: string | null
        }
        Update: {
          amount?: number
          dex_name?: string | null
          gas_fee?: number | null
          id?: string
          metadata_json?: Json | null
          pair?: string
          profit_loss?: number | null
          status?: Database["public"]["Enums"]["trade_status"] | null
          timestamp?: string | null
          trade_type?: Database["public"]["Enums"]["trade_type"]
          tx_hash?: string | null
          user_wallet?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_history_user_wallet_fkey"
            columns: ["user_wallet"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["wallet_address"]
          },
        ]
      }
      trading_strategies: {
        Row: {
          active: boolean | null
          config_json: Json
          created_at: string | null
          id: string
          last_execution: string | null
          name: string
          profit_loss: number | null
          strategy_type: Database["public"]["Enums"]["trading_strategy_type"]
          total_trades: number | null
          updated_at: string | null
          user_wallet: string | null
        }
        Insert: {
          active?: boolean | null
          config_json?: Json
          created_at?: string | null
          id?: string
          last_execution?: string | null
          name: string
          profit_loss?: number | null
          strategy_type: Database["public"]["Enums"]["trading_strategy_type"]
          total_trades?: number | null
          updated_at?: string | null
          user_wallet?: string | null
        }
        Update: {
          active?: boolean | null
          config_json?: Json
          created_at?: string | null
          id?: string
          last_execution?: string | null
          name?: string
          profit_loss?: number | null
          strategy_type?: Database["public"]["Enums"]["trading_strategy_type"]
          total_trades?: number | null
          updated_at?: string | null
          user_wallet?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trading_strategies_user_wallet_fkey"
            columns: ["user_wallet"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["wallet_address"]
          },
        ]
      }
      users: {
        Row: {
          api_keys_encrypted: string | null
          created_at: string | null
          is_active: boolean | null
          last_login: string | null
          settings_json: Json | null
          wallet_address: string
        }
        Insert: {
          api_keys_encrypted?: string | null
          created_at?: string | null
          is_active?: boolean | null
          last_login?: string | null
          settings_json?: Json | null
          wallet_address: string
        }
        Update: {
          api_keys_encrypted?: string | null
          created_at?: string | null
          is_active?: boolean | null
          last_login?: string | null
          settings_json?: Json | null
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_expired_arbitrage_opportunities: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_trading_strategy: {
        Args: {
          p_user_wallet: string
          p_name: string
          p_strategy_type: Database["public"]["Enums"]["trading_strategy_type"]
          p_config_json?: Json
        }
        Returns: string
      }
      delete_trading_strategy: {
        Args: { p_strategy_id: string; p_user_wallet: string }
        Returns: boolean
      }
      ensure_user_exists: {
        Args: { p_wallet_address: string }
        Returns: undefined
      }
      get_user_trading_strategies: {
        Args: { p_user_wallet: string }
        Returns: {
          id: string
          name: string
          strategy_type: Database["public"]["Enums"]["trading_strategy_type"]
          active: boolean
          profit_loss: number
          total_trades: number
          created_at: string
          config_json: Json
        }[]
      }
      set_current_user_wallet: {
        Args: { wallet_address: string }
        Returns: undefined
      }
      toggle_strategy_status: {
        Args: { p_strategy_id: string; p_user_wallet: string }
        Returns: boolean
      }
      update_portfolio_metrics: {
        Args: { p_user_wallet: string }
        Returns: undefined
      }
    }
    Enums: {
      trade_status: "pending" | "executed" | "failed" | "cancelled"
      trade_type: "buy" | "sell" | "arbitrage"
      trading_strategy_type:
        | "DCA"
        | "Grid"
        | "MeanReversion"
        | "Momentum"
        | "Arbitrage"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      trade_status: ["pending", "executed", "failed", "cancelled"],
      trade_type: ["buy", "sell", "arbitrage"],
      trading_strategy_type: [
        "DCA",
        "Grid",
        "MeanReversion",
        "Momentum",
        "Arbitrage",
      ],
    },
  },
} as const
