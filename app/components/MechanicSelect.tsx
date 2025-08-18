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

  // ダークテーマ共通クラス
  const inputBase =
      'border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500';

  return (
      <div className="relative" ref={dropdownRef}>
        {/* プルダウン選択ボタン（ダーク配色） */}
        <div className="relative">
          <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`w-full p-2 rounded text-left flex items-center justify-between hover:bg-gray-800 disabled:opacity-50 ${inputBase}`}
              disabled={loading}
          >
          <span className="text-gray-100">
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
              <div className="mt-1 text-sm text-red-300">
                エラー: {error}
                <button
                    onClick={loadMechanics}
                    className="ml-2 text-sky-400 hover:text-sky-300 underline"
                >
                  再読み込み
                </button>
              </div>
          )}

          {/* ドロップダウンリスト（ダーク配色に変更） */}
          {isOpen && !loading && !error && (
              <div className="absolute z-20 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg mt-1">
                {/* 検索ボックス */}
                <div className="p-2 border-b border-gray-800">
                  <input
                      type="text"
                      placeholder="メカニクス名で絞り込み..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full p-1 text-sm ${inputBase}`}
                      autoFocus
                  />
                </div>

                {/* メカニクスリスト */}
                <div className="max-h-60 overflow-y-auto">
                  {filteredMechanics.length > 0 ? (
                      <>
                        <div className="p-2 text-xs text-gray-400 bg-gray-800">
                          {filteredMechanics.length}件のメカニクス
                        </div>
                        {filteredMechanics.map((mechanic) => (
                            <div
                                key={mechanic.id}
                                onClick={() => selectMechanic(mechanic.name)}
                                className="p-2 text-sm text-gray-100 hover:bg-gray-800 cursor-pointer border-b border-gray-800 last:border-b-0"
                            >
                              {mechanic.name}
                            </div>
                        ))}
                      </>
                  ) : searchTerm ? (
                      <div className="p-2 text-gray-400 text-sm text-center">
                        「{searchTerm}」に該当するメカニクスが見つかりません
                      </div>
                  ) : (
                      <div className="p-2 text-gray-400 text-sm text-center">
                        すべてのメカニクスが選択済みです
                      </div>
                  )}
                </div>
              </div>
          )}
        </div>

        {/* 選択済みメカニクスタグ - プルダウンの下に移動 */}
        {selectedMechanics.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">
              選択済み: {selectedMechanics.length}件
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
                {selectedMechanics.map((mechanicName) => (
                    <span
                        key={mechanicName}
                        className="bg-orange-900/30 text-orange-300 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                {mechanicName}
                      <button
                          onClick={() => removeMechanic(mechanicName)}
                          className="text-orange-300 hover:text-orange-200 font-bold"
                          type="button"
                      >
                  ×
                </button>
              </span>
                ))}
              </div>
            </div>
        )}
      </div>
  );
}