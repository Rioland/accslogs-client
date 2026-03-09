import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import supabaseClient from '@/lib/supabaseClient';

export async function POST(req: Request) {

  const { event, data } = await req.json();
  if (event !== 'transfer.success') {
    return NextResponse.json({ status: 'error', message: 'Invalid event' });
  }

  
  const { fee, amount, status, currency, reference } = data;

  

    // Insert a new deposit
    const { error: transactionError } = await supabaseClient
      .from('deposits')
      .insert([
        {
          user_id:reference,
          amount: amount,
          status: status,
          reference: reference,
          fee: fee,
          currency: currency,
        },
      ]);

    if (transactionError) {
      console.error('Webhook Error: Failed to insert transaction', transactionError);
      return NextResponse.json({ status: 'error', message: 'Failed to insert transaction' });
    }

  
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, balance')
      .eq('id', reference)
      .single();

    if (profileError) {
      console.error('Webhook Error: Failed to get profile', profileError);
      return NextResponse.json({ status: 'error', message: 'Failed to get profile' });
    }

    // Update user's balance
    const newBalance = profile?.balance + amount;
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', profile?.id);

    if (updateError) {
      console.error('Webhook Error: Failed to update balance', updateError);
      return NextResponse.json({ status: 'error', message: 'Failed to update balance' });
    }

  return NextResponse.json({ status: 'success', message: 'Deposit successful' });
}
