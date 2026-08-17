import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const decoded = verifyToken(token)
  if (!decoded) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })

  const fuliza = await prisma.fuliza.findUnique({ where: { userId: (decoded as any).userId } })
  return NextResponse.json({ success: true, data: fuliza })
}
