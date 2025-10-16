import { ArticleData } from '../types';

const CACHE_PREFIX = 'articleRewriterCache_';
const CACHE_TTL = 3600 * 1000; // 1 hour in milliseconds

interface CacheEntry {
  timestamp: number;
  data: ArticleData;
}

export const getCachedArticle = (key: string): ArticleData | null => {
  const itemStr = sessionStorage.getItem(`${CACHE_PREFIX}${key}`);
  if (!itemStr) {
    return null;
  }

  try {
    const item: CacheEntry = JSON.parse(itemStr);
    const now = new Date().getTime();

    if (now - item.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    return item.data;
  } catch (error) {
    console.error("Failed to parse cache", error);
    return null;
  }
};

export const setCachedArticle = (key: string, data: ArticleData): void => {
  const item: CacheEntry = {
    timestamp: new Date().getTime(),
    data: data,
  };
  try {
    sessionStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
  } catch (error) {
    console.error("Failed to set cache", error);
  }
};
