
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const genres = await prisma.genres.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(genres);
  } catch (error) {
    console.error('ジャンル取得エラー:', error);
    return NextResponse.json(
        { error: 'ジャンル取得中にエラーが発生しました' },
        { status: 500 }
    );
  }
}