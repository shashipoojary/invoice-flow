import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, reminderType = 'first' } = await request.json();

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder would be sent successfully',
      invoiceId,
      reminderType
    });

  } catch (error) {
    console.error('Error in send-simple:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
