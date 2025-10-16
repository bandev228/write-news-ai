export interface ArticleData {
  id: string; // Unique identifier
  createdAt: number; // Timestamp
  keywords: string[];
  categories: string[];
  title: string;
  slug: string;
  summary: string;
  content: string; // HTML content
  avatarUrl: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
}

export interface StoredArticle extends ArticleData {
    sourceUrl: string;
    sourceFocusKeyword: string;
}

export interface SeoCheck {
  pass: boolean;
  message: string;
}

export interface SeoValidationResult {
  score: number; // Overall score out of 100
  results: {
    titleLength: SeoCheck;
    metaDescriptionLength: SeoCheck;
    keywordInTitle: SeoCheck;
    keywordInMetaDescription: SeoCheck;
    keywordInContent: SeoCheck;
    headings: SeoCheck;
  }
}

export interface NewsSearchResult {
  title: string;
  url: string;
}
