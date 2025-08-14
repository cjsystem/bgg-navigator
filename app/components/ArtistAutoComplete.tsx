
'use client';

import { useState, useEffect, useRef } from 'react';

interface Artist {
  id: number;
  name: string;
}

interface ArtistAutocompleteProps {
  selectedArtists: string[];
  onArtistsChange: (artists: string[]) => void;
}

export default function ArtistAutoComplete({ selectedArtists, onArtistsChange }: ArtistAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // アーティスト検索
  const searchArtists = async (search: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/artists?search=${encodeURIComponent(search)}`);
      const data: Artist[] = await response.json();
      setArtists(data);
    } catch (error) {
      console.error('アーティスト検索エラー:', error);
      setArtists([]);
    } finally {
      setLoading(false);
    }
  };

  // 検索文字列が変更された時
  useEffect(() => {
    if (searchTerm.length >= 1) {
      const timer = setTimeout(() => {
        searchArtists(searchTerm);
        setIsOpen(true);
      }, 300); // 300ms遅延でデバウンス

      return () => clearTimeout(timer);
    } else {
      setArtists([]);
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

  // アーティストを選択
  const selectArtist = (artistName: string) => {
    if (!selectedArtists.includes(artistName)) {
      onArtistsChange([...selectedArtists, artistName]);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  // 選択済みアーティストを削除
  const removeArtist = (artistName: string) => {
    onArtistsChange(selectedArtists.filter(name => name !== artistName));
  };

  return (
      <div className="relative" ref={dropdownRef}>
        {/* 選択済みアーティストタグ */}
        {selectedArtists.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedArtists.map((artistName) => (
                  <span
                      key={artistName}
                      className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                  >
              {artistName}
                    <button
                        onClick={() => removeArtist(artistName)}
                        className="text-green-600 hover:text-green-800 font-bold"
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
            placeholder="アーティスト名を入力..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (artists.length > 0) setIsOpen(true);
            }}
            className="w-full border p-2 rounded"
        />

        {/* ドロップダウンリスト */}
        {isOpen && (
            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
              {loading ? (
                  <div className="p-2 text-gray-500">検索中...</div>
              ) : artists.length > 0 ? (
                  artists
                      .filter(artist => !selectedArtists.includes(artist.name))
                      .map((artist) => (
                          <div
                              key={artist.id}
                              onClick={() => selectArtist(artist.name)}
                              className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            {artist.name}
                          </div>
                      ))
              ) : searchTerm.length >= 1 ? (
                  <div className="p-2 text-gray-500">該当するアーティストが見つかりません</div>
              ) : null}
            </div>
        )}
      </div>
  );
}