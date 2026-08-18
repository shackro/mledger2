import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPin, generateToken } from '@/lib/auth'
import { registerSchema } from '@/lib/validators'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 1. Validate incoming data
    const validation = registerSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { name, phone, pin, nationalId, startingAmount, fulizaLimit } = validation.data

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { phone } })
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'User already exists' }, { status: 409 })
    }

    // 3. Hash the PIN
    const pinHash = await hashPin(pin)

    // 4. Create User, Account, and Fuliza in a single ACID transaction
    const newUser = await prisma.$transaction(async (tx) => {
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
              balance: startingAmount, // Zod guarantees this is a valid number (defaults to 0)
              currency: 'KES',
              status: 'ACTIVE',
            }
          },
          
          fuliza: {
            create: {
              creditLimit: fulizaLimit ?? 0.0, // 👈 Nullish coalescing: keeps 0 as 0, doesn't fallback to 1500
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
    }) // 👈 This correctly closes the prisma.$transaction block

    // 5. Generate JWT Token
    const token = generateToken(newUser.id, newUser.phone)
    
    // 6. Remove pinHash from response for security
    const { pinHash: _, ...userWithoutPin } = newUser

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: {
        user: userWithoutPin,
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
