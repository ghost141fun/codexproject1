import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { channelId } = await req.json();

  const res = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: `huddle-${channelId}`,
      properties: {
        max_participants: 50,
        enable_chat: true,
        enable_screenshare: true,
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
      },
    }),
  });

  // Room may already exist — fetch it instead
  if (res.status === 409) {
    const existing = await fetch(
      `https://api.daily.co/v1/rooms/huddle-${channelId}`,
      { headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}` } }
    );
    const data = await existing.json();
    return NextResponse.json(data);
  }

  const data = await res.json();
  return NextResponse.json(data);
}
