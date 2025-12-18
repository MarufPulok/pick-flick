# 🎬 Pick Flick

> Your AI-powered movie and TV show recommendation engine. End decision fatigue – get one perfect pick.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://www.mongodb.com/atlas)
[![TMDB](https://img.shields.io/badge/TMDB-API-01b4e4?logo=themoviedatabase)](https://www.themoviedb.org)

## ✨ Features

### Smart Recommendations
- **🎯 Personalized Picks** - One recommendation at a time based on your taste profile
- **🧠 Preference Learning** - System learns from your likes/dislikes to improve over time
- **🔄 Content Diversity** - Automatically varies between movies, series, and anime

### Rich Discovery
- **🎬 Trailer Preview** - Watch trailers directly in the app via modal player
- **💡 "Why This Pick?"** - See explanations for why each recommendation matches you
- **📺 Streaming Availability** - See where to watch (Netflix, Hulu, Disney+, etc.)
- **🆓 Universal Free Streaming** - Direct links to 100% free streaming platforms for movies, TV shows, and anime

### Two Modes
- **✨ Smart Mode** - AI picks based on your complete taste profile
- **🎚️ Filtered Mode** - Manual control over content type, genre, language, and rating

### Personalized Dashboard
- **📊 Stats Overview** - Track watched, liked, disliked counts
- **📈 Content Breakdown** - See your movies vs series vs anime distribution
- **🔥 Activity Streak** - Track consecutive active days
- **📉 Taste Match** - See your like ratio percentage

### Quick Access
- **⚡ Quick Moods** - One-click picks for specific moods (Date Night, Thriller, etc.)
- **📱 Recent Activity** - See your latest interactions

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- TMDB API key ([get one free](https://www.themoviedb.org/settings/api))

### Environment Variables

Create a `.env.local` file (or copy from `.env.example`):

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pickflick

# TMDB API (get keys at: https://www.themoviedb.org/settings/api)
TMDB_API_KEY=your-tmdb-api-key
TMDB_ACCESS_TOKEN=your-tmdb-access-token

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Universal Free Streaming
NEXT_PUBLIC_ENABLE_FREE_STREAMING=true
NEXT_PUBLIC_MAX_FREE_SERVICES=4

# Movie Platforms
NEXT_PUBLIC_ENABLE_TUBI=true
NEXT_PUBLIC_TUBI_BASE_URL=https://tubitv.com
NEXT_PUBLIC_ENABLE_CRACKLE=true
NEXT_PUBLIC_CRACKLE_BASE_URL=https://crackle.com

# TV Series Platforms  
NEXT_PUBLIC_ENABLE_PLUTO=true
NEXT_PUBLIC_PLUTO_BASE_URL=https://pluto.tv

# Anime Platforms
NEXT_PUBLIC_ENABLE_HIANIME=true
NEXT_PUBLIC_HIANIME_BASE_URL=https://hianime.to
NEXT_PUBLIC_ENABLE_ZORO=true
NEXT_PUBLIC_ZORO_BASE_URL=https://zoro.to

# Auth (BetterAuth)
BETTER_AUTH_SECRET=your-random-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### Environment Variable Details

**Universal Free Streaming Configuration:**

- **NEXT_PUBLIC_ENABLE_FREE_STREAMING** - Global toggle for the free streaming feature (true/false)
- **NEXT_PUBLIC_MAX_FREE_SERVICES** - Maximum number of streaming services to display (default: 4)

**Platform Toggles:** Enable/disable individual streaming platforms
- **NEXT_PUBLIC_ENABLE_TUBI** - Toggle Tubi (movies & TV series)
- **NEXT_PUBLIC_ENABLE_CRACKLE** - Toggle Crackle (movies & TV series) 
- **NEXT_PUBLIC_ENABLE_PLUTO** - Toggle Pluto TV (TV series & live TV)
- **NEXT_PUBLIC_ENABLE_POPCORNFLIX** - Toggle Popcornflix (movies)
- **NEXT_PUBLIC_ENABLE_FILMRISE** - Toggle FilmRise (movies & documentaries)
- **NEXT_PUBLIC_ENABLE_YOUTUBE_FREE** - Toggle YouTube Free Movies
- **NEXT_PUBLIC_ENABLE_INTERNET_ARCHIVE** - Toggle Internet Archive (public domain)
- **NEXT_PUBLIC_ENABLE_HIANIME** - Toggle HiAnime (anime)
- **NEXT_PUBLIC_ENABLE_ZORO** - Toggle Zoro.to (anime)
- **NEXT_PUBLIC_ENABLE_9ANIME** - Toggle 9anime (anime)
- **NEXT_PUBLIC_ENABLE_GOGOANIME** - Toggle Gogoanime (anime)

**Custom Platform URLs:** Override default URLs for streaming platforms
- **NEXT_PUBLIC_TUBI_BASE_URL** - Custom Tubi URL (default: https://tubitv.com)
- **NEXT_PUBLIC_CRACKLE_BASE_URL** - Custom Crackle URL (default: https://crackle.com)
- **NEXT_PUBLIC_PLUTO_BASE_URL** - Custom Pluto TV URL (default: https://pluto.tv)
- **NEXT_PUBLIC_POPCORNFLIX_BASE_URL** - Custom Popcornflix URL (default: https://popcornflix.com)
- **NEXT_PUBLIC_FILMRISE_BASE_URL** - Custom FilmRise URL (default: https://filmrise.com)
- **NEXT_PUBLIC_YOUTUBE_FREE_BASE_URL** - Custom YouTube URL (default: https://youtube.com)
- **NEXT_PUBLIC_INTERNET_ARCHIVE_BASE_URL** - Custom Internet Archive URL (default: https://archive.org)
- **NEXT_PUBLIC_HIANIME_BASE_URL** - Custom HiAnime URL (default: https://hianime.to)
- **NEXT_PUBLIC_ZORO_BASE_URL** - Custom Zoro URL (default: https://zoro.to)
- **NEXT_PUBLIC_9ANIME_BASE_URL** - Custom 9anime URL (default: https://9anime.to)
- **NEXT_PUBLIC_GOGOANIME_BASE_URL** - Custom Gogoanime URL (default: https://gogoanime.lu)

**Examples:**
- **Movies**: Tubi, Crackle, Popcornflix provide free movies with ads
- **TV Series**: Tubi, Crackle, Pluto TV offer free TV shows and series
- **Anime**: HiAnime, Zoro, 9anime specialize in free anime streaming

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Database** | MongoDB Atlas + Mongoose |
| **Auth** | NextAuth.js (Google OAuth) |
| **API** | TMDB (The Movie Database) |
| **State** | React Query (TanStack) |

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Main recommendation page
│   ├── login/             # Authentication
│   └── onboarding/        # Taste profile setup
├── components/
│   ├── dashboard/         # Dashboard-specific components
│   └── ui/                # shadcn/ui components
├── config/                # App configuration
├── dtos/                  # Data transfer objects (Zod schemas)
├── hooks/                 # Custom React hooks
├── infrastructure/
│   ├── db/               # MongoDB models & connection
│   └── external/         # TMDB API client
├── lib/                   # Auth & utilities
└── services/              # Business logic
    ├── history.service.ts
    ├── preference-weights.service.ts
    └── recommendation.service.ts
```

---

## 🎯 How It Works

1. **Onboarding** - Users select preferred content types, genres, and languages
2. **Profile Creation** - Taste profile stored in MongoDB
3. **Smart Recommendation** - Algorithm tries multiple strategies with cascading fallbacks
4. **User Feedback** - Like/dislike updates preference weights
5. **Continuous Learning** - Future recommendations improve based on history

### Recommendation Strategies

The system tries these strategies in order until one succeeds:

1. All genres + primary language + high rating
2. Single random genre + language
3. 2 random genres combination
4. Alternative languages from profile
5. Lower rating threshold
6. Fallback to different content type

---

## 🛣️ Roadmap

### ✅ Completed
- [x] Trailer Preview Integration
- [x] "Why This Pick?" Explanation
- [x] Content Type Diversity Tracking
- [x] Streaming Availability
- [x] Preference Weights Learning
- [x] Enhanced Stats Dashboard

### 📋 Coming Soon
- [ ] Query Result Caching
- [ ] Time-Based Recommendations
- [ ] Watchlist / Save for Later
- [ ] "More Like This"
- [ ] Trending Now Section

---

## 📄 License

This project is for educational and personal use. TMDB API usage subject to their [terms of use](https://www.themoviedb.org/terms-of-use).

---

## 🙏 Acknowledgments

- [TMDB](https://www.themoviedb.org) for the amazing movie database API
- [shadcn/ui](https://ui.shadcn.com) for beautiful UI components
- [Vercel](https://vercel.com) for Next.js and hosting

---

<p align="center">
  Made with ❤️ for movie lovers who can't decide what to watch
</p>
