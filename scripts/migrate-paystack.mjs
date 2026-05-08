import pg from "pg";

const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await client.connect();
  console.log("Connected to database.");

  // Drop old Stripe columns if they exist, add new Paystack columns
  await client.query(`
    DO $$
    BEGIN
      -- Drop stripe columns if they exist
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='stripe_customer_id') THEN
        ALTER TABLE users DROP COLUMN stripe_customer_id;
        RAISE NOTICE 'Dropped stripe_customer_id';
      END IF;

      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='stripe_subscription_id') THEN
        ALTER TABLE users DROP COLUMN stripe_subscription_id;
        RAISE NOTICE 'Dropped stripe_subscription_id';
      END IF;

      -- Add paystack columns if they don't exist
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='paystack_customer_code') THEN
        ALTER TABLE users ADD COLUMN paystack_customer_code VARCHAR;
        RAISE NOTICE 'Added paystack_customer_code';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='paystack_subscription_code') THEN
        ALTER TABLE users ADD COLUMN paystack_subscription_code VARCHAR;
        RAISE NOTICE 'Added paystack_subscription_code';
      END IF;
    END $$;
  `);

  console.log("Migration complete.");
  await client.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
