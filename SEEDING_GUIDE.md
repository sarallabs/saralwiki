# 🚀 Quick Start Guide: Seeding Database with Test Data

This guide shows how to set up the database and populate it with comprehensive seed data for testing.

## 📋 What Gets Seeded

The seed script creates:
- **5 demo users** across 2 organizations
- **2 workspaces** (Saral Vidhya, Saral Labs)
- **5 spaces** for documentation and collaboration
- **5 projects** with various statuses
- **10 issues** (tasks, bugs, stories, epics)
- **Complete team memberships** and permissions

## 🛠️ Setup Steps

### Option 1: Local PostgreSQL with Docker (Recommended)

1. **Install Docker** from https://www.docker.com/products/docker-desktop

2. **Start PostgreSQL container:**
   ```bash
   docker-compose up -d
   ```
   This creates a PostgreSQL database on `localhost:5432`

3. **Update .env.local:**
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saralwiki
   DIRECT_URL=postgresql://postgres:postgres@localhost:5432/saralwiki
   ```

4. **Apply database migrations:**
   ```bash
   npm run db:push
   ```

5. **Seed the database:**
   ```bash
   node scripts/seed-all-data.mjs
   ```

6. **Start the app:**
   ```bash
   npm run dev
   ```

7. **Log in** at http://localhost:3000 with any demo user:
   - Email: `admin@saralvidhya.com`
   - Password: `Admin@123`

---

### Option 2: Neon (Cloud PostgreSQL)

1. **Create free account** at https://neon.tech

2. **Create a project** and copy the connection string

3. **Update .env.local:**
   ```
   DATABASE_URL=<your-neon-connection-string>
   DIRECT_URL=<your-neon-direct-connection-string>
   ```

4. **Apply migrations:**
   ```bash
   npm run db:push
   ```

5. **Seed the database:**
   ```bash
   node scripts/seed-all-data.mjs
   ```

6. **Start the app:**
   ```bash
   npm run dev
   ```

---

### Option 3: Supabase (Cloud PostgreSQL + Auth)

1. **Create account** at https://supabase.com

2. **Create new project** and get connection details

3. **Update .env.local:**
   ```
   DATABASE_URL=postgresql://postgres:<password>@<project>.supabase.co:6543/postgres?sslmode=require
   DIRECT_URL=postgresql://postgres:<password>@<project>.supabase.co:5432/postgres?sslmode=require
   ```

4. **Apply migrations:**
   ```bash
   npm run db:push
   ```

5. **Seed the database:**
   ```bash
   node scripts/seed-all-data.mjs
   ```

6. **Start the app:**
   ```bash
   npm run dev
   ```

---

## 📝 Demo User Credentials

After seeding, log in with any of these:

| Email | Password | Role |
|-------|----------|------|
| admin@saralvidhya.com | Admin@123 | Global Admin |
| rahul@saralvidhya.com | Rahul@123 | Team Member |
| priya@saralvidhya.com | Priya@123 | Team Member |
| akshay@sarallabs.com | Akshay@123 | Team Lead |
| neha@sarallabs.com | Neha@123 | Team Member |

---

## 🧹 Clean Up

### Stop Docker database:
```bash
docker-compose down
```

### Remove all data:
```bash
docker-compose down -v
```

### Clear local database:
```bash
npm run db:push  # Re-applies schema
node scripts/seed-all-data.mjs  # Seed again
```

---

## 🐛 Troubleshooting

### Database connection failed
- Ensure DATABASE_URL is correct in .env.local
- Check if database is running (Docker or cloud)
- Verify credentials are correct

### Seed script fails
- Run `npm run db:push` first to apply migrations
- Check that the database is accessible
- Ensure all tables exist

### Can't log in
- Use exact email and password from the table above
- Check that user was created by running seed script again
- Clear browser cache and try again

---

## 📊 View Seeded Data

**Using pgAdmin** (if using Docker):
```bash
docker run -d --name pgadmin -e PGADMIN_DEFAULT_EMAIL=admin@example.com -e PGADMIN_DEFAULT_PASSWORD=admin -p 5050:80 dpage/pgadmin4
# Access at http://localhost:5050
```

**Using Drizzle Studio** (built-in):
```bash
npm run db:studio
```

---

## 🎯 Next Steps

1. ✅ Database set up and seeded
2. ✅ Demo users created
3. 👉 **Start the dev server:** `npm run dev`
4. 👉 **Log in** with demo credentials
5. 👉 **Explore workspaces, projects, and issues**
6. 👉 **Test creating new items**

---

## 📚 Additional Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js v5](https://authjs.dev/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
