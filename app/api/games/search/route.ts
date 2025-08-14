import { NextRequest, NextResponse } from 'next/server';
import {GameSearchFilters, searchGames} from "@/app/lib/gameService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // クエリパラメータからフィルタを構築
    const filters: GameSearchFilters = {};

    // 基本検索
    if (searchParams.get('name')) {
      filters.name = searchParams.get('name')!;
    }

    if (searchParams.get('yearMin') || searchParams.get('yearMax')) {
      filters.yearReleased = {};
      if (searchParams.get('yearMin')) {
        filters.yearReleased.min = parseInt(searchParams.get('yearMin')!);
      }
      if (searchParams.get('yearMax')) {
        filters.yearReleased.max = parseInt(searchParams.get('yearMax')!);
      }
    }

    // プレイヤー数
    if (searchParams.get('playerCount')) {
      filters.playerCount = parseInt(searchParams.get('playerCount')!);
    }

    if (searchParams.get('bestPlayerCount')) {
      filters.bestPlayerCount = parseInt(searchParams.get('bestPlayerCount')!);
    }

    // プレイ時間・年齢
    if (searchParams.get('minPlaytime')) {
      filters.minPlaytime = parseInt(searchParams.get('minPlaytime')!);
    }

    if (searchParams.get('maxPlaytime')) {
      filters.maxPlaytime = parseInt(searchParams.get('maxPlaytime')!);
    }

    if (searchParams.get('minAge')) {
      filters.minAge = parseInt(searchParams.get('minAge')!);
    }

    // 評価・ランキング
    if (searchParams.get('minRating')) {
      filters.minRating = parseFloat(searchParams.get('minRating')!);
    }

    if (searchParams.get('maxRank')) {
      filters.maxRank = parseInt(searchParams.get('maxRank')!);
    }

    // 関連エンティティ（カンマ区切りで複数指定可能）
    if (searchParams.get('designers')) {
      filters.designerNames = searchParams.get('designers')!.split(',');
    }

    if (searchParams.get('artists')) {
      filters.artistNames = searchParams.get('artists')!.split(',');
    }

    if (searchParams.get('publishers')) {
      filters.publisherNames = searchParams.get('publishers')!.split(',');
    }

    if (searchParams.get('mechanics')) {
      filters.mechanicNames = searchParams.get('mechanics')!.split(',');
    }

    if (searchParams.get('categories')) {
      filters.categoryNames = searchParams.get('categories')!.split(',');
    }

    if (searchParams.get('awards')) {
      filters.awardNames = searchParams.get('awards')!.split(',');
    }

    // ジャンル名
    if (searchParams.get('genre')) {
      filters.genreName = searchParams.get('genre')!;
    }

    // 賞検索
    if (searchParams.get('awardYear')) {
      filters.awardYear = parseInt(searchParams.get('awardYear')!);
    }
    if (searchParams.get('awardName')) {
      filters.awardName = searchParams.get('awardName')!;
    }
    if (searchParams.get('awardType')) {
      filters.awardType = searchParams.get('awardType')!;
    }

    // ページング
    if (searchParams.get('page')) {
      filters.page = parseInt(searchParams.get('page')!);
    }

    if (searchParams.get('limit')) {
      filters.limit = parseInt(searchParams.get('limit')!);
    }

    const result = await searchGames(filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('ゲーム検索エラー:', error);
    return NextResponse.json(
        { error: 'ゲーム検索中にエラーが発生しました', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
    );
  }
}