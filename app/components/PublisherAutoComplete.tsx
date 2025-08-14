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

  // パブリッシャー検索
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

  // 検索文字列が変更された時
  useEffect(() => {
    if (searchTerm.length >= 1) {
      const timer = setTimeout(() => {
        searchPublishers(searchTerm);
        setIsOpen(true);
      }, 300); // 300ms遅延でデバウンス

      return () => clearTimeout(timer);
    } else {
      setPublishers([]);
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

  // パブリッシャーを選択
  const selectPublisher = (publisherName: string) => {
    if (!selectedPublishers.includes(publisherName)) {
      onPublishersChange([...selectedPublishers, publisherName]);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  // 選択済みパブリッシャーを削除
  const removePublisher = (publisherName: string) => {
    onPublishersChange(selectedPublishers.filter(name => name !== publisherName));
  };

  return (
      <div className="relative" ref={dropdownRef}>
        {/* 選択済みパブリッシャータグ */}
        {selectedPublishers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedPublishers.map((publisherName) => (
                  <span
                      key={publisherName}
                      className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                  >
              {publisherName}
                    <button
                        onClick={() => removePublisher(publisherName)}
                        className="text-purple-600 hover:text-purple-800 font-bold"
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
            className="w-full border p-2 rounded"
        />

        {/* ドロップダウンリスト */}
        {isOpen && (
            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
              {loading ? (
                  <div className="p-2 text-gray-500">検索中...</div>
              ) : publishers.length > 0 ? (
                  publishers
                      .filter(publisher => !selectedPublishers.includes(publisher.name))
                      .map((publisher) => (
                          <div
                              key={publisher.id}
                              onClick={() => selectPublisher(publisher.name)}
                              className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            {publisher.name}
                          </div>
                      ))
              ) : searchTerm.length >= 1 ? (
                  <div className="p-2 text-gray-500">該当するパブリッシャーが見つかりません</div>
              ) : null}
            </div>
        )}
      </div>
  );
}