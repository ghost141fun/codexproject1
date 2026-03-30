import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      plan 
    } = await request.json();

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret || secret.includes('XXXX')) {
      // Demo mode verification
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('users')
          .update({ plan: plan || 'pro' })
          .eq('id', user.id);
      }

      return NextResponse.json({ 
        status: 'ok', 
        message: 'Payment verified (Demo Mode)',
        demo: true 
      });
    }

    // Real verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Update user plan in DB
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from('users')
          .update({ 
            plan: plan || 'pro',
            last_payment_id: razorpay_payment_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (error) {
          console.error('Database update error:', error);
          // We still return success for payment, but log the DB error
        }
      }

      return NextResponse.json({ status: 'ok', message: 'Payment verified successfully' });
    } else {
      return NextResponse.json({ status: 'error', message: 'Invalid signature' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
