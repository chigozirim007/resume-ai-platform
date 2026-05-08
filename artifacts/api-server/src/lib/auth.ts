import jwt from "jsonwebtoken";
import { type Request } from "express";
import type { AuthUser } from "@workspace/api-zod";

export const SESSION_COOKIE = "sid";

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

if (!JWT_SECRET) {
  console.warn("SUPABASE_JWT_SECRET not set — auth will not work");
}

export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    avatar_url?: string;
  };
  aud: string;
  exp: number;
  iat: number;
}

export function getTokenFromRequest(req: Request): string | undefined {
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return undefined;
}

export function verifySupabaseToken(token: string): SupabaseJwtPayload | null {
  if (!JWT_SECRET) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    }) as SupabaseJwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function jwtPayloadToAuthUser(payload: SupabaseJwtPayload): AuthUser {
  const meta = payload.user_metadata || {};
  let firstName = meta.first_name || null;
  let lastName = meta.last_name || null;

  // If no first/last name, try to split full_name
  if (!firstName && meta.full_name) {
    const parts = meta.full_name.split(" ");
    firstName = parts[0] || null;
    lastName = parts.slice(1).join(" ") || null;
  }

  return {
    id: payload.sub,
    email: payload.email || null,
    firstName,
    lastName,
    profileImageUrl: meta.avatar_url || null,
  };
}
