import { LRUCache } from 'npm:lru-cache@10.1.0';
import type { User } from '@/x/web_twitter.ts';
import type { TimelineProfile } from '../x/syndication_twitter.ts';

export const usersCache = new LRUCache<bigint, User>({
  max: 1000,
  ttl: 1000 * 60 * 60,
});

export const timelineProfilesCache = new LRUCache<bigint, TimelineProfile>({
  max: 1000,
  ttl: 1000 * 60 * 60,
});
