
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.categories.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('カテゴリ取得エラー:', error);
    return NextResponse.json(
        { error: 'カテゴリ取得中にエラーが発生しました' },
        { status: 500 }
    );
  }
}