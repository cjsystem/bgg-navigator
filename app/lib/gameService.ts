import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

// ゲーム検索のためのフィルタ型定義
export interface GameSearchFilters {
  // 基本検索
  name?: string;                    // ゲーム名（英語・日本語両方を検索）
  yearReleased?: {
    min?: number;
    max?: number;
  };

  // プレイヤー数・プレイ時間
  playerCount?: number;             // この人数でプレイ可能なゲーム
  bestPlayerCount?: number;         // ベストプレイヤー数
  minPlaytime?: number;
  maxPlaytime?: number;
  minAge?: number;

  // 評価・ランキング
  minRating?: number;
  maxRank?: number;                 // 総合ランキング上位X位まで

  // 関連エンティティでの検索
  designerNames?: string[];         // デザイナー名
  artistNames?: string[];           // アーティスト名
  publisherNames?: string[];        // パブリッシャー名
  mechanicNames?: string[];         // メカニクス名
  categoryNames?: string[];         // カテゴリ名
  awardNames?: string[];            // 受賞歴
  genreName?: string;             // ジャンル名（単一選択）

  // ページング
  page?: number;
  limit?: number;
}

// 検索結果の型定義
export interface GameSearchResult {
  // 基本情報
  id: number;
  bggId: number;
  primaryName: string;
  japaneseName: string | null;
  yearReleased: number | null;
  imageUrl: string | null;

  // 評価情報
  avgRating: number | null;
  ratingsCount: number | null;
  commentsCount: number | null;

  // プレイ情報
  minPlayers: number | null;
  maxPlayers: number | null;
  minPlaytime: number | null;
  maxPlaytime: number | null;
  minAge: number | null;
  weight: number | null;
  rankOverall: number | null;

  // 関連情報
  designers: Array<{
    id: number;
    name: string;
  }>;
  artists: Array<{
    id: number;
    name: string;
  }>;
  publishers: Array<{
    id: number;
    name: string;
  }>;
  mechanics: Array<{
    id: number;
    name: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
  }>;
  awards: Array<{
    id: number;
    awardName: string;
    awardYear: number;
    awardType: string;
    awardCategory: string | null;
  }>;
  genreRankings: Array<{
    genre: {
      id: number;
      name: string;
    };
    rankInGenre: number | null;
  }>;
  bestPlayerCounts: number[];

  // メタデータ
  createdAt: Date | null;
  updatedAt: Date | null;
}

// 検索結果のページング情報
export interface GameSearchResponse {
  games: GameSearchResult[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * ゲームを包括的に検索する関数
 */
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
    page = 1,
    limit = 20
  } = filters;

  // WHERE条件を構築
  const whereConditions: any = {
    AND: []
  };

  // 名前検索（英語・日本語両方）
  if (name) {
    whereConditions.AND.push({
      OR: [
        { primary_name: { contains: name, mode: 'insensitive' } },
        { japanese_name: { contains: name, mode: 'insensitive' } }
      ]
    });
  }

  // 年代検索
  if (yearReleased) {
    const yearConditions: any = {};
    if (yearReleased.min) yearConditions.gte = yearReleased.min;
    if (yearReleased.max) yearConditions.lte = yearReleased.max;
    if (Object.keys(yearConditions).length > 0) {
      whereConditions.AND.push({ year_released: yearConditions });
    }
  }

  // プレイヤー数検索（指定した人数でプレイ可能）
  if (playerCount) {
    whereConditions.AND.push({
      AND: [
        { min_players: { lte: playerCount } },
        { max_players: { gte: playerCount } }
      ]
    });
  }

  // プレイ時間、年齢、評価、ランキング
  if (minPlaytime) {
    whereConditions.AND.push({ min_playtime: { gte: minPlaytime } });
  }
  if (maxPlaytime) {
    whereConditions.AND.push({ max_playtime: { lte: maxPlaytime } });
  }
  if (minAge) {
    whereConditions.AND.push({ min_age: { gte: minAge } });
  }
  if (minRating) {
    whereConditions.AND.push({ avg_rating: { gte: minRating } });
  }
  if (maxRank) {
    whereConditions.AND.push({ rank_overall: { lte: maxRank } });
  }

  // ベストプレイヤー数
  if (bestPlayerCount) {
    whereConditions.AND.push({
      game_best_player_counts: {
        some: {
          player_count: bestPlayerCount
        }
      }
    });
  }

