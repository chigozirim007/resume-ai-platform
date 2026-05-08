import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  initializeTransaction,
  verifyTransaction,
  createCustomer,
  getSubscription,
  validateWebhookSignature,
} from "../lib/paystackClient";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * GET /api/paystack/subscription
 * Returns the current user's subscription status.
 */
router.get("/paystack/subscription", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id))
    .limit(1);

  if (!user?.paystackSubscriptionCode) {
    res.json({ subscription: null, plan: user?.plan ?? "free" });
    return;
  }

  try {
    const subscription = await getSubscription(user.paystackSubscriptionCode);
    res.json({ subscription, plan: user.plan });
  } catch (err) {
    // Subscription may have been cancelled; still return plan info
    res.json({ subscription: null, plan: user.plan });
  }
});

/**
 * POST /api/paystack/initialize
 * Creates a Paystack checkout session and returns the authorization URL.
 */
router.post("/paystack/initialize", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.plan === "pro") {
    res.status(400).json({ error: "Already on Pro plan" });
    return;
  }

  const planCode = process.env.PAYSTACK_PLAN_CODE;
  if (!planCode) {
    res.status(500).json({ error: "PAYSTACK_PLAN_CODE is not configured on the server." });
    return;
  }

  try {
    // Ensure the customer exists in Paystack
    let customerCode = user.paystackCustomerCode;
    if (!customerCode) {
      const customer = await createCustomer({
        email: user.email!,
        first_name: user.firstName ?? undefined,
        last_name: user.lastName ?? undefined,
      });
      customerCode = customer.customer_code;
      await db
        .update(usersTable)
        .set({ paystackCustomerCode: customerCode })
        .where(eq(usersTable.id, user.id));
    }

    const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 5173}`;
    const transaction = await initializeTransaction({
      email: user.email!,
      amount: 0, // Amount is 0 because the plan handles billing
      plan: planCode,
      callback_url: `${baseUrl}/checkout/success`,
      metadata: { userId: user.id },
    });

    res.json({ authorization_url: transaction.authorization_url, reference: transaction.reference });
  } catch (err: any) {
    logger.error({ err }, "Paystack initialize failed");
    res.status(500).json({ error: err.message || "Failed to initialize payment" });
  }
});

/**
 * GET /api/paystack/verify?reference=xxx
 * Verifies a transaction after the user returns from Paystack checkout.
 */
router.get("/paystack/verify", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { reference } = req.query as { reference?: string };
  if (!reference) {
    res.status(400).json({ error: "reference is required" });
    return;
  }

  try {
    const transaction = await verifyTransaction(reference);

    if (transaction.status === "success") {
      const subscriptionCode = transaction.subscription?.subscription_code ?? null;
      await db
        .update(usersTable)
        .set({
          plan: "pro",
          paystackSubscriptionCode: subscriptionCode,
        })
        .where(eq(usersTable.id, req.user.id));

      res.json({ success: true, plan: "pro" });
    } else {
      res.json({ success: false, status: transaction.status });
    }
  } catch (err: any) {
    logger.error({ err }, "Paystack verify failed");
    res.status(500).json({ error: err.message || "Verification failed" });
  }
});

/**
 * POST /api/paystack/webhook
 * Receives real-time events from Paystack (subscription renewals, cancellations).
 */
router.post("/paystack/webhook", async (req, res): Promise<void> => {
  const signature = req.headers["x-paystack-signature"] as string;
  const rawBody = JSON.stringify(req.body);

  if (!validateWebhookSignature(rawBody, signature)) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  const event = req.body as { event: string; data: Record<string, any> };
  logger.info({ event: event.event }, "Paystack webhook received");

  try {
    switch (event.event) {
      case "charge.success": {
        const metadata = event.data?.metadata as { userId?: string };
        const subscriptionCode = event.data?.subscription?.subscription_code as string | undefined;
        if (metadata?.userId) {
          await db
            .update(usersTable)
            .set({ plan: "pro", paystackSubscriptionCode: subscriptionCode ?? null })
            .where(eq(usersTable.id, metadata.userId));
          logger.info({ userId: metadata.userId }, "User upgraded to Pro via Paystack");
        }
        break;
      }

      case "subscription.disable":
      case "subscription.notrenew": {
        const subscriptionCode = event.data?.subscription_code as string;
        if (subscriptionCode) {
          const [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.paystackSubscriptionCode, subscriptionCode))
            .limit(1);
          if (user) {
            await db
              .update(usersTable)
              .set({ plan: "free", paystackSubscriptionCode: null })
              .where(eq(usersTable.id, user.id));
            logger.info({ userId: user.id }, "User downgraded to Free via Paystack webhook");
          }
        }
        break;
      }

      default:
        logger.info({ event: event.event }, "Unhandled Paystack webhook event");
    }
  } catch (err) {
    logger.error({ err }, "Error processing Paystack webhook");
  }

  // Always respond 200 to Paystack
  res.sendStatus(200);
});

export default router;
