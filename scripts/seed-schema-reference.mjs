/**
 * Seed data schema and examples for reference.
 * Shows complete entity structures for manual database seeding or use with a local/accessible database.
 * 
 * ⚠️  Database Connection Issue:
 *   The configured DATABASE_URL points to an unreachable Supabase instance.
 *   Before running this seed script, ensure:
 *   1. A PostgreSQL database is running and accessible
 *   2. DATABASE_URL in .env.local points to a valid connection string
 *   3. Drizzle migrations have been applied: npm run db:push
 *
 * Usage:
 *   node scripts/seed-schema-reference.mjs
 */

// ─── Complete Entity Schema Reference ─────────────────────────────────────

export const SEED_SCHEMA = {
  // ─── Users with demo credentials ───────────────────────────────────────
  users: [
    {
      email: "admin@saralvidhya.com",
      name: "Admin User",
      password: "Admin@123", // Will be hashed
      status: "active",
      isGlobalAdmin: true,
      appRole: "lead",
      emailVerified: true,
    },
    {
      email: "rahul@saralvidhya.com",
      name: "Rahul Kumar",
      password: "Rahul@123",
      status: "active",
      isGlobalAdmin: false,
      appRole: "intern",
      emailVerified: true,
    },
    {
      email: "priya@saralvidhya.com",
      name: "Priya Singh",
      password: "Priya@123",
      status: "active",
      isGlobalAdmin: false,
      appRole: "intern",
      emailVerified: true,
    },
    {
      email: "akshay@sarallabs.com",
      name: "Akshay Patel",
      password: "Akshay@123",
      status: "active",
      isGlobalAdmin: false,
      appRole: "lead",
      emailVerified: true,
    },
    {
      email: "neha@sarallabs.com",
      name: "Neha Sharma",
      password: "Neha@123",
      status: "active",
      isGlobalAdmin: false,
      appRole: "intern",
      emailVerified: true,
    },
  ],

  // ─── Workspaces ───────────────────────────────────────────────────────
  workspaces: [
    {
      name: "Saral Vidhya",
      slug: "saral-vidhya",
      logoUrl: null,
    },
    {
      name: "Saral Labs",
      slug: "saral-labs",
      logoUrl: null,
    },
  ],

  // ─── Spaces (documentation, knowledge bases, etc.) ─────────────────────
  spaces: [
    {
      workspaceSlug: "saral-vidhya",
      name: "Documentation",
      slug: "documentation",
      description: "Product and technical documentation",
      icon: "📚",
      color: "#3b82f6",
      isPrivate: false,
    },
    {
      workspaceSlug: "saral-vidhya",
      name: "Engineering",
      slug: "engineering",
      description: "Engineering team workspace",
      icon: "⚙️",
      color: "#8b5cf6",
      isPrivate: false,
    },
    {
      workspaceSlug: "saral-vidhya",
      name: "Product",
      slug: "product",
      description: "Product team collaboration",
      icon: "🚀",
      color: "#ec4899",
      isPrivate: false,
    },
    {
      workspaceSlug: "saral-labs",
      name: "Labs Research",
      slug: "research",
      description: "Research and experiments",
      icon: "🔬",
      color: "#06b6d4",
      isPrivate: false,
    },
    {
      workspaceSlug: "saral-labs",
      name: "Ideas",
      slug: "ideas",
      description: "Innovation and brainstorming",
      icon: "💡",
      color: "#f59e0b",
      isPrivate: false,
    },
  ],

  // ─── Projects ───────────────────────────────────────────────────────
  projects: [
    {
      workspaceSlug: "saral-vidhya",
      name: "Portal Redesign",
      key: "PRD",
      description: "Complete redesign of the user portal with modern UI/UX",
      status: "active",
      ownerEmail: "admin@saralvidhya.com",
      coverColor: "#3b82f6",
    },
    {
      workspaceSlug: "saral-vidhya",
      name: "Mobile App",
      key: "MOBILE",
      description: "Native mobile application for iOS and Android",
      status: "active",
      ownerEmail: "priya@saralvidhya.com",
      coverColor: "#8b5cf6",
    },
    {
      workspaceSlug: "saral-vidhya",
      name: "API Refactor",
      key: "API",
      description: "Modernize backend API architecture and performance",
      status: "active",
      ownerEmail: "rahul@saralvidhya.com",
      coverColor: "#06b6d4",
    },
    {
      workspaceSlug: "saral-labs",
      name: "ML Pipeline",
      key: "ML",
      description: "Machine learning data pipeline and model training",
      status: "active",
      ownerEmail: "akshay@sarallabs.com",
      coverColor: "#f59e0b",
    },
    {
      workspaceSlug: "saral-labs",
      name: "Cloud Migration",
      key: "CLOUD",
      description: "Migrate infrastructure to cloud with improved scalability",
      status: "active",
      ownerEmail: "neha@sarallabs.com",
      coverColor: "#ec4899",
    },
  ],

  // ─── Issues (tasks, bugs, stories, epics) ──────────────────────────────
  issues: [
    {
      projectKey: "PRD",
      title: "Update landing page hero section",
      description: "Redesign the hero section with new branding colors and messaging",
      type: "task",
      status: "in_progress",
      priority: "high",
      assigneeEmail: "rahul@saralvidhya.com",
    },
    {
      projectKey: "PRD",
      title: "Fix responsive design on mobile",
      description: "Mobile view breaks on screens smaller than 375px",
      type: "bug",
      status: "todo",
      priority: "urgent",
      assigneeEmail: "admin@saralvidhya.com",
    },
    {
      projectKey: "MOBILE",
      title: "Implement user authentication",
      description: "Add secure login flow with biometric support",
      type: "story",
      status: "in_progress",
      priority: "high",
      assigneeEmail: "priya@saralvidhya.com",
    },
    {
      projectKey: "MOBILE",
      title: "Create database schema",
      description: "Define tables, relationships, and indexes for mobile app",
      type: "task",
      status: "done",
      priority: "medium",
      assigneeEmail: "admin@saralvidhya.com",
    },
    {
      projectKey: "API",
      title: "Optimize API response times",
      description: "Reduce average response time below 200ms through various optimizations",
      type: "epic",
      status: "in_progress",
      priority: "high",
      assigneeEmail: "rahul@saralvidhya.com",
    },
    {
      projectKey: "API",
      title: "Add caching layer",
      description: "Implement Redis caching for frequently accessed endpoints",
      type: "task",
      status: "todo",
      priority: "medium",
      assigneeEmail: "rahul@saralvidhya.com",
    },
    {
      projectKey: "ML",
      title: "Build data preprocessing pipeline",
      description: "Create automated data cleaning and feature extraction workflow",
      type: "epic",
      status: "todo",
      priority: "high",
      assigneeEmail: "akshay@sarallabs.com",
    },
    {
      projectKey: "ML",
      title: "Evaluate model performance",
      description: "Run comprehensive benchmarks against test data",
      type: "task",
      status: "in_review",
      priority: "medium",
      assigneeEmail: "neha@sarallabs.com",
    },
    {
      projectKey: "CLOUD",
      title: "Migrate database to cloud",
      description: "Move PostgreSQL to AWS RDS with automated backups",
      type: "epic",
      status: "todo",
      priority: "urgent",
      assigneeEmail: "neha@sarallabs.com",
    },
    {
      projectKey: "CLOUD",
      title: "Set up CI/CD pipeline",
      description: "Configure GitHub Actions for automated deployment to staging and production",
      type: "task",
      status: "in_progress",
      priority: "high",
      assigneeEmail: "akshay@sarallabs.com",
    },
  ],

  // ─── Memberships (user-workspace assignments) ─────────────────────────
  memberships: [
    { userEmail: "admin@saralvidhya.com", workspaceSlug: "saral-vidhya", role: "owner" },
    { userEmail: "rahul@saralvidhya.com", workspaceSlug: "saral-vidhya", role: "member" },
    { userEmail: "priya@saralvidhya.com", workspaceSlug: "saral-vidhya", role: "member" },
    { userEmail: "akshay@sarallabs.com", workspaceSlug: "saral-labs", role: "owner" },
    { userEmail: "neha@sarallabs.com", workspaceSlug: "saral-labs", role: "member" },
  ],

  // ─── Space Members ────────────────────────────────────────────────────
  spaceMembers: [
    { userEmail: "admin@saralvidhya.com", spaceSlug: "documentation", role: "admin" },
    { userEmail: "rahul@saralvidhya.com", spaceSlug: "documentation", role: "editor" },
    { userEmail: "priya@saralvidhya.com", spaceSlug: "engineering", role: "admin" },
    { userEmail: "rahul@saralvidhya.com", spaceSlug: "engineering", role: "editor" },
    { userEmail: "admin@saralvidhya.com", spaceSlug: "product", role: "admin" },
    { userEmail: "akshay@sarallabs.com", spaceSlug: "research", role: "admin" },
    { userEmail: "neha@sarallabs.com", spaceSlug: "research", role: "editor" },
    { userEmail: "neha@sarallabs.com", spaceSlug: "ideas", role: "admin" },
  ],

  // ─── Project Members ───────────────────────────────────────────────────
  projectMembers: [
    { userEmail: "admin@saralvidhya.com", projectKey: "PRD", role: "owner" },
    { userEmail: "rahul@saralvidhya.com", projectKey: "PRD", role: "member" },
    { userEmail: "priya@saralvidhya.com", projectKey: "MOBILE", role: "owner" },
    { userEmail: "admin@saralvidhya.com", projectKey: "MOBILE", role: "member" },
    { userEmail: "rahul@saralvidhya.com", projectKey: "API", role: "owner" },
    { userEmail: "akshay@sarallabs.com", projectKey: "ML", role: "owner" },
    { userEmail: "neha@sarallabs.com", projectKey: "ML", role: "member" },
    { userEmail: "neha@sarallabs.com", projectKey: "CLOUD", role: "owner" },
    { userEmail: "akshay@sarallabs.com", projectKey: "CLOUD", role: "member" },
  ],
};

