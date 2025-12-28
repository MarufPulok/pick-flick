/**
 * Mood Analysis Service
 * Provides AI-powered mood detection and genre recommendations
 * Uses Bytez AI when available, falls back to rule-based analysis
 */

import { ContentType } from '@/dtos/common.dto';
import { getBytezClient, isBytezAvailable } from '@/infrastructure/external/bytez.client';
import { getTimeContext, TimeContext } from './time-context';
import { getTimeBasedPreset, TMDB_GENRES } from './time-recommendation.config';

/**
 * Mood categories
 */
export type MoodCategory = 
  | 'happy'
  | 'relaxed'
  | 'adventurous'
  | 'romantic'
  | 'thoughtful'
  | 'excited'
  | 'nostalgic'
  | 'intense'
  | 'cozy'
  | 'inspired';

/**
 * Mood analysis result
 */
export interface MoodAnalysis {
  mood: MoodCategory;
  confidence: number;
  suggestedGenres: number[];
  contentTypes: ContentType[];
  reasoning: string;
  isAIGenerated: boolean;
}

/**
 * Mood to genre mappings (fallback when AI unavailable)
 */
const MOOD_GENRE_MAP: Record<MoodCategory, { genres: number[]; contentTypes: ContentType[] }> = {
  happy: {
    genres: [TMDB_GENRES.COMEDY, TMDB_GENRES.ANIMATION, TMDB_GENRES.FAMILY, TMDB_GENRES.MUSIC],
    contentTypes: ['MOVIE', 'SERIES', 'ANIME'],
  },
  relaxed: {
    genres: [TMDB_GENRES.DOCUMENTARY, TMDB_GENRES.DRAMA, TMDB_GENRES.FAMILY],
    contentTypes: ['MOVIE', 'SERIES'],
  },
  adventurous: {
    genres: [TMDB_GENRES.ACTION, TMDB_GENRES.ADVENTURE, TMDB_GENRES.FANTASY, TMDB_GENRES.SCIENCE_FICTION],
    contentTypes: ['MOVIE', 'ANIME'],
  },
  romantic: {
    genres: [TMDB_GENRES.ROMANCE, TMDB_GENRES.DRAMA, TMDB_GENRES.COMEDY],
    contentTypes: ['MOVIE', 'SERIES'],
  },
  thoughtful: {
    genres: [TMDB_GENRES.DRAMA, TMDB_GENRES.DOCUMENTARY, TMDB_GENRES.HISTORY, TMDB_GENRES.MYSTERY],
    contentTypes: ['MOVIE', 'SERIES'],
  },
  excited: {
    genres: [TMDB_GENRES.ACTION, TMDB_GENRES.THRILLER, TMDB_GENRES.SCIENCE_FICTION],
    contentTypes: ['MOVIE', 'ANIME'],
  },
  nostalgic: {
    genres: [TMDB_GENRES.DRAMA, TMDB_GENRES.FAMILY, TMDB_GENRES.COMEDY, TMDB_GENRES.ANIMATION],
    contentTypes: ['MOVIE', 'SERIES'],
  },
  intense: {
    genres: [TMDB_GENRES.THRILLER, TMDB_GENRES.HORROR, TMDB_GENRES.CRIME, TMDB_GENRES.MYSTERY],
    contentTypes: ['MOVIE', 'SERIES'],
  },
  cozy: {
    genres: [TMDB_GENRES.COMEDY, TMDB_GENRES.ROMANCE, TMDB_GENRES.FAMILY, TMDB_GENRES.ANIMATION],
    contentTypes: ['MOVIE', 'SERIES', 'ANIME'],
  },
  inspired: {
    genres: [TMDB_GENRES.DOCUMENTARY, TMDB_GENRES.DRAMA, TMDB_GENRES.HISTORY],
    contentTypes: ['MOVIE', 'SERIES'],
  },
};

/**
 * Mood display info
 */
export const MOOD_INFO: Record<MoodCategory, { emoji: string; label: string; color: string }> = {
  happy: { emoji: '😊', label: 'Happy', color: 'from-yellow-400 to-orange-400' },
  relaxed: { emoji: '😌', label: 'Relaxed', color: 'from-teal-400 to-cyan-400' },
  adventurous: { emoji: '🚀', label: 'Adventurous', color: 'from-purple-400 to-pink-400' },
  romantic: { emoji: '💕', label: 'Romantic', color: 'from-pink-400 to-rose-400' },
  thoughtful: { emoji: '🤔', label: 'Thoughtful', color: 'from-blue-400 to-indigo-400' },
  excited: { emoji: '🔥', label: 'Excited', color: 'from-red-400 to-orange-400' },
  nostalgic: { emoji: '🌅', label: 'Nostalgic', color: 'from-amber-400 to-yellow-400' },
  intense: { emoji: '😱', label: 'Intense', color: 'from-gray-600 to-gray-800' },
  cozy: { emoji: '☕', label: 'Cozy', color: 'from-orange-300 to-amber-400' },
  inspired: { emoji: '✨', label: 'Inspired', color: 'from-violet-400 to-purple-400' },
};

