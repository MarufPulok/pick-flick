/**
 * Bytez AI Client
 * Wrapper for the Bytez SDK providing AI-powered features
 * 
 * Features:
 * - Mood analysis from viewing patterns
 * - Smart recommendation reasoning
 * - Collaborative filtering enhancements
 */

import { serverEnv } from '@/config/env.config';

// Type definitions for Bytez responses
interface BytezChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface MoodAnalysisResult {
  detectedMood: string;
  confidence: number;
  suggestedGenres: string[];
  reasoning: string;
}

interface SmartRecommendationResult {
  recommendedGenres: string[];
  timeContext: string;
  reasoning: string;
}

// Bytez model to use for chat completions
const BYTEZ_MODEL = 'Qwen/Qwen3-4B';

/**
 * Check if Bytez AI features are available
 */
export function isBytezAvailable(): boolean {
  return !!serverEnv.BYTEZ_API_KEY;
}

/**
 * Bytez AI Client class
 * Provides methods for AI-powered mood detection and recommendations
 */
export class BytezClient {
  private apiKey: string;
  private baseUrl = 'https://api.bytez.com/v1';

  constructor() {
    if (!serverEnv.BYTEZ_API_KEY) {
      throw new Error('BYTEZ_API_KEY is not configured. Set it in .env.local to enable AI features.');
    }
    this.apiKey = serverEnv.BYTEZ_API_KEY;
  }

  /**
   * Make a chat completion request to Bytez
   */
  private async chatCompletion(messages: BytezChatMessage[]): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: BYTEZ_MODEL,
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Bytez API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * Analyze user's viewing patterns to detect current mood
   * 
   * @param recentTitles - Recently watched/liked content titles
   * @param recentGenres - Recently engaged genre IDs
   * @param timeOfDay - Current time context (morning, afternoon, evening, night)
   * @returns Mood analysis with suggested genres
   */
  async analyzeMood(
    recentTitles: string[],
    recentGenres: string[],
    timeOfDay: string
  ): Promise<MoodAnalysisResult> {
    const systemPrompt = `You are a movie/TV recommendation AI assistant. Analyze the user's viewing patterns to detect their current mood and suggest relevant genres.

Respond in valid JSON format ONLY with this structure:
{
  "detectedMood": "string (e.g., 'relaxed', 'excited', 'thoughtful', 'adventurous')",
  "confidence": number (0-100),
  "suggestedGenres": ["genre1", "genre2", "genre3"],
  "reasoning": "Brief explanation"
}`;

    const userPrompt = `Based on these recent viewing patterns, analyze the user's mood:

Recent titles watched/liked: ${recentTitles.slice(0, 10).join(', ') || 'None'}
Recent genres: ${recentGenres.slice(0, 5).join(', ') || 'Not specified'}
Time of day: ${timeOfDay}

Detect their current mood and suggest 3-5 genres that would match well.`;

    try {
      const response = await this.chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      // Parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const parsed = JSON.parse(jsonMatch[0]) as MoodAnalysisResult;
      return {
        detectedMood: parsed.detectedMood || 'neutral',
        confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
        suggestedGenres: parsed.suggestedGenres || [],
        reasoning: parsed.reasoning || 'Based on viewing patterns',
      };
    } catch (error) {
      console.error('[Bytez] Mood analysis failed:', error);
      // Return fallback response
      return {
        detectedMood: 'neutral',
        confidence: 0,
        suggestedGenres: [],
        reasoning: 'AI analysis unavailable',
      };
    }
  }

  /**
   * Generate smart recommendation context based on user profile and time
   * 
   * @param userPreferences - User's preferred genres
   * @param recentActivity - Recent actions (liked, disliked)
   * @param timeContext - Time of day and weekend status
   * @returns Smart recommendation guidance
   */
  async generateSmartRecommendation(
    userPreferences: string[],
    recentActivity: { likes: string[]; dislikes: string[] },
    timeContext: { timeOfDay: string; isWeekend: boolean }
  ): Promise<SmartRecommendationResult> {
    const systemPrompt = `You are a movie/TV recommendation AI. Generate genre recommendations based on user preferences, recent activity, and time context.

Respond in valid JSON format ONLY with this structure:
{
  "recommendedGenres": ["genre1", "genre2"],
  "timeContext": "Brief context about why these genres fit the time",
  "reasoning": "Brief explanation"
}`;

    const userPrompt = `Generate recommendations for this user:

Preferred genres: ${userPreferences.join(', ') || 'Not specified'}
Recently liked: ${recentActivity.likes.slice(0, 5).join(', ') || 'None'}
Recently disliked: ${recentActivity.dislikes.slice(0, 5).join(', ') || 'None'}
Time: ${timeContext.timeOfDay} on a ${timeContext.isWeekend ? 'weekend' : 'weekday'}

Suggest 2-4 genres that would work well for this context.`;

    try {
      const response = await this.chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      // Parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const parsed = JSON.parse(jsonMatch[0]) as SmartRecommendationResult;
      return {
        recommendedGenres: parsed.recommendedGenres || [],
        timeContext: parsed.timeContext || '',
        reasoning: parsed.reasoning || 'Based on preferences and time',
      };
    } catch (error) {
      console.error('[Bytez] Smart recommendation failed:', error);
      // Return fallback response
      return {
        recommendedGenres: userPreferences.slice(0, 2),
        timeContext: `${timeContext.timeOfDay} viewing`,
        reasoning: 'Using default preferences (AI unavailable)',
      };
    }
  }

  /**
   * Enhance collaborative filtering with AI reasoning
   * When user-to-user similarity data is sparse
   * 
   * @param baseTitle - The title the user liked
   * @param candidateTitles - Potential recommendations
   * @returns Ranked titles with reasoning
   */
  async enhanceCollaborativeFiltering(
    baseTitle: string,
    candidateTitles: string[]
  ): Promise<{ title: string; score: number; reason: string }[]> {
    if (candidateTitles.length === 0) {
      return [];
    }

    const systemPrompt = `You are a movie/TV recommendation AI. Rank similar titles based on how likely someone who liked the base title would also enjoy them.

Respond in valid JSON format ONLY as an array:
[
  { "title": "string", "score": number (1-10), "reason": "brief reason" }
]`;

    const userPrompt = `A user liked: "${baseTitle}"

Rank these titles by similarity (return top 5):
${candidateTitles.slice(0, 10).map((t, i) => `${i + 1}. ${t}`).join('\n')}`;

    try {
      const response = await this.chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      // Parse JSON array from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const parsed = JSON.parse(jsonMatch[0]) as { title: string; score: number; reason: string }[];
      return parsed.slice(0, 5).map(item => ({
        title: item.title || '',
        score: Math.min(10, Math.max(1, item.score || 5)),
        reason: item.reason || 'Similar content',
      }));
    } catch (error) {
      console.error('[Bytez] Collaborative filtering enhancement failed:', error);
      // Return original titles with default scores
      return candidateTitles.slice(0, 5).map(title => ({
        title,
        score: 5,
        reason: 'AI ranking unavailable',
      }));
    }
  }
}

// Singleton instance (lazy initialization)
let bytezClientInstance: BytezClient | null = null;

/**
 * Get the Bytez client instance
 * Returns null if API key is not configured
 */
export function getBytezClient(): BytezClient | null {
  if (!isBytezAvailable()) {
    return null;
  }

  if (!bytezClientInstance) {
    bytezClientInstance = new BytezClient();
  }

  return bytezClientInstance;
}
