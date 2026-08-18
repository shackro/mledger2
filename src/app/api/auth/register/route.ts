import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPin, generateToken } from '@/lib/auth'
import { registerSchema } from '@/lib/validators'
import { serializePrisma } from '@/lib/serializers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate incoming data (including startingAmount and fulizaLimit)
    const validation = registerSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.format() },
        { status: 400 }
      )
    }

    const { name, phone, pin, nationalId, startingAmount, fulizaLimit } = validation.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { phone } })
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'User already exists' }, { status: 409 })
    }

    // Hash the PIN
    const pinHash = await hashPin(pin)

    // Create User, Account, and Fuliza in a single ACID transaction
    // Inside the prisma.$transaction block of your register route
    const user = await tx.user.create({
      data: {
        name: name,
        phone: phone,
        nationalId: nationalId,
        pinHash: pinHash,
        role: 'USER',
        isVerified: true,
        isActive: true,
        
        account: {
          create: {
            accountNumber: `ACC${Date.now()}`,
            balance: startingAmount ?? 0.0, // 👈 Respects 0, defaults to 0.0
            currency: 'KES',
            status: 'ACTIVE',
          }
        },
        
        fuliza: {
          create: {
            creditLimit: fulizaLimit ?? 0.0, // 👈 Respects 0, defaults to 0.0 (NOT 1500)
            usedAmount: 0.0,
            isActive: true,
          }
        },
        
        loyalty: {
          create: {
            points: 0,
            tier: 'BRONZE',
          }
        }
      },
      include: { 
        account: true, 
        fuliza: true 
      }
    })

      return user
    })

    // Generate JWT Token
    const token = generateToken(newUser.id, newUser.phone)
    const { pinHash: _, ...userWithoutPin } = newUser

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: {
        user: serializePrisma(userWithoutPin),
        accessToken: token,
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Server error during registration' },
      { status: 500 }
    )
  }
}
