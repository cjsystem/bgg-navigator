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

  return (
      <div>
        <select
            value={selectedGenre}
            onChange={handleSelectChange}
            disabled={loading}
            className="w-full border p-2 rounded bg-white text-gray-700 disabled:bg-gray-100"
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

        {/* エラー表示 */}
        {error && (
            <div className="mt-1 text-sm text-red-600">
              エラー: {error}
              <button
                  onClick={loadGenres}
                  className="ml-2 text-blue-600 hover:text-blue-800 underline"
              >
                再読み込み
              </button>
            </div>
        )}

        {/* 選択済み表示 */}
        {selectedGenre && (
            <div className="mt-2">
          <span className="inline-block bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm">
            選択中: {selectedGenre}
          </span>
            </div>
        )}
      </div>
  );
}