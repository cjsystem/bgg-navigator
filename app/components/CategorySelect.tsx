'use client';

import { useState, useEffect, useRef } from 'react';

interface Category {
  id: number;
  name: string;
}

interface CategorySelectProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

export default function CategorySelect({ selectedCategories, onCategoriesChange }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      const data: Category[] = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('カテゴリ取得エラー:', error);
      setError(error instanceof Error ? error.message : 'カテゴリ取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(category =>
      !selectedCategories.includes(category.name) &&
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectCategory = (categoryName: string) => {
    if (!selectedCategories.includes(categoryName)) {
      onCategoriesChange([...selectedCategories, categoryName]);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const removeCategory = (categoryName: string) => {
    onCategoriesChange(selectedCategories.filter(name => name !== categoryName));
  };

  const clearAll = () => {
    onCategoriesChange([]);
  };

  // AwardSearch/MechanicSelect に合わせたダーク配色共通クラス
  const triggerCls =
      'w-full border border-gray-700 bg-gray-900 text-gray-100 p-2 rounded text-left flex items-center justify-between ' +
      'hover:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50';
  const panelBase =
      'absolute z-20 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg mt-1';
  const headerRowCls = 'p-2 text-xs text-gray-400 bg-gray-800';
  const listItemCls =
      'p-2 text-sm text-gray-100 hover:bg-gray-800 cursor-pointer border-b border-gray-800 last:border-b-0';
  const inputBase =
      'w-full border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 p-1 rounded text-sm ' +
      'focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500';

  return (
      <div className="relative" ref={dropdownRef}>
        {/* 選択済みタグ（ダーク配色） */}
        {selectedCategories.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">
              選択済み: {selectedCategories.length}件
            </span>
                <button
                    onClick={clearAll}
                    className="text-sm text-red-300 hover:text-red-200"
                    type="button"
                >
                  すべて削除
                </button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {selectedCategories.map((categoryName) => (
                    <span
                        key={categoryName}
                        className="bg-teal-900/30 text-teal-300 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                {categoryName}
                      <button
                          onClick={() => removeCategory(categoryName)}
                          className="text-teal-300 hover:text-teal-200 font-bold"
                          type="button"
                      >
                  ×
                </button>
              </span>
                ))}
              </div>
            </div>
        )}

        {/* トリガーボタン（AwardSearchのselect風見た目） */}
        <div className="relative">
          <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={triggerCls}
              disabled={loading}
          >
          <span className="text-gray-100">
            {loading ? 'カテゴリ読み込み中...' : 'カテゴリを選択...'}
          </span>
            <svg
                className={`w-5 h-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* エラー表示（ダーク配色） */}
          {error && (
              <div className="mt-1 text-sm text-red-300">
                エラー: {error}
                <button
                    onClick={loadCategories}
                    className="ml-2 text-sky-400 hover:text-sky-300 underline"
                >
                  再読み込み
                </button>
              </div>
          )}

          {/* ドロップダウン（AwardSearch と同系ダーク見た目） */}
          {isOpen && !loading && !error && (
              <div className={panelBase}>
                {/* 検索ボックス */}
                <div className="p-2 border-b border-gray-800">
                  <input
                      type="text"
                      placeholder="カテゴリ名で絞り込み..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={inputBase}
                      autoFocus
                  />
                </div>

                {/* カテゴリリスト */}
                <div className="max-h-60 overflow-y-auto">
                  {filteredCategories.length > 0 ? (
                      <>
                        <div className={headerRowCls}>
                          {filteredCategories.length}件のカテゴリ
                        </div>
                        {filteredCategories.map((category) => (
                            <div
                                key={category.id}
                                onClick={() => selectCategory(category.name)}
                                className={listItemCls}
                            >
                              {category.name}
                            </div>
                        ))}
                      </>
                  ) : searchTerm ? (
                      <div className="p-2 text-gray-400 text-sm text-center">
                        「{searchTerm}」に該当するカテゴリが見つかりません
                      </div>
                  ) : (
                      <div className="p-2 text-gray-400 text-sm text-center">
                        すべてのカテゴリが選択済みです
                      </div>
                  )}
                </div>
              </div>
          )}
        </div>
      </div>
  );
}