/**
 * Get all available moods
 */
export function getAvailableMoods(): MoodCategory[] {
  return Object.keys(MOOD_INFO) as MoodCategory[];
}

/**
 * Analyze mood based on viewing history and context
 * Uses AI when available, falls back to rule-based
 */
export async function analyzeMood(
  recentTitles: string[] = [],
  recentGenres: string[] = [],
  timeContext?: TimeContext
): Promise<MoodAnalysis> {
  const context = timeContext ?? getTimeContext();
  
  // Try AI-powered analysis if available
  if (isBytezAvailable()) {
    const client = getBytezClient();
    if (client) {
      try {
        const aiResult = await client.analyzeMood(
          recentTitles,
          recentGenres,
          context.timeOfDay
        );
        
        // Map AI detected mood to our categories
        const mappedMood = mapAIMoodToCategory(aiResult.detectedMood);
        const genreConfig = MOOD_GENRE_MAP[mappedMood];
        
        return {
          mood: mappedMood,
          confidence: aiResult.confidence,
          suggestedGenres: genreConfig.genres,
          contentTypes: genreConfig.contentTypes,
          reasoning: aiResult.reasoning,
          isAIGenerated: true,
        };
      } catch (error) {
        console.warn('[MoodAnalysis] AI analysis failed, using fallback:', error);
      }
    }
  }
  
  // Fallback: Use time-based preset
  const preset = getTimeBasedPreset(context.timeOfDay, context.dayType);
  const mood = mapMoodStringToCategory(preset.mood);
  const genreConfig = MOOD_GENRE_MAP[mood];
  
  return {
    mood,
    confidence: 60,
    suggestedGenres: genreConfig.genres,
    contentTypes: genreConfig.contentTypes,
    reasoning: `Based on ${context.displayLabel} viewing patterns`,
    isAIGenerated: false,
  };
}

/**
 * Get recommendations for a specific mood
 */
export function getMoodRecommendationConfig(mood: MoodCategory): {
  genres: number[];
  contentTypes: ContentType[];
  info: { emoji: string; label: string; color: string };
} {
  return {
    genres: MOOD_GENRE_MAP[mood].genres,
    contentTypes: MOOD_GENRE_MAP[mood].contentTypes,
    info: MOOD_INFO[mood],
  };
}

/**
 * Map AI-detected mood string to our categories
 */
function mapAIMoodToCategory(aiMood: string): MoodCategory {
  const normalized = aiMood.toLowerCase();
  
  const mappings: Record<string, MoodCategory> = {
    'happy': 'happy',
    'joyful': 'happy',
    'cheerful': 'happy',
    'relaxed': 'relaxed',
    'calm': 'relaxed',
    'peaceful': 'relaxed',
    'adventurous': 'adventurous',
    'curious': 'adventurous',
    'exploring': 'adventurous',
    'romantic': 'romantic',
    'loving': 'romantic',
    'thoughtful': 'thoughtful',
    'contemplative': 'thoughtful',
    'reflective': 'thoughtful',
    'excited': 'excited',
    'thrilled': 'excited',
    'energetic': 'excited',
    'nostalgic': 'nostalgic',
    'sentimental': 'nostalgic',
    'intense': 'intense',
    'tense': 'intense',
    'suspenseful': 'intense',
    'cozy': 'cozy',
    'comfortable': 'cozy',
    'warm': 'cozy',
    'inspired': 'inspired',
    'motivated': 'inspired',
  };
  
  for (const [key, value] of Object.entries(mappings)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return 'relaxed'; // Default
}

/**
 * Map mood string from preset to category
 */
function mapMoodStringToCategory(moodString: string): MoodCategory {
  const mappings: Record<string, MoodCategory> = {
    'uplifting': 'happy',
    'engaging': 'excited',
    'immersive': 'thoughtful',
    'intense': 'intense',
    'contemplative': 'thoughtful',
    'relaxed': 'relaxed',
    'adventurous': 'adventurous',
    'epic': 'excited',
    'celebratory': 'excited',
  };
  
  return mappings[moodString.toLowerCase()] ?? 'relaxed';
}
