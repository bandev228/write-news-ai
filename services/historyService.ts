import { StoredArticle } from '../types';
import { validateSeo } from './seoValidator';

const HISTORY_KEY = 'articleRewriterHistory';

// Function to get all articles from history
export const getHistory = (): StoredArticle[] => {
  try {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    if (historyJson) {
      const history = JSON.parse(historyJson) as StoredArticle[];
      
      let needsUpdate = false;
      // One-time migration for old items without seoScore
      const historyWithScores = history.map(article => {
        if (typeof article.seoScore !== 'number') {
          needsUpdate = true;
          // FIX: Added missing `article.sourceUrl` argument to `validateSeo` call.
          const score = validateSeo(article, article.sourceFocusKeyword, article.sourceUrl).score;
          return { ...article, seoScore: score };
        }
        return article;
      });

      if (needsUpdate) {
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(historyWithScores));
        } catch (error) {
          console.error("Failed to update history with SEO scores", error);
        }
      }

      // Sort by newest first
      return historyWithScores.sort((a, b) => b.createdAt - a.createdAt);
    }
  } catch (error) {
    console.error("Failed to parse history from localStorage", error);
  }
  return [];
};

// Function to save a new article to history
export const saveArticleToHistory = (article: Omit<StoredArticle, 'id' | 'createdAt'>): StoredArticle => {
  const history = getHistory();
  const newArticle: StoredArticle = {
    ...article,
    id: `art_${new Date().getTime()}`,
    createdAt: new Date().getTime(),
  };
  
  const newHistory = [newArticle, ...history.filter(a => a.id !== newArticle.id)];
  
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error("Failed to save article to history", error);
  }
  return newArticle;
};

// Function to update an existing article in history
export const updateArticleInHistory = (updatedArticle: StoredArticle): void => {
  const history = getHistory();
  const articleIndex = history.findIndex(a => a.id === updatedArticle.id);

  if (articleIndex > -1) {
    history[articleIndex] = updatedArticle;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Failed to update article in history", error);
    }
  }
};

// Function to delete an article from history
export const deleteArticleFromHistory = (articleId: string): void => {
  let history = getHistory();
  history = history.filter(article => article.id !== articleId);

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to delete article from history", error);
  }
};