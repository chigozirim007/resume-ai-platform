import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Get user profile/settings
router.get("/user/settings", async (req, res): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user);
  } catch (err) {
    logger.error({ err, userId }, "Failed to fetch user settings");
    res.status(500).json({ error: "Failed to fetch user settings" });
  }
});

// Update user settings (e.g. first name, last name)
router.patch("/user/settings", async (req, res): Promise<void> => {
  const userId = req.user?.id;
  const { firstName, lastName } = req.body;

  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const [updatedUser] = await db
      .update(usersTable)
      .set({
        firstName,
        lastName,
      })
      .where(eq(usersTable.id, userId))
      .returning();

    res.json(updatedUser);
  } catch (err) {
    logger.error({ err, userId }, "Failed to update user settings");
    res.status(500).json({ error: "Failed to update user settings" });
  }
});

export default router;
