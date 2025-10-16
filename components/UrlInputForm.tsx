import React, { useState } from 'react';
import { LinkIcon, ArrowRightIcon, KeyIcon, SpinnerIcon, SearchIcon } from './Icons';
import { NewsSearchResult } from '../types';

interface UrlInputFormProps {
  url: string;
  setUrl: (url: string) => void;
  focusKeyword: string;
  setFocusKeyword: (keyword: string) => void;
  tone: string;
  setTone: (tone: string) => void;
  length: string;
  setLength: (length: string) => void;
  isStrict: boolean;
  setIsStrict: (isStrict: boolean) => void;
  language: string;
  setLanguage: (lang: string) => void;
  seoGoal: string;
  setSeoGoal: (goal: string) => void;
  seoLevel: number;
  setSeoLevel: (level: number) => void;
  autoImages: boolean;
  setAutoImages: (auto: boolean) => void;
  sampleTitle: string;
  setSampleTitle: (title: string) => void;
  handleSubmit: (event: React.FormEvent) => void;
  isLoading: boolean;
  keywordSuggestions: string[];
  isSuggestingKeywords: boolean;
  // News Search props
  searchTopic: string;
  setSearchTopic: (topic: string) => void;
  handleSearch: () => void;
  isSearching: boolean;
  searchError: string | null;
  searchResults: NewsSearchResult[];
}

const TabButton: React.FC<{ active: boolean; onClick: () => void, children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
      active
        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`}
  >
    {children}
  </button>
);


const UrlInputForm: React.FC<UrlInputFormProps> = ({ 
    url, setUrl, 
    focusKeyword, setFocusKeyword, 
    tone, setTone,
    length, setLength,
    isStrict, setIsStrict,
    language, setLanguage,
    seoGoal, setSeoGoal,
    seoLevel, setSeoLevel,
    autoImages, setAutoImages,
    sampleTitle, setSampleTitle,
    handleSubmit, isLoading,
    keywordSuggestions, isSuggestingKeywords,
    searchTopic, setSearchTopic,
    handleSearch, isSearching,
    searchError, searchResults,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'search'>('url');
  
  const handleSelectUrl = (selectedUrl: string) => {
    setUrl(selectedUrl);
    setActiveTab('url');
    // Scroll to the top of the form for better UX
    const formElement = document.getElementById('url-input-form');
    formElement?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div id="url-input-form">
      <div className="mb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 -mb-px">
          <TabButton active={activeTab === 'url'} onClick={() => setActiveTab('url')}>
            Từ URL
          </TabButton>
          <TabButton active={activeTab === 'search'} onClick={() => setActiveTab('search')}>
            Tìm kiếm Tin tức
          </TabButton>
        </div>
      </div>
      
      {activeTab === 'url' && (
        <form onSubmit={handleSubmit} className="w-full space-y-6 animate-fade-in">
          <div className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200 mb-1">
                URL Bài viết Gốc
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <LinkIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  type="url"
                  name="url"
                  id="url"
                  className="block w-full rounded-lg border-0 py-3 pl-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-slate-50 dark:bg-slate-800/50 transition"
                  placeholder="https://example.com/bai-viet-can-viet-lai"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="focusKeyword" className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200 mb-1">
                Từ khóa Tập trung
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <KeyIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  name="focusKeyword"
                  id="focusKeyword"
                  className="block w-full rounded-lg border-0 py-3 pl-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-slate-50 dark:bg-slate-800/50 transition"
                  placeholder="vd: công thức nấu phở bò"
                  value={focusKeyword}
                  onChange={(e) => setFocusKeyword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              {(isSuggestingKeywords || keywordSuggestions.length > 0) && (
                  <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-800/60 rounded-lg">
                      {isSuggestingKeywords ? (
                          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                              <SpinnerIcon className="h-4 w-4" />
                              <span>Đang gợi ý từ khóa...</span>
                          </div>
                      ) : (
                          <div className="space-y-2">
                              <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Gợi ý:</h4>
                              <div className="flex flex-wrap gap-2">
                                  {keywordSuggestions.map((keyword, index) => (
                                      <button
                                          key={index}
                                          type="button"
                                          onClick={() => setFocusKeyword(keyword)}
                                          className="px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-100 dark:text-indigo-100 dark:bg-indigo-500/20 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-colors"
                                      >
                                          {keyword}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              )}
            </div>
          </div>
          
          <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-6">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 -mb-2">Tùy chọn Viết lại</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <div>
                    <label htmlFor="tone" className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">Văn phong</label>
                    <select id="tone" name="tone" value={tone} onChange={(e) => setTone(e.target.value)} disabled={isLoading} className="mt-1 block w-full rounded-lg border-0 py-2.5 pl-3 pr-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-slate-50 dark:bg-slate-800/50 transition">
                        <option>Chuyên nghiệp</option>
                        <option>Thân thiện</option>
                        <option>Hài hước</option>
                        <option>Thuyết phục</option>
                        <option>Truyền cảm hứng</option>
                        <option>Kỹ thuật</option>
                        <option>Giải trí</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="length" className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">Độ dài mong muốn</label>
                    <input type="text" name="length" id="length" value={length} onChange={(e) => setLength(e.target.value)} disabled={isLoading} className="mt-1 block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-slate-50 dark:bg-slate-800/50 transition"/>
                </div>
                <div>
                    <label htmlFor="language" className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">Ngôn ngữ</label>
                    <select id="language" name="language" value={language} onChange={(e) => setLanguage(e.target.value)} disabled={isLoading} className="mt-1 block w-full rounded-lg border-0 py-2.5 pl-3 pr-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-slate-50 dark:bg-slate-800/50 transition">
                        <option>Vietnamese</option>
                        <option>English</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="seoGoal" className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">Mục tiêu SEO (Intent)</label>
                    <select id="seoGoal" name="seoGoal" value={seoGoal} onChange={(e) => setSeoGoal(e.target.value)} disabled={isLoading} className="mt-1 block w-full rounded-lg border-0 py-2.5 pl-3 pr-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-slate-50 dark:bg-slate-800/50 transition">
                        <option>Thông tin</option>
                        <option>Thương mại</option>
                        <option>Đánh giá</option>
                        <option>Hướng dẫn</option>
                    </select>
                </div>
              </div>
              <div>
                <label htmlFor="sampleTitle" className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200 mb-1">Tiêu đề Mẫu (Tùy chọn)</label>
                <input type="text" name="sampleTitle" id="sampleTitle" className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-slate-50 dark:bg-slate-800/50 transition" placeholder="Cung cấp tiêu đề mẫu để AI tham khảo..." value={sampleTitle} onChange={(e) => setSampleTitle(e.target.value)} disabled={isLoading} />
              </div>
              <div>
                <label htmlFor="seoLevel" className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">Mức độ Tối ưu SEO: <span className="font-bold text-indigo-600 dark:text-indigo-400">{seoLevel}</span>/5</label>
                <input id="seoLevel" type="range" min="1" max="5" step="1" value={seoLevel} onChange={(e) => setSeoLevel(Number(e.target.value))} disabled={isLoading} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer mt-2 accent-indigo-600 dark:accent-indigo-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="relative flex items-start">
                    <div className="flex h-6 items-center">
                        <input id="isStrict" name="isStrict" type="checkbox" checked={isStrict} onChange={(e) => setIsStrict(e.target.checked)} disabled={isLoading} className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-600 bg-white/5 dark:bg-slate-800/50" />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                        <label htmlFor="isStrict" className="font-medium text-slate-900 dark:text-slate-200">Viết lại nghiêm ngặt</label>
                        <p className="text-slate-500 dark:text-slate-400">Tăng cường mức độ viết lại để giảm thiểu sự tương đồng.</p>
                    </div>
                </div>
                 <div className="relative flex items-start">
                    <div className="flex h-6 items-center">
                        <input id="autoImages" name="autoImages" type="checkbox" checked={autoImages} onChange={(e) => setAutoImages(e.target.checked)} disabled={isLoading} className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-600 bg-white/5 dark:bg-slate-800/50" />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                        <label htmlFor="autoImages" className="font-medium text-slate-900 dark:text-slate-200">Tự động tạo ảnh</label>
                        <p className="text-slate-500 dark:text-slate-400">AI sẽ tạo một ảnh đại diện (featured image) cho bài viết.</p>
                    </div>
                </div>
              </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !url || !focusKeyword}
            className="w-full flex items-center justify-center px-4 py-3 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 dark:disabled:text-slate-400 disabled:cursor-not-allowed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {isLoading ? (
              <>
                <SpinnerIcon className="w-5 h-5 mr-2" />
                <span>Đang viết lại...</span>
              </>
            ) : (
              <>
                <span>Viết lại với AI</span>
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </form>
      )}

      {activeTab === 'search' && (
        <div className="w-full space-y-6 animate-fade-in">
          <form onSubmit={onSearchSubmit}>
            <label htmlFor="searchTopic" className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200 mb-1">
                Chủ đề Tin tức
            </label>
            <div className="flex gap-3">
              <div className="relative flex-grow">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <SearchIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  name="searchTopic"
                  id="searchTopic"
                  className="block w-full rounded-lg border-0 py-3 pl-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-slate-50 dark:bg-slate-800/50 transition"
                  placeholder="vd: cập nhật công nghệ AI mới nhất"
                  value={searchTopic}
                  onChange={(e) => setSearchTopic(e.target.value)}
                  disabled={isSearching}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchTopic}
                className="flex items-center justify-center px-5 py-3 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 dark:disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                {isSearching ? <SpinnerIcon className="w-5 h-5"/> : <SearchIcon className="w-5 h-5"/>}
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {isSearching && (
                <div className="flex justify-center items-center gap-2 text-slate-500 dark:text-slate-400 py-4">
                    <SpinnerIcon className="h-5 w-5" />
                    <span>Đang tìm kiếm tin tức...</span>
                </div>
            )}
            {searchError && <p className="text-sm text-red-600 dark:text-red-400 text-center">{searchError}</p>}
            {searchResults.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Kết quả tìm kiếm:</h3>
                    <ul className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-3">
                        {searchResults.map((result, index) => (
                            <li key={index} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 truncate block" title={result.title}>
                                        {result.title}
                                    </a>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{result.url}</p>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => handleSelectUrl(result.url)}
                                    className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-500 transition-colors flex-shrink-0"
                                >
                                    Sử dụng URL này
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UrlInputForm;