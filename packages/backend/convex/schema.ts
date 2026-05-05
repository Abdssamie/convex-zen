import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const tables = {
  emailEvents: defineTable({
    event: v.string(),
    email: v.string(),
    messageId: v.string(),
    ts: v.number(),
    subject: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    link: v.optional(v.string()),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    payload: v.any(),
  })
    .index("by_email", ["email"])
    .index("by_messageId", ["messageId"])
    .index("by_event", ["event"])
    .index("by_ts", ["ts"]),
  users: defineTable({
    authId: v.string(),
    name: v.string(),
    email: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_authId", ["authId"])
    .index("by_email", ["email"]),
};

export default defineSchema(tables);
