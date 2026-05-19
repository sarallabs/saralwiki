export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { issues, users, notifications } from "@/lib/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { APP_ROLES, canAccessIssue, canAccessProject, mergeMentionAccess, serializeAccessList } from "@/lib/access";

// GET /api/issues?projectId=xxx
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const status = url.searchParams.get("status");
  const assigneeId = url.searchParams.get("assigneeId");

  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });
  const projectAccess = await canAccessProject(projectId, session.user.id);
  if (!projectAccess.project) return NextResponse.json({ issues: [] });

  const query = db
    .select({
      id: issues.id,
      title: issues.title,
      description: issues.description,
      type: issues.type,
      status: issues.status,
      priority: issues.priority,
      sortOrder: issues.sortOrder,
      dueDate: issues.dueDate,
      createdAt: issues.createdAt,
      updatedAt: issues.updatedAt,
      assigneeId: issues.assigneeId,
      reporterId: issues.reporterId,
      parentId: issues.parentId,
      allowedRoles: issues.allowedRoles,
      allowedUserIds: issues.allowedUserIds,
      assigneeName: users.name,
      assigneeEmail: users.email,
      assigneeImage: users.image,
    })
    .from(issues)
    .leftJoin(users, eq(issues.assigneeId, users.id))
    .where(eq(issues.projectId, projectId))
    .orderBy(asc(issues.sortOrder), desc(issues.createdAt));

  const rows = await query;
  const accessibleRows = await Promise.all(rows.map(async (issue) => {
    const access = await canAccessIssue(issue.id, session.user!.id!);
    return access.issue ? issue : null;
  }));
  const presentRows = accessibleRows.filter((i): i is NonNullable<typeof i> => Boolean(i));
  const filtered = presentRows.filter((i) => {
    if (status && i.status !== status) return false;
    if (assigneeId && i.assigneeId !== assigneeId) return false;
    return true;
  });

  return NextResponse.json({ issues: filtered });
}

const createSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(["task", "bug", "story", "epic"]).default("task"),
  status: z.enum(["backlog", "todo", "in_progress", "in_review", "done", "cancelled"]).default("backlog"),
  priority: z.enum(["urgent", "high", "medium", "low", "none"]).default("medium"),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  allowedRoles: z.array(z.enum(APP_ROLES)).optional(),
  allowedUserIds: z.array(z.string().uuid()).optional(),
});

// POST /api/issues
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { projectId, dueDate, ...rest } = parsed.data;
  const projectAccess = await canAccessProject(projectId, session.user.id);
  if (!projectAccess.project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (!projectAccess.canEdit) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  // Get max sort order for column
  const existing = await db
    .select({ sortOrder: issues.sortOrder })
    .from(issues)
    .where(and(eq(issues.projectId, projectId), eq(issues.status, rest.status)));
  const maxOrder = existing.reduce((m, i) => Math.max(m, i.sortOrder ?? 0), 0);

  const [issue] = await db.insert(issues).values({
    ...rest,
    allowedRoles: serializeAccessList(parsed.data.allowedRoles),
    allowedUserIds: await mergeMentionAccess(
      serializeAccessList([...(parsed.data.allowedUserIds ?? []), ...(rest.assigneeId ? [rest.assigneeId] : [])]),
      [rest.title, rest.description]
    ),
    projectId,
    reporterId: session.user.id,
    dueDate: dueDate ? new Date(dueDate) : null,
    sortOrder: maxOrder + 1000,
  }).returning();

  // Notify assignee if assigned
  if (issue.assigneeId && issue.assigneeId !== session.user.id) {
    await db.insert(notifications).values({
      userId: issue.assigneeId,
      type: "issue_assigned",
      entityType: "issue",
      entityId: issue.id,
      title: "You were assigned an issue",
      body: issue.title,
    });
  }

  return NextResponse.json({ issue }, { status: 201 });
}
