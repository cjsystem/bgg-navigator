'use client';

import { useState, useEffect, useRef } from 'react';

interface Mechanic {
  id: number;
  name: string;
}

interface MechanicSelectProps {
  selectedMechanics: string[];
  onMechanicsChange: (mechanics: string[]) => void;
}

export default function MechanicSelect({ selectedMechanics, onMechanicsChange }: MechanicSelectProps) {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 初回読み込み時に全メカニクスを取得
  useEffect(() => {
    loadMechanics();
  }, []);

  const loadMechanics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mechanics');

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data: Mechanic[] = await response.json();
      setMechanics(data);
    } catch (error) {
      console.error('メカニクス取得エラー:', error);
      setError(error instanceof Error ? error.message : 'メカニクス取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 検索フィルタリング
  const filteredMechanics = mechanics.filter(mechanic =>
      !selectedMechanics.includes(mechanic.name) &&
      mechanic.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 外側クリックでドロップダウンを閉じる
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

  // メカニクスを選択
  const selectMechanic = (mechanicName: string) => {
    if (!selectedMechanics.includes(mechanicName)) {
      onMechanicsChange([...selectedMechanics, mechanicName]);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  // 選択済みメカニクスを削除
  const removeMechanic = (mechanicName: string) => {
    onMechanicsChange(selectedMechanics.filter(name => name !== mechanicName));
  };

  // 全選択解除
  const clearAll = () => {
    onMechanicsChange([]);
  };

  return (
      <div className="relative" ref={dropdownRef}>
        {/* 選択済みメカニクスタグ */}
        {selectedMechanics.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              選択済み: {selectedMechanics.length}件
            </span>
                <button
                    onClick={clearAll}
                    className="text-sm text-red-600 hover:text-red-800"
                    type="button"
                >
                  すべて削除
                </button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {selectedMechanics.map((mechanicName) => (
                    <span
                        key={mechanicName}
                        className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                {mechanicName}
                      <button
                          onClick={() => removeMechanic(mechanicName)}
                          className="text-orange-600 hover:text-orange-800 font-bold"
                          type="button"
                      >
                  ×
                </button>
              </span>
                ))}
              </div>
            </div>
        )}

        {/* プルダウン選択ボタン */}
        <div className="relative">
          <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full border p-2 rounded bg-white text-left flex items-center justify-between hover:bg-gray-50"
              disabled={loading}
          >
          <span className="text-gray-700">
            {loading ? 'メカニクス読み込み中...' : 'メカニクスを選択...'}
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

          {/* エラー表示 */}
          {error && (
              <div className="mt-1 text-sm text-red-600">
                エラー: {error}
                <button
                    onClick={loadMechanics}
                    className="ml-2 text-blue-600 hover:text-blue-800 underline"
                >
                  再読み込み
                </button>
              </div>
          )}

          {/* ドロップダウンリスト */}
          {isOpen && !loading && !error && (
              <div className="absolute z-20 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1">
                {/* 検索ボックス */}
                <div className="p-2 border-b">
                  <input
                      type="text"
                      placeholder="メカニクス名で絞り込み..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full border p-1 rounded text-sm"
                      autoFocus
                  />
                </div>

                {/* メカニクスリスト */}
                <div className="max-h-60 overflow-y-auto">
                  {filteredMechanics.length > 0 ? (
                      <>
                        <div className="p-2 text-xs text-gray-500 bg-gray-50">
                          {filteredMechanics.length}件のメカニクス
                        </div>
                        {filteredMechanics.map((mechanic) => (
                            <div
                                key={mechanic.id}
                                onClick={() => selectMechanic(mechanic.name)}
                                className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 text-sm"
                            >
                              {mechanic.name}
                            </div>
                        ))}
                      </>
                  ) : searchTerm ? (
                      <div className="p-2 text-gray-500 text-sm text-center">
                        「{searchTerm}」に該当するメカニクスが見つかりません
                      </div>
                  ) : (
                      <div className="p-2 text-gray-500 text-sm text-center">
                        すべてのメカニクスが選択済みです
                      </div>
                  )}
                </div>
              </div>
          )}
        </div>
      </div>
  );
}