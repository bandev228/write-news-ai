import React, { useState, useEffect, useCallback } from 'react';
import { StoredArticle, SeoValidationResult, HeadingInfo } from '../types';
import Card from './Card';
import { CopyIcon, CheckIcon, EditIcon, WarningIcon, CheckBadgeIcon, ColumnsIcon, DownloadIcon, SpinnerIcon, BookOpenIcon, ListBulletIcon, ArrowTopRightOnSquareIcon, ArrowDownLeftIcon, PhotoIcon } from './Icons';
import { convertHtmlToMarkdown, getReadabilityScore } from '../services/geminiService';

type Tab = 'preview' | 'seo' | 'compare' | 'export';

interface CopyableFieldProps {
  label: string;
  value: string;
  isCode?: boolean;
  children?: React.ReactNode;
  isEditable?: boolean;
  isTextarea?: boolean;
  onSave?: (newValue: string) => void;
  className?: string;
}

const CopyButton: React.FC<{ onCopy: () => void, hasCopied: boolean }> = ({ onCopy, hasCopied }) => (
    <button
        onClick={onCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300 dark:hover:bg-slate-600 transition text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        aria-label="Copy to clipboard"
    >
        {hasCopied ? (
            <CheckIcon className="w-4 h-4 text-green-500" />
        ) : (
            <CopyIcon className="w-4 h-4" />
        )}
    </button>
);

const CopyableField: React.FC<CopyableFieldProps> = ({ label, value, isCode, children, isEditable, isTextarea, onSave, className }) => {
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const handleCopy = () => {
        const textToCopy = children ? value : currentValue;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleSave = () => {
        if (onSave) {
            onSave(currentValue);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setCurrentValue(value);
        setIsEditing(false);
    };
    
    return (
        <div className={`relative ${className}`}>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{label}</h3>
            
            <div className="relative bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700/50">
                {!isEditing && <CopyButton onCopy={handleCopy} hasCopied={copied} />}
                {isEditable && !isEditing && (
                    <button onClick={() => setIsEditing(true)} className="absolute top-2 right-11 p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label="Edit field">
                        <EditIcon className="h-4 w-4" />
                    </button>
                )}
                
                {isEditing ? (
                    <div className="space-y-3">
                        {isTextarea ? (
                            <textarea
                                value={currentValue}
                                onChange={(e) => setCurrentValue(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white/5 dark:bg-slate-900 transition"
                                rows={4}
                            />
                        ) : (
                            <input
                                type="text"
                                value={currentValue}
                                onChange={(e) => setCurrentValue(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white/5 dark:bg-slate-900 transition"
                            />
                        )}
                        <div className="flex justify-end gap-2">
                            <button onClick={handleCancel} className="px-3 py-1 text-sm rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors">Hủy</button>
                            <button onClick={handleSave} className="px-3 py-1 text-sm rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">Lưu</button>
                        </div>
                    </div>
                ) : (
                    children ? (
                        <div className="text-slate-800 dark:text-slate-200 pr-10">{children}</div>
                    ) : (
                        isCode ? (
                            <code className="block text-sm break-words font-mono text-indigo-700 dark:text-indigo-300 pr-10">{value}</code>
                        ) : (
                            <p className="text-slate-800 dark:text-slate-200 text-base pr-10">{value}</p>
                        )
                    )
                )}
            </div>
        </div>
    );
};

const ProgressBar: React.FC<{ value: number, min: number, max: number }> = ({ value, min, max }) => {
    const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
    const isOver = value > max;
    const color = isOver ? 'bg-red-500' : (percentage >= 100 ? 'bg-green-500' : 'bg-indigo-500');

    return (
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
            <div className={`${color} h-2.5 rounded-full`} style={{ width: `${isOver ? 100 : percentage}%` }}></div>
        </div>
    );
};

const SeoDashboard: React.FC<{ article: StoredArticle, seoResult: SeoValidationResult }> = ({ article, seoResult }) => {
    const [readability, setReadability] = useState<{ score: number, message: string } | null>(null);
    const [isCheckingReadability, setIsCheckingReadability] = useState(false);
    
    const checkReadability = useCallback(async () => {
        if (!article.content || readability) return;
        setIsCheckingReadability(true);
        try {
            const plainText = article.content.replace(/<[^>]*>?/gm, '');
            const result = await getReadabilityScore(plainText);
            setReadability(result);
        } catch (error) {
            console.error(error);
            setReadability({ score: 0, message: "Không thể phân tích độ dễ đọc." });
        } finally {
            setIsCheckingReadability(false);
        }
    }, [article.content, readability]);

    useEffect(() => {
        // Trigger on first render of the dashboard
        checkReadability();
    }, [checkReadability]);
    
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-200">Bảng điều khiển SEO</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Phân tích chi tiết các yếu tố SEO on-page của bài viết.</p>
                </div>
                <div className="text-center bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl">
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Tổng điểm</p>
                    <span className={`text-5xl font-extrabold ${getScoreColor(seoResult.score)}`}>{seoResult.score}<span className="text-2xl text-slate-400 dark:text-slate-500">/100</span></span>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Title Card */}
                <Card className="p-4 space-y-3">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">Tiêu đề SEO</h3>
                    <ProgressBar value={seoResult.title.length} min={0} max={seoResult.title.idealMax} />
                    <p className="text-xs text-slate-500 dark:text-slate-400">{`Độ dài: ${seoResult.title.length} / ${seoResult.title.idealMax} ký tự.`}</p>
                    <div className={`flex items-center gap-2 text-sm ${seoResult.title.check.pass ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {seoResult.title.check.pass ? <CheckIcon className="w-4 h-4"/> : <WarningIcon className="w-4 h-4"/>}
                        <span>{seoResult.title.check.message}</span>
                    </div>
                </Card>
                {/* Meta Description Card */}
                <Card className="p-4 space-y-3">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">Mô tả SEO</h3>
                    <ProgressBar value={seoResult.metaDescription.length} min={0} max={seoResult.metaDescription.idealMax} />
                    <p className="text-xs text-slate-500 dark:text-slate-400">{`Độ dài: ${seoResult.metaDescription.length} / ${seoResult.metaDescription.idealMax} ký tự.`}</p>
                    <div className={`flex items-center gap-2 text-sm ${seoResult.metaDescription.check.pass ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {seoResult.metaDescription.check.pass ? <CheckIcon className="w-4 h-4"/> : <WarningIcon className="w-4 h-4"/>}
                        <span>{seoResult.metaDescription.check.message}</span>
                    </div>
                </Card>
                {/* Keyword Density Card */}
                 <Card className="p-4 space-y-2">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">Từ khóa chính</h3>
                    <div className="flex justify-between items-baseline">
                        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{seoResult.keywordDensity.count}</span>
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">lần xuất hiện</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{`Mật độ: ${seoResult.keywordDensity.density.toFixed(2)}% trong ${seoResult.keywordDensity.wordCount} từ`}</p>
                     <div className={`flex items-center gap-2 text-sm ${seoResult.keywordDensity.check.pass ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                        {seoResult.keywordDensity.check.pass ? <CheckIcon className="w-4 h-4"/> : <WarningIcon className="w-4 h-4"/>}
                        <span>{seoResult.keywordDensity.check.message}</span>
                    </div>
                </Card>
                {/* Links Card */}
                <Card className="p-4">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Liên kết</h3>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><ArrowDownLeftIcon className="w-4 h-4"/><span>Nội bộ</span></div>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{seoResult.links.internalCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><ArrowTopRightOnSquareIcon className="w-4 h-4"/><span>Bên ngoài</span></div>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{seoResult.links.externalCount}</span>
                        </div>
                    </div>
                </Card>
                 {/* Image Card */}
                <Card className="p-4">
                     <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2"><PhotoIcon className="w-5 h-5" /><span>Hình ảnh</span></h3>
                     <div className={`mt-2 flex items-center gap-2 text-sm ${seoResult.image.check.pass ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {seoResult.image.check.pass ? <CheckIcon className="w-4 h-4"/> : <WarningIcon className="w-4 h-4"/>}
                        <span>{seoResult.image.check.message}</span>
                    </div>
                </Card>
                {/* Readability Card */}
                <Card className="p-4">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2"><BookOpenIcon className="w-5 h-5" /><span>Độ dễ đọc</span></h3>
                    {isCheckingReadability ? (
                        <div className="flex items-center justify-center h-16"><SpinnerIcon className="w-6 h-6 text-indigo-500" /></div>
                    ) : readability ? (
                        <div className="mt-2">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Điểm (AI chấm)</p>
                            <p className={`text-3xl font-bold ${getScoreColor(readability.score)}`}>{readability.score}<span className="text-xl text-slate-400">/100</span></p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{readability.message}</p>
                        </div>
                    ) : (
                        <div className="text-center mt-4">
                           <button onClick={checkReadability} className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">Phân tích</button>
                        </div>
                    )}
                </Card>
            </div>
            {/* Headings Card */}
            <Card className="p-4">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2"><ListBulletIcon className="w-5 h-5" /><span>Cấu trúc Tiêu đề</span></h3>
                {seoResult.headings.structure.length > 0 ? (
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {seoResult.headings.structure.map((h, i) => (
                            <li key={i} className="flex items-start">
                                <span className={`mr-2 font-mono text-xs p-1 rounded-md ${h.level === 2 ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 ml-4'}`}>
                                    H{h.level}
                                </span>
                                <span className="text-sm text-slate-700 dark:text-slate-300">{h.text}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">{seoResult.headings.check.message}</p>
                )}
            </Card>
        </div>
    );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void, children: React.ReactNode, icon: React.ReactNode }> = ({ active, onClick, children, icon }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
      active
        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
        : 'border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
    }`}
  >
    {icon}
    <span>{children}</span>
  </button>
);


interface ArticleDisplayProps {
    article: StoredArticle;
    seoResult: SeoValidationResult;
    onUpdate: (updatedArticle: StoredArticle) => void;
    originalText: string | null;
}

const ArticleDisplay: React.FC<ArticleDisplayProps> = ({ article, seoResult, onUpdate, originalText }) => {
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string|null>(null);

  const handleFieldChange = (field: keyof StoredArticle, value: string | string[]) => {
      const updatedArticle = { ...article, [field]: value };
      onUpdate(updatedArticle);
  };
  
  const handleDownloadMarkdown = async () => {
    setIsConverting(true);
    setConversionError(null);
    try {
        const markdown = await convertHtmlToMarkdown(article.content);
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${article.slug}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Markdown conversion failed:", e);
        setConversionError('Không thể chuyển đổi sang Markdown. Vui lòng thử lại.');
    } finally {
        setIsConverting(false);
    }
  }

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(article.content);
  }

  const tabs: { id: Tab, name: string, icon: React.ReactNode }[] = [
      { id: 'preview', name: 'Xem trước & Chỉnh sửa', icon: <EditIcon className="w-5 h-5" /> },
      { id: 'seo', name: 'Phân tích SEO', icon: <CheckBadgeIcon className="w-5 h-5" /> },
      { id: 'compare', name: 'So sánh', icon: <ColumnsIcon className="w-5 h-5" /> },
      { id: 'export', name: 'Xuất bản', icon: <DownloadIcon className="w-5 h-5" /> },
  ];

  return (
    <Card className="p-0">
        <div className="px-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 -mb-px">
                {tabs.map(tab => (
                    <TabButton
                        key={tab.id}
                        active={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        icon={tab.icon}
                    >
                        {tab.name}
                    </TabButton>
                ))}
            </div>
        </div>
        
        <div className="p-6">
            {activeTab === 'preview' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <CopyableField label="Tiêu đề (Title)" value={article.title} isEditable onSave={(newValue) => handleFieldChange('title', newValue)} />
                        <CopyableField label="Slug" value={article.slug} isCode isEditable onSave={(newValue) => handleFieldChange('slug', newValue)} />
                    </div>
                    <CopyableField label="Tóm tắt (Summary)" value={article.summary} isEditable isTextarea onSave={(newValue) => handleFieldChange('summary', newValue)}/>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <CopyableField label="Danh mục (Categories)" value={article.categories.join(', ')} isEditable onSave={(newValue) => handleFieldChange('categories', newValue.split(',').map(s => s.trim()))}>
                            <div className="flex flex-wrap gap-2">
                                {article.categories.map((category, index) => (
                                    <span key={index} className="px-3 py-1 text-sm font-medium text-sky-800 bg-sky-100 dark:text-sky-100 dark:bg-sky-500/20 rounded-full">{category}</span>
                                ))}
                            </div>
                        </CopyableField>
                        <CopyableField label="Từ khóa (Keywords)" value={article.keywords.join(', ')} isEditable onSave={(newValue) => handleFieldChange('keywords', newValue.split(',').map(s => s.trim()))}>
                            <div className="flex flex-wrap gap-2">
                                {article.keywords.map((keyword, index) => (
                                    <span key={index} className="px-3 py-1 text-xs font-medium text-slate-700 bg-slate-200 dark:text-slate-200 dark:bg-slate-700 rounded-md">{keyword}</span>
                                ))}
                            </div>
                        </CopyableField>
                    </div>

                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6">
                         <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-200">Siêu dữ liệu SEO</h2>
                        <CopyableField label="Tiêu đề SEO (SEO Title)" value={article.seoTitle} isEditable onSave={(newValue) => handleFieldChange('seoTitle', newValue)} />
                        <CopyableField label="Mô tả SEO (SEO Description)" value={article.seoDescription} isEditable isTextarea onSave={(newValue) => handleFieldChange('seoDescription', newValue)} />
                        <CopyableField label="Từ khóa SEO (SEO Keywords)" value={article.seoKeywords.join(', ')} isEditable onSave={(newValue) => handleFieldChange('seoKeywords', newValue.split(',').map(s => s.trim()))}>
                           <p className="text-slate-700 dark:text-slate-300 text-sm">{article.seoKeywords.join(', ')}</p>
                        </CopyableField>
                    </div>

                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Nội dung Bài viết</h2>
                      <div className="prose prose-slate dark:prose-invert max-w-none p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700/50" dangerouslySetInnerHTML={{ __html: article.content }} />
                    </div>
                </div>
            )}
            
            {activeTab === 'seo' && <SeoDashboard article={article} seoResult={seoResult} />}
            
            {activeTab === 'compare' && (
              <div className="animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-200">Bài viết Gốc</h3>
                    <div className="h-96 overflow-y-auto p-4 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {originalText ? originalText : <div className="flex items-center justify-center h-full"><SpinnerIcon className="w-6 h-6" /></div>}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-200">Bài viết Mới</h3>
                    <div className="h-96 overflow-y-auto p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="prose prose-sm prose-slate dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'export' && (
              <div className="animate-fade-in max-w-lg mx-auto text-center">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-200">Xuất bài viết của bạn</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Sao chép HTML hoặc tải xuống dưới dạng tệp Markdown.</p>
                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                  <button onClick={handleCopyHtml} className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg shadow-sm hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-colors">
                    <CopyIcon className="w-5 h-5" />
                    <span>Sao chép HTML</span>
                  </button>
                  <button onClick={handleDownloadMarkdown} disabled={isConverting} className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-500 disabled:bg-indigo-400 transition-colors">
                    {isConverting ? <SpinnerIcon className="w-5 h-5" /> : <DownloadIcon className="w-5 h-5" />}
                    <span>{isConverting ? 'Đang chuyển đổi...' : 'Tải Markdown (.md)'}</span>
                  </button>
                </div>
                {conversionError && <p className="text-sm text-red-500 mt-4">{conversionError}</p>}
              </div>
            )}
        </div>
    </Card>
  );
};

export default ArticleDisplay;