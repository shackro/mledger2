import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, verifyPin } from '@/lib/auth'
import { sendMoneySchema } from '@/lib/validators'
import { generateMpesaCode } from '@/lib/utils'

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

    // Start ACID transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get sender
      const sender = await tx.user.findUnique({
        where: { id: (decoded as any).userId },
        include: { account: true },
      })

      if (!sender || !sender.account) {
        throw new Error('Sender account not found')
      }

      // 2. Verify PIN
      const isValidPin = await verifyPin(pin, sender.pinHash)
      if (!isValidPin) {
        throw new Error('Invalid PIN')
      }

      // 3. Check balance
      if ((sender.account.balance as any).toNumber() < amount) {
        throw new Error('Insufficient funds')
      }

      // 4. Get recipient
      const recipient = await tx.user.findUnique({
        where: { phone: recipientPhone },
        include: { account: true },
      })

      if (!recipient || !recipient.account) {
        throw new Error('Recipient not found')
      }

      // 5. 👇 GENERATE REALISTIC 10-CHAR M-PESA CODE (e.g., UHHXTXDE4M)
      const transactionCode = generateMpesaCode()

      // 6. Create transaction record
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

      // 7. Update balances atomically
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
