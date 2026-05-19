export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { APP_ROLES, canAccessProject, mergeMentionAccess, serializeAccessList } from "@/lib/access";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  key: z.string().min(2).max(6).toUpperCase().regex(/^[A-Z]+$/).optional(),
  description: z.string().max(500).nullable().optional(),
  status: z.enum(["active", "archived", "completed"]).optional(),
  coverColor: z.string().optional(),
  allowedRoles: z.array(z.enum(APP_ROLES)).optional(),
  allowedUserIds: z.array(z.string().uuid()).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const access = await canAccessProject(id, session.user.id);
  if (!access.project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ project: access.project, canEdit: access.canEdit });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const access = await canAccessProject(id, session.user.id);
  if (!access.project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!access.canEdit) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { allowedRoles, allowedUserIds, ...rest } = parsed.data;
  const explicitUserIds = allowedUserIds ? serializeAccessList(allowedUserIds) : access.project.allowedUserIds;
  const mentionedUserIds = await mergeMentionAccess(explicitUserIds, [rest.name, rest.description]);

  const [project] = await db.update(projects).set({
    ...rest,
    ...(allowedRoles ? { allowedRoles: serializeAccessList(allowedRoles) } : {}),
    allowedUserIds: mentionedUserIds,
    updatedAt: new Date(),
  }).where(eq(projects.id, id)).returning();

  return NextResponse.json({ project });
}
