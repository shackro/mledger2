import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    // 👇 Fetch BOTH account and fuliza in one query
    const user = await prisma.user.findUnique({
      where: { id: (decoded as any).userId },
      include: {
        account: true,
        fuliza: true,
      }
    })

    if (!user || !user.account) {
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        balance: user.account.balance,
        currency: user.account.currency,
        fulizaLimit: user.fuliza?.creditLimit || 0.0,       // 👈 ADDED
        fulizaUsed: user.fuliza?.usedAmount || 0.0,         // 👈 ADDED
      }
    })

  } catch (error) {
    console.error('Balance check error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
