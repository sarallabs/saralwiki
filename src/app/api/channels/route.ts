export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { channels, memberships } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { APP_ROLES, canAccessChannel, getAccessUser, isAdminUser, mergeMentionAccess, serializeAccessList } from "@/lib/access";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const membership = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, session.user.id))
    .limit(1);

  if (!membership[0]) return NextResponse.json({ channels: [] });
  const workspaceId = membership[0].workspaceId;

  const allChannels = await db.select().from(channels).where(eq(channels.workspaceId, workspaceId)).orderBy(desc(channels.createdAt));
  const visibleChannels = await Promise.all(
    allChannels.map(async (channel) => {
      const access = await canAccessChannel(channel.id, userId);
      return access.channel ? channel : null;
    })
  );

  return NextResponse.json({ channels: visibleChannels.filter(Boolean) });
}

const createSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  isPrivate: z.boolean().default(false),
  allowedRoles: z.array(z.enum(APP_ROLES)).optional(),
  allowedUserIds: z.array(z.string().uuid()).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const membership = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, session.user.id))
    .limit(1);

  if (!membership[0]) return NextResponse.json({ error: "No workspace" }, { status: 400 });
  const caller = await getAccessUser(userId);
  if (!isAdminUser(caller) && !["owner", "admin"].includes(membership[0].role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const allowedUserIds = serializeAccessList(parsed.data.allowedUserIds);
  const mentionedAllowedUserIds = await mergeMentionAccess(allowedUserIds, [
    parsed.data.name,
    parsed.data.description,
  ]);

  const [channel] = await db.insert(channels).values({
    ...parsed.data,
    allowedRoles: serializeAccessList(parsed.data.allowedRoles),
    allowedUserIds: mentionedAllowedUserIds,
    workspaceId: membership[0].workspaceId,
    createdBy: userId,
    isDm: false,
  }).returning();

  return NextResponse.json({ channel }, { status: 201 });
}
