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
    originalText?: string;
    seoScore?: number;
}

export interface SeoCheck {
  pass: boolean;
  message: string;
  value?: string | number;
}

export interface HeadingInfo {
    level: number;
    text: string;
}

export interface SeoValidationResult {
  score: number;
  title: {
    check: SeoCheck;
    length: number;
    idealMin: number;
    idealMax: number;
  };
  metaDescription: {
    check: SeoCheck;
    length: number;
    idealMin: number;
    idealMax: number;
  };
  keywordDensity: {
    check: SeoCheck;
    count: number;
    wordCount: number;
    density: number; // percentage
  };
  image: {
    check: SeoCheck;
  };
  headings: {
    check: SeoCheck;
    structure: HeadingInfo[];
  };
  links: {
    check: SeoCheck;
    internalCount: number;
    externalCount: number;
  };
}


export interface NewsSearchResult {
  title: string;
  url: string;
}

export interface RewriteResult {
  articleData: Omit<ArticleData, 'id' | 'createdAt'>;
  originalText: string;
}