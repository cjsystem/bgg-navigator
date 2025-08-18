'use client';

import { useState, useEffect, useRef } from 'react';

interface Designer {
  id: number;
  name: string;
}

interface DesignerAutocompleteProps {
  selectedDesigners: string[];
  onDesignersChange: (designers: string[]) => void;
}

export default function DesignerAutoComplete({ selectedDesigners, onDesignersChange }: DesignerAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 共通クラス（ダーク配色）
  const inputBase =
      'w-full border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 p-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500';
  const panelBase =
      'absolute z-20 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1';
  const itemBase =
      'p-2 text-sm text-gray-100 hover:bg-gray-800 cursor-pointer border-b border-gray-800 last:border-b-0';

  // デザイナー検索
  const searchDesigners = async (search: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/designers?search=${encodeURIComponent(search)}`);
      const data: Designer[] = await response.json();
      setDesigners(data);
    } catch (error) {
      console.error('デザイナー検索エラー:', error);
      setDesigners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm.length >= 1) {
      const timer = setTimeout(() => {
        searchDesigners(searchTerm);
        setIsOpen(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setDesigners([]);
      setIsOpen(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectDesigner = (designerName: string) => {
    if (!selectedDesigners.includes(designerName)) {
      onDesignersChange([...selectedDesigners, designerName]);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  const removeDesigner = (designerName: string) => {
    onDesignersChange(selectedDesigners.filter(name => name !== designerName));
  };

  return (
      <div className="relative" ref={dropdownRef}>
        {/* 選択済みタグ（ダーク配色） */}
        {selectedDesigners.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedDesigners.map((designerName) => (
                  <span
                      key={designerName}
                      className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                  >
              {designerName}
                    <button
                        onClick={() => removeDesigner(designerName)}
                        className="text-blue-300 hover:text-blue-200 font-bold"
                        type="button"
                    >
                ×
              </button>
            </span>
              ))}
            </div>
        )}

        {/* 検索入力（ダーク配色） */}
        <input
            type="text"
            placeholder="デザイナー名を入力..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (designers.length > 0) setIsOpen(true);
            }}
            className={inputBase}
        />

        {/* ドロップダウン（ダーク配色） */}
        {isOpen && (
            <div className={panelBase}>
              {loading ? (
                  <div className="p-2 text-gray-400">検索中...</div>
              ) : designers.length > 0 ? (
                  designers
                      .filter(designer => !selectedDesigners.includes(designer.name))
                      .map((designer) => (
                          <div
                              key={designer.id}
                              onClick={() => selectDesigner(designer.name)}
                              className={itemBase}
                          >
                            {designer.name}
                          </div>
                      ))
              ) : searchTerm.length >= 1 ? (
                  <div className="p-2 text-gray-400">該当するデザイナーが見つかりません</div>
              ) : null}
            </div>
        )}
      </div>
  );
}