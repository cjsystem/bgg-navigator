'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';

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
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 共通クラス（ダーク配色）
  const inputLikeWrapper =
      'w-full border border-gray-700 bg-gray-900 text-gray-100 rounded text-sm ' +
      'focus-within:ring-1 focus-within:ring-sky-500 focus-within:border-sky-500';
  const innerInputCls =
      'bg-transparent text-gray-100 placeholder-gray-500 outline-none border-none p-0 m-0 ' +
      'min-w-[8ch] flex-1';
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

  // 外側クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
          dropdownRef.current &&
          !dropdownRef.current.contains(target) &&
          containerRef.current &&
          !containerRef.current.contains(target)
      ) {
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
    inputRef.current?.focus();
  };

  const removeDesigner = (designerName: string) => {
    onDesignersChange(selectedDesigners.filter(name => name !== designerName));
    inputRef.current?.focus();
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
    if (designers.length > 0 && searchTerm) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // 入力が空のときのBackspaceで最後のタグを削除
    if (e.key === 'Backspace' && searchTerm.length === 0 && selectedDesigners.length > 0) {
      e.preventDefault();
      const last = selectedDesigners[selectedDesigners.length - 1];
      removeDesigner(last);
    }
    // Enterでドロップダウン先頭を選択（任意）
    if (e.key === 'Enter' && designers.length > 0 && searchTerm.length > 0) {
      e.preventDefault();
      const first = designers.find(d => !selectedDesigners.includes(d.name));
      if (first) selectDesigner(first.name);
    }
    // Escでパネルを閉じる
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
      <div className="relative">
        {/* タグが「入力欄の中」に表示される擬似インプット */}
        <div
            ref={containerRef}
            className={`${inputLikeWrapper} px-2 py-2`}
            onClick={handleContainerClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') inputRef.current?.focus();
            }}
        >
          <div className="flex flex-wrap items-center gap-2">
            {selectedDesigners.map((designerName) => (
                <span
                    key={designerName}
                    className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                >
              {designerName}
                  <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDesigner(designerName);
                      }}
                      className="text-blue-300 hover:text-blue-200 font-bold"
                      type="button"
                      aria-label={`${designerName} を削除`}
                  >
                ×
              </button>
            </span>
            ))}

            {/* 実際のインプット（枠線なし、透明背景） */}
            <input
                ref={inputRef}
                type="text"
                placeholder={selectedDesigners.length ? '' : 'デザイナー名を入力...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                  if (designers.length > 0 && searchTerm) setIsOpen(true);
                }}
                onKeyDown={handleKeyDown}
                className={innerInputCls}
            />
          </div>
        </div>

        {/* ドロップダウン（ダーク配色） */}
        {isOpen && (
            <div ref={dropdownRef} className={panelBase}>
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