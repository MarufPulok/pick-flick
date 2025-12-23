/**
 * Service Hints Configuration
 * Provides contextual tips and recommendations for streaming services
 * Helps users discover service-specific features and benefits
 */

'use client';

import { ContentType } from '@/dtos/common.dto';

/**
 * Service hint types
 */
export type HintType = 'quality' | 'feature' | 'content' | 'tip' | 'warning';

/**
 * Service hint definition
 */
export interface ServiceHint {
  id: string;
  serviceId: string;
  type: HintType;
  message: string;
  /** Content types this hint applies to (empty = all) */
  contentTypes?: ContentType[];
  /** Priority for display ordering (lower = higher priority) */
  priority?: number;
}

/**
 * Predefined service hints
 */
const SERVICE_HINTS: ServiceHint[] = [
  // MovieBox hints
  {
    id: 'moviebox-quality',
    serviceId: 'moviebox',
    type: 'quality',
    message: 'Often has HD/4K quality options',
    priority: 1,
  },
  {
    id: 'moviebox-subtitles',
    serviceId: 'moviebox',
    type: 'feature',
    message: 'Multiple subtitle languages available',
    priority: 2,
  },
  
  // Cineb hints
  {
    id: 'cineb-speed',
    serviceId: 'cineb',
    type: 'tip',
    message: 'Fast loading times, good for slow connections',
    priority: 1,
  },
  
  // HiAnime hints
  {
    id: 'hianime-subs',
    serviceId: 'hianime',
    type: 'feature',
    message: 'Both subbed and dubbed anime available',
    contentTypes: ['ANIME'],
    priority: 1,
  },
  {
    id: 'hianime-schedule',
    serviceId: 'hianime',
    type: 'content',
    message: 'Simulcast schedule for ongoing anime',
    contentTypes: ['ANIME'],
    priority: 2,
  },
  
  // SyncPlay hints
  {
    id: 'syncplay-watchparty',
    serviceId: 'syncplay',
    type: 'feature',
    message: 'Built-in watch party sync feature',
    priority: 1,
  },
  {
    id: 'syncplay-mobile',
    serviceId: 'syncplay',
    type: 'tip',
    message: 'Works well on mobile devices',
    priority: 2,
  },
];

/**
 * Get hints for a specific service
 */
export function getServiceHints(
  serviceId: string,
  contentType?: ContentType
): ServiceHint[] {
  return SERVICE_HINTS
    .filter(hint => {
      if (hint.serviceId !== serviceId) return false;
      if (contentType && hint.contentTypes?.length) {
        return hint.contentTypes.includes(contentType);
      }
      return true;
    })
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
}

/**
 * Get the primary hint for a service (highest priority)
 */
export function getPrimaryHint(
  serviceId: string,
  contentType?: ContentType
): ServiceHint | null {
  const hints = getServiceHints(serviceId, contentType);
  return hints[0] || null;
}

/**
 * Get all available services with hints
 */
export function getServicesWithHints(): string[] {
  return [...new Set(SERVICE_HINTS.map(h => h.serviceId))];
}

/**
 * Get hint type icon/emoji
 */
export function getHintIcon(type: HintType): string {
  switch (type) {
    case 'quality': return '🎬';
    case 'feature': return '✨';
    case 'content': return '📺';
    case 'tip': return '💡';
    case 'warning': return '⚠️';
    default: return 'ℹ️';
  }
}

/**
 * Get hint type color class
 */
export function getHintColor(type: HintType): string {
  switch (type) {
    case 'quality': return 'text-purple-300';
    case 'feature': return 'text-amber-300';
    case 'content': return 'text-blue-300';
    case 'tip': return 'text-green-300';
    case 'warning': return 'text-red-300';
    default: return 'text-gray-300';
  }
}
