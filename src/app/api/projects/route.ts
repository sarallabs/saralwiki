export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, memberships, projectMembers, users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { APP_ROLES, canAccessProject, getAccessUser, isAdminUser, mergeMentionAccess, serializeAccessList } from "@/lib/access";

// GET /api/projects — list projects for user's workspace
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get workspace from membership
  const membership = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, session.user.id))
    .limit(1);

  if (!membership[0]) {
    return NextResponse.json({ projects: [] });
  }

  const workspaceId = membership[0].workspaceId;

  const allProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      key: projects.key,
      description: projects.description,
      status: projects.status,
      coverColor: projects.coverColor,
      allowedRoles: projects.allowedRoles,
      allowedUserIds: projects.allowedUserIds,
      createdAt: projects.createdAt,
      ownerName: users.name,
      ownerEmail: users.email,
      ownerAvatar: users.avatarUrl,
    })
    .from(projects)
    .leftJoin(users, eq(projects.ownerId, users.id))
    .where(eq(projects.workspaceId, workspaceId))
    .orderBy(desc(projects.createdAt));

  const visible = await Promise.all(allProjects.map(async (project) => {
    const access = await canAccessProject(project.id, session.user!.id!);
    return access.project ? project : null;
  }));

  return NextResponse.json({ projects: visible.filter(Boolean) });
}

// POST /api/projects — create a new project
const createSchema = z.object({
  name: z.string().min(1).max(100),
  key: z
    .string()
    .min(2)
    .max(6)
    .toUpperCase()
    .regex(/^[A-Z]+$/, "Key must be uppercase letters only"),
  description: z.string().max(500).optional(),
  coverColor: z.string().optional(),
  allowedRoles: z.array(z.enum(APP_ROLES)).optional(),
  allowedUserIds: z.array(z.string().uuid()).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, session.user.id))
    .limit(1);

  if (!membership[0]) {
    return NextResponse.json({ error: "No workspace found" }, { status: 400 });
  }
  const caller = await getAccessUser(session.user.id);
  if (!isAdminUser(caller) && !["owner", "admin"].includes(membership[0].role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const workspaceId = membership[0].workspaceId;

  const explicitUserIds = serializeAccessList(parsed.data.allowedUserIds);
  const mentionedIds = await mergeMentionAccess(explicitUserIds, [parsed.data.name, parsed.data.description]);

  const [project] = await db
    .insert(projects)
    .values({
      ...parsed.data,
      allowedRoles: serializeAccessList(parsed.data.allowedRoles),
      allowedUserIds: mentionedIds,
      workspaceId,
      ownerId: session.user.id,
    })
    .returning();

  // Add creator as project admin
  await db.insert(projectMembers).values({
    projectId: project.id,
    userId: session.user.id,
    role: "admin",
  });

  return NextResponse.json({ project }, { status: 201 });
}

