export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { channels } from "@/lib/schema";
import { APP_ROLES, canAccessChannel, getAccessUser, isAdminUser, mergeMentionAccess, serializeAccessList } from "@/lib/access";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  isPrivate: z.boolean().optional(),
  allowedRoles: z.array(z.enum(APP_ROLES)).optional(),
  allowedUserIds: z.array(z.string().uuid()).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { channelId } = await params;
  const { channel } = await canAccessChannel(channelId, session.user.id);
  if (!channel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ channel });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caller = await getAccessUser(session.user.id);
  if (!isAdminUser(caller)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { channelId } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [existing] = await db.select().from(channels).where(eq(channels.id, channelId)).limit(1);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { allowedRoles, allowedUserIds, ...rest } = parsed.data;
  const existingAllowedUserIds = allowedUserIds ? serializeAccessList(allowedUserIds) : existing.allowedUserIds;
  const mentionedAllowedUserIds = await mergeMentionAccess(existingAllowedUserIds, [
    parsed.data.name,
    parsed.data.description,
  ]);

  const [channel] = await db.update(channels).set({
    ...rest,
    ...(allowedRoles ? { allowedRoles: serializeAccessList(allowedRoles) } : {}),
    allowedUserIds: mentionedAllowedUserIds,
  }).where(eq(channels.id, channelId)).returning();

  return NextResponse.json({ channel });
}
