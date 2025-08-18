import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

// ゲーム検索のためのフィルタ型定義
export interface GameSearchFilters {
  name?: string;
  yearReleased?: { min?: number; max?: number };
  playerCount?: number;
  bestPlayerCount?: number;
  minPlaytime?: number;
  maxPlaytime?: number;
  minAge?: number;
  minRating?: number;
  maxRank?: number;
  designerNames?: string[];
  artistNames?: string[];
  publisherNames?: string[];
  mechanicNames?: string[];
  categoryNames?: string[];
  awardNames?: string[];
  genreName?: string;
  awardYear?: number;
  awardName?: string;
  awardType?: string;
  weightMin?: number;
  weightMax?: number;
  ratingsCountMin?: number;
  ratingsCountMax?: number;
  commentsCountMin?: number;
  commentsCountMax?: number;
  page?: number;
  limit?: number;
}

// 検索結果の型定義（awards に bggUrl を追加）
export interface GameSearchResult {
  id: number;
  bggId: number;
  primaryName: string;
  japaneseName: string | null;
  yearReleased: number | null;
  imageUrl: string | null;

  avgRating: number | null;
  ratingsCount: number | null;
  commentsCount: number | null;

  minPlayers: number | null;
  maxPlayers: number | null;
  minPlaytime: number | null;
  maxPlaytime: number | null;
  minAge: number | null;
  weight: number | null;
  rankOverall: number | null;

  designers: Array<{ id: number; name: string; bggUrl?: string | null }>;
  artists: Array<{ id: number; name: string; bggUrl?: string | null }>;
  publishers: Array<{ id: number; name: string; bggUrl?: string | null }>;
  mechanics: Array<{ id: number; name: string; bggUrl?: string | null }>;
  categories: Array<{ id: number; name: string; bggUrl?: string | null }>;
  awards: Array<{
    id: number;
    awardName: string;
    awardYear: number;
    awardType: string;
    awardCategory: string | null;
    bggUrl: string | null; // ← 追加
  }>;
  genreRankings: Array<{
    genre: { id: number; name: string; bggUrl?: string | null };
    rankInGenre: number | null;
  }>;
  bestPlayerCounts: number[];

  createdAt: Date | null;
  updatedAt: Date | null;
}

