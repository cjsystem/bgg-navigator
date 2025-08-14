
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const awardTypes = await prisma.awards.findMany({
      select: {
        award_type: true
      },
      distinct: ['award_type'],
      orderBy: {
        award_type: 'asc'
      }
    });

    return NextResponse.json(awardTypes.map(award => ({ type: award.award_type })));
  } catch (error) {
    console.error('賞タイプ取得エラー:', error);
    return NextResponse.json(
        { error: '賞タイプ取得中にエラーが発生しました' },
        { status: 500 }
    );
  }
}