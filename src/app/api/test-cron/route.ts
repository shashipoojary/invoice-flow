import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing auto-reminder cron job...');
    
    // Call the cron job endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cron/reminders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Test cron job executed',
      result
    });

  } catch (error) {
    console.error('❌ Error in test cron job:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
