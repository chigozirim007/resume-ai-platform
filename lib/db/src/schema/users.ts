import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";

// This table is used to store user data and sync with Supabase Auth
export const usersTable = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"),
  plan: text("plan").notNull().default("free"),
  usageCount: integer("usage_count").notNull().default(0),
  paystackCustomerCode: varchar("paystack_customer_code"),
  paystackSubscriptionCode: varchar("paystack_subscription_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type UpsertUser = typeof usersTable.$inferInsert;
export type User = typeof usersTable.$inferSelect;
