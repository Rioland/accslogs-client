import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY!;
  const signature = req.headers.get('x-paystack-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  const body = await req.text();

  const hash = crypto
    .createHmac('sha512', secret)
    .update(body)
    .digest('hex');

  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event === 'charge.success') {
    const { amount, reference, customer } = event.data;
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            async get(name: string) {
              return (await cookieStore).get(name)?.value;
            },
          },
        }
      );

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, balance')
      .eq('email', customer.email)
      .single();

    if (error || !profile) {
      console.error('Webhook Error: Profile not found for email', customer.email);
      // Even if the profile is not found, we should return a 200 to Paystack
      // to prevent them from resending the webhook.
      return NextResponse.json({ status: 'success' });
    }

    // Insert a new transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: profile.id,
          amount: amount / 100, // Paystack amount is in kobo
          status: 'successful',
          reference,
        },
      ]);

    if (transactionError) {
      console.error('Webhook Error: Failed to insert transaction', transactionError);
      return NextResponse.json({ status: 'success' });
    }

    // Update user's balance
    const newBalance = profile.balance + amount / 100;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Webhook Error: Failed to update balance', updateError);
      return NextResponse.json({ status: 'success' });
    }
  }

  return NextResponse.json({ status: 'success' });
}
