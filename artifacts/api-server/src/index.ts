import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["API_PORT"] || "5000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  if (!process.env.PAYSTACK_SECRET_KEY) {
    logger.warn("PAYSTACK_SECRET_KEY is not set — payments will be unavailable until configured.");
  }
  if (!process.env.PAYSTACK_PLAN_CODE) {
    logger.warn("PAYSTACK_PLAN_CODE is not set — subscription upgrades will fail until configured.");
  }
});
