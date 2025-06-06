import { supabase } from '@/integrations/supabase/client';
import { WalletContextService } from '@/services/walletContextService';
import { realCardanoDEXService } from '@/services/realCardanoDEXService';
import type { RealMarketMakingPosition, PositionCreationParams } from '@/types/marketMakingTypes';
import { PositionCalculationsService } from './positionCalculationsService';

export class MarketMakingPositionsService {
  static async fetchPositions(walletAddress: string): Promise<RealMarketMakingPosition[]> {
    const { data, error } = await WalletContextService.executeWithWalletContext(
      walletAddress,
      async () => {
        return await supabase
          .from('market_making_positions')
          .select('*')
          .order('created_at', { ascending: false });
      }
    );

    if (error) {
      console.error('Error fetching positions:', error);
      return [];
    }

    return (data || []).map(this.mapDatabaseToPosition);
  }

  static async createPosition(
    params: PositionCreationParams,
    walletAddress: string
  ): Promise<{ success: boolean; position?: RealMarketMakingPosition; error?: string }> {
    try {
      console.log('🔄 Creating new market making position...');

      // Calculate initial metrics
      const liquidityProvided = (params.tokenAAmount * params.priceA) + (params.tokenBAmount * params.priceB);
      const lpTokenAmount = Math.sqrt(params.tokenAAmount * params.tokenBAmount);

      // First create the position in database
      const { data: positionData, error: positionError } = await WalletContextService.executeWithWalletContext(
        walletAddress,
        async () => {
          return await supabase
            .from('market_making_positions')
            .insert({
              user_wallet: walletAddress,
              pair: params.pair,
              dex: params.dex,
              token_a_amount: params.tokenAAmount,
              token_b_amount: params.tokenBAmount,
              entry_price_a: params.priceA,
              entry_price_b: params.priceB,
              liquidity_provided: liquidityProvided,
              lp_token_amount: lpTokenAmount,
              current_spread: 0,
              volume_24h: 0,
              fees_earned: 0,
              impermanent_loss: 0,
              apy: 0,
              status: 'active'
            })
            .select()
            .single();
        }
      );

      if (positionError || !positionData) {
        console.error('Error creating position:', positionError);
        return { success: false, error: 'Failed to store position in database' };
      }

      // Now add liquidity through DEX service with the position ID
      const dexResult = await realCardanoDEXService.addLiquidityToPool(
        params.dex,
        params.pair,
        params.tokenAAmount,
        params.tokenBAmount,
        walletAddress,
        params.priceA,
        params.priceB,
        positionData.id
      );

      if (!dexResult.success) {
        // If DEX operation fails, we should remove the position we just created
        await WalletContextService.executeWithWalletContext(
          walletAddress,
          async () => {
            return await supabase
              .from('market_making_positions')
              .delete()
              .eq('id', positionData.id);
          }
        );
        return { success: false, error: dexResult.error };
      }

      const position = this.mapDatabaseToPosition(positionData);
      console.log('✅ Position created successfully:', position.id);
      
      return { success: true, position };
    } catch (error) {
      console.error('Error in createPosition:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async removePosition(
    positionId: string,
    walletAddress: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Removing position:', positionId);

      // Remove liquidity through DEX service
      const dexResult = await realCardanoDEXService.removeLiquidityFromPool(positionId, walletAddress);
      
      if (!dexResult.success) {
        return { success: false, error: dexResult.error };
      }

      // Update position status in database
      const { error } = await WalletContextService.executeWithWalletContext(
        walletAddress,
        async () => {
          return await supabase
            .from('market_making_positions')
            .update({ 
              status: 'closed',
              updated_at: new Date().toISOString()
            })
            .eq('id', positionId);
        }
      );

      if (error) {
        console.error('Error updating position status:', error);
        return { success: false, error: 'Failed to update position status' };
      }

      console.log('✅ Position removed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error removing position:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async togglePositionStatus(
    positionId: string,
    walletAddress: string
  ): Promise<{ success: boolean; newStatus?: 'active' | 'paused'; error?: string }> {
    try {
      // Get current position
      const { data: position, error: fetchError } = await WalletContextService.executeWithWalletContext(
        walletAddress,
        async () => {
          return await supabase
            .from('market_making_positions')
            .select('status')
            .eq('id', positionId)
            .single();
        }
      );

      if (fetchError || !position) {
        return { success: false, error: 'Position not found' };
      }

      const newStatus = position.status === 'active' ? 'paused' : 'active';

      const { error } = await WalletContextService.executeWithWalletContext(
        walletAddress,
        async () => {
          return await supabase
            .from('market_making_positions')
            .update({ 
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', positionId);
        }
      );

      if (error) {
        console.error('Error toggling position status:', error);
        return { success: false, error: 'Failed to update position status' };
      }

      return { success: true, newStatus };
    } catch (error) {
      console.error('Error toggling position:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async updatePositionMetrics(
    positionId: string,
    walletAddress: string,
    currentPriceA: number,
    currentPriceB: number,
    newVolume?: number,
    newFeesEarned?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current position
      const { data: positionData, error: fetchError } = await WalletContextService.executeWithWalletContext(
        walletAddress,
        async () => {
          return await supabase
            .from('market_making_positions')
            .select('*')
            .eq('id', positionId)
            .single();
        }
      );

      if (fetchError || !positionData) {
        return { success: false, error: 'Position not found' };
      }

      const position = this.mapDatabaseToPosition(positionData);
      const updatedMetrics = PositionCalculationsService.updatePositionMetrics(
        position,
        currentPriceA,
        currentPriceB,
        newFeesEarned
      );

      const updateData: any = {
        current_spread: updatedMetrics.currentSpread,
        impermanent_loss: updatedMetrics.impermanentLoss,
        fees_earned: updatedMetrics.feesEarned,
        apy: updatedMetrics.apy,
        updated_at: updatedMetrics.updatedAt
      };

      if (newVolume !== undefined) {
        updateData.volume_24h = newVolume;
      }

      const { error } = await WalletContextService.executeWithWalletContext(
        walletAddress,
        async () => {
          return await supabase
            .from('market_making_positions')
            .update(updateData)
            .eq('id', positionId);
        }
      );

      if (error) {
        console.error('Error updating position metrics:', error);
        return { success: false, error: 'Failed to update position metrics' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating position metrics:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private static mapDatabaseToPosition(data: any): RealMarketMakingPosition {
    return {
      id: data.id,
      pair: data.pair,
      dex: data.dex,
      liquidityProvided: Number(data.liquidity_provided),
      currentSpread: Number(data.current_spread),
      volume24h: Number(data.volume_24h),
      feesEarned: Number(data.fees_earned),
      impermanentLoss: Number(data.impermanent_loss),
      apy: Number(data.apy),
      status: data.status,
      tokenAAmount: Number(data.token_a_amount),
      tokenBAmount: Number(data.token_b_amount),
      entryPriceA: Number(data.entry_price_a),
      entryPriceB: Number(data.entry_price_b),
      poolAddress: data.pool_address,
      lpTokenAmount: data.lp_token_amount ? Number(data.lp_token_amount) : undefined,
      lastRebalance: data.last_rebalance,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}
