import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Test send endpoint working',
      invoiceId: invoiceId
    });
  } catch (error) {
    console.error('Test send error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
