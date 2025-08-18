'use client';

import { useState, useEffect } from 'react';

interface Genre {
  id: number;
  name: string;
}

interface GenreSelectProps {
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
}

export default function GenreSelect({ selectedGenre, onGenreChange }: GenreSelectProps) {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初回読み込み時に全ジャンルを取得
  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/genres');

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data: Genre[] = await response.json();
      setGenres(data);
    } catch (error) {
      console.error('ジャンル取得エラー:', error);
      setError(error instanceof Error ? error.message : 'ジャンル取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onGenreChange(e.target.value);
  };

  // AwardSearch の select と同じ見た目
  const selectCls =
      'w-full border border-gray-700 bg-gray-900 text-gray-100 p-2 rounded text-sm ' +
      'focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 disabled:bg-gray-800 disabled:text-gray-400';

  return (
      <div>
        <select
            value={selectedGenre}
            onChange={handleSelectChange}
            disabled={loading}
            className={selectCls}
        >
          <option value="">ジャンルを選択...</option>
          {loading ? (
              <option disabled>読み込み中...</option>
          ) : error ? (
              <option disabled>エラーが発生しました</option>
          ) : (
              genres.map((genre) => (
                  <option key={genre.id} value={genre.name}>
                    {genre.name}
                  </option>
              ))
          )}
        </select>

        {/* エラー表示（ダーク配色） */}
        {error && (
            <div className="mt-1 text-sm text-red-300">
              エラー: {error}
              <button
                  onClick={loadGenres}
                  className="ml-2 text-sky-400 hover:text-sky-300 underline"
              >
                再読み込み
              </button>
            </div>
        )}

        {/* 選択済み表示（ダーク配色） */}
        {selectedGenre && (
            <div className="mt-2">
          <span className="inline-block bg-indigo-900/30 text-indigo-300 px-2 py-1 rounded-full text-sm">
            選択中: {selectedGenre}
          </span>
            </div>
        )}
      </div>
  );
}