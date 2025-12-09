import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('🚀 Manually triggering auto reminder job...');
    
    // Get base URL for API call
    const getBaseUrl = () => {
      if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
      if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
      // Only use localhost in development
      if (process.env.NODE_ENV === 'development') {
        return 'http://localhost:3000';
      }
      // In production, return empty string to prevent broken links
      console.error('NEXT_PUBLIC_APP_URL or VERCEL_URL must be set in production');
      return '';
    };
    const baseUrl = getBaseUrl();
    
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'Base URL not configured. Please set NEXT_PUBLIC_APP_URL environment variable.' },
        { status: 500 }
      );
    }
    
    // Call the auto-send endpoint
    const response = await fetch(`${baseUrl}/api/reminders/auto-send`, {
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
