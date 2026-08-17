import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export function authMiddleware(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
  }

  return NextResponse.next()
}
