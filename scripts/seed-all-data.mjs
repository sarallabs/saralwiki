/**
 * Comprehensive seed script for all entities.
 * Creates users, workspaces, spaces, projects, issues, and more.
 * Usage: node scripts/seed-all-data.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local if present
const envPath = join(__dirname, "..", ".env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch (e) {
  // ignore
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment (.env.local)");
  process.exit(1);
}

let Client;
try {
  const pgModule = await import("pg");
  Client = pgModule.default?.Client ?? pgModule.Client;
} catch (err) {
  console.error("❌ pg not installed. Run: npm install");
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL });

try {
  await client.connect();
  console.log("✅ Connected to database\n");

  const { default: bcrypt } = await import("bcryptjs");

  // ─── Step 1: Create demo users ───────────────────────────────────────
  console.log("📝 Creating users...");
  const demoUsers = [
    {
      username: "admin",
      email: "admin@saralvidhya.com",
      password: "Admin@123",
      isGlobalAdmin: true,
      name: "Admin User",
    },
    {
      username: "rahul",
      email: "rahul@saralvidhya.com",
      password: "Rahul@123",
      isGlobalAdmin: false,
      name: "Rahul Kumar",
    },
    {
      username: "priya",
      email: "priya@saralvidhya.com",
      password: "Priya@123",
      isGlobalAdmin: false,
      name: "Priya Singh",
    },
    {
      username: "akshay",
      email: "akshay@sarallabs.com",
      password: "Akshay@123",
      isGlobalAdmin: false,
      name: "Akshay Patel",
    },
    {
      username: "neha",
      email: "neha@sarallabs.com",
      password: "Neha@123",
      isGlobalAdmin: false,
      name: "Neha Sharma",
    },
  ];

  const userIds = {};
  for (const u of demoUsers) {
    const hash = await bcrypt.hash(u.password, 12);
    const { rows: existing } = await client.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [u.email]
    );

    let userId;
    if (existing.length > 0) {
      userId = existing[0].id;
      await client.query(
        "UPDATE users SET password_hash = $1, status = $2, name = $3, updated_at = NOW() WHERE id = $4",
        [hash, "active", u.name, userId]
      );
      console.log(`  ✓ Updated: ${u.email}`);
    } else {
      const { rows: ins } = await client.query(
        `INSERT INTO users (id, email, name, password_hash, status, is_global_admin, email_verified, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW(), NOW()) RETURNING id`,
        [u.email, u.name, hash, "active", u.isGlobalAdmin]
      );
      userId = ins[0].id;
      console.log(`  ✓ Created: ${u.email}`);
    }
    userIds[u.username] = userId;
  }

  // ─── Step 2: Create workspaces ───────────────────────────────────────
  console.log("\n📝 Creating workspaces...");
  const workspaces = [
    { name: "Saral Vidhya", slug: "saral-vidhya" },
    { name: "Saral Labs", slug: "saral-labs" },
  ];

  const workspaceIds = {};
  for (const ws of workspaces) {
    const { rows: existing } = await client.query(
      "SELECT id FROM workspaces WHERE slug = $1 LIMIT 1",
      [ws.slug]
    );

    let wsId;
    if (existing.length > 0) {
      wsId = existing[0].id;
      console.log(`  ✓ Found: ${ws.name}`);
    } else {
      const { rows: ins } = await client.query(
        `INSERT INTO workspaces (id, name, slug, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, NOW(), NOW()) RETURNING id`,
        [ws.name, ws.slug]
      );
      wsId = ins[0].id;
      console.log(`  ✓ Created: ${ws.name}`);
    }
    workspaceIds[ws.slug] = wsId;
  }

  // ─── Step 3: Create memberships ──────────────────────────────────────
  console.log("\n📝 Creating memberships...");
  const memberships = [
    { username: "admin", workspace: "saral-vidhya", role: "owner" },
    { username: "rahul", workspace: "saral-vidhya", role: "member" },
    { username: "priya", workspace: "saral-vidhya", role: "member" },
    { username: "akshay", workspace: "saral-labs", role: "owner" },
    { username: "neha", workspace: "saral-labs", role: "member" },
  ];

  for (const m of memberships) {
    const userId = userIds[m.username];
    const workspaceId = workspaceIds[m.workspace];

    const { rows: existing } = await client.query(
      "SELECT id FROM memberships WHERE user_id = $1 AND workspace_id = $2 LIMIT 1",
      [userId, workspaceId]
    );

    if (existing.length === 0) {
      await client.query(
        `INSERT INTO memberships (id, user_id, workspace_id, role, joined_at)
         VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
        [userId, workspaceId, m.role]
      );
      console.log(`  ✓ Added ${m.username} to ${m.workspace} as ${m.role}`);
    }
  }

  // ─── Step 4: Create spaces ──────────────────────────────────────────
  console.log("\n📝 Creating spaces...");
  const spaces = [
    {
      name: "Documentation",
      slug: "documentation",
      workspace: "saral-vidhya",
      description: "Product and technical documentation",
      icon: "📚",
      color: "#3b82f6",
    },
    {
      name: "Engineering",
      slug: "engineering",
      workspace: "saral-vidhya",
      description: "Engineering team workspace",
      icon: "⚙️",
      color: "#8b5cf6",
    },
    {
      name: "Product",
      slug: "product",
      workspace: "saral-vidhya",
      description: "Product team collaboration",
      icon: "🚀",
      color: "#ec4899",
    },
    {
      name: "Labs Research",
      slug: "research",
      workspace: "saral-labs",
      description: "Research and experiments",
      icon: "🔬",
      color: "#06b6d4",
    },
    {
      name: "Ideas",
      slug: "ideas",
      workspace: "saral-labs",
      description: "Innovation and brainstorming",
      icon: "💡",
      color: "#f59e0b",
    },
  ];

  const spaceIds = {};
  for (const space of spaces) {
    const workspaceId = workspaceIds[space.workspace];
    const createdBy = userIds.admin;

    const { rows: existing } = await client.query(
      "SELECT id FROM spaces WHERE workspace_id = $1 AND slug = $2 LIMIT 1",
      [workspaceId, space.slug]
    );

    let spaceId;
    if (existing.length > 0) {
      spaceId = existing[0].id;
      console.log(`  ✓ Found: ${space.name}`);
    } else {
      const { rows: ins } = await client.query(
        `INSERT INTO spaces (id, workspace_id, name, slug, description, icon, color, created_by, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id`,
        [workspaceId, space.name, space.slug, space.description, space.icon, space.color, createdBy]
      );
      spaceId = ins[0].id;
      console.log(`  ✓ Created: ${space.name}`);
    }
    spaceIds[space.slug] = spaceId;
  }

  // ─── Step 5: Create space members ────────────────────────────────────
  console.log("\n📝 Creating space members...");
  const spaceMembers = [
    { space: "documentation", username: "admin", role: "admin" },
    { space: "documentation", username: "rahul", role: "editor" },
    { space: "engineering", username: "priya", role: "admin" },
    { space: "engineering", username: "rahul", role: "editor" },
    { space: "product", username: "admin", role: "admin" },
    { space: "research", username: "akshay", role: "admin" },
    { space: "research", username: "neha", role: "editor" },
    { space: "ideas", username: "neha", role: "admin" },
  ];

  for (const sm of spaceMembers) {
    const spaceId = spaceIds[sm.space];
    const userId = userIds[sm.username];

    const { rows: existing } = await client.query(
      "SELECT id FROM space_members WHERE space_id = $1 AND user_id = $2 LIMIT 1",
      [spaceId, userId]
    );

    if (existing.length === 0) {
      await client.query(
        `INSERT INTO space_members (id, space_id, user_id, role, joined_at)
         VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
        [spaceId, userId, sm.role]
      );
      console.log(`  ✓ Added ${sm.username} to ${sm.space} as ${sm.role}`);
    }
  }

  // ─── Step 6: Create projects ─────────────────────────────────────────
  console.log("\n📝 Creating projects...");
  const projects = [
    {
      name: "Portal Redesign",
      key: "PRD",
      workspace: "saral-vidhya",
      description: "Complete redesign of the user portal",
      owner: "admin",
      color: "#3b82f6",
    },
    {
      name: "Mobile App",
      key: "MOBILE",
      workspace: "saral-vidhya",
      description: "Native mobile application development",
      owner: "priya",
      color: "#8b5cf6",
    },
    {
      name: "API Refactor",
      key: "API",
      workspace: "saral-vidhya",
      description: "Modernize backend API architecture",
      owner: "rahul",
      color: "#06b6d4",
    },
    {
      name: "ML Pipeline",
      key: "ML",
      workspace: "saral-labs",
      description: "Machine learning data pipeline",
      owner: "akshay",
      color: "#f59e0b",
    },
    {
      name: "Cloud Migration",
      key: "CLOUD",
      workspace: "saral-labs",
      description: "Move infrastructure to cloud",
      owner: "neha",
      color: "#ec4899",
    },
  ];

  const projectIds = {};
  for (const proj of projects) {
    const workspaceId = workspaceIds[proj.workspace];
    const ownerId = userIds[proj.owner];

    const { rows: existing } = await client.query(
      "SELECT id FROM projects WHERE workspace_id = $1 AND key = $2 LIMIT 1",
      [workspaceId, proj.key]
    );

    let projectId;
    if (existing.length > 0) {
      projectId = existing[0].id;
      console.log(`  ✓ Found: ${proj.name}`);
    } else {
      const { rows: ins } = await client.query(
        `INSERT INTO projects (id, workspace_id, name, key, description, owner_id, cover_color, status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id`,
        [workspaceId, proj.name, proj.key, proj.description, ownerId, proj.color, "active"]
      );
      projectId = ins[0].id;
      console.log(`  ✓ Created: ${proj.name}`);
    }
    projectIds[proj.key] = projectId;
  }

  // ─── Step 7: Create project members ──────────────────────────────────
  console.log("\n📝 Creating project members...");
  const projectMembers = [
    { project: "PRD", username: "admin", role: "owner" },
    { project: "PRD", username: "rahul", role: "member" },
    { project: "MOBILE", username: "priya", role: "owner" },
    { project: "MOBILE", username: "admin", role: "member" },
    { project: "API", username: "rahul", role: "owner" },
    { project: "ML", username: "akshay", role: "owner" },
    { project: "ML", username: "neha", role: "member" },
    { project: "CLOUD", username: "neha", role: "owner" },
    { project: "CLOUD", username: "akshay", role: "member" },
  ];

  for (const pm of projectMembers) {
    const projectId = projectIds[pm.project];
    const userId = userIds[pm.username];

    const { rows: existing } = await client.query(
      "SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2 LIMIT 1",
      [projectId, userId]
    );

    if (existing.length === 0) {
      await client.query(
        `INSERT INTO project_members (id, project_id, user_id, role, joined_at)
         VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
        [projectId, userId, pm.role]
      );
      console.log(`  ✓ Added ${pm.username} to ${pm.project} as ${pm.role}`);
    }
  }

  // ─── Step 8: Create issues ──────────────────────────────────────────
  console.log("\n📝 Creating issues...");
  const issues = [
    {
      title: "Update landing page hero section",
      description: "Redesign the hero section with new branding colors",
      project: "PRD",
      type: "task",
      status: "in_progress",
      priority: "high",
      assignee: "rahul",
    },
    {
      title: "Fix responsive design on mobile",
      description: "Mobile view breaks on small screens",
      project: "PRD",
      type: "bug",
      status: "todo",
      priority: "urgent",
      assignee: "admin",
    },
    {
      title: "Implement user authentication",
      description: "Add NextAuth integration for secure login",
      project: "MOBILE",
      type: "story",
      status: "in_progress",
      priority: "high",
      assignee: "priya",
    },
    {
      title: "Create database schema",
      description: "Define tables and relationships",
      project: "MOBILE",
      type: "task",
      status: "done",
      priority: "medium",
      assignee: "admin",
    },
    {
      title: "Optimize API response times",
      description: "Reduce average response time below 200ms",
      project: "API",
      type: "epic",
      status: "in_progress",
      priority: "high",
      assignee: "rahul",
    },
    {
      title: "Add caching layer",
      description: "Implement Redis caching",
      project: "API",
      type: "task",
      status: "todo",
      priority: "medium",
      assignee: "rahul",
    },
    {
      title: "Build data preprocessing pipeline",
      description: "Create automated data cleaning and feature extraction",
      project: "ML",
      type: "epic",
      status: "todo",
      priority: "high",
      assignee: "akshay",
    },
    {
      title: "Evaluate model performance",
      description: "Run comprehensive benchmarks",
      project: "ML",
      type: "task",
      status: "in_review",
      priority: "medium",
      assignee: "neha",
    },
    {
      title: "Migrate database to cloud",
      description: "Move PostgreSQL to AWS RDS",
      project: "CLOUD",
      type: "epic",
      status: "todo",
      priority: "urgent",
      assignee: "neha",
    },
    {
      title: "Set up CI/CD pipeline",
      description: "Configure GitHub Actions for automated deployment",
      project: "CLOUD",
      type: "task",
      status: "in_progress",
      priority: "high",
      assignee: "akshay",
    },
  ];

  for (const issue of issues) {
    const projectId = projectIds[issue.project];
    const assigneeId = userIds[issue.assignee];

    const { rows: ins } = await client.query(
      `INSERT INTO issues (id, project_id, title, description, type, status, priority, assignee_id, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id`,
      [projectId, issue.title, issue.description, issue.type, issue.status, issue.priority, assigneeId]
    );
    console.log(`  ✓ Created: ${issue.title}`);
  }

  console.log("\n✅ Database seeded successfully!\n");
  console.log("📋 Summary:");
  console.log(`  - ${demoUsers.length} users`);
  console.log(`  - ${workspaces.length} workspaces`);
  console.log(`  - ${spaces.length} spaces`);
  console.log(`  - ${projects.length} projects`);
  console.log(`  - ${issues.length} issues`);
  console.log("\n🔐 Demo user credentials:");
  for (const u of demoUsers) {
    console.log(`  - ${u.email} / ${u.password}`);
  }
  console.log("\n🚀 Start the app with: npm run dev");
} catch (err) {
  console.error("❌ Seed error:", err.message);
  console.error(err);
  process.exit(1);
} finally {
  await client.end();
}
