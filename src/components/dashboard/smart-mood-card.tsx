/**
 * SmartMoodCard Component
 * Displays AI-analyzed mood with reasoning and genre suggestions
 */

'use client';

import { ContentType } from '@/dtos/common.dto';
import { MOOD_INFO, MoodCategory } from '@/lib/mood-analysis';
import { Brain, Loader2, Sparkles, Zap } from 'lucide-react';
import { useState } from 'react';

interface MoodAnalysisResult {
  mood: MoodCategory;
  confidence: number;
  suggestedGenres: number[];
  contentTypes: ContentType[];
  reasoning: string;
  isAIGenerated: boolean;
}

interface SmartMoodCardProps {
  analysis: MoodAnalysisResult | null;
  isLoading?: boolean;
  onMoodSelect?: (mood: MoodCategory) => void;
  onUseRecommendation?: () => void;
}

export function SmartMoodCard({
  analysis,
  isLoading = false,
  onMoodSelect,
  onUseRecommendation,
}: SmartMoodCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 animate-pulse">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Analyzing your mood...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const moodInfo = MOOD_INFO[analysis.mood];

  return (
    <div 
      className="glass rounded-2xl p-5 mb-6 overflow-hidden relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient Background Accent */}
      <div className={`
        absolute inset-0 opacity-10 bg-gradient-to-br ${moodInfo.color}
        transition-opacity duration-300
        ${isHovered ? 'opacity-20' : 'opacity-10'}
      `} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${moodInfo.color}`}>
              {analysis.isAIGenerated ? (
                <Brain className="w-5 h-5 text-white" />
              ) : (
                <Zap className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Smart Mood</h2>
                {analysis.isAIGenerated && (
                  <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-medium flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Personalized for you right now
              </p>
            </div>
          </div>

          {/* Confidence Badge */}
          <div className="text-right">
            <div className="text-2xl">{moodInfo.emoji}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {analysis.confidence}% sure
            </div>
          </div>
        </div>

        {/* Mood Display */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`
            px-4 py-2 rounded-xl bg-gradient-to-r ${moodInfo.color}
            text-white font-semibold shadow-lg
          `}>
            {moodInfo.label}
          </div>
          <span className="text-sm text-muted-foreground">mood detected</span>
        </div>

        {/* Reasoning */}
        <div className="bg-secondary/30 rounded-xl p-3 mb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            💡 {analysis.reasoning}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onUseRecommendation && (
            <button
              onClick={onUseRecommendation}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                bg-gradient-to-r ${moodInfo.color} text-white font-medium
                hover:shadow-lg transition-all duration-200
                hover:scale-[1.02] active:scale-[0.98]
              `}
            >
              <Sparkles className="w-4 h-4" />
              Use This Mood
            </button>
          )}
          
          {onMoodSelect && (
            <button
              onClick={() => onMoodSelect(analysis.mood)}
              className="px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 
                         font-medium transition-colors"
            >
              Change
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact mood selector grid
 */
interface MoodSelectorGridProps {
  selectedMood?: MoodCategory;
  onMoodSelect: (mood: MoodCategory) => void;
}

export function MoodSelectorGrid({ selectedMood, onMoodSelect }: MoodSelectorGridProps) {
  const moods = Object.entries(MOOD_INFO) as [MoodCategory, typeof MOOD_INFO[MoodCategory]][];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      {moods.map(([mood, info]) => (
        <button
          key={mood}
          onClick={() => onMoodSelect(mood)}
          className={`
            flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200
            ${selectedMood === mood 
              ? `bg-gradient-to-br ${info.color} text-white shadow-lg scale-105` 
              : 'bg-secondary/50 hover:bg-secondary hover:scale-102'
            }
          `}
        >
          <span className="text-xl">{info.emoji}</span>
          <span className="text-xs font-medium">{info.label}</span>
        </button>
      ))}
    </div>
  );
}
