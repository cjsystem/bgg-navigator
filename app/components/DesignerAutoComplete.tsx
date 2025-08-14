
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

  // 検索文字列が変更された時
  useEffect(() => {
    if (searchTerm.length >= 1) {
      const timer = setTimeout(() => {
        searchDesigners(searchTerm);
        setIsOpen(true);
      }, 300); // 300ms遅延でデバウンス

      return () => clearTimeout(timer);
    } else {
      setDesigners([]);
      setIsOpen(false);
    }
  }, [searchTerm]);

  // 外側クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // デザイナーを選択
  const selectDesigner = (designerName: string) => {
    if (!selectedDesigners.includes(designerName)) {
      onDesignersChange([...selectedDesigners, designerName]);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  // 選択済みデザイナーを削除
  const removeDesigner = (designerName: string) => {
    onDesignersChange(selectedDesigners.filter(name => name !== designerName));
  };

  return (
      <div className="relative" ref={dropdownRef}>
      {/* 選択済みデザイナータグ */}
  {selectedDesigners.length > 0 && (
      <div className="flex flex-wrap gap-2 mb-2">
          {selectedDesigners.map((designerName) => (
                <span
                    key={designerName}
            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                >
                {designerName}
                <button
            onClick={() => removeDesigner(designerName)}
    className="text-blue-600 hover:text-blue-800 font-bold"
    type="button"
        >
                ×
              </button>
              </span>
  ))}
    </div>
  )}

  {/* 検索入力 */}
  <input
      type="text"
  placeholder="デザイナー名を入力..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  onFocus={() => {
    if (designers.length > 0) setIsOpen(true);
  }}
  className="w-full border p-2 rounded"
      />

      {/* ドロップダウンリスト */}
  {isOpen && (
      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
          {loading ? (
                <div className="p-2 text-gray-500">検索中...</div>
  ) : designers.length > 0 ? (
          designers
              .filter(designer => !selectedDesigners.includes(designer.name))
              .map((designer) => (
                  <div
                      key={designer.id}
      onClick={() => selectDesigner(designer.name)}
    className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
        >
        {designer.name}
        </div>
  ))
  ) : searchTerm.length >= 1 ? (
      <div className="p-2 text-gray-500">該当するデザイナーが見つかりません</div>
  ) : null}
    </div>
  )}
  </div>
);
}