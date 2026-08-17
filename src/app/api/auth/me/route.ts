import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const decoded = verifyToken(token)
  if (!decoded) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: (decoded as any).userId }, include: { account: true } })
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

  const { pinHash, ...userWithoutPin } = user as any
  return NextResponse.json({ success: true, data: userWithoutPin })
}