// ─── Print Summary ────────────────────────────────────────────────────────

console.log("📊 Database Seed Schema Reference\n");
console.log("📝 Demo User Credentials (for testing):");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
for (const user of SEED_SCHEMA.users) {
  console.log(`  📧 ${user.email}`);
  console.log(`     Password: ${user.password}`);
  console.log(`     Role: ${user.isGlobalAdmin ? "Global Admin" : user.appRole}`);
  console.log();
}

console.log("\n📊 Entity Counts:");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`  👥 Users:              ${SEED_SCHEMA.users.length}`);
console.log(`  🏢 Workspaces:         ${SEED_SCHEMA.workspaces.length}`);
console.log(`  📁 Spaces:             ${SEED_SCHEMA.spaces.length}`);
console.log(`  🚀 Projects:           ${SEED_SCHEMA.projects.length}`);
console.log(`  📋 Issues:             ${SEED_SCHEMA.issues.length}`);
console.log(`  👤 Memberships:        ${SEED_SCHEMA.memberships.length}`);
console.log(`  👥 Space Members:      ${SEED_SCHEMA.spaceMembers.length}`);
console.log(`  🔧 Project Members:    ${SEED_SCHEMA.projectMembers.length}`);

console.log("\n\n🔗 Setup Instructions:");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`
1️⃣  Set up a PostgreSQL database (local or cloud):
   • Local: docker run -d -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:latest
   • Cloud: https://supabase.com or https://neon.tech

2️⃣  Update .env.local with correct DATABASE_URL:
   DATABASE_URL=postgresql://user:password@host:port/dbname?sslmode=require

3️⃣  Apply database migrations:
   npm run db:push

4️⃣  Run the seed script:
   node scripts/seed-all-data.mjs

5️⃣  Start the development server:
   npm run dev

6️⃣  Log in at http://localhost:3000 with any demo user email and password
`);

console.log("\n💡 Workspace Structure:");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`
Saral Vidhya (saral-vidhya)
├── Spaces: Documentation, Engineering, Product
├── Projects: Portal Redesign, Mobile App, API Refactor
└── Members: admin (owner), rahul, priya

Saral Labs (saral-labs)
├── Spaces: Labs Research, Ideas
├── Projects: ML Pipeline, Cloud Migration
└── Members: akshay (owner), neha
`);
