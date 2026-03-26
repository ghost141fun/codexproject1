import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(request: Request) {
  try {
    const { to, message } = await request.json();

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || accountSid.includes('XXXX')) {
      // Demo mode — mock the SMS sending if no real keys
      console.log(`[Twilio Demo] SMS to ${to}: ${message}`);
      return NextResponse.json({
        success: true,
        demo: true,
        message: 'SMS queued (Demo Mode)',
      });
    }

    const client = twilio(accountSid, authToken);
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to,
    });

    return NextResponse.json({ success: true, sid: result.sid });
  } catch (error: any) {
    console.error('Twilio Error:', error);
    return NextResponse.json({ error: error.message || 'SMS send failed' }, { status: 500 });
  }
}
