import { type Request, type Response, type NextFunction } from "express";
import type { AuthUser } from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  getTokenFromRequest,
  verifySupabaseToken,
  jwtPayloadToAuthUser,
} from "../lib/auth";
import { logger } from "../lib/logger";

declare global {
  namespace Express {
    interface User extends AuthUser {}

    interface Request {
      isAuthenticated(): this is AuthedRequest;
      user?: User | undefined;
    }

    export interface AuthedRequest {
      user: User;
    }
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  req.isAuthenticated = function (this: Request) {
    return this.user != null;
  } as Request["isAuthenticated"];

  const token = getTokenFromRequest(req);
  if (!token) {
    next();
    return;
  }

  const payload = await verifySupabaseToken(token);
  if (!payload) {
    next();
    return;
  }

  // Build user from JWT claims
  const authUser = jwtPayloadToAuthUser(payload);

  // Try to find user in our DB; if they exist, use DB data (has plan, usage, etc.)
  try {
    const [dbUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, authUser.id))
      .limit(1);

    if (dbUser) {
      req.user = {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        profileImageUrl: dbUser.profileImageUrl,
      };
    } else {
      try {
        const [newUser] = await db
          .insert(usersTable)
          .values({
            id: authUser.id,
            email: authUser.email,
            firstName: authUser.firstName,
            lastName: authUser.lastName,
            profileImageUrl: authUser.profileImageUrl,
          })
          .onConflictDoUpdate({
            target: usersTable.id,
            set: {
              email: authUser.email,
              firstName: authUser.firstName,
              lastName: authUser.lastName,
              profileImageUrl: authUser.profileImageUrl,
              updatedAt: new Date(),
            },
          })
          .returning();
        
        req.user = newUser ? {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          profileImageUrl: newUser.profileImageUrl,
        } : authUser;
        logger.info({ userId: authUser.id }, "User proactively synchronized in authMiddleware");
      } catch (err) {
        logger.error({ userId: authUser.id, err }, "Proactive sync failed in authMiddleware");
        req.user = authUser;
      }
    }
  } catch (err) {
    console.error("DB lookup failed in authMiddleware:", err);
    req.user = authUser;
  }

  next();
}
