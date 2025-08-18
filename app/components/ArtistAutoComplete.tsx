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

  // 共通クラス（ダーク配色）
  const inputBase =
      'w-full border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 p-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500';
  const panelBase =
      'absolute z-20 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1';
  const itemBase =
      'p-2 text-sm text-gray-100 hover:bg-gray-800 cursor-pointer border-b border-gray-800 last:border-b-0';

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

  useEffect(() => {
    if (searchTerm.length >= 1) {
      const timer = setTimeout(() => {
        searchArtists(searchTerm);
        setIsOpen(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setArtists([]);
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

  const selectArtist = (artistName: string) => {
    if (!selectedArtists.includes(artistName)) {
      onArtistsChange([...selectedArtists, artistName]);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  const removeArtist = (artistName: string) => {
    onArtistsChange(selectedArtists.filter(name => name !== artistName));
  };

  return (
      <div className="relative" ref={dropdownRef}>
        {/* 選択済みタグ */}
        {selectedArtists.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedArtists.map((artistName) => (
                  <span
                      key={artistName}
                      className="bg-green-900/30 text-green-300 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                  >
              {artistName}
                    <button
                        onClick={() => removeArtist(artistName)}
                        className="text-green-300 hover:text-green-200 font-bold"
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
            className={inputBase}
        />

        {/* ドロップダウン */}
        {isOpen && (
            <div className={panelBase}>
              {loading ? (
                  <div className="p-2 text-gray-400">検索中...</div>
              ) : artists.length > 0 ? (
                  artists
                      .filter(artist => !selectedArtists.includes(artist.name))
                      .map((artist) => (
                          <div
                              key={artist.id}
                              onClick={() => selectArtist(artist.name)}
                              className={itemBase}
                          >
                            {artist.name}
                          </div>
                      ))
              ) : searchTerm.length >= 1 ? (
                  <div className="p-2 text-gray-400">該当するアーティストが見つかりません</div>
              ) : null}
            </div>
        )}
      </div>
  );
}