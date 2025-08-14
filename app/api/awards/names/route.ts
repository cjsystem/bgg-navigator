import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    // 検索条件を構築
    const whereConditions = search
        ? {
          award_name: {
            contains: search,
            mode: 'insensitive' as const
          }
        }
        : {};

    const awardNames = await prisma.awards.findMany({
      where: whereConditions,
      select: {
        award_name: true
      },
      distinct: ['award_name'],
      orderBy: {
        award_name: 'asc'
      },
      take: 50 // 最大50件まで
    });

    return NextResponse.json(awardNames.map(award => ({ name: award.award_name })));
  } catch (error) {
    console.error('賞名取得エラー:', error);
    return NextResponse.json(
        { error: '賞名取得中にエラーが発生しました' },
        { status: 500 }
    );
  }
}