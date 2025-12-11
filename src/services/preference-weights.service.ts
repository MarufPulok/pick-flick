/**
 * Preference Weights Service
 * Manages learning from user feedback (likes/dislikes) to improve recommendations
 */

import { PreferenceWeightsModel } from '@/infrastructure/db/models';
import { logger } from '@/lib/logger';

// Weight adjustment constants
const LIKE_BOOST = 5;      // Points added for a like
const DISLIKE_PENALTY = 3; // Points subtracted for a dislike
const MIN_WEIGHT = 0;      // Minimum weight value
const MAX_WEIGHT = 100;    // Maximum weight value
const DEFAULT_WEIGHT = 50; // Starting weight for new items

interface UpdateWeightsParams {
  userId: string;
  action: 'LIKED' | 'DISLIKED';
  genreIds: number[];
  contentType: string;
  language: string;
}

export class PreferenceWeightsService {
  /**
   * Update preference weights based on user action
   * LIKED: Increase genre/language/contentType weights
   * DISLIKED: Decrease genre/language/contentType weights
   */
  static async updateWeights(params: UpdateWeightsParams): Promise<void> {
    const { userId, action, genreIds, contentType, language } = params;
    const isLike = action === 'LIKED';

    // Find or create weights document for user
    let weights = await PreferenceWeightsModel.findOne({ userId });
    
    if (!weights) {
      weights = new PreferenceWeightsModel({
        userId,
        genreWeights: new Map(),
        contentTypeWeights: new Map([
          ['MOVIE', DEFAULT_WEIGHT],
          ['SERIES', DEFAULT_WEIGHT],
          ['ANIME', DEFAULT_WEIGHT],
        ]),
        languageWeights: new Map(),
        totalLikes: 0,
        totalDislikes: 0,
      });
    }

    // Update genre weights
    for (const genreId of genreIds) {
      const genreKey = String(genreId);
      const currentWeight = weights.genreWeights.get(genreKey) ?? DEFAULT_WEIGHT;
      const newWeight = this.calculateNewWeight(currentWeight, isLike);
      weights.genreWeights.set(genreKey, newWeight);
    }

    // Update content type weight
    if (contentType) {
      const currentTypeWeight = weights.contentTypeWeights.get(contentType) ?? DEFAULT_WEIGHT;
      const newTypeWeight = this.calculateNewWeight(currentTypeWeight, isLike);
      weights.contentTypeWeights.set(contentType, newTypeWeight);
    }

    // Update language weight
    if (language) {
      const currentLangWeight = weights.languageWeights.get(language) ?? DEFAULT_WEIGHT;
      const newLangWeight = this.calculateNewWeight(currentLangWeight, isLike);
      weights.languageWeights.set(language, newLangWeight);
    }

    // Update totals
    if (isLike) {
      weights.totalLikes = (weights.totalLikes || 0) + 1;
    } else {
      weights.totalDislikes = (weights.totalDislikes || 0) + 1;
    }

    await weights.save();
    
    logger.debug(`Updated weights for user ${userId}: ${action} on ${contentType} with genres [${genreIds.join(', ')}]`);
  }

  /**
   * Calculate new weight after adjustment
   * Clamps result between MIN_WEIGHT and MAX_WEIGHT
   */
  private static calculateNewWeight(currentWeight: number, isLike: boolean): number {
    const adjustment = isLike ? LIKE_BOOST : -DISLIKE_PENALTY;
    const newWeight = currentWeight + adjustment;
    return Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, newWeight));
  }

  /**
   * Get current preference weights for a user
   */
  static async getWeights(userId: string) {
    const weights = await PreferenceWeightsModel.findOne({ userId }).lean();
    
    if (!weights) {
      return null;
    }

    return {
      genreWeights: weights.genreWeights ? Object.fromEntries(weights.genreWeights) : {},
      contentTypeWeights: weights.contentTypeWeights ? Object.fromEntries(weights.contentTypeWeights) : {},
      languageWeights: weights.languageWeights ? Object.fromEntries(weights.languageWeights) : {},
      totalLikes: weights.totalLikes || 0,
      totalDislikes: weights.totalDislikes || 0,
    };
  }

  /**
   * Get top weighted genres for a user (for prioritizing in recommendations)
   * Returns genre IDs sorted by weight (highest first)
   */
  static async getTopGenres(userId: string, limit: number = 5): Promise<string[]> {
    const weights = await this.getWeights(userId);
    
    if (!weights || Object.keys(weights.genreWeights).length === 0) {
      return [];
    }

    const entries = Object.entries(weights.genreWeights);
    entries.sort((a, b) => (b[1] as number) - (a[1] as number));
    
    return entries.slice(0, limit).map(([genreId]) => genreId);
  }

  /**
   * Get preferred content type ordering based on weights
   */
  static async getContentTypeOrder(userId: string): Promise<string[]> {
    const weights = await this.getWeights(userId);
    
    if (!weights || Object.keys(weights.contentTypeWeights).length === 0) {
      return ['MOVIE', 'SERIES', 'ANIME'];
    }

    const entries = Object.entries(weights.contentTypeWeights);
    entries.sort((a, b) => (b[1] as number) - (a[1] as number));
    
    return entries.map(([type]) => type);
  }

  /**
   * Reset weights for a user (useful for testing or user preference reset)
   */
  static async resetWeights(userId: string): Promise<void> {
    await PreferenceWeightsModel.findOneAndUpdate(
      { userId },
      {
        genreWeights: new Map(),
        contentTypeWeights: new Map([
          ['MOVIE', DEFAULT_WEIGHT],
          ['SERIES', DEFAULT_WEIGHT],
          ['ANIME', DEFAULT_WEIGHT],
        ]),
        languageWeights: new Map(),
        totalLikes: 0,
        totalDislikes: 0,
      },
      { upsert: true }
    );
  }
}
