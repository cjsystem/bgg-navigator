
'use client';

import { useState, useEffect } from 'react';
import {GameSearchResponse, GameSearchResult} from "@/app/lib/gameService";
import DesignerAutoComplete from "@/app/components/DesignerAutoComplete";
import PublisherAutocomplete from "@/app/components/PublisherAutoComplete";
import ArtistAutoComplete from "@/app/components/ArtistAutoComplete";
import PublisherAutoComplete from "@/app/components/PublisherAutoComplete";

export default function GameSearch() {
  const [searchResults, setSearchResults] = useState<GameSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    name: '',
    playerCount: '',
    minRating: '',
    yearMin: '',
    yearMax: '',
    page: 1,
    limit: 10
  });
  const [selectedDesigners, setSelectedDesigners] = useState<string[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();

      if (searchParams.name) queryParams.append('name', searchParams.name);
      if (searchParams.playerCount) queryParams.append('playerCount', searchParams.playerCount);
      if (searchParams.minRating) queryParams.append('minRating', searchParams.minRating);
      if (searchParams.yearMin) queryParams.append('yearMin', searchParams.yearMin);
      if (searchParams.yearMax) queryParams.append('yearMax', searchParams.yearMax);

      // デザイナー名をカンマ区切りで追加
      if (selectedDesigners.length > 0) {
        queryParams.append('designers', selectedDesigners.join(','));
      }

      // アーティスト名をカンマ区切りで追加
      if (selectedArtists.length > 0) {
        queryParams.append('artists', selectedArtists.join(','));
      }

      // パブリッシャー名をカンマ区切りで追加
      if (selectedPublishers.length > 0) {
        queryParams.append('publishers', selectedPublishers.join(','));
      }

      queryParams.append('page', searchParams.page.toString());
      queryParams.append('limit', searchParams.limit.toString());

      const response = await fetch(`/api/games/search?${queryParams}`);
      const data: GameSearchResponse = await response.json();

      setSearchResults(data);
      setHasSearched(true);
    } catch (error) {
      console.error('検索エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasSearched) {
      handleSearch();
    }
  }, [searchParams.page]);

  const handleInitialSearch = () => {
    setSearchParams({ ...searchParams, page: 1 });
    handleSearch();
  };

  return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">ボードゲーム検索</h1>

        {/* 検索フォーム */}
        <div className="mb-6 grid grid-cols-1 gap-4">
          {/* 1行目 */}
          <div className="grid grid-cols-2 gap-4">
            <input
                type="text"
                placeholder="ゲーム名"
                value={searchParams.name}
                onChange={(e) => setSearchParams({ ...searchParams, name: e.target.value })}
                className="border p-2 rounded"
            />

            <input
                type="number"
                placeholder="プレイヤー数"
                value={searchParams.playerCount}
                onChange={(e) => setSearchParams({ ...searchParams, playerCount: e.target.value })}
                className="border p-2 rounded"
            />
          </div>

          {/* 2行目 */}
          <div className="grid grid-cols-2 gap-4">
            <input
                type="number"
                placeholder="最低評価"
                step="0.1"
                value={searchParams.minRating}
                onChange={(e) => setSearchParams({ ...searchParams, minRating: e.target.value })}
                className="border p-2 rounded"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                  type="number"
                  placeholder="発売年（開始）"
                  value={searchParams.yearMin}
                  onChange={(e) => setSearchParams({ ...searchParams, yearMin: e.target.value })}
                  className="border p-2 rounded"
              />

              <input
                  type="number"
                  placeholder="発売年（終了）"
                  value={searchParams.yearMax}
                  onChange={(e) => setSearchParams({ ...searchParams, yearMax: e.target.value })}
                  className="border p-2 rounded"
              />
            </div>
          </div>

          {/* 3行目: デザイナー検索 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              デザイナー
            </label>
            <DesignerAutoComplete
                selectedDesigners={selectedDesigners}
                onDesignersChange={setSelectedDesigners}
            />
          </div>

          {/* 4行目: アーティスト検索 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              アーティスト
            </label>
            <ArtistAutoComplete
                selectedArtists={selectedArtists}
                onArtistsChange={setSelectedArtists}
            />
          </div>

          {/* 5行目: パブリッシャー検索 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パブリッシャー
            </label>
            <PublisherAutoComplete
                selectedPublishers={selectedPublishers}
                onPublishersChange={setSelectedPublishers}
            />
          </div>
        </div>

        <button
            onClick={handleInitialSearch}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '検索中...' : '検索'}
        </button>

        {/* 検索結果 */}
        {searchResults && (
            <div className="mt-6">
              <div className="mb-4">
                <p className="text-gray-600">
                  {searchResults.totalCount}件中 {((searchResults.currentPage - 1) * searchParams.limit + 1)} - {Math.min(searchResults.currentPage * searchParams.limit, searchResults.totalCount)}件を表示
                </p>
              </div>

              <div className="space-y-4">
                {searchResults.games.map((game) => (
                    <GameCard key={game.id} game={game} />
                ))}
              </div>

              {/* ページング */}
              <div className="mt-6 flex justify-center space-x-2">
                <button
                    onClick={() => setSearchParams({ ...searchParams, page: searchParams.page - 1 })}
                    disabled={!searchResults.hasPreviousPage || loading}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  前へ
                </button>

                <span className="px-3 py-1">
                  {searchResults.currentPage} / {searchResults.totalPages}
                </span>

                <button
                    onClick={() => setSearchParams({ ...searchParams, page: searchResults.currentPage + 1 })}
                    disabled={!searchResults.hasNextPage || loading}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  {loading ? '読込中...' : '次へ'}
                </button>
              </div>
            </div>
        )}
      </div>
  );
}

