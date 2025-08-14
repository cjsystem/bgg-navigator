
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    // 検索条件を構築
    const whereConditions = search
        ? {
          name: {
            contains: search,
            mode: 'insensitive' as const
          }
        }
        : {};

    const designers = await prisma.designers.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      },
      take: 50 // 最大50件まで
    });

    return NextResponse.json(designers);
  } catch (error) {
    console.error('デザイナー取得エラー:', error);
    return NextResponse.json(
        { error: 'デザイナー取得中にエラーが発生しました' },
        { status: 500 }
    );
  }
}