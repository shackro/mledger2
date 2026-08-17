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
    const fuliza = await prisma.fuliza.findUnique({ where: { userId } })
    if (!fuliza) return NextResponse.json({ success: false, error: 'Fuliza not found' }, { status: 404 })

    const tx = await prisma.$transaction(async (t) => {
      await t.fuliza.update({ where: { userId }, data: { usedAmount: { decrement: amount } } })
      await t.account.update({ where: { userId }, data: { balance: { decrement: amount } } })
      return t.transaction.create({
        data: {
          transactionCode: `FZRP${Date.now()}`,
          type: 'FULIZA_REPAY',
          amount,
          fee: 0,
          totalAmount: amount,
          status: 'COMPLETED',
          senderId: userId,
          completedAt: new Date(),
        },
      })
    })

    return NextResponse.json({ success: true, data: tx })
  } catch (error) {
    console.error('Fuliza repay error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
