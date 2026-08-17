import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validators'
import { hashPin, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
    }

    const { name, phone, pin, nationalId } = validation.data

    const existing = await prisma.user.findUnique({ where: { phone } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'User already exists' }, { status: 409 })
    }

    const pinHash = await hashPin(pin)

    const user = await prisma.user.create({
      data: {
        name,
        phone,
        nationalId,
        pinHash,
      },
      include: { account: true },
    })

    // create basic account
    await prisma.account.create({
      data: {
        userId: user.id,
        accountNumber: `MPESA${Date.now() + Math.floor(Math.random() * 1000)}`,
        balance: 0,
      },
    })

    const token = generateToken(user.id, user.phone)
    const { pinHash: ph, ...userWithoutPin } = user as any

    return NextResponse.json({ success: true, data: { user: userWithoutPin, accessToken: token } })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
