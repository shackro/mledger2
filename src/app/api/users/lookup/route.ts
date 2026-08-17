import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    // Basic validation
    if (!phone || phone.length < 10) {
      return NextResponse.json({ success: false, error: 'Invalid phone number' }, { status: 400 })
    }

    // Search database for the user
    const user = await prisma.user.findUnique({
      where: { phone: phone },
      select: { 
        name: true, 
        phone: true 
      } // Only return safe, non-sensitive data
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      data: { name: user.name, phone: user.phone } 
    })
  } catch (error) {
    console.error('User lookup error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}