// 検索処理
export async function searchGames(filters: GameSearchFilters = {}): Promise<GameSearchResponse> {
  const {
    name,
    yearReleased,
    playerCount,
    bestPlayerCount,
    minPlaytime,
    maxPlaytime,
    minAge,
    minRating,
    maxRank,
    designerNames,
    artistNames,
    publisherNames,
    mechanicNames,
    categoryNames,
    awardNames,
    genreName,
    awardYear,
    awardName,
    awardType,
    weightMin,
    weightMax,
    ratingsCountMin,
    ratingsCountMax,
    commentsCountMin,
    commentsCountMax,
    page = 1,
    limit = 20
  } = filters;

  const whereConditions: any = { AND: [] };
  if (name) {
    whereConditions.AND.push({
      OR: [
        { primary_name: { contains: name, mode: 'insensitive' } },
        { japanese_name: { contains: name, mode: 'insensitive' } }
      ]
    });
  }
  if (yearReleased) {
    const yearCond: any = {};
    if (yearReleased.min) yearCond.gte = yearReleased.min;
    if (yearReleased.max) yearCond.lte = yearReleased.max;
    if (Object.keys(yearCond).length) whereConditions.AND.push({ year_released: yearCond });
  }
  if (playerCount) {
    whereConditions.AND.push({
      AND: [{ min_players: { lte: playerCount } }, { max_players: { gte: playerCount } }]
    });
  }
  if (minPlaytime) whereConditions.AND.push({ min_playtime: { gte: minPlaytime } });
  if (maxPlaytime) whereConditions.AND.push({ max_playtime: { lte: maxPlaytime } });
  if (minAge) whereConditions.AND.push({ min_age: { gte: minAge } });
  if (minRating) whereConditions.AND.push({ avg_rating: { gte: minRating } });
  if (maxRank) whereConditions.AND.push({ rank_overall: { lte: maxRank } });

  if (bestPlayerCount) {
    whereConditions.AND.push({ game_best_player_counts: { some: { player_count: bestPlayerCount } } });
  }
  if (designerNames?.length) {
    whereConditions.AND.push({ game_designers: { some: { designers: { name: { in: designerNames } } } } });
  }
  if (artistNames?.length) {
    whereConditions.AND.push({ game_artists: { some: { artists: { name: { in: artistNames } } } } });
  }
  if (publisherNames?.length) {
    whereConditions.AND.push({ game_publishers: { some: { publishers: { name: { in: publisherNames } } } } });
  }
  if (mechanicNames?.length) {
    whereConditions.AND.push({ game_mechanics: { some: { mechanics: { name: { in: mechanicNames } } } } });
  }
  if (categoryNames?.length) {
    whereConditions.AND.push({ game_categories: { some: { categories: { name: { in: categoryNames } } } } });
  }
  if (awardNames?.length) {
    whereConditions.AND.push({ game_awards: { some: { awards: { award_name: { in: awardNames } } } } });
  }
  if (genreName) {
    whereConditions.AND.push({ game_genre_ranks: { some: { genres: { name: genreName } } } });
  }
  if (awardYear || awardName || awardType) {
    const awardCond: any = {};
    if (awardYear) awardCond.award_year = awardYear;
    if (awardName) awardCond.award_name = { contains: awardName, mode: 'insensitive' };
    if (awardType) awardCond.award_type = awardType;
    whereConditions.AND.push({ game_awards: { some: { awards: awardCond } } });
  }
  if (weightMin !== undefined) whereConditions.AND.push({ weight: { gte: weightMin } });
  if (weightMax !== undefined) whereConditions.AND.push({ weight: { lte: weightMax } });
  if (ratingsCountMin !== undefined) whereConditions.AND.push({ ratings_count: { gte: ratingsCountMin } });
  if (ratingsCountMax !== undefined) whereConditions.AND.push({ ratings_count: { lte: ratingsCountMax } });
  if (commentsCountMin !== undefined) whereConditions.AND.push({ comments_count: { gte: commentsCountMin } });
  if (commentsCountMax !== undefined) whereConditions.AND.push({ comments_count: { lte: commentsCountMax } });

  if (!whereConditions.AND.length) delete whereConditions.AND;

  const totalCount = await prisma.games.count({ where: whereConditions });
  const skip = (page - 1) * limit;
  const totalPages = Math.ceil(totalCount / limit);

  const games = await prisma.games.findMany({
    where: whereConditions,
    include: {
      game_designers: {
        include: { designers: { select: { id: true, name: true, bgg_url: true } } }
      },
      game_artists: {
        include: { artists: { select: { id: true, name: true, bgg_url: true } } }
      },
      game_publishers: {
        include: { publishers: { select: { id: true, name: true, bgg_url: true } } }
      },
      game_mechanics: {
        include: { mechanics: { select: { id: true, name: true, bgg_url: true } } }
      },
      game_categories: {
        include: { categories: { select: { id: true, name: true, bgg_url: true } } }
      },
      game_awards: {
        include: {
          awards: {
            select: {
              id: true,
              award_name: true,
              award_year: true,
              award_type: true,
              award_category: true,
              bgg_url: true // ← 追加
            }
          }
        }
      },
      game_genre_ranks: {
        include: { genres: { select: { id: true, name: true, bgg_url: true } } }
      },
      game_best_player_counts: {
        select: { player_count: true },
        orderBy: { player_count: 'asc' }
      }
    },
    orderBy: [{ rank_overall: 'asc' }, { avg_rating: 'desc' }, { primary_name: 'asc' }],
    skip,
    take: limit
  });

  const gameResults: GameSearchResult[] = games.map((game) => ({
    id: game.id,
    bggId: game.bgg_id,
    primaryName: game.primary_name,
    japaneseName: game.japanese_name,
    yearReleased: game.year_released,
    imageUrl: game.image_url,
    avgRating: game.avg_rating ? Number(game.avg_rating) : null,
    ratingsCount: game.ratings_count,
    commentsCount: game.comments_count,
    minPlayers: game.min_players,
    maxPlayers: game.max_players,
    minPlaytime: game.min_playtime,
    maxPlaytime: game.max_playtime,
    minAge: game.min_age,
    weight: game.weight ? Number(game.weight) : null,
    rankOverall: game.rank_overall,

    designers: game.game_designers.map((gd) => ({
      id: gd.designers.id,
      name: gd.designers.name,
      bggUrl: gd.designers.bgg_url ?? null
    })),
    artists: game.game_artists.map((ga) => ({
      id: ga.artists.id,
      name: ga.artists.name,
      bggUrl: ga.artists.bgg_url ?? null
    })),
    publishers: game.game_publishers.map((gp) => ({
      id: gp.publishers.id,
      name: gp.publishers.name,
      bggUrl: gp.publishers.bgg_url ?? null
    })),
    mechanics: game.game_mechanics.map((gm) => ({
      id: gm.mechanics.id,
      name: gm.mechanics.name,
      bggUrl: gm.mechanics.bgg_url ?? null
    })),
    categories: game.game_categories.map((gc) => ({
      id: gc.categories.id,
      name: gc.categories.name,
      bggUrl: gc.categories.bgg_url ?? null
    })),
    awards: game.game_awards.map((ga) => ({
      id: ga.awards.id,
      awardName: ga.awards.award_name,
      awardYear: ga.awards.award_year,
      awardType: ga.awards.award_type,
      awardCategory: ga.awards.award_category,
      bggUrl: ga.awards.bgg_url ?? null // ← 追加
    })),
    genreRankings: game.game_genre_ranks.map((ggr) => ({
      genre: {
        id: ggr.genres.id,
        name: ggr.genres.name,
        bggUrl: ggr.genres.bgg_url ?? null
      },
      rankInGenre: ggr.rank_in_genre
    })),
    bestPlayerCounts: game.game_best_player_counts.map((bpc) => bpc.player_count),
    createdAt: game.created_at,
    updatedAt: game.updated_at
  }));

  return {
    games: gameResults,
    totalCount,
    currentPage: page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
}

// getGameById / getGameByBggId も awards に bgg_url を含めて返却するよう修正
export async function getGameById(id: number): Promise<GameSearchResult | null> {
  const game = await prisma.games.findUnique({
    where: { id },
    include: {
      game_designers: { include: { designers: { select: { id: true, name: true, bgg_url: true } } } },
      game_artists: { include: { artists: { select: { id: true, name: true, bgg_url: true } } } },
      game_publishers: { include: { publishers: { select: { id: true, name: true, bgg_url: true } } } },
      game_mechanics: { include: { mechanics: { select: { id: true, name: true, bgg_url: true } } } },
      game_categories: { include: { categories: { select: { id: true, name: true, bgg_url: true } } } },
      game_awards: {
        include: {
          awards: {
            select: { id: true, award_name: true, award_year: true, award_type: true, award_category: true, bgg_url: true }
          }
        }
      },
      game_genre_ranks: { include: { genres: { select: { id: true, name: true, bgg_url: true } } } },
      game_best_player_counts: { select: { player_count: true }, orderBy: { player_count: 'asc' } }
    }
  });
  if (!game) return null;

  return {
    id: game.id,
    bggId: game.bgg_id,
    primaryName: game.primary_name,
    japaneseName: game.japanese_name,
    yearReleased: game.year_released,
    imageUrl: game.image_url,
    avgRating: game.avg_rating ? Number(game.avg_rating) : null,
    ratingsCount: game.ratings_count,
    commentsCount: game.comments_count,
    minPlayers: game.min_players,
    maxPlayers: game.max_players,
    minPlaytime: game.min_playtime,
    maxPlaytime: game.max_playtime,
    minAge: game.min_age,
    weight: game.weight ? Number(game.weight) : null,
    rankOverall: game.rank_overall,
    designers: game.game_designers.map((gd) => ({ id: gd.designers.id, name: gd.designers.name, bggUrl: gd.designers.bgg_url ?? null })),
    artists: game.game_artists.map((ga) => ({ id: ga.artists.id, name: ga.artists.name, bggUrl: ga.artists.bgg_url ?? null })),
    publishers: game.game_publishers.map((gp) => ({ id: gp.publishers.id, name: gp.publishers.name, bggUrl: gp.publishers.bgg_url ?? null })),
    mechanics: game.game_mechanics.map((gm) => ({ id: gm.mechanics.id, name: gm.mechanics.name, bggUrl: gm.mechanics.bgg_url ?? null })),
    categories: game.game_categories.map((gc) => ({ id: gc.categories.id, name: gc.categories.name, bggUrl: gc.categories.bgg_url ?? null })),
    awards: game.game_awards.map((ga) => ({
      id: ga.awards.id,
      awardName: ga.awards.award_name,
      awardYear: ga.awards.award_year,
      awardType: ga.awards.award_type,
      awardCategory: ga.awards.award_category,
      bggUrl: ga.awards.bgg_url ?? null
    })),
    genreRankings: game.game_genre_ranks.map((ggr) => ({
      genre: { id: ggr.genres.id, name: ggr.genres.name, bggUrl: ggr.genres.bgg_url ?? null },
      rankInGenre: ggr.rank_in_genre
    })),
    bestPlayerCounts: game.game_best_player_counts.map((bpc) => bpc.player_count),
    createdAt: game.created_at,
    updatedAt: game.updated_at
  };
}

export async function getGameByBggId(bggId: number): Promise<GameSearchResult | null> {
  const game = await prisma.games.findUnique({
    where: { bgg_id: bggId },
    include: {
      game_designers: { include: { designers: { select: { id: true, name: true, bgg_url: true } } } },
      game_artists: { include: { artists: { select: { id: true, name: true, bgg_url: true } } } },
      game_publishers: { include: { publishers: { select: { id: true, name: true, bgg_url: true } } } },
      game_mechanics: { include: { mechanics: { select: { id: true, name: true, bgg_url: true } } } },
      game_categories: { include: { categories: { select: { id: true, name: true, bgg_url: true } } } },
      game_awards: {
        include: {
          awards: {
            select: { id: true, award_name: true, award_year: true, award_type: true, award_category: true, bgg_url: true }
          }
        }
      },
      game_genre_ranks: { include: { genres: { select: { id: true, name: true, bgg_url: true } } } },
      game_best_player_counts: { select: { player_count: true }, orderBy: { player_count: 'asc' } }
    }
  });
  if (!game) return null;

  return {
    id: game.id,
    bggId: game.bgg_id,
    primaryName: game.primary_name,
    japaneseName: game.japanese_name,
    yearReleased: game.year_released,
    imageUrl: game.image_url,
    avgRating: game.avg_rating ? Number(game.avg_rating) : null,
    ratingsCount: game.ratings_count,
    commentsCount: game.comments_count,
    minPlayers: game.min_players,
    maxPlayers: game.max_players,
    minPlaytime: game.min_playtime,
    maxPlaytime: game.max_playtime,
    minAge: game.min_age,
    weight: game.weight ? Number(game.weight) : null,
    rankOverall: game.rank_overall,
    designers: game.game_designers.map((gd) => ({ id: gd.designers.id, name: gd.designers.name, bggUrl: gd.designers.bgg_url ?? null })),
    artists: game.game_artists.map((ga) => ({ id: ga.artists.id, name: ga.artists.name, bggUrl: ga.artists.bgg_url ?? null })),
    publishers: game.game_publishers.map((gp) => ({ id: gp.publishers.id, name: gp.publishers.name, bggUrl: gp.publishers.bgg_url ?? null })),
    mechanics: game.game_mechanics.map((gm) => ({ id: gm.mechanics.id, name: gm.mechanics.name, bggUrl: gm.mechanics.bgg_url ?? null })),
    categories: game.game_categories.map((gc) => ({ id: gc.categories.id, name: gc.categories.name, bggUrl: gc.categories.bgg_url ?? null })),
    awards: game.game_awards.map((ga) => ({
      id: ga.awards.id,
      awardName: ga.awards.award_name,
      awardYear: ga.awards.award_year,
      awardType: ga.awards.award_type,
      awardCategory: ga.awards.award_category,
      bggUrl: ga.awards.bgg_url ?? null
    })),
    genreRankings: game.game_genre_ranks.map((ggr) => ({
      genre: { id: ggr.genres.id, name: ggr.genres.name, bggUrl: ggr.genres.bgg_url ?? null },
      rankInGenre: ggr.rank_in_genre
    })),
    bestPlayerCounts: game.game_best_player_counts.map((bpc) => bpc.player_count),
    createdAt: game.created_at,
    updatedAt: game.updated_at
  };
}

export interface GameSearchResponse {
  games: GameSearchResult[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}