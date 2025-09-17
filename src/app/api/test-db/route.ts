import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const result = await query('SELECT NOW() as current_time')
    return NextResponse.json({ 
      success: true, 
      time: result.rows[0].current_time,
      message: 'Database connection successful'
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

