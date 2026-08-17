import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPin, generateToken } from '@/lib/auth'
import { loginSchema } from '@/lib/validators'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = loginSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input' },
        { status: 400 }
      )
    }

    const { phone, pin } = validation.data

    const user = await prisma.user.findUnique({
      where: { phone },
      include: { account: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const isValidPin = await verifyPin(pin, user.pinHash)
    if (!isValidPin) {
      return NextResponse.json(
        { success: false, error: 'Invalid PIN' },
        { status: 401 }
      )
    }

    const token = generateToken(user.id, user.phone)
    // remove pinHash for response
    // Note: user is a Prisma model object with pinHash field
    const { pinHash, ...userWithoutPin } = user as any

    return NextResponse.json({
      success: true,
      data: {
        user: userWithoutPin,
        accessToken: token,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}
