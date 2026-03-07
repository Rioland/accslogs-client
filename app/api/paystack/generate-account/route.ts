import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!
const PAYSTACK_BASE_URL =
  process.env.PAYSTACK_BASE_URL ?? 'https://api.paystack.co'

export async function POST (request: NextRequest) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('paystack_customer_id, dedicated_account_number, email, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 500 })
  }

  // If user already has a dedicated account, return it.
  if (profile.dedicated_account_number) {
    return NextResponse.json({
      accountNumber: profile.dedicated_account_number
    })
  }

  let customerId = profile.paystack_customer_id

  if (!customerId) {
    // Create a new customer on Paystack
    const response = await fetch(`${PAYSTACK_BASE_URL}/customer`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: profile.email,
        first_name: profile.full_name?.split(' ')[0],
        last_name: profile.full_name?.split(' ').slice(1).join(' ')
      })
    })

    const data = await response.json()

    if (!response.ok) {
      // Propagate Paystack error details to the client for easier debugging.
      const details = data?.message || data
      console.error('Paystack customer creation failed:', details)
      return NextResponse.json(
        { error: 'Failed to create customer', details },
        { status: 500 }
      )
    }

    customerId = data.data.customer_code

    // Save the customer ID in the user's profile
    await supabase
      .from('profiles')
      .update({ paystack_customer_id: customerId })
      .eq('id', user.id)
  }

  // Create a new dedicated virtual account for the customer
  const response = await fetch(`${PAYSTACK_BASE_URL}/dedicated_account`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customer: customerId,
      preferred_bank: 'wema-bank'
    })
  })

  const data = await response.json()

  if (!response.ok) {
    const details = data?.message || data
    console.error('Paystack dedicated account creation failed:', details)
    return NextResponse.json(
      { error: 'Failed to create dedicated account', details },
      { status: 500 }
    )
  }

  const { account_number, account_name, bank } = data.data

  // Save the dedicated account details in the user's profile
  await supabase
    .from('profiles')
    .update({
      dedicated_account_number: account_number,
      dedicated_account_name: account_name,
      dedicated_bank: bank.name
    })
    .eq('id', user.id)

  return NextResponse.json({
    accountNumber: account_number,
    accountBank: bank.name,
    accountName: account_name
  })
}
