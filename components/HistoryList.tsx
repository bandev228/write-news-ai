import React from 'react';
import { StoredArticle } from '../types';
import { HistoryIcon, TrashIcon } from './Icons';

interface HistoryListProps {
  history: StoredArticle[];
  onSelect: (article: StoredArticle) => void;
  onDelete: (id: string) => void;
  activeId?: string | null;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onDelete, activeId }) => {

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent onSelect from being called
        if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
            onDelete(id);
        }
    }

    return (
        <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                <HistoryIcon className="w-6 h-6" />
                <span>Lịch sử Bài viết</span>
            </h2>
            {history.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Chưa có bài viết nào
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                       Lịch sử sẽ được lưu ở đây.
                    </p>
                </div>
            ) : (
                <ul className="space-y-1 -mx-2">
                    {history.map(article => (
                        <li key={article.id}>
                            <div
                                onClick={() => onSelect(article)}
                                className={`group p-3 rounded-lg cursor-pointer transition-colors w-full text-left ${activeId === article.id ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1">
                                        <h3 className={`font-semibold text-sm truncate ${activeId === article.id ? 'text-indigo-800 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>
                                            {article.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            {new Date(article.createdAt).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                    <div className="flex items-center flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                        <button onClick={(e) => handleDeleteClick(e, article.id)} className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-500 transition-colors rounded-md">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default HistoryList;