  // デザイナー名検索
  if (designerNames && designerNames.length > 0) {
    whereConditions.AND.push({
      game_designers: {
        some: {
          designers: {
            name: {
              in: designerNames
            }
          }
        }
      }
    });
  }

  // アーティスト名検索
  if (artistNames && artistNames.length > 0) {
    whereConditions.AND.push({
      game_artists: {
        some: {
          artists: {
            name: {
              in: artistNames
            }
          }
        }
      }
    });
  }

  // パブリッシャー名検索
  if (publisherNames && publisherNames.length > 0) {
    whereConditions.AND.push({
      game_publishers: {
        some: {
          publishers: {
            name: {
              in: publisherNames
            }
          }
        }
      }
    });
  }

  // メカニクス名検索
  if (mechanicNames && mechanicNames.length > 0) {
    whereConditions.AND.push({
      game_mechanics: {
        some: {
          mechanics: {
            name: {
              in: mechanicNames
            }
          }
        }
      }
    });
  }

  // カテゴリ名検索
  if (categoryNames && categoryNames.length > 0) {
    whereConditions.AND.push({
      game_categories: {
        some: {
          categories: {
            name: {
              in: categoryNames
            }
          }
        }
      }
    });
  }

  // 受賞歴検索
  if (awardNames && awardNames.length > 0) {
    whereConditions.AND.push({
      game_awards: {
        some: {
          awards: {
            award_name: {
              in: awardNames
            }
          }
        }
      }
    });
  }

  // ジャンル検索
  if (genreName) {
    whereConditions.AND.push({
      game_genre_ranks: {
        some: {
          genres: {
            name: genreName
          }
        }
      }
    });
  }

  // ANDが空の場合は削除
  if (whereConditions.AND.length === 0) {
    delete whereConditions.AND;
  }

  // 総件数を取得
  const totalCount = await prisma.games.count({
    where: whereConditions
  });

  // ページング計算
  const skip = (page - 1) * limit;
  const totalPages = Math.ceil(totalCount / limit);

  // ゲーム検索実行（全関連データを含む）
  const games = await prisma.games.findMany({
    where: whereConditions,
    include: {
      // デザイナー
      game_designers: {
        include: {
          designers: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      // アーティスト
      game_artists: {
        include: {
          artists: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      // パブリッシャー
      game_publishers: {
        include: {
          publishers: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      // メカニクス
      game_mechanics: {
        include: {
          mechanics: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      // カテゴリ
      game_categories: {
        include: {
          categories: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      // 受賞歴
      game_awards: {
        include: {
          awards: {
            select: {
              id: true,
              award_name: true,
              award_year: true,
              award_type: true,
              award_category: true
            }
          }
        }
      },
      // ジャンルランキング
      game_genre_ranks: {
        include: {
          genres: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      // ベストプレイヤー数
      game_best_player_counts: {
        select: {
          player_count: true
        },
        orderBy: {
          player_count: 'asc'
        }
      }
    },
    orderBy: [
      { rank_overall: 'asc' },
      { avg_rating: 'desc' },
      { primary_name: 'asc' }
    ],
    skip,
    take: limit
  });

  // 結果を整形
  const gameResults: GameSearchResult[] = games.map(game => ({
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
    designers: game.game_designers.map(gd => ({
      id: gd.designers.id,
      name: gd.designers.name
    })),
    artists: game.game_artists.map(ga => ({
      id: ga.artists.id,
      name: ga.artists.name
    })),
    publishers: game.game_publishers.map(gp => ({
      id: gp.publishers.id,
      name: gp.publishers.name
    })),
    mechanics: game.game_mechanics.map(gm => ({
      id: gm.mechanics.id,
      name: gm.mechanics.name
    })),
    categories: game.game_categories.map(gc => ({
      id: gc.categories.id,
      name: gc.categories.name
    })),
    awards: game.game_awards.map(ga => ({
      id: ga.awards.id,
      awardName: ga.awards.award_name,
      awardYear: ga.awards.award_year,
      awardType: ga.awards.award_type,
      awardCategory: ga.awards.award_category
    })),
    genreRankings: game.game_genre_ranks.map(ggr => ({
      genre: {
        id: ggr.genres.id,
        name: ggr.genres.name
      },
      rankInGenre: ggr.rank_in_genre
    })),
    bestPlayerCounts: game.game_best_player_counts.map(bpc => bpc.player_count),
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

/**
 * 特定IDのゲーム詳細を取得
 */
export async function getGameById(id: number): Promise<GameSearchResult | null> {
  const game = await prisma.games.findUnique({
    where: { id },
    include: {
      game_designers: {
        include: {
          designers: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      game_artists: {
        include: {
          artists: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      game_publishers: {
        include: {
          publishers: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      game_mechanics: {
        include: {
          mechanics: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      game_categories: {
        include: {
          categories: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      game_awards: {
        include: {
          awards: {
            select: {
              id: true,
              award_name: true,
              award_year: true,
              award_type: true,
              award_category: true
            }
          }
        }
      },
      game_genre_ranks: {
        include: {
          genres: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      game_best_player_counts: {
        select: {
          player_count: true
        },
        orderBy: {
          player_count: 'asc'
        }
      }
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
    designers: game.game_designers.map(gd => ({
      id: gd.designers.id,
      name: gd.designers.name
    })),
    artists: game.game_artists.map(ga => ({
      id: ga.artists.id,
      name: ga.artists.name
    })),
    publishers: game.game_publishers.map(gp => ({
      id: gp.publishers.id,
      name: gp.publishers.name
    })),
    mechanics: game.game_mechanics.map(gm => ({
      id: gm.mechanics.id,
      name: gm.mechanics.name
    })),
    categories: game.game_categories.map(gc => ({
      id: gc.categories.id,
      name: gc.categories.name
    })),
    awards: game.game_awards.map(ga => ({
      id: ga.awards.id,
      awardName: ga.awards.award_name,
      awardYear: ga.awards.award_year,
      awardType: ga.awards.award_type,
      awardCategory: ga.awards.award_category
    })),
    genreRankings: game.game_genre_ranks.map(ggr => ({
      genre: {
        id: ggr.genres.id,
        name: ggr.genres.name
      },
      rankInGenre: ggr.rank_in_genre
    })),
    bestPlayerCounts: game.game_best_player_counts.map(bpc => bpc.player_count),
    createdAt: game.created_at,
    updatedAt: game.updated_at
  };
}

/**
 * BGGIDでゲーム詳細を取得
 */
export async function getGameByBggId(bggId: number): Promise<GameSearchResult | null> {
  const game = await prisma.games.findUnique({
    where: { bgg_id: bggId },
    include: {
      game_designers: {
        include: {
          designers: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      game_artists: {
        include: {
          artists: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      game_publishers: {
        include: {
          publishers: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      game_mechanics: {
        include: {
          mechanics: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      game_categories: {
        include: {
          categories: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      game_awards: {
        include: {
          awards: {
            select: {
              id: true,
              award_name: true,
              award_year: true,
              award_type: true,
              award_category: true
            }
          }
        }
      },
      game_genre_ranks: {
        include: {
          genres: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      game_best_player_counts: {
        select: {
          player_count: true
        },
        orderBy: {
          player_count: 'asc'
        }
      }
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
    designers: game.game_designers.map(gd => ({
      id: gd.designers.id,
      name: gd.designers.name
    })),
    artists: game.game_artists.map(ga => ({
      id: ga.artists.id,
      name: ga.artists.name
    })),
    publishers: game.game_publishers.map(gp => ({
      id: gp.publishers.id,
      name: gp.publishers.name
    })),
    mechanics: game.game_mechanics.map(gm => ({
      id: gm.mechanics.id,
      name: gm.mechanics.name
    })),
    categories: game.game_categories.map(gc => ({
      id: gc.categories.id,
      name: gc.categories.name
    })),
    awards: game.game_awards.map(ga => ({
      id: ga.awards.id,
      awardName: ga.awards.award_name,
      awardYear: ga.awards.award_year,
      awardType: ga.awards.award_type,
      awardCategory: ga.awards.award_category
    })),
    genreRankings: game.game_genre_ranks.map(ggr => ({
      genre: {
        id: ggr.genres.id,
        name: ggr.genres.name
      },
      rankInGenre: ggr.rank_in_genre
    })),
    bestPlayerCounts: game.game_best_player_counts.map(bpc => bpc.player_count),
    createdAt: game.created_at,
    updatedAt: game.updated_at
  };
}