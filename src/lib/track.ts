'use client';

import type { EventReqDto } from '@/dtos/request/event.req.dto';

const KEY = 'pf_anon_id';
let memoryId: string | null = null;

export function getAnonId(): string {
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return (memoryId ??= crypto.randomUUID());
  }
}

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

/** Fire-and-forget; never throws. */
export function track(event: DistributiveOmit<EventReqDto, 'anonId'>): void {
  try {
    const json = JSON.stringify({ ...event, anonId: getAnonId() });
    if (navigator.sendBeacon?.('/api/events', new Blob([json], { type: 'application/json' }))) return;
    void fetch('/api/events', { method: 'POST', body: json, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {});
  } catch {}
}
