/**
 * Swagger/OpenAPI Configuration
 * API documentation setup
 */

import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'PickFlick API',
        version: '1.0.0',
        description: `
# PickFlick API Documentation

PickFlick is a movie/TV/anime recommendation engine that provides **one perfect pick** based on user preferences.

## Features
- **Authentication**: Google OAuth and email/password via BetterAuth
- **User Profiles**: Taste profile management for personalized recommendations
- **Recommendations**: Single-result recommendation engine with filtering
- **History & Feedback**: Track recommendations and improve future suggestions

## Authentication
Most endpoints require authentication. Use the \`/api/auth\` endpoints to sign in.
        `,
        contact: {
          name: 'PickFlick Support',
        },
      },
      servers: [
        {
          url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'Health', description: 'System health checks' },
        { name: 'Auth', description: 'Authentication endpoints (via BetterAuth)' },
        { name: 'Profile', description: 'User taste profile management' },
        { name: 'Recommendation', description: 'Recommendation engine' },
        { name: 'History', description: 'Recommendation history' },
        { name: 'Feedback', description: 'Like/Unlike feedback' },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'better-auth.session_token',
          },
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          ContentType: {
            type: 'string',
            enum: ['MOVIE', 'SERIES', 'ANIME'],
          },
          FeedbackType: {
            type: 'string',
            enum: ['LIKE', 'UNLIKE'],
          },
          RecommendationItem: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              tmdbId: { type: 'number' },
              title: { type: 'string' },
              overview: { type: 'string', nullable: true },
              posterUrl: { type: 'string', nullable: true },
              backdropUrl: { type: 'string', nullable: true },
              rating: { type: 'number', nullable: true },
              contentType: { $ref: '#/components/schemas/ContentType' },
              releaseYear: { type: 'number' },
              genres: { type: 'array', items: { type: 'string' } },
            },
          },
          TasteProfile: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              contentTypes: { 
                type: 'array', 
                items: { $ref: '#/components/schemas/ContentType' } 
              },
              genres: { type: 'array', items: { type: 'string' } },
              languages: { type: 'array', items: { type: 'string' } },
              onboardingComplete: { type: 'boolean' },
            },
          },
          HistoryItem: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              tmdbId: { type: 'number' },
              title: { type: 'string' },
              posterUrl: { type: 'string', nullable: true },
              rating: { type: 'number', nullable: true },
              contentType: { $ref: '#/components/schemas/ContentType' },
              feedback: { $ref: '#/components/schemas/FeedbackType' },
              generatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      paths: {
        '/api/health': {
          get: {
            tags: ['Health'],
            summary: 'Health check',
            description: 'Check the health of MongoDB and TMDB API connections',
            responses: {
              200: {
                description: 'All services healthy',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', enum: ['ok', 'degraded'] },
                        timestamp: { type: 'string', format: 'date-time' },
                        services: {
                          type: 'object',
                          properties: {
                            mongodb: {
                              type: 'object',
                              properties: {
                                connected: { type: 'boolean' },
                                error: { type: 'string', nullable: true },
                              },
                            },
                            tmdb: {
                              type: 'object',
                              properties: {
                                connected: { type: 'boolean' },
                                error: { type: 'string', nullable: true },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/api/profile': {
          get: {
            tags: ['Profile'],
            summary: 'Get user taste profile',
            security: [{ cookieAuth: [] }],
            responses: {
              200: {
                description: 'User profile',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/TasteProfile' },
                  },
                },
              },
              401: { description: 'Unauthorized' },
            },
          },
          post: {
            tags: ['Profile'],
            summary: 'Save/update taste profile (onboarding)',
            security: [{ cookieAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['contentTypes', 'genres', 'languages'],
                    properties: {
                      contentTypes: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ContentType' },
                        minItems: 1,
                      },
                      genres: {
                        type: 'array',
                        items: { type: 'string' },
                        minItems: 3,
                      },
                      languages: {
                        type: 'array',
                        items: { type: 'string' },
                        minItems: 1,
                      },
                    },
                  },
                },
              },
            },
            responses: {
              200: { description: 'Profile saved' },
              401: { description: 'Unauthorized' },
            },
          },
        },
        '/api/recommendation': {
          post: {
            tags: ['Recommendation'],
            summary: 'Generate a single recommendation',
            security: [{ cookieAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['contentType'],
                    properties: {
                      contentType: { $ref: '#/components/schemas/ContentType' },
                      language: { type: 'string' },
                      genres: { type: 'array', items: { type: 'string' } },
                      minRating: { type: 'number', minimum: 0, maximum: 10 },
                      mode: { 
                        type: 'string', 
                        enum: ['FILTERED', 'SMART'],
                        default: 'FILTERED',
                      },
                    },
                  },
                },
              },
            },
            responses: {
              200: {
                description: 'Single recommendation',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        item: { $ref: '#/components/schemas/RecommendationItem' },
                        source: { type: 'string', enum: ['FILTERED', 'SMART', 'REROLL'] },
                        generatedAt: { type: 'string', format: 'date-time' },
                        historyId: { type: 'string' },
                      },
                    },
                  },
                },
              },
              401: { description: 'Unauthorized' },
            },
          },
        },
        '/api/history': {
          get: {
            tags: ['History'],
            summary: 'Get recommendation history',
            security: [{ cookieAuth: [] }],
            parameters: [
              { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
              { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            ],
            responses: {
              200: {
                description: 'Paginated history',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        items: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/HistoryItem' },
                        },
                        total: { type: 'number' },
                        page: { type: 'number' },
                        hasMore: { type: 'boolean' },
                      },
                    },
                  },
                },
              },
              401: { description: 'Unauthorized' },
            },
          },
        },
        '/api/feedback': {
          post: {
            tags: ['Feedback'],
            summary: 'Submit like/unlike feedback',
            security: [{ cookieAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['recommendationId', 'feedback'],
                    properties: {
                      recommendationId: { type: 'string' },
                      feedback: { $ref: '#/components/schemas/FeedbackType' },
                    },
                  },
                },
              },
            },
            responses: {
              200: { description: 'Feedback recorded' },
              401: { description: 'Unauthorized' },
            },
          },
        },
      },
    },
  });
  return spec;
};
