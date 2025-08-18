'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';

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

  const selectArtist = (artistName: string) => {
    if (!selectedArtists.includes(artistName)) {
      onArtistsChange([...selectedArtists, artistName]);
    }
    setSearchTerm('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeArtist = (artistName: string) => {
    onArtistsChange(selectedArtists.filter(name => name !== artistName));
    inputRef.current?.focus();
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
    if (artists.length > 0 && searchTerm) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && searchTerm.length === 0 && selectedArtists.length > 0) {
      e.preventDefault();
      const last = selectedArtists[selectedArtists.length - 1];
      removeArtist(last);
    }
    if (e.key === 'Enter' && artists.length > 0 && searchTerm.length > 0) {
      e.preventDefault();
      const first = artists.find(a => !selectedArtists.includes(a.name));
      if (first) selectArtist(first.name);
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
            {selectedArtists.map((artistName) => (
                <span
                    key={artistName}
                    className="bg-green-900/30 text-green-300 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                >
              {artistName}
                  <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeArtist(artistName);
                      }}
                      className="text-green-300 hover:text-green-200 font-bold"
                      type="button"
                      aria-label={`${artistName} を削除`}
                  >
                ×
              </button>
            </span>
            ))}

            <input
                ref={inputRef}
                type="text"
                placeholder={selectedArtists.length ? '' : 'アーティスト名を入力...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                  if (artists.length > 0 && searchTerm) setIsOpen(true);
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