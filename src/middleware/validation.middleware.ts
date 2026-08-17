import { NextRequest, NextResponse } from 'next/server'

export function validationErrorResponse(errors: any) {
  return NextResponse.json({ success: false, error: 'Invalid input', details: errors }, { status: 400 })
}
