import React, { useState, useCallback, useEffect } from 'react';
import { StoredArticle, SeoValidationResult, NewsSearchResult } from './types';
import { rewriteArticleFromUrl, suggestKeywordsFromUrl, searchRecentNews } from './services/geminiService';
import { getHistory, saveArticleToHistory, deleteArticleFromHistory, updateArticleInHistory } from './services/historyService';
import { validateSeo } from './services/seoValidator';

import Layout from './components/Layout';
import UrlInputForm from './components/UrlInputForm';
import ArticleDisplay from './components/ArticleDisplay';
import Loader from './components/Loader';
import HistoryList from './components/HistoryList';
import Card from './components/Card';
import { SparklesIcon, PlusIcon } from './components/Icons';

const App: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [focusKeyword, setFocusKeyword] = useState<string>('');
  
  // Rewriting options
  const [tone, setTone] = useState<string>('Chuyên nghiệp');
  const [length, setLength] = useState<string>('Khoảng 800 từ');
  const [isStrict, setIsStrict] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>('Vietnamese');
  const [seoGoal, setSeoGoal] = useState<string>('Thông tin');
  const [seoLevel, setSeoLevel] = useState<number>(3);
  const [autoImages, setAutoImages] = useState<boolean>(true);
  const [sampleTitle, setSampleTitle] = useState<string>('');

  const [rewrittenArticle, setRewrittenArticle] = useState<StoredArticle | null>(null);
  const [originalArticleText, setOriginalArticleText] = useState<string | null>(null);
  const [seoResult, setSeoResult] = useState<SeoValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);

  const [history, setHistory] = useState<StoredArticle[]>([]);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);

  // State for News Search
  const [searchTopic, setSearchTopic] = useState<string>('');
  const [searchResults, setSearchResults] = useState<NewsSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);


  useEffect(() => {
    setHistory(getHistory());
  }, []);

  useEffect(() => {
    if (!url || !/^(https|http):\/\/[^ "]+$/.test(url)) {
      setKeywordSuggestions([]);
      return;
    }

    const suggestionTimeout = setTimeout(async () => {
      setIsSuggesting(true);
      setKeywordSuggestions([]);
      try {
        const suggestions = await suggestKeywordsFromUrl(url);
        setKeywordSuggestions(suggestions);
      } catch (err) {
        console.error('Failed to fetch keyword suggestions:', err);
      } finally {
        setIsSuggesting(false);
      }
    }, 800);

    return () => clearTimeout(suggestionTimeout);
  }, [url]);

  const handleNewArticle = () => {
    setRewrittenArticle(null);
    setSeoResult(null);
    setUrl('');
    setFocusKeyword('');
    setError(null);
    setCurrentArticleId(null);
    setSearchResults([]);
    setSearchTopic('');
    setSearchError(null);
    setOriginalArticleText(null);
  };

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!url || !focusKeyword) {
      setError('Vui lòng nhập URL và Từ khóa tập trung.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRewrittenArticle(null);
    setSeoResult(null);
    setCurrentArticleId(null);
    setOriginalArticleText(null);

    try {
      const { articleData, originalText } = await rewriteArticleFromUrl(url, focusKeyword, { 
        tone, 
        length, 
        isStrict,
        language,
        seoGoal,
        seoLevel,
        sampleTitle,
        autoImages,
      });
      
      const validation = validateSeo(articleData, focusKeyword, url);
      
      const articleToSave = {
        ...articleData,
        sourceUrl: url,
        sourceFocusKeyword: focusKeyword,
        originalText: originalText,
        seoScore: validation.score,
      };
      
      const storedArticle = saveArticleToHistory(articleToSave);
      setHistory(prev => [storedArticle, ...prev.filter(a => a.id !== storedArticle.id)]);
      setRewrittenArticle(storedArticle);
      setCurrentArticleId(storedArticle.id);
      setOriginalArticleText(originalText);
      setSeoResult(validation);

    } catch (err) {
      console.error(err);
      setError('Không thể viết lại bài viết. API có thể đang bận hoặc đã xảy ra lỗi. Vui lòng kiểm tra console và thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [url, focusKeyword, tone, length, isStrict, language, seoGoal, seoLevel, sampleTitle, autoImages]);

  const handleSearch = useCallback(async () => {
    if (!searchTopic.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      const results = await searchRecentNews(searchTopic);
      if (results.length === 0) {
        setSearchError('Không tìm thấy bài viết nào phù hợp với chủ đề này.');
      }
      setSearchResults(results);
    } catch (err) {
      setSearchError('Không thể tìm kiếm tin tức. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  }, [searchTopic]);

  const handleSelectArticle = (article: StoredArticle) => {
    setRewrittenArticle(article);
    setSeoResult(validateSeo(article, article.sourceFocusKeyword, article.sourceUrl));
    setUrl(article.sourceUrl);
    setFocusKeyword(article.sourceFocusKeyword);
    setCurrentArticleId(article.id);
    setOriginalArticleText(article.originalText || null);
    window.scrollTo(0, 0);
  };

  const handleDeleteArticle = (id: string) => {
    deleteArticleFromHistory(id);
    const updatedHistory = history.filter(a => a.id !== id);
    setHistory(updatedHistory);
    if(currentArticleId === id) {
        handleNewArticle();
    }
  };

  const handleUpdateArticle = (updatedArticle: StoredArticle) => {
    const validation = validateSeo(updatedArticle, updatedArticle.sourceFocusKeyword, updatedArticle.sourceUrl);
    const articleWithScore = { ...updatedArticle, seoScore: validation.score };
    updateArticleInHistory(articleWithScore);
    setRewrittenArticle(articleWithScore);
    setSeoResult(validation);
    setHistory(prev => prev.map(a => a.id === articleWithScore.id ? articleWithScore : a));
  };
  
  const handleDuplicateArticle = (articleToDuplicate: StoredArticle) => {
    const { id, createdAt, title, ...rest } = articleToDuplicate;
    const articleToSave = {
        ...rest,
        title: `${title} (Copy)`,
    };
    const newArticle = saveArticleToHistory(articleToSave);
    setHistory(getHistory()); // Re-fetch to get the sorted list
    handleSelectArticle(newArticle);
  };

  const sidebarContent = (
    <HistoryList 
      history={history}
      onSelect={handleSelectArticle}
      onDelete={handleDeleteArticle}
      onDuplicate={handleDuplicateArticle}
      activeId={currentArticleId}
    />
  );

  return (
    <Layout sidebarContent={sidebarContent}>
      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {currentArticleId ? 'Chỉnh sửa Bài viết' : 'Tạo Bài viết Mới'}
            </h2>
            {currentArticleId && (
              <button onClick={handleNewArticle} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors">
                  <PlusIcon className="w-5 h-5" />
                  <span>Bài viết Mới</span>
              </button>
            )}
          </div>
          <UrlInputForm
            url={url}
            setUrl={setUrl}
            focusKeyword={focusKeyword}
            setFocusKeyword={setFocusKeyword}
            tone={tone}
            setTone={setTone}
            length={length}
            setLength={setLength}
            isStrict={isStrict}
            setIsStrict={setIsStrict}
            language={language}
            setLanguage={setLanguage}
            seoGoal={seoGoal}
            setSeoGoal={setSeoGoal}
            seoLevel={seoLevel}
            setSeoLevel={setSeoLevel}
            autoImages={autoImages}
            setAutoImages={setAutoImages}
            sampleTitle={sampleTitle}
            setSampleTitle={setSampleTitle}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            keywordSuggestions={keywordSuggestions}
            isSuggestingKeywords={isSuggesting}
            searchTopic={searchTopic}
            setSearchTopic={setSearchTopic}
            handleSearch={handleSearch}
            isSearching={isSearching}
            searchError={searchError}
            searchResults={searchResults}
          />
        </Card>
      
        {isLoading && <Loader />}
        {error && (
          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600 text-red-700 dark:text-red-300">
              <p className="font-bold">Đã xảy ra lỗi</p>
              <p>{error}</p>
          </Card>
        )}
        {rewrittenArticle && seoResult && !isLoading && (
          <div className="animate-fade-in space-y-8">
              <div className="text-center">
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
                      <SparklesIcon className="w-8 h-8 text-indigo-500" />
                      <span>{currentArticleId ? 'Nội dung Bài viết' : 'Viết Lại Hoàn Tất!'}</span>
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">Đây là dữ liệu bài viết đã được tối ưu hóa SEO của bạn.</p>
              </div>
              <ArticleDisplay article={rewrittenArticle} seoResult={seoResult} onUpdate={handleUpdateArticle} originalText={originalArticleText} />
          </div>
        )}
        {!isLoading && !error && !rewrittenArticle && (
          <Card className="text-center text-slate-500 dark:text-slate-400 py-16">
              <h3 className="text-lg font-semibold">Chào mừng bạn!</h3>
              <p className="mt-1">Kết quả bài viết của bạn sẽ xuất hiện ở đây.</p>
              <p className="text-sm">Tạo một bài viết mới hoặc chọn từ lịch sử để bắt đầu.</p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default App;