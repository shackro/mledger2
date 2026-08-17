import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const decoded = verifyToken(token)
  if (!decoded) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })

  const transactions = await prisma.transaction.findMany({
    where: { OR: [{ senderId: (decoded as any).userId }, { recipientId: (decoded as any).userId }] },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const { serializePrisma } = await import('@/lib/serializers')
  return NextResponse.json({ success: true, data: serializePrisma(transactions) })
}
