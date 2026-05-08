import { Router, type IRouter, type Request, type Response } from "express";
import { GetCurrentAuthUserResponse } from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

// Zod schema for the auth/sync endpoint
const SyncUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  profileImageUrl: z.string().url().nullable().optional(),
});

// Endpoint called by frontend after Supabase login/signup
router.post("/auth/sync", async (req: Request, res: Response) => {
  // Wait, the user might not be fully authenticated in middleware yet if they just signed up,
  // but they will send the JWT. So authMiddleware will run.
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = SyncUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userData = parsed.data;

  // Ensure the user syncing matches the authenticated JWT
  if (req.user.id !== userData.id) {
    res.status(403).json({ error: "User ID mismatch" });
    return;
  }

  try {
    const [user] = await db
      .insert(usersTable)
      .values({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
      })
      .onConflictDoUpdate({
        target: usersTable.id,
        set: {
          email: userData.email,
          firstName: userData.firstName || null,
          lastName: userData.lastName || null,
          profileImageUrl: userData.profileImageUrl || null,
          updatedAt: new Date(),
        },
      })
      .returning();

    res.json({ success: true, user });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Error syncing user:", msg);
    res.status(500).json({ error: "Failed to sync user" });
  }
});

router.get("/auth/user", async (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    try {
      // Automatically sync user to local DB to prevent foreign key errors
      // especially for Google OAuth users who bypass the manual sync endpoint
      const [dbUser] = await db
        .insert(usersTable)
        .values({
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.firstName || null,
          lastName: req.user.lastName || null,
          profileImageUrl: req.user.profileImageUrl || null,
        })
        .onConflictDoUpdate({
          target: usersTable.id,
          set: {
            email: req.user.email,
            firstName: req.user.firstName || null,
            lastName: req.user.lastName || null,
            profileImageUrl: req.user.profileImageUrl || null,
            updatedAt: new Date(),
          },
        })
        .returning();

      req.user = {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        profileImageUrl: dbUser.profileImageUrl,
      };
    } catch (err) {
      console.error("Auto-sync failed in /auth/user:", err);
    }
  }

  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

export default router;