// ゲームカードコンポーネント
function GameCard({ game }: { game: GameSearchResult }) {
  return (
      <div className="border rounded-lg p-4 shadow-sm">
        <div className="flex items-start space-x-4">
          {game.imageUrl && (
              <img
                  src={game.imageUrl}
                  alt={game.primaryName}
                  className="w-20 h-20 object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
              />
          )}

          <div className="flex-1">
            <h3 className="text-lg font-semibold">
              {game.primaryName}
              {game.japaneseName && (
                  <span className="text-sm text-gray-600 ml-2">({game.japaneseName})</span>
              )}
            </h3>

            <div className="text-sm text-gray-600 mt-1">
              {game.yearReleased && <span>発売年: {game.yearReleased} | </span>}
              {game.minPlayers && game.maxPlayers && (
                  <span>プレイヤー数: {game.minPlayers}-{game.maxPlayers}人 | </span>
              )}
              {game.avgRating && <span>評価: {game.avgRating}/10 | </span>}
              {game.rankOverall && <span>ランキング: {game.rankOverall}位</span>}
            </div>

            {game.designers.length > 0 && (
                <div className="text-sm mt-2">
                  <strong>デザイナー:</strong> {game.designers.map(d => d.name).join(', ')}
                </div>
            )}

            {game.artists.length > 0 && (
                <div className="text-sm mt-1">
                  <strong>アーティスト:</strong> {game.artists.map(a => a.name).join(', ')}
                </div>
            )}

            {game.publishers.length > 0 && (
                <div className="text-sm mt-1">
                  <strong>パブリッシャー:</strong> {game.publishers.map(p => p.name).join(', ')}
                </div>
            )}

            {game.mechanics.length > 0 && (
                <div className="text-sm mt-1">
                  <strong>メカニクス:</strong> {game.mechanics.map(m => m.name).join(', ')}
                </div>
            )}

            {game.bestPlayerCounts.length > 0 && (
                <div className="text-sm mt-1">
                  <strong>ベストプレイヤー数:</strong> {game.bestPlayerCounts.join(', ')}人
                </div>
            )}
          </div>
        </div>
      </div>
  );
}