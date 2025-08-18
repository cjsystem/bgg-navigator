'use client';

import { useState, useEffect, useRef } from 'react';

interface AwardName {
  name: string;
}

interface AwardType {
  type: string;
}

interface AwardSearchProps {
  awardYear: string;
  awardName: string;
  awardType: string;
  onAwardYearChange: (year: string) => void;
  onAwardNameChange: (name: string) => void;
  onAwardTypeChange: (type: string) => void;
}

export default function AwardSearch({
                                      awardYear,
                                      awardName,
                                      awardType,
                                      onAwardYearChange,
                                      onAwardNameChange,
                                      onAwardTypeChange
                                    }: AwardSearchProps) {
  // 賞名オートコンプリート用の状態
  const [awardNames, setAwardNames] = useState<AwardName[]>([]);
  const [isAwardNameOpen, setIsAwardNameOpen] = useState(false);
  const [awardNameSearchTerm, setAwardNameSearchTerm] = useState('');
  const [awardNameLoading, setAwardNameLoading] = useState(false);
  const awardNameRef = useRef<HTMLDivElement>(null);

  // 賞タイプ用の状態
  const [awardTypes, setAwardTypes] = useState<AwardType[]>([]);
  const [awardTypesLoading, setAwardTypesLoading] = useState(true);

  // 初回読み込み時に賞タイプを取得
  useEffect(() => {
    loadAwardTypes();
  }, []);

  const loadAwardTypes = async () => {
    setAwardTypesLoading(true);
    try {
      const response = await fetch('/api/awards/types');
      if (response.ok) {
        const data: AwardType[] = await response.json();
        setAwardTypes(data);
      }
    } catch (error) {
      console.error('賞タイプ取得エラー:', error);
    } finally {
      setAwardTypesLoading(false);
    }
  };

  // 賞名検索
  const searchAwardNames = async (search: string) => {
    setAwardNameLoading(true);
    try {
      const response = await fetch(`/api/awards/names?search=${encodeURIComponent(search)}`);
      if (response.ok) {
        const data: AwardName[] = await response.json();
        setAwardNames(data);
      }
    } catch (error) {
      console.error('賞名検索エラー:', error);
      setAwardNames([]);
    } finally {
      setAwardNameLoading(false);
    }
  };

  // 賞名検索文字列が変更された時
  useEffect(() => {
    if (awardNameSearchTerm.length >= 1) {
      const timer = setTimeout(() => {
        searchAwardNames(awardNameSearchTerm);
        setIsAwardNameOpen(true);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setAwardNames([]);
      setIsAwardNameOpen(false);
    }
  }, [awardNameSearchTerm]);

  // 外側クリックで賞名ドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (awardNameRef.current && !awardNameRef.current.contains(event.target as Node)) {
        setIsAwardNameOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 賞名を選択
  const selectAwardName = (name: string) => {
    onAwardNameChange(name);
    setAwardNameSearchTerm('');
    setIsAwardNameOpen(false);
  };

  // 賞名入力変更
  const handleAwardNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onAwardNameChange(value);
    setAwardNameSearchTerm(value);
  };

  // クリア機能
  const clearAll = () => {
    onAwardYearChange('');
    onAwardNameChange('');
    onAwardTypeChange('');
    setAwardNameSearchTerm('');
  };

  // ダークテーマ向け共通クラス
  const labelCls = 'block text-xs font-medium text-slate-200 mb-1';
  const inputCls =
      'w-full border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 p-2 rounded text-sm ' +
      'focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500';
  const selectCls =
      'w-full border border-gray-700 bg-gray-900 text-gray-100 p-2 rounded text-sm ' +
      'focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 disabled:bg-gray-800 disabled:text-gray-400';

  return (
      <div>
        <div className="grid grid-cols-3 gap-3">
          {/* 受賞年 */}
          <div>
            <label className={labelCls}>
              受賞年
            </label>
            <input
                type="number"
                placeholder="1998"
                value={awardYear}
                onChange={(e) => onAwardYearChange(e.target.value)}
                className={inputCls}
                min="1900"
                max="2030"
            />
          </div>

          {/* 賞名（オートコンプリート） */}
          <div className="relative" ref={awardNameRef}>
            <label className={labelCls}>
              賞名
            </label>
            <input
                type="text"
                placeholder="賞名を入力..."
                value={awardName}
                onChange={handleAwardNameInputChange}
                onFocus={() => {
                  if (awardNames.length > 0) setIsAwardNameOpen(true);
                }}
                className={inputCls}
            />

            {/* ドロップダウンリスト（ダークテーマ配色） */}
            {isAwardNameOpen && (
                <div className="absolute z-20 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                  {awardNameLoading ? (
                      <div className="p-2 text-gray-400 text-sm">検索中...</div>
                  ) : awardNames.length > 0 ? (
                      awardNames.map((award, index) => (
                          <div
                              key={index}
                              onClick={() => selectAwardName(award.name)}
                              className="p-2 hover:bg-gray-800 cursor-pointer border-b border-gray-800 last:border-b-0 text-sm text-gray-100"
                          >
                            {award.name}
                          </div>
                      ))
                  ) : awardNameSearchTerm.length >= 1 ? (
                      <div className="p-2 text-gray-400 text-sm">該当する賞が見つかりません</div>
                  ) : null}
                </div>
            )}
          </div>

          {/* 賞タイプ */}
          <div>
            <label className={labelCls}>
              タイプ
            </label>
            <select
                value={awardType}
                onChange={(e) => onAwardTypeChange(e.target.value)}
                disabled={awardTypesLoading}
                className={selectCls}
            >
              <option value="">選択...</option>
              {awardTypesLoading ? (
                  <option disabled>読み込み中...</option>
              ) : (
                  awardTypes.map((type, index) => (
                      <option key={index} value={type.type}>
                        {type.type}
                      </option>
                  ))
              )}
            </select>
          </div>
        </div>

        {/* 選択済み表示とクリアボタン（ダークテーマに合わせて調整） */}
        {(awardYear || awardName || awardType) && (
            <div className="mt-2 flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {awardYear && (
                    <span className="inline-block bg-rose-900/30 text-rose-300 px-2 py-1 rounded-full text-xs">
                年: {awardYear}
              </span>
                )}
                {awardName && (
                    <span className="inline-block bg-rose-900/30 text-rose-300 px-2 py-1 rounded-full text-xs">
                賞: {awardName}
              </span>
                )}
                {awardType && (
                    <span className="inline-block bg-rose-900/30 text-rose-300 px-2 py-1 rounded-full text-xs">
                {awardType}
              </span>
                )}
              </div>
              <button
                  onClick={clearAll}
                  className="text-xs text-red-300 hover:text-red-200"
                  type="button"
              >
                すべてクリア
              </button>
            </div>
        )}
      </div>
  );
}