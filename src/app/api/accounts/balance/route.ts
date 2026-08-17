import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const decoded = verifyToken(token)
  if (!decoded) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })

  const account = await prisma.account.findUnique({ where: { userId: (decoded as any).userId } })
  if (!account) return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 })

  return NextResponse.json({ success: true, data: { balance: (account.balance as any).toNumber ? (account.balance as any).toNumber() : account.balance } })
}
