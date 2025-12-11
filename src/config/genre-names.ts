/**
 * Genre and Language Display Names
 * Maps TMDB IDs to human-readable names for "Why This Pick?" explanations
 */

// Movie and TV genre names (from TMDB)
export const GENRE_NAMES: Record<string, string> = {
  // Movie Genres
  '28': 'Action',
  '12': 'Adventure',
  '16': 'Animation',
  '35': 'Comedy',
  '80': 'Crime',
  '99': 'Documentary',
  '18': 'Drama',
  '10751': 'Family',
  '14': 'Fantasy',
  '36': 'History',
  '27': 'Horror',
  '10402': 'Music',
  '9648': 'Mystery',
  '10749': 'Romance',
  '878': 'Sci-Fi',
  '10770': 'TV Movie',
  '53': 'Thriller',
  '10752': 'War',
  '37': 'Western',
  // TV Genres
  '10759': 'Action & Adventure',
  '10762': 'Kids',
  '10763': 'News',
  '10764': 'Reality',
  '10765': 'Sci-Fi & Fantasy',
  '10766': 'Soap',
  '10767': 'Talk',
  '10768': 'War & Politics',
};

// Language display names
export const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',
  'ja': 'Japanese',
  'ko': 'Korean',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'zh': 'Chinese',
  'hi': 'Hindi',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ar': 'Arabic',
  'th': 'Thai',
  'tr': 'Turkish',
  'id': 'Indonesian',
  'vi': 'Vietnamese',
  'tl': 'Filipino',
  'nl': 'Dutch',
  'pl': 'Polish',
  'sv': 'Swedish',
  'da': 'Danish',
  'no': 'Norwegian',
  'fi': 'Finnish',
  'cs': 'Czech',
  'hu': 'Hungarian',
  'ro': 'Romanian',
  'el': 'Greek',
  'he': 'Hebrew',
  'bn': 'Bengali',
  'ta': 'Tamil',
  'te': 'Telugu',
  'ml': 'Malayalam',
  'mr': 'Marathi',
  'pa': 'Punjabi',
  'uk': 'Ukrainian',
};

/**
 * Get genre name(s) from IDs
 */
export function getGenreNames(genreIds: string[]): string[] {
  return genreIds
    .map(id => GENRE_NAMES[id])
    .filter(Boolean);
}

/**
 * Get language name from code
 */
export function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] || code.toUpperCase();
}

/**
 * Build "Why This Pick?" explanation from strategy details
 * Returns an object with title and description for richer display
 */
export function buildExplanation(params: {
  strategyName: string;
  genres: string[];
  languages: string[];
  contentType: 'MOVIE' | 'SERIES' | 'ANIME';
}): { title: string; description: string } {
  const { strategyName, genres, languages, contentType } = params;
  
  const genreNames = getGenreNames(genres);
  const languageNames = languages.map(l => getLanguageName(l));
  
  const contentLabel = contentType === 'MOVIE' ? 'movie' : contentType === 'SERIES' ? 'series' : 'anime';
  const contentLabelPlural = contentType === 'MOVIE' ? 'movies' : contentType === 'SERIES' ? 'series' : 'anime';
  
  // Format genre list nicely
  const formatGenres = (names: string[]) => {
    if (names.length === 0) return '';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
  };

  // Strategy: All filters with genres
  if (strategyName.includes('All filters') || strategyName.includes('All genres')) {
    if (genreNames.length > 0 && languageNames.length > 0) {
      return {
        title: '🎯 Perfect Match',
        description: `This ${contentLabel} combines your favorite genres — ${formatGenres(genreNames.slice(0, 2))} — with ${languageNames[0]} content you love.`
      };
    }
    if (genreNames.length > 0) {
      return {
        title: '🎯 Genre Match',
        description: `Selected because you enjoy ${formatGenres(genreNames.slice(0, 2))} ${contentLabelPlural}.`
      };
    }
  }

  // Strategy: Single genre
  if (strategyName.includes('Single genre')) {
    const genreName = genreNames[0] || 'your preferred genre';
    return {
      title: '🎬 Genre Pick',
      description: `Chosen from the ${genreName} category, one of your go-to genres.`
    };
  }

  // Strategy: 2 random genres
  if (strategyName.includes('2 random genres') || strategyName.includes('random genres')) {
    if (genreNames.length >= 2) {
      return {
        title: '✨ Genre Blend',
        description: `Mixes ${genreNames[0]} with ${genreNames[1]} — a combo based on your taste profile.`
      };
    }
  }

  // Strategy: Vote average sort (highly rated)
  if (strategyName.includes('vote_average') || strategyName.includes('highly-rated')) {
    return {
      title: '⭐ Critically Acclaimed',
      description: `A top-rated ${contentLabel} that matches your preferences — critics and audiences agree on this one.`
    };
  }

  // Strategy: Alternative language
  if (strategyName.includes('Alternative language')) {
    const lang = languageNames[0] || 'an alternative language';
    return {
      title: '🌍 Language Discovery',
      description: `Exploring ${lang} content from your language preferences.`
    };
  }

  // Strategy: Lower rating threshold
  if (strategyName.includes('lower rating')) {
    return {
      title: '💎 Hidden Gem',
      description: `A lesser-known ${contentLabel} that fits your taste — sometimes the best finds are off the beaten path.`
    };
  }

  // Strategy: Fallback with different content type
  if (strategyName.includes('Fallback')) {
    return {
      title: '🔄 Fresh Discovery',
      description: `Stepping outside your usual picks to bring you something different yet aligned with your taste.`
    };
  }

  // Strategy: No genres, language only
  if (strategyName.includes('language only') || strategyName.includes('No genres')) {
    if (languageNames.length > 0) {
      return {
        title: '🎭 Popular in ' + languageNames[0],
        description: `A trending ${contentLabel} in ${languageNames[0]} — popular with viewers who share your preferences.`
      };
    }
  }

  // Default fallback with genre info
  if (genreNames.length > 0) {
    return {
      title: '🎯 For You',
      description: `Recommended based on your interest in ${genreNames[0]} ${contentLabelPlural}.`
    };
  }

  // Ultimate default
  return {
    title: '✨ Personalized Pick',
    description: `Curated based on your unique taste profile and viewing preferences.`
  };
}
