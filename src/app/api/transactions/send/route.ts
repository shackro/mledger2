import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { sendMoneySchema } from '@/lib/validators'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const validation = sendMoneySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
    }

    const { recipientPhone, amount, pin } = validation.data

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get sender
      const sender = await tx.user.findUnique({
        where: { id: (decoded as any).userId },
        include: { account: true },
      })

      if (!sender || !sender.account) {
        throw new Error('Sender account not found')
      }

      // Verify PIN
      const { verifyPin } = await import('@/lib/auth')
      const isValidPin = await verifyPin(pin, sender.pinHash)
      if (!isValidPin) {
        throw new Error('Invalid PIN')
      }

      // Check balance
      // sender.account.balance is Decimal (Prisma.Decimal)
      if ((sender.account.balance as any).toNumber() < amount) {
        throw new Error('Insufficient funds')
      }

      // Get recipient
      const recipient = await tx.user.findUnique({
        where: { phone: recipientPhone },
        include: { account: true },
      })

      if (!recipient || !recipient.account) {
        throw new Error('Recipient not found')
      }

      // Generate transaction code
      const transactionCode = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`

      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          transactionCode,
          type: 'SEND_MONEY',
          amount,
          fee: 0,
          totalAmount: amount,
          status: 'COMPLETED',
          description: `Sent to ${recipient.name}`,
          senderId: sender.id,
          recipientId: recipient.id,
          completedAt: new Date(),
        },
      })

      // Update balances
      await tx.account.update({
        where: { userId: sender.id },
        data: { balance: { decrement: amount } },
      })

      await tx.account.update({
        where: { userId: recipient.id },
        data: { balance: { increment: amount } },
      })

      return transaction
    })

    const { serializePrisma } = await import('@/lib/serializers')
    return NextResponse.json({ success: true, data: serializePrisma(result) })
  } catch (error) {
    console.error('Send money error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}
