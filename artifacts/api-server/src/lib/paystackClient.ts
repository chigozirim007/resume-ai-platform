/**
 * Paystack API Client
 * Uses the Paystack REST API directly via native fetch.
 * Docs: https://paystack.com/docs/api/
 */

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error(
      'Missing PAYSTACK_SECRET_KEY environment variable. ' +
      'Add it to your .env file. Get it from https://dashboard.paystack.com/#/settings/developers'
    );
  }
  return key;
}

const BASE_URL = 'https://api.paystack.co';

async function paystackRequest<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = (await res.json()) as { status: boolean; message: string; data: T };
  if (!json.status) {
    throw new Error(`Paystack API error: ${json.message}`);
  }
  return json.data;
}

/** Initialize a one-time or subscription transaction */
export async function initializeTransaction(params: {
  email: string;
  amount: number; // in kobo (NGN) or smallest currency unit
  plan?: string;  // Paystack plan code for subscriptions
  callback_url?: string;
  metadata?: Record<string, unknown>;
}) {
  return paystackRequest<{ authorization_url: string; access_code: string; reference: string }>(
    'POST',
    '/transaction/initialize',
    params
  );
}

/** Verify a transaction by reference */
export async function verifyTransaction(reference: string) {
  return paystackRequest<{
    status: string;
    reference: string;
    amount: number;
    customer: { email: string; customer_code: string };
    subscription?: { subscription_code: string };
    plan?: { plan_code: string };
  }>('GET', `/transaction/verify/${reference}`);
}

/** Create or fetch a Paystack customer */
export async function createCustomer(params: { email: string; first_name?: string; last_name?: string }) {
  return paystackRequest<{ customer_code: string; id: number }>('POST', '/customer', params);
}

/** Fetch a subscription by code */
export async function getSubscription(subscriptionCode: string) {
  return paystackRequest<{
    status: string;
    subscription_code: string;
    amount: number;
    plan: { plan_code: string; name: string };
    next_payment_date: string;
  }>('GET', `/subscription/${subscriptionCode}`);
}

/** Validate webhook signature from Paystack */
import crypto from 'crypto';
export function validateWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;
  const hash = crypto.createHmac('sha512', secret).update(payload).digest('hex');
  return hash === signature;
}
