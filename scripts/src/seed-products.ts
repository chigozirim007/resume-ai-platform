import { getUncachableStripeClient } from './stripeClient';

async function createProducts() {
  try {
    const stripe = await getUncachableStripeClient();

    console.log('Checking for existing Pro Plan product...');
    const existing = await stripe.products.search({
      query: "name:'Pro Plan' AND active:'true'",
    });

    if (existing.data.length > 0) {
      console.log('Pro Plan already exists — skipping creation.');
      const product = existing.data[0];
      console.log(`Product ID: ${product.id}`);
      const prices = await stripe.prices.list({ product: product.id, active: true });
      for (const p of prices.data) {
        console.log(`Price ID: ${p.id}  amount: $${(p.unit_amount ?? 0) / 100}/${(p.recurring?.interval ?? 'one-time')}`);
      }
      return;
    }

    console.log('Creating Pro Plan product...');
    const product = await stripe.products.create({
      name: 'Pro Plan',
      description: 'Unlimited AI resume analyses, unlimited resume storage, priority processing.',
    });
    console.log(`Created product: ${product.name} (${product.id})`);

    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 900,
      currency: 'usd',
      recurring: { interval: 'month' },
    });
    console.log(`Created monthly price: $9.00/month (${monthlyPrice.id})`);

    console.log('\nDone! Webhooks will sync this data to the database automatically.');
    console.log(`\nMonthly price ID: ${monthlyPrice.id}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error creating products:', msg);
    process.exit(1);
  }
}

createProducts();
