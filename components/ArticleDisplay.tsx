import React, { useState, useEffect } from 'react';
import { StoredArticle, SeoValidationResult, SeoCheck } from '../types';
import Card from './Card';
import { CopyIcon, CheckIcon, EditIcon, WarningIcon } from './Icons';

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

const SeoCheckItem: React.FC<{ check: SeoCheck }> = ({ check }) => (
    <li className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
            {check.pass ? (
                <CheckIcon className="h-5 w-5 text-green-500" />
            ) : (
                <WarningIcon className="h-5 w-5 text-yellow-500" />
            )}
        </div>
        <p className="ml-3 text-sm text-slate-600 dark:text-slate-400">{check.message}</p>
    </li>
);

const SeoScore: React.FC<{ result: SeoValidationResult }> = ({ result }) => {
    const scoreColor = result.score >= 80 ? 'text-green-500' : result.score >= 50 ? 'text-yellow-500' : 'text-red-500';

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-200">
                    Phân tích SEO
                </h2>
                 <span className={`text-3xl font-extrabold ${scoreColor}`}>{result.score}<span className="text-lg">/100</span></span>
            </div>
            <ul className="space-y-3 mt-4">
                {Object.values(result.results).map((check, index) => <SeoCheckItem key={index} check={check} />)}
            </ul>
        </Card>
    );
}

interface ArticleDisplayProps {
    article: StoredArticle;
    seoResult: SeoValidationResult;
    onUpdate: (updatedArticle: StoredArticle) => void;
}

const ArticleDisplay: React.FC<ArticleDisplayProps> = ({ article, seoResult, onUpdate }) => {
  const handleFieldChange = (field: keyof StoredArticle, value: string | string[]) => {
      const updatedArticle = { ...article, [field]: value };
      onUpdate(updatedArticle);
  };

  return (
    <div className="space-y-8">
      <SeoScore result={seoResult} />
      
      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CopyableField label="Tiêu đề (Title)" value={article.title} />
            <CopyableField label="Slug" value={article.slug} isCode />
        </div>
        <CopyableField label="Tóm tắt (Summary)" value={article.summary} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CopyableField label="Danh mục (Categories)" value={article.categories.join(', ')}>
                <div className="flex flex-wrap gap-2">
                    {article.categories.map((category, index) => (
                        <span key={index} className="px-3 py-1 text-sm font-medium text-sky-800 bg-sky-100 dark:text-sky-100 dark:bg-sky-500/20 rounded-full">
                            {category}
                        </span>
                    ))}
                </div>
            </CopyableField>
            
            <CopyableField label="Từ khóa (Keywords)" value={article.keywords.join(', ')}>
                <div className="flex flex-wrap gap-2">
                    {article.keywords.map((keyword, index) => (
                        <span key={index} className="px-3 py-1 text-xs font-medium text-slate-700 bg-slate-200 dark:text-slate-200 dark:bg-slate-700 rounded-md">
                            {keyword}
                        </span>
                    ))}
                </div>
            </CopyableField>
        </div>
      </Card>
      
      <Card className="p-6 space-y-6 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700/50">
        <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-200">Siêu dữ liệu SEO</h2>
        <CopyableField label="Tiêu đề SEO (SEO Title)" value={article.seoTitle} isEditable onSave={(newValue) => handleFieldChange('seoTitle', newValue)} />
        <CopyableField label="Mô tả SEO (SEO Description)" value={article.seoDescription} isEditable isTextarea onSave={(newValue) => handleFieldChange('seoDescription', newValue)} />
        <CopyableField label="Từ khóa SEO (SEO Keywords)" value={article.seoKeywords.join(', ')} isEditable onSave={(newValue) => handleFieldChange('seoKeywords', newValue.split(',').map(s => s.trim()))}>
           <p className="text-slate-700 dark:text-slate-300 text-sm">{article.seoKeywords.join(', ')}</p>
        </CopyableField>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Nội dung Bài viết</h2>
        <CopyableField label="Nội dung HTML" value={article.content} className="mb-6"/>
        <div>
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Xem trước Nội dung</h3>
          <div
              className="prose prose-slate dark:prose-invert max-w-none p-4 bg-white dark:bg-slate-800 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
        </div>
      </Card>

    </div>
  );
};

export default ArticleDisplay;