'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';

interface Publisher {
  id: number;
  name: string;
}

interface PublisherAutoCompleteProps {
  selectedPublishers: string[];
  onPublishersChange: (publishers: string[]) => void;
}

export default function PublisherAutoComplete({ selectedPublishers, onPublishersChange }: PublisherAutoCompleteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 共通クラス（ダーク配色・Designer版と統一）
  const inputLikeWrapper =
      'w-full border border-gray-700 bg-gray-900 text-gray-100 rounded text-sm ' +
      'focus-within:ring-1 focus-within:ring-sky-500 focus-within:border-sky-500 px-2 py-2';
  const innerInputCls =
      'bg-transparent text-gray-100 placeholder-gray-500 outline-none border-none p-0 m-0 ' +
      'min-w-[8ch] flex-1';
  const panelBase =
      'absolute z-20 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1';
  const itemBase =
      'p-2 text-sm text-gray-100 hover:bg-gray-800 cursor-pointer border-b border-gray-800 last	border-b-0';

  const searchPublishers = async (search: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/publishers?search=${encodeURIComponent(search)}`);
      const data: Publisher[] = await response.json();
      setPublishers(data);
    } catch (error) {
      console.error('パブリッシャー検索エラー:', error);
      setPublishers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm.length >= 1) {
      const timer = setTimeout(() => {
        searchPublishers(searchTerm);
        setIsOpen(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setPublishers([]);
      setIsOpen(false);
    }
  }, [searchTerm]);

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

  const selectPublisher = (publisherName: string) => {
    if (!selectedPublishers.includes(publisherName)) {
      onPublishersChange([...selectedPublishers, publisherName]);
    }
    setSearchTerm('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removePublisher = (publisherName: string) => {
    onPublishersChange(selectedPublishers.filter(name => name !== publisherName));
    inputRef.current?.focus();
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
    if (publishers.length > 0 && searchTerm) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && searchTerm.length === 0 && selectedPublishers.length > 0) {
      e.preventDefault();
      const last = selectedPublishers[selectedPublishers.length - 1];
      removePublisher(last);
    }
    if (e.key === 'Enter' && publishers.length > 0 && searchTerm.length > 0) {
      e.preventDefault();
      const first = publishers.find(p => !selectedPublishers.includes(p.name));
      if (first) selectPublisher(first.name);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
      <div className="relative">
        {/* タグを入力欄内に表示 */}
        <div
            ref={containerRef}
            className={inputLikeWrapper}
            onClick={handleContainerClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') inputRef.current?.focus();
            }}
        >
          <div className="flex flex-wrap items-center gap-2">
            {selectedPublishers.map((publisherName) => (
                <span
                    key={publisherName}
                    className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                >
              {publisherName}
                  <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removePublisher(publisherName);
                      }}
                      className="text-purple-300 hover:text-purple-200 font-bold"
                      type="button"
                      aria-label={`${publisherName} を削除`}
                  >
                ×
              </button>
            </span>
            ))}

            <input
                ref={inputRef}
                type="text"
                placeholder={selectedPublishers.length ? '' : 'パブリッシャー名を入力...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                  if (publishers.length > 0 && searchTerm) setIsOpen(true);
                }}
                onKeyDown={handleKeyDown}
                className={innerInputCls}
            />
          </div>
        </div>

        {/* ドロップダウン */}
        {isOpen && (
            <div ref={dropdownRef} className={panelBase}>
              {loading ? (
                  <div className="p-2 text-gray-400">検索中...</div>
              ) : publishers.length > 0 ? (
                  publishers
                      .filter(publisher => !selectedPublishers.includes(publisher.name))
                      .map((publisher) => (
                          <div
                              key={publisher.id}
                              onClick={() => selectPublisher(publisher.name)}
                              className="p-2 text-sm text-gray-100 hover:bg-gray-800 cursor-pointer border-b border-gray-800 last:border-b-0"
                          >
                            {publisher.name}
                          </div>
                      ))
              ) : searchTerm.length >= 1 ? (
                  <div className="p-2 text-gray-400">該当するパブリッシャーが見つかりません</div>
              ) : null}
            </div>
        )}
      </div>
  );
}