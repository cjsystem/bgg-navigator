// app/api/games/names/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('search')?.trim() ?? '';
    if (!q) return NextResponse.json([]);

    const games = await prisma.games.findMany({
      where: {
        OR: [
          { primary_name: { contains: q, mode: 'insensitive' } },
          { japanese_name: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        primary_name: true,
        japanese_name: true,
        year_released: true,
        image_url: true,
      },
      orderBy: [
        { ratings_count: 'desc' },
        { avg_rating: 'desc' },
        { primary_name: 'asc' },
      ],
      take: 20,
    });

    return NextResponse.json(
        games.map(g => ({
          id: g.id,
          primaryName: g.primary_name,
          japaneseName: g.japanese_name,
          yearReleased: g.year_released,
          imageUrl: g.image_url,
        }))
    );
  } catch (e) {
    console.error('ゲーム名候補取得エラー:', e);
    return NextResponse.json({ error: '候補取得に失敗しました' }, { status: 500 });
  }
}