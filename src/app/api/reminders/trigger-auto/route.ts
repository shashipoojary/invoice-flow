import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('🚀 Manually triggering auto reminder job...');
    
    // Call the auto-send endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reminders/auto-send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.CRON_SECRET && { 'Authorization': `Bearer ${process.env.CRON_SECRET}` })
      }
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Auto reminder job triggered successfully',
      result
    });

  } catch (error) {
    console.error('❌ Failed to trigger auto reminder job:', error);
    return NextResponse.json(
      { error: 'Failed to trigger auto reminder job', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
