import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { amount, currency = 'INR', receipt } = await request.json();

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId.includes('XXXX')) {
      // Demo mode — return a mock order when no real keys are configured
      return NextResponse.json({
        id: `order_demo_${Date.now()}`,
        amount: amount * 100,
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        status: 'created',
        demo: true,
      });
    }

    // Real Razorpay order creation via REST API
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: amount * 100, // Razorpay expects paise
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.error?.description || 'Order creation failed' }, { status: 400 });
    }

    const order = await response.json();
    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
