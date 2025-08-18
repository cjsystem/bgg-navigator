'use client';

import { useState, useEffect, useRef } from 'react';
import {GameSearchResponse, GameSearchResult} from "@/app/lib/gameService";
import DesignerAutoComplete from './components/DesignerAutoComplete';
import ArtistAutoComplete from "./components/ArtistAutoComplete";
import PublisherAutoComplete from "./components/PublisherAutoComplete";
import MechanicSelect from "./components/MechanicSelect";
import CategorySelect from "./components/CategorySelect";
import GenreSelect from "./components/GenreSelect";
import AwardSearch from "./components/AwardSearch";
import GameNameAutoComplete from './components/GameNameAutoComplete';

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

  const [awardYear, setAwardYear] = useState<string>('');
  const [awardName, setAwardName] = useState<string>('');
  const [awardType, setAwardType] = useState<string>('');

  const [hasSearched, setHasSearched] = useState(false);
  const [showSearchArea, setShowSearchArea] = useState(true);

  // 追加: 進行中のフェッチを中断するための AbortController
  const abortRef = useRef<AbortController | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    // 直前のフェッチがあれば中断
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const queryParams = new URLSearchParams();

      if (searchParams.name) queryParams.append('name', searchParams.name);
      if (searchParams.playerCount) queryParams.append('playerCount', searchParams.playerCount);
      if (searchParams.bestPlayerCount) queryParams.append('bestPlayerCount', searchParams.bestPlayerCount);
      if (searchParams.minRating) queryParams.append('minRating', searchParams.minRating);
      if (searchParams.yearMin) queryParams.append('yearMin', searchParams.yearMin);
      if (searchParams.yearMax) queryParams.append('yearMax', searchParams.yearMax);

      if (searchParams.weightMin) queryParams.append('weightMin', searchParams.weightMin);
      if (searchParams.weightMax) queryParams.append('weightMax', searchParams.weightMax);
      if (searchParams.ratingsCountMin) queryParams.append('ratingsCountMin', searchParams.ratingsCountMin);
      if (searchParams.ratingsCountMax) queryParams.append('ratingsCountMax', searchParams.ratingsCountMax);
      if (searchParams.commentsCountMin) queryParams.append('commentsCountMin', searchParams.commentsCountMin);
      if (searchParams.commentsCountMax) queryParams.append('commentsCountMax', searchParams.commentsCountMax);

      if (selectedDesigners.length > 0) queryParams.append('designers', selectedDesigners.join(','));
      if (selectedArtists.length > 0) queryParams.append('artists', selectedArtists.join(','));
      if (selectedPublishers.length > 0) queryParams.append('publishers', selectedPublishers.join(','));
      if (selectedMechanics.length > 0) queryParams.append('mechanics', selectedMechanics.join(','));
      if (selectedCategories.length > 0) queryParams.append('categories', selectedCategories.join(','));
      if (selectedGenre) queryParams.append('genre', selectedGenre);

      if (awardYear) queryParams.append('awardYear', awardYear);
      if (awardName) queryParams.append('awardName', awardName);
      if (awardType) queryParams.append('awardType', awardType);

      queryParams.append('page', searchParams.page.toString());
      queryParams.append('limit', searchParams.limit.toString());

      const response = await fetch(`/api/games/search?${queryParams}`, {
        signal: controller.signal,
      });
      const data: GameSearchResponse = await response.json();

      setSearchResults(data);
      setHasSearched(true);
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        // 中断時は何もしない
      } else {
        console.error('検索エラー:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // アンマウント時に進行中のリクエストを中断
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (hasSearched) {
      handleSearch();
    }
  }, [searchParams.page]);

  const handleInitialSearch = () => {
    // 新規検索開始: 旧結果を消す → スピナー表示の条件（loading && !searchResults）を満たす
    setSearchResults(null);
    setShowSearchArea(false);
    setHasSearched(true);
    setSearchParams({ ...searchParams, page: 1 });
    handleSearch();
  };


  // 検索条件のサマリー表示用（存在するものだけを抽出）
  const buildActiveConditions = () => {
    const chips: { label: string; value: string }[] = [];

    if (searchParams.name) chips.push({ label: '名前', value: searchParams.name });
    if (searchParams.playerCount) chips.push({ label: 'プレイヤー数', value: `${searchParams.playerCount}人` });
    if (searchParams.bestPlayerCount) chips.push({ label: 'ベストプレイヤー数', value: `${searchParams.bestPlayerCount}人` });
    if (searchParams.minRating) chips.push({ label: '最低評価', value: `${searchParams.minRating}` });

    if (searchParams.yearMin || searchParams.yearMax) {
      const from = searchParams.yearMin ? `${searchParams.yearMin}年` : '';
      const to = searchParams.yearMax ? `${searchParams.yearMax}年` : '';
      const range = searchParams.yearMin && searchParams.yearMax
          ? `${from}〜${to}`
          : searchParams.yearMin
              ? `${from}以降`
              : `${to}以前`;
      chips.push({ label: '発売年', value: range });
    }

    if (searchParams.weightMin || searchParams.weightMax) {
      const from = searchParams.weightMin || '0';
      const to = searchParams.weightMax || '5';
      chips.push({ label: '重さ', value: `${from}〜${to}` });
    }

    if (searchParams.ratingsCountMin || searchParams.ratingsCountMax) {
      const from = searchParams.ratingsCountMin || '0';
      const to = searchParams.ratingsCountMax || '∞';
      chips.push({ label: '投票数', value: `${from}〜${to}` });
    }

    if (searchParams.commentsCountMin || searchParams.commentsCountMax) {
      const from = searchParams.commentsCountMin || '0';
      const to = searchParams.commentsCountMax || '∞';
      chips.push({ label: '口コミ数', value: `${from}〜${to}` });
    }

    if (selectedGenre) chips.push({ label: 'ジャンル', value: selectedGenre });
    if (awardYear) chips.push({ label: '受賞年', value: awardYear });
    if (awardName) chips.push({ label: '受賞名', value: awardName });
    if (awardType) chips.push({ label: '受賞種別', value: awardType });

    if (selectedDesigners.length) chips.push({ label: 'デザイナー', value: selectedDesigners.join(', ') });
    if (selectedArtists.length) chips.push({ label: 'アーティスト', value: selectedArtists.join(', ') });
    if (selectedPublishers.length) chips.push({ label: 'パブリッシャー', value: selectedPublishers.join(', ') });
    if (selectedMechanics.length) chips.push({ label: 'メカニクス', value: selectedMechanics.join(', ') });
    if (selectedCategories.length) chips.push({ label: 'カテゴリ', value: selectedCategories.join(', ') });

    return chips;
  };

  const activeConditions = buildActiveConditions();

  return (
      <div className="p-6 text-gray-100">
        <h1 className="text-2xl font-bold mb-6 text-white">ボードゲーム検索</h1>

        {/* 検索条件サマリー（フォーム非表示時に表示） */}
        {!showSearchArea && (
            <div className="mb-6 border border-gray-800 rounded-lg bg-black/30">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <h2 className="text-lg font-semibold text-white">検索条件</h2>
                <button
                    type="button"
                    onClick={() => setShowSearchArea(true)}
                    className="bg-sky-600 text-white px-3 py-1.5 rounded hover:bg-sky-500"
                >
                  再度検索
                </button>
              </div>
              <div className="px-4 py-3">
                {activeConditions.length > 0 ? (
                    <ul className="flex flex-wrap gap-2">
                      {activeConditions.map((c, idx) => (
                          <li
                              key={`${c.label}-${idx}`}
                              className="text-sm px-2 py-1 rounded border border-gray-700 bg-gray-800/60 text-gray-100"
                              title={c.value}
                          >
                            <span className="text-slate-300">{c.label}:</span> <span className="text-gray-100">{c.value}</span>
                          </li>
                      ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-300">条件なし（全件検索）</p>
                )}
              </div>
            </div>
        )}

        {/* 検索フォーム（検索前、または「再度検索」クリック時に表示） */}
        {showSearchArea && (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4">
                {/* 1行目 */}
                <div className="grid grid-cols-3 gap-4">
                  <GameNameAutoComplete
                      value={searchParams.name}
                      onChange={(val) => setSearchParams({ ...searchParams, name: val })}
                  />

                  <input
                      type="number"
                      placeholder="プレイヤー数"
                      value={searchParams.playerCount}
                      onChange={(e) => setSearchParams({ ...searchParams, playerCount: e.target.value })}
                      className="border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 p-2 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                      min="1"
                      max="20"
                  />

                  <input
                      type="number"
                      placeholder="ベストプレイヤー数"
                      value={searchParams.bestPlayerCount}
                      onChange={(e) => setSearchParams({ ...searchParams, bestPlayerCount: e.target.value })}
                      className="border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 p-2 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
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
                      className="border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 p-2 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                        type="number"
                        placeholder="発売年（開始）"
                        value={searchParams.yearMin}
                        onChange={(e) => setSearchParams({ ...searchParams, yearMin: e.target.value })}
                        className="border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 p-2 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                    />

                    <input
                        type="number"
                        placeholder="発売年（終了）"
                        value={searchParams.yearMax}
                        onChange={(e) => setSearchParams({ ...searchParams, yearMax: e.target.value })}
                        className="border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 p-2 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* 3行目: 重さ/投票数/口コミ数（min/max） */}
                <div className="grid grid-cols-3 gap-4">
                  {/* weight */}
                  <div>
                    <label className="block text-sm text-slate-200 mb-1">重さ（0〜5）</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          placeholder="最小"
                          value={searchParams.weightMin}
                          onChange={(e) => setSearchParams({ ...searchParams, weightMin: e.target.value })}
                          className="border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 p-2 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                      />
                      <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          placeholder="最大"
                          value={searchParams.weightMax}
                          onChange={(e) => setSearchParams({ ...searchParams, weightMax: e.target.value })}
                          className="border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 p-2 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {/* ratingsCount */}
                  <div>
                    <label className="block text-sm text-slate-200 mb-1">投票数</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="最小"
                          value={searchParams.ratingsCountMin}
                          onChange={(e) => setSearchParams({ ...searchParams, ratingsCountMin: e.target.value })}
                          className="border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 p-2 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                      />
                      <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="最大"
                          value={searchParams.ratingsCountMax}
                          onChange={(e) => setSearchParams({ ...searchParams, ratingsCountMax: e.target.value })}
                          className="border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 p-2 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {/* commentsCount */}
                  <div>
                    <label className="block text-sm text-slate-2 00 mb-1">口コミ数</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="最小"
                          value={searchParams.commentsCountMin}
                          onChange={(e) => setSearchParams({ ...searchParams, commentsCountMin: e.target.value })}
                          className="border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 p-2 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                      />
                      <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="最大"
                          value={searchParams.commentsCountMax}
                          onChange={(e) => setSearchParams({ ...searchParams, commentsCountMax: e.target.value })}
                          className="border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 p-2 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    ジャンル
                  </label>
                  <GenreSelect
                      selectedGenre={selectedGenre}
                      onGenreChange={setSelectedGenre}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
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

                {/* 検索項目（デザイナー/アーティスト/パブリッシャー/メカニクス/カテゴリ） */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1">デザイナー</label>
                    <DesignerAutoComplete
                        selectedDesigners={selectedDesigners}
                        onDesignersChange={setSelectedDesigners}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1">アーティスト</label>
                    <ArtistAutoComplete
                        selectedArtists={selectedArtists}
                        onArtistsChange={setSelectedArtists}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1">パブリッシャー</label>
                    <PublisherAutoComplete
                        selectedPublishers={selectedPublishers}
                        onPublishersChange={setSelectedPublishers}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1">メカニクス</label>
                    <MechanicSelect
                        selectedMechanics={selectedMechanics}
                        onMechanicsChange={setSelectedMechanics}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1">カテゴリ</label>
                    <CategorySelect
                        selectedCategories={selectedCategories}
                        onCategoriesChange={setSelectedCategories}
                    />
                  </div>
                </div>
              </div>

              {/* 検索ボタン（フォームと一緒に表示/非表示） */}
              <button
                  onClick={handleInitialSearch}
                  disabled={loading}
                  className="bg-sky-600 text-white px-4 py-2 rounded hover:bg-sky-500 disabled:opacity-50"
              >
                {loading ? '検索中...' : '検索'}
              </button>
            </>
        )}

        {/* ローディング（初回など結果がまだ無いときにだけ表示） */}
        {loading && !searchResults && (
            <div role="status" aria-live="polite" aria-busy="true" className="mt-6 flex justify-center py-12">
              {/* 横書きを強制 */}
              <div className="[writing-mode:horizontal-tb] [text-orientation:mixed] flex flex-col items-center">
                {/* CSSアニメのスピナー（Tailwindのanimation使用） */}
                <div
                    className="h-10 w-10 rounded-full border-4 border-gray-700 border-t-sky-500 mb-3 animate-spin-basic"
                    aria-label="検索中"
                />

                {/* スピナーの下で横並び（今回はテキストのみ） */}
                <div className="flex flex-row items-center gap-2">
                  <span className="text-slate-300 whitespace-nowrap">検索中...</span>
                </div>

                {/* 一覧のスケルトン（シマー） - カスタムアニメーション */}
                <div className="mt-6 w-full flex flex-col items-center gap-3">
                  {[0, 1, 2].map((i) => (
                      <div
                          key={i}
                          className="h-20 w-[min(800px,92vw)] rounded-md bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%] animate-pulse"
                          aria-hidden="true"
                      />
                  ))}
                </div>
              </div>
            </div>
        )}

        {/* 検索結果 */}
        {searchResults && (
            <div className="mt-6">
              <div className="mb-4">
                <p className="text-gray-300">
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
                    className="px-3 py-1 border border-gray-700 text-gray-100 rounded hover:bg-gray-800 disabled:opacity-50"
                >
                  前へ
                </button>

                <span className="px-3 py-1 text-gray-200">
                {searchResults.currentPage} / {searchResults.totalPages}
              </span>

                <button
                    onClick={() => setSearchParams({ ...searchParams, page: searchResults.currentPage + 1 })}
                    disabled={!searchResults.hasNextPage || loading}
                    className="px-3 py-1 border border-gray-700 text-gray-100 rounded hover:bg-gray-800 disabled:opacity-50"
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

// （GameCardの直前あたりに追加）BGGリンク付きで名前を描画するヘルパー
const renderCommaSeparatedWithLinks = <T,>(
    items: T[],
    getName: (x: T) => string,
    getUrl: (x: T) => string | undefined
) => {
  return items.map((item, idx) => {
    const name = getName(item);
    const url = getUrl(item);
    return (
        <span key={`${name}-${idx}`}>
        {url ? (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
                title="BGGで開く"
            >
              {name}
            </a>
        ) : (
            name
        )}
          {idx < items.length - 1 ? ', ' : ''}
      </span>
    );
  });
};

// ゲームカード（「もっと見る」で後半を折りたたみ表示）
function GameCard({ game }: { game: GameSearchResult }) {
  const [expanded, setExpanded] = useState(false);

  const hasMore =
      (game.artists?.length ?? 0) > 0 ||
      (game.publishers?.length ?? 0) > 0 ||
      (game.mechanics?.length ?? 0) > 0 ||
      (game.categories?.length ?? 0) > 0 ||
      (game.genreRankings?.length ?? 0) > 0 ||
      (game.awards?.length ?? 0) > 0 ||
      (game.bestPlayerCounts?.length ?? 0) > 0;

  return (
      <div className="border border-gray-800 rounded-lg p-4 shadow-sm bg-black/30">
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
            <h3 className="text-lg font-semibold text-white">
              {game.primaryName}
              {game.japaneseName && (
                  <span className="text-sm text-gray-300 ml-2">({game.japaneseName})</span>
              )}
            </h3>

            <div className="text-sm text-gray-300 mt-1">
              {game.yearReleased && <span>発売年: <span className="text-gray-100">{game.yearReleased}</span> | </span>}
              {game.minPlayers && game.maxPlayers && (
                  <span>プレイヤー数: <span className="text-gray-100">{game.minPlayers}-{game.maxPlayers}</span>人 | </span>
              )}
              {game.avgRating && <span>評価: <span className="text-gray-100">{game.avgRating}</span> / 10 | </span>}
              {typeof game.ratingsCount === 'number' && (
                  <span>評価数: <span className="text-gray-100">{formatCount(game.ratingsCount)}</span> | </span>
              )}
              {typeof game.commentsCount === 'number' && (
                  <span>口コミ数: <span className="text-gray-100">{formatCount(game.commentsCount)}</span> | </span>
              )}
              {game.rankOverall && <span>ランキング: <span className="text-gray-100">{game.rankOverall}</span>位 | </span>}
              {game.weight && <span>重さ: <span className="text-gray-100">{game.weight}</span> / 5</span>}
            </div>

            {game.designers.length > 0 && (
                <div className="text-sm mt-2">
                  <strong className="text-sky-300">デザイナー:</strong>{' '}
                  {renderCommaSeparatedWithLinks(
                      game.designers as any[],
                      (d: any) => d.name,
                      (d: any) => d.bgg_url ?? d.bggUrl
                  )}
                </div>
            )}

            {/* 展開トグル（中央寄せ） */}
            {hasMore && (
                <div className="mt-2 flex justify-center">
                  <button
                      type="button"
                      onClick={() => setExpanded((v) => !v)}
                      className="text-sky-400 hover:text-sky-300 text-sm"
                      aria-expanded={expanded}
                  >
                    {expanded ? '閉じる ▲' : 'もっと見る ▼'}
                  </button>
                </div>
            )}

            {/* ここから下は「もっと見る」で展開 */}
            {expanded && (
                <>
                  {game.artists.length > 0 && (
                      <div className="text-sm mt-3">
                        <strong className="text-sky-300">アーティスト:</strong>{' '}
                        {renderCommaSeparatedWithLinks(
                            game.artists as any[],
                            (a: any) => a.name,
                            (a: any) => a.bgg_url ?? a.bggUrl
                        )}
                      </div>
                  )}

                  {game.publishers.length > 0 && (
                      <div className="text-sm mt-1">
                        <strong className="text-sky-300">パブリッシャー:</strong>{' '}
                        {renderCommaSeparatedWithLinks(
                            game.publishers as any[],
                            (p: any) => p.name,
                            (p: any) => p.bgg_url ?? p.bggUrl
                        )}
                      </div>
                  )}

                  {game.mechanics.length > 0 && (
                      <div className="text-sm mt-1">
                        <strong className="text-sky-300">メカニクス:</strong>{' '}
                        {renderCommaSeparatedWithLinks(
                            game.mechanics as any[],
                            (m: any) => m.name,
                            (m: any) => m.bgg_url ?? m.bggUrl
                        )}
                      </div>
                  )}

                  {game.categories.length > 0 && (
                      <div className="text-sm mt-1">
                        <strong className="text-sky-300">カテゴリ:</strong>{' '}
                        {renderCommaSeparatedWithLinks(
                            game.categories as any[],
                            (c: any) => c.name,
                            (c: any) => c.bgg_url ?? c.bggUrl
                        )}
                      </div>
                  )}

                  {game.genreRankings.length > 0 && (
                      <div className="text-sm mt-1">
                        <strong className="text-sky-300">ジャンル別ランキング:</strong>{' '}
                        {game.genreRankings.map((gr: any, idx: number) => {
                          const g = gr.genre;
                          const url = g?.bgg_url ?? g?.bggUrl;
                          return (
                              <span key={`${g?.name}-${idx}`}>
                        {url ? (
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-400 hover:text-sky-300"
                                title="BGGで開く"
                            >
                              {g?.name}
                            </a>
                        ) : (
                            g?.name
                        )}
                                :{gr.rankInGenre ?? '-'}位
                                {idx < game.genreRankings.length - 1 ? ', ' : ''}
                      </span>
                          );
                        })}
                      </div>
                  )}

                  {game.awards.length > 0 && (
                      <div className="text-sm mt-1">
                        <strong className="text-sky-300">受賞歴:</strong>{' '}
                        {game.awards.map((a, idx) => (
                            <span key={a.id}>
                      {a.bggUrl ? (
                          <a
                              href={a.bggUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-400 hover:text-sky-300"
                              title="BGGで開く"
                          >
                            {a.awardYear} {a.awardName}
                          </a>
                      ) : (
                          <span className="text-gray-200">{a.awardName}</span>
                      )}{' '}
                              - <span className="text-gray-200">{a.awardType}</span>
                              {idx < game.awards.length - 1 ? '; ' : ''}
                    </span>
                        ))}
                      </div>
                  )}

                  {game.bestPlayerCounts.length > 0 && (
                      <div className="text-sm mt-1">
                        <strong className="text-sky-300">ベストプレイヤー数:</strong>{' '}
                        <span className="text-gray-200">{game.bestPlayerCounts.join(', ')}</span>人
                      </div>
                  )}
                </>
            )}
          </div>
        </div>
      </div>
  );
}