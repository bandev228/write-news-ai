import React, { useState, useMemo } from 'react';
import { StoredArticle } from '../types';
import { HistoryIcon, TrashIcon, LogoIcon, StarIcon, WrenchIcon, EyeIcon, EditIcon, CopyIcon } from './Icons';

type FilterType = 'recent' | 'best' | 'editing';

const getScoreColor = (score: number | undefined) => {
    if (score === undefined) return 'text-slate-500';
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
};

const QuickViewModal: React.FC<{ article: StoredArticle, onClose: () => void }> = ({ article, onClose }) => {
    return (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 z-40 w-screen overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <div className="relative transform overflow-hidden rounded-xl bg-white dark:bg-slate-900 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                        <div className="p-6">
                            {article.avatarUrl && <img src={article.avatarUrl} alt={article.title} className="w-full h-48 object-cover rounded-lg mb-4" />}
                            <h3 className="text-lg font-bold leading-6 text-slate-900 dark:text-white" id="modal-title">{article.title}</h3>
                            <div className="mt-2">
                                <p className="text-sm text-slate-500 dark:text-slate-400">{article.summary}</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-slate-700 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-200 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 sm:mt-0 sm:w-auto"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


interface HistoryListProps {
  history: StoredArticle[];
  onSelect: (article: StoredArticle) => void;
  onDelete: (id: string) => void;
  onDuplicate: (article: StoredArticle) => void;
  activeId?: string | null;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onDelete, onDuplicate, activeId }) => {
    const [filter, setFilter] = useState<FilterType>('recent');
    const [viewingArticle, setViewingArticle] = useState<StoredArticle | null>(null);

    const filteredHistory = useMemo(() => {
        const historyCopy = [...history];
        switch (filter) {
            case 'best':
                return historyCopy.sort((a, b) => (b.seoScore ?? 0) - (a.seoScore ?? 0));
            case 'editing':
                return historyCopy.filter(a => (a.seoScore ?? 0) < 80).sort((a, b) => (a.seoScore ?? 0) - (b.seoScore ?? 0));
            case 'recent':
            default:
                return historyCopy.sort((a, b) => b.createdAt - a.createdAt);
        }
    }, [history, filter]);

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
            onDelete(id);
        }
    }
    
    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    }
    
    const filters: { id: FilterType; name: string; icon: React.ReactNode }[] = [
      { id: 'recent', name: 'Gần đây', icon: <HistoryIcon className="w-4 h-4" /> },
      { id: 'best', name: 'Tốt nhất', icon: <StarIcon className="w-4 h-4" /> },
      { id: 'editing', name: 'Cần sửa', icon: <WrenchIcon className="w-4 h-4" /> },
    ];

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
                <HistoryIcon className="w-6 h-6" />
                <span>Lịch sử Bài viết</span>
            </h2>
            
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-3">
                {filters.map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                            filter === f.id
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'
                        }`}
                    >
                        {f.icon}
                        <span>{f.name}</span>
                    </button>
                ))}
            </div>

            {filteredHistory.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Không có bài viết nào
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                       Lịch sử của bạn cho bộ lọc này trống.
                    </p>
                </div>
            ) : (
                <ul className="space-y-2 overflow-y-auto flex-1 -mx-2 px-2">
                    {filteredHistory.map(article => (
                        <li key={article.id}>
                            <div
                                className={`group p-2 rounded-lg transition-colors w-full text-left flex items-center gap-3 relative ${activeId === article.id ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <div className="flex-shrink-0 w-14 h-14 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                                    {article.avatarUrl ? (
                                        <img src={article.avatarUrl} alt={article.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <LogoIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelect(article)}>
                                    <h3 className={`font-semibold text-sm truncate ${activeId === article.id ? 'text-indigo-800 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {article.title}
                                    </h3>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        <div className={`flex items-center gap-1 font-semibold ${getScoreColor(article.seoScore)}`}>
                                            <StarIcon className="w-3.5 h-3.5" />
                                            <span>{article.seoScore ?? 'N/A'}</span>
                                        </div>
                                        <span>
                                            {new Date(article.createdAt).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity absolute top-1/2 -translate-y-1/2 right-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-1 rounded-md shadow-md border border-slate-200 dark:border-slate-700">
                                    <button onClick={(e) => handleActionClick(e, () => setViewingArticle(article))} className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-md" title="Xem nhanh"> <EyeIcon className="w-4 h-4" /> </button>
                                    <button onClick={(e) => handleActionClick(e, () => onSelect(article))} className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-md" title="Chỉnh sửa"> <EditIcon className="w-4 h-4" /> </button>
                                    <button onClick={(e) => handleActionClick(e, () => onDuplicate(article))} className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-md" title="Nhân bản"> <CopyIcon className="w-4 h-4" /> </button>
                                    <button onClick={(e) => handleDeleteClick(e, article.id)} className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-500 transition-colors rounded-md" title="Xóa"> <TrashIcon className="w-4 h-4" /> </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {viewingArticle && <QuickViewModal article={viewingArticle} onClose={() => setViewingArticle(null)} />}
        </div>
    );
};

export default HistoryList;
