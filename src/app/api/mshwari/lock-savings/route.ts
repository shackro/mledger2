import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })

    const { amount } = await request.json()
    if (!amount || typeof amount !== 'number' || amount <= 0) return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 })

    const userId = (decoded as any).userId
    const mshwari = await prisma.mshwari.findUnique({ where: { userId } })
    if (!mshwari) return NextResponse.json({ success: false, error: 'M-Shwari not found' }, { status: 404 })

    // Simplified: move funds from account to savings
    const result = await prisma.$transaction(async (t) => {
      await t.account.update({ where: { userId }, data: { balance: { decrement: amount } } })
      return t.mshwari.update({ where: { userId }, data: { savingsBalance: { increment: amount } } })
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Lock savings error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
