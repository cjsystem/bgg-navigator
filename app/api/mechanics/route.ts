import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const mechanics = await prisma.mechanics.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(mechanics);
  } catch (error) {
    console.error('メカニクス取得エラー:', error);
    return NextResponse.json(
        { error: 'メカニクス取得中にエラーが発生しました' },
        { status: 500 }
    );
  }
}