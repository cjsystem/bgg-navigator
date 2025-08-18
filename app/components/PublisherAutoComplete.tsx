'use client';

import { useState, useEffect, useRef } from 'react';

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

  // 共通クラス（ダーク配色）
  const inputBase =
      'w-full border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 p-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500';
  const panelBase =
      'absolute z-20 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1';
  const itemBase =
      'p-2 text-sm text-gray-100 hover:bg-gray-800 cursor-pointer border-b border-gray-800 last:border-b-0';

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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
  };

  const removePublisher = (publisherName: string) => {
    onPublishersChange(selectedPublishers.filter(name => name !== publisherName));
  };

  return (
      <div className="relative" ref={dropdownRef}>
        {/* 選択済みタグ */}
        {selectedPublishers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedPublishers.map((publisherName) => (
                  <span
                      key={publisherName}
                      className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                  >
              {publisherName}
                    <button
                        onClick={() => removePublisher(publisherName)}
                        className="text-purple-300 hover:text-purple-200 font-bold"
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
            placeholder="パブリッシャー名を入力..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (publishers.length > 0) setIsOpen(true);
            }}
            className={inputBase}
        />

        {/* ドロップダウン */}
        {isOpen && (
            <div className={panelBase}>
              {loading ? (
                  <div className="p-2 text-gray-400">検索中...</div>
              ) : publishers.length > 0 ? (
                  publishers
                      .filter(publisher => !selectedPublishers.includes(publisher.name))
                      .map((publisher) => (
                          <div
                              key={publisher.id}
                              onClick={() => selectPublisher(publisher.name)}
                              className={itemBase}
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