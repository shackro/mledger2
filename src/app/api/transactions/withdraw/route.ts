import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const { amount } = body
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 })
    }

    const userId = (decoded as any).userId
    const account = await prisma.account.findUnique({ where: { userId } })
    if (!account) return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 })

    if ((account.balance as any).toNumber() < amount) return NextResponse.json({ success: false, error: 'Insufficient funds' }, { status: 400 })

    const transaction = await prisma.$transaction(async (tx) => {
      const t = await tx.transaction.create({
        data: {
          transactionCode: `WD${Date.now()}`,
          type: 'WITHDRAW',
          amount,
          fee: 0,
          totalAmount: amount,
          status: 'COMPLETED',
          senderId: userId,
          completedAt: new Date(),
        },
      })

      await tx.account.update({ where: { userId }, data: { balance: { decrement: amount } } })
      return t
    })

    return NextResponse.json({ success: true, data: transaction })
  } catch (error) {
    console.error('Withdraw error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
