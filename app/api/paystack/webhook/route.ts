import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'
import crypto from 'crypto'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!

function verifyPaystackSignature (payload: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET)
    .update(payload)
    .digest('hex')
  return hash === signature
}

export async function POST (request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    if (!signature || !verifyPaystackSignature(payload, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(payload)
    const supabase = getSupabaseServerClient()

    // Handle transfer.success event for dedicated accounts
    if (event.event === 'transfer.success') {
      const { data } = event
      const { reference, amount, recipient } = data

      // Find the user by account number
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('account_number', recipient.details.account_number)
        .single()

      if (profileError || !profile) {
        console.error(
          'Profile not found for account number:',
          recipient.details.account_number
        )
        return NextResponse.json({ status: 'ignored' })
      }

      // Check if deposit already exists
      const { data: existingDeposit } = await supabase
        .from('deposits')
        .select('id')
        .eq('reference', reference)
        .single()

      if (existingDeposit) {
        return NextResponse.json({ status: 'already_processed' })
      }

      // Create deposit record
      const { error: insertError } = await supabase.from('deposits').insert({
        user_id: profile.id,
        amount: amount / 100, // Convert from kobo to naira
        reference: reference,
        status: 'successful',
        paystack_data: data
      })

      if (insertError) {
        console.error('Failed to create deposit:', insertError)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      // Update user funds
      const depositAmount = amount / 100

      // Get current funds
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('funds')
        .eq('id', profile.id)
        .single()

      if (fetchError || !currentProfile) {
        console.error('Failed to fetch current funds:', fetchError)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      const newFunds = (currentProfile.funds || 0) + depositAmount

      const { error: updateFundsError } = await supabase
        .from('profiles')
        .update({ funds: newFunds })
        .eq('id', profile.id)

      if (updateFundsError) {
        console.error('Failed to update funds:', updateFundsError)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      console.log(
        `Deposit processed: ₦${amount / 100} added to user ${profile.id}`
      )
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
