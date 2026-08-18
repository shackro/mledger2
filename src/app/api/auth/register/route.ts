import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPin, generateToken } from '@/lib/auth'
import { registerSchema } from '@/lib/validators'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate incoming data
    const validation = registerSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        // 👇 Changed .errors to .issues (Zod's correct property name)
        { success: false, error: 'Invalid input', details: validation.error.issues },
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
          
          // Initialize Account with starting amount
          account: {
            create: {
              accountNumber: `ACC${Date.now()}`,
              balance: startingAmount ?? 0.0, 
              currency: 'KES',
              status: 'ACTIVE',
            }
          },
          
          // Initialize Fuliza with limit
          fuliza: {
            create: {
              creditLimit: fulizaLimit ?? 0.0, 
              usedAmount: 0.0,
              isActive: true,
            }
          },
          
          // Initialize Loyalty
          loyalty: {
            create: {
              points: 0,
              tier: 'BRONZE',
            }
          }
        },
        include: {
          account: true,
          fuliza: true,
        }
      })

      return user
    })

    // Generate JWT Token
    const token = generateToken(newUser.id, newUser.phone)
    
    // Remove pinHash from response for security
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
