import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const hasApiKey = !!process.env.RESEND_API_KEY;
    const apiKeyLength = process.env.RESEND_API_KEY?.length || 0;
    
    return NextResponse.json({
      success: true,
      hasApiKey,
      apiKeyLength,
      message: hasApiKey ? 'Resend API key is configured' : 'Resend API key is missing'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
