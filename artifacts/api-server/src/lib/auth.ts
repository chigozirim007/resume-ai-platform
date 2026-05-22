import jwt from "jsonwebtoken";
import {
  createRemoteJWKSet,
  decodeProtectedHeader,
  jwtVerify,
  type JWTPayload,
} from "jose";
import { type Request } from "express";
import type { AuthUser } from "@workspace/api-zod";

export const SESSION_COOKIE = "sid";

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const SUPABASE_JWKS = SUPABASE_URL
  ? createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`))
  : null;

if (!JWT_SECRET && !SUPABASE_JWKS) {
  console.warn("Neither SUPABASE_JWT_SECRET nor SUPABASE_URL is set - auth will not work");
} else if (!SUPABASE_JWKS) {
  console.warn("SUPABASE_URL is not set - asymmetric Supabase JWT verification will be unavailable");
} else if (!JWT_SECRET) {
  console.warn("SUPABASE_JWT_SECRET is not set - legacy HS256 Supabase JWT verification will be unavailable");
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

function toSupabaseJwtPayload(payload: JWTPayload): SupabaseJwtPayload | null {
  if (typeof payload.sub !== "string") {
    return null;
  }

  return {
    sub: payload.sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
    user_metadata:
      payload.user_metadata && typeof payload.user_metadata === "object"
        ? (payload.user_metadata as SupabaseJwtPayload["user_metadata"])
        : undefined,
    aud: Array.isArray(payload.aud) ? payload.aud[0] ?? "" : payload.aud ?? "",
    exp: payload.exp ?? 0,
    iat: payload.iat ?? 0,
  };
}

function verifyLegacySupabaseToken(token: string): SupabaseJwtPayload | null {
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

async function verifyJwksSupabaseToken(token: string): Promise<SupabaseJwtPayload | null> {
  if (!SUPABASE_JWKS) return null;

  try {
    const { payload } = await jwtVerify(token, SUPABASE_JWKS, {
      algorithms: ["ES256", "RS256"],
    });
    return toSupabaseJwtPayload(payload);
  } catch {
    return null;
  }
}

export async function verifySupabaseToken(token: string): Promise<SupabaseJwtPayload | null> {
  let header: ReturnType<typeof decodeProtectedHeader>;
  try {
    header = decodeProtectedHeader(token);
  } catch {
    return null;
  }

  if (header.alg && header.alg !== "HS256") {
    const jwksPayload = await verifyJwksSupabaseToken(token);
    if (jwksPayload) return jwksPayload;
  }

  const legacyPayload = verifyLegacySupabaseToken(token);
  if (legacyPayload) return legacyPayload;

  return verifyJwksSupabaseToken(token);
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
