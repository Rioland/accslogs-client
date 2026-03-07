/* eslint-disable @typescript-eslint/no-explicit-any */

import supabaseClient from './supabaseClient'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!
const PAYSTACK_BASE_URL =
  process.env.NEXT_PUBLIC_PAYSTACK_BASE_URL
 ?? 'https://api.paystack.co'

export type PaystackDedicatedAccount = {
  accountNumber: string
  accountBank: string
  accountName: string
}

export async function generatePaystackDedicatedAccount (
  id: string
): Promise<PaystackDedicatedAccount> {
  'use client'

  const { data: profile, error: profileError } = await supabaseClient

    .from('profiles')
    .select(
      'paystack_customer_id, dedicated_account_number, email, first_name, last_name, dedicated_account_name, dedicated_bank, account_number, account_bank, account_name'
    )
    .eq('id', id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  // Prefer the existing saved account number, regardless of which column it comes from.
  const existingAccountNumber =
    profile.dedicated_account_number || (profile as any).account_number
  const existingAccountBank =
    profile.dedicated_bank || (profile as any).account_bank
  const existingAccountName =
    profile.dedicated_account_name || (profile as any).account_name

  if (existingAccountNumber) {
    return {
      accountNumber: existingAccountNumber,
      accountBank: existingAccountBank,
      accountName: existingAccountName
    }
  }

  let customerId = profile.paystack_customer_id
console.log(PAYSTACK_SECRET_KEY, PAYSTACK_BASE_URL)
  if (!customerId) {
    const response = await fetch(`${PAYSTACK_BASE_URL}/customer`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY || "sk_test_607a708e8c579fe41abce93305b8b666d16f3cd7"}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: profile.email,
        first_name: profile.first_name,
         "type": "nuban",
        last_name: profile.last_name
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error('Failed to create customer')
    }

    customerId = data.data.customer_code

    await supabaseClient

      .from('profiles')
      .update({ paystack_customer_id: customerId })
      .eq('id', id)
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/dedicated_account`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY || "sk_test_607a708e8c579fe41abce93305b8b666d16f3cd7"}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customer: customerId,
      preferred_bank: 'test-bank'
    })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error('Failed to create dedicated account')
  }

  const { account_number, account_name, bank } = data.data

  await supabaseClient

    .from('profiles')
    .update({
      paystack_customer_id: customerId,
      dedicated_account_number: account_number,
      dedicated_account_name: account_name,
      dedicated_bank: bank.name,
      account_number: account_number,
      account_name: account_name,
      account_bank: bank.name
    })
    .eq('id', id)

  return {
    accountNumber: account_number,
    accountBank: bank.name,
    accountName: account_name
  }
}
