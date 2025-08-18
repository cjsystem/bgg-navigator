'use client';

import { useState, useEffect } from 'react';
import {GameSearchResponse, GameSearchResult} from "@/app/lib/gameService";
import DesignerAutoComplete from './components/DesignerAutoComplete';
import ArtistAutoComplete from "./components/ArtistAutoComplete";
import PublisherAutoComplete from "./components/PublisherAutoComplete";
import MechanicSelect from "./components/MechanicSelect";
import CategorySelect from "./components/CategorySelect";
import GenreSelect from "./components/GenreSelect";
import AwardSearch from "./components/AwardSearch";

export default function GameSearch() {
  const [searchResults, setSearchResults] = useState<GameSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    name: '',
    playerCount: '',
    bestPlayerCount: '',
    minRating: '',
    yearMin: '',
    yearMax: '',
    // 追加: weight / ratingsCount / commentsCount の最小最大
    weightMin: '',
    weightMax: '',
    ratingsCountMin: '',
    ratingsCountMax: '',
    commentsCountMin: '',
    commentsCountMax: '',
    page: 1,
    limit: 10
  });
  const [selectedDesigners, setSelectedDesigners] = useState<string[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);
  const [selectedMechanics, setSelectedMechanics] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('');

  // 賞検索用の状態
  const [awardYear, setAwardYear] = useState<string>('');
  const [awardName, setAwardName] = useState<string>('');
  const [awardType, setAwardType] = useState<string>('');

  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();

      if (searchParams.name) queryParams.append('name', searchParams.name);
      if (searchParams.playerCount) queryParams.append('playerCount', searchParams.playerCount);
      if (searchParams.bestPlayerCount) queryParams.append('bestPlayerCount', searchParams.bestPlayerCount);
      if (searchParams.minRating) queryParams.append('minRating', searchParams.minRating);
      if (searchParams.yearMin) queryParams.append('yearMin', searchParams.yearMin);
      if (searchParams.yearMax) queryParams.append('yearMax', searchParams.yearMax);

      // 追加: weight / ratingsCount / commentsCount（min/max）
      if (searchParams.weightMin) queryParams.append('weightMin', searchParams.weightMin);
      if (searchParams.weightMax) queryParams.append('weightMax', searchParams.weightMax);
      if (searchParams.ratingsCountMin) queryParams.append('ratingsCountMin', searchParams.ratingsCountMin);
      if (searchParams.ratingsCountMax) queryParams.append('ratingsCountMax', searchParams.ratingsCountMax);
      if (searchParams.commentsCountMin) queryParams.append('commentsCountMin', searchParams.commentsCountMin);
      if (searchParams.commentsCountMax) queryParams.append('commentsCountMax', searchParams.commentsCountMax);

      // 既存の複合条件
      if (selectedDesigners.length > 0) queryParams.append('designers', selectedDesigners.join(','));
      if (selectedArtists.length > 0) queryParams.append('artists', selectedArtists.join(','));
      if (selectedPublishers.length > 0) queryParams.append('publishers', selectedPublishers.join(','));
      if (selectedMechanics.length > 0) queryParams.append('mechanics', selectedMechanics.join(','));
      if (selectedCategories.length > 0) queryParams.append('categories', selectedCategories.join(','));
      if (selectedGenre) queryParams.append('genre', selectedGenre);

      // 賞
      if (awardYear) queryParams.append('awardYear', awardYear);
      if (awardName) queryParams.append('awardName', awardName);
      if (awardType) queryParams.append('awardType', awardType);

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
          <div className="grid grid-cols-3 gap-4">
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
                min="1"
                max="20"
            />

            <input
                type="number"
                placeholder="ベストプレイヤー数"
                value={searchParams.bestPlayerCount}
                onChange={(e) => setSearchParams({ ...searchParams, bestPlayerCount: e.target.value })}
                className="border p-2 rounded"
                min="1"
                max="20"
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

          {/* 3行目: 重さ/投票数/口コミ数（min/max） */}
          <div className="grid grid-cols-3 gap-4">
            {/* weight */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">重さ（0〜5）</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    placeholder="最小"
                    value={searchParams.weightMin}
                    onChange={(e) => setSearchParams({ ...searchParams, weightMin: e.target.value })}
                    className="border p-2 rounded"
                />
                <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    placeholder="最大"
                    value={searchParams.weightMax}
                    onChange={(e) => setSearchParams({ ...searchParams, weightMax: e.target.value })}
                    className="border p-2 rounded"
                />
              </div>
            </div>

            {/* ratingsCount */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">投票数</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="最小"
                    value={searchParams.ratingsCountMin}
                    onChange={(e) => setSearchParams({ ...searchParams, ratingsCountMin: e.target.value })}
                    className="border p-2 rounded"
                />
                <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="最大"
                    value={searchParams.ratingsCountMax}
                    onChange={(e) => setSearchParams({ ...searchParams, ratingsCountMax: e.target.value })}
                    className="border p-2 rounded"
                />
              </div>
            </div>

            {/* commentsCount */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">口コミ数</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="最小"
                    value={searchParams.commentsCountMin}
                    onChange={(e) => setSearchParams({ ...searchParams, commentsCountMin: e.target.value })}
                    className="border p-2 rounded"
                />
                <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="最大"
                    value={searchParams.commentsCountMax}
                    onChange={(e) => setSearchParams({ ...searchParams, commentsCountMax: e.target.value })}
                    className="border p-2 rounded"
                />
              </div>
            </div>
          </div>

          {/* 4行目: ジャンル */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ジャンル
            </label>
            <GenreSelect
                selectedGenre={selectedGenre}
                onGenreChange={setSelectedGenre}
            />
          </div>

          {/* 5行目: 受賞 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              受賞歴
            </label>
            <AwardSearch
                awardYear={awardYear}
                awardName={awardName}
                awardType={awardType}
                onAwardYearChange={setAwardYear}
                onAwardNameChange={setAwardName}
                onAwardTypeChange={setAwardType}
            />
          </div>

          {/* 6行目以降: 既存の各オートコンプリート/セレクト */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">デザイナー</label>
            <DesignerAutoComplete
                selectedDesigners={selectedDesigners}
                onDesignersChange={setSelectedDesigners}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">アーティスト</label>
            <ArtistAutoComplete
                selectedArtists={selectedArtists}
                onArtistsChange={setSelectedArtists}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">パブリッシャー</label>
            <PublisherAutoComplete
                selectedPublishers={selectedPublishers}
                onPublishersChange={setSelectedPublishers}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メカニクス</label>
            <MechanicSelect
                selectedMechanics={selectedMechanics}
                onMechanicsChange={setSelectedMechanics}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
            <CategorySelect
                selectedCategories={selectedCategories}
                onCategoriesChange={setSelectedCategories}
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

// 数値をk表記にフォーマット（例: 7100 -> 7.1k、7000 -> 7k）
const formatCount = (n: number) => {
  if (n < 1000) return n.toLocaleString();
  const value = n / 1000;
  const formatted = n % 1000 === 0 ? value.toFixed(0) : value.toFixed(1);
  return `${formatted}k`;
};

// ゲームカードコンポーネント（口コミ数・評価数を追加）
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
              {typeof game.ratingsCount === 'number' && (
                  <span>評価数: {formatCount(game.ratingsCount)} | </span>
              )}
              {typeof game.commentsCount === 'number' && (
                  <span>口コミ数: {formatCount(game.commentsCount)} | </span>
              )}
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

            {game.categories.length > 0 && (
                <div className="text-sm mt-1">
                  <strong>カテゴリ:</strong> {game.categories.map(c => c.name).join(', ')}
                </div>
            )}

            {game.genreRankings.length > 0 && (
                <div className="text-sm mt-1">
                  <strong>ジャンル別ランキング:</strong>{' '}
                  {game.genreRankings.map(gr => `${gr.genre.name}:${gr.rankInGenre}位`).join(', ')}
                </div>
            )}

            {game.awards.length > 0 && (
                <div className="text-sm mt-1">
                  <strong>受賞歴:</strong>{' '}
                  {game.awards.map(a => `${a.awardName} (${a.awardYear}) - ${a.awardType}`).join('; ')}
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

