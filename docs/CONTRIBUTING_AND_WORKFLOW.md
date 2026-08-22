# 🤝 Contributing & Workflow Guide - GlassHub Professional Resume

Welcome to the development and contributing guide for **GlassHub Professional Resume**! This document guides developers of all experience levels (from interns to staff engineers) on setting up the local environment, working with PostgreSQL via Prisma, building asynchronous BullMQ workers, and following quality standards.

---

## 💻 1. Local Environment Setup

### Prerequisites
Before starting, ensure you have the following tools installed on your host machine:
- **Node.js:** Version `20.x` or higher (`node -v`)
- **Docker Desktop:** Installed and running (`docker --version`)
- **Git:** Installed (`git --version`)

### Step-by-Step Initialization

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/matheustheus27/Glassmorphic-Professional-Resume-Template.git
   cd Glassmorphic-Professional-Resume-Template
   ```

2. **Generate Environment Configuration (`.env`):**
   Run the utility script to generate the default `.env` file automatically:
   ```bash
   node scripts/init-env.js
   ```

3. **Start the Platform via Docker Compose:**
   ```bash
   docker compose up --build
   ```
   *After container startup, Nginx will serve the application on port `80` (`http://localhost`).*

---

## 🗄️ 2. Database Workflow (Prisma ORM & PostgreSQL)

The database schema is defined in [`../backend/prisma/schema.prisma`](../backend/prisma/schema.prisma).

### Modifying the Database Schema
Whenever you add new tables or columns:

1. Edit [`../backend/prisma/schema.prisma`](../backend/prisma/schema.prisma).
2. Generate and apply a new migration locally:
   ```bash
   cd backend
   npx prisma migrate dev --name add_your_migration_name
   ```
3. Prisma will automatically generate updated `@prisma/client` TypeScript types.

### Running Database Seeders
To re-seed the PostgreSQL database with default accounts (`admin@glasshub.com` and `test@glasshub.com`):
```bash
cd backend
npx prisma db seed
```

### Browsing Data with Prisma Studio
To open the graphical interface for inspecting relational tables:
```bash
cd backend
npx prisma studio
```
*Access `http://localhost:5555` in your browser.*

---

## ⚡ 3. Creating a New Worker in BullMQ

If you need to implement a new asynchronous background task (e.g. generating monthly CSV reports or sending SMS alerts):

1. **Define Queue Name:**
   Inside `backend/queues/queueManager.js`, export the new queue:
   ```javascript
   export const myNewQueue = new Queue('my-new-task', { connection: redisConfig });
   ```

2. **Create the Worker Script:**
   Create `backend/workers/worker-my-new-task.js`:
   ```javascript
   import { Worker } from 'bullmq';
   import { redisConfig } from '../queues/queueManager.js';

   const worker = new Worker('my-new-task', async (job) => {
     console.log(`[Worker] Processing job ${job.id} with payload:`, job.data);
     
     // Perform background job logic here...
     
     return { success: true };
   }, { connection: redisConfig });

   console.log('✅ Worker My-New-Task initialized successfully.');
   ```

3. **Declare Container Service in `docker-compose.yml`:**
   Add a dedicated worker container to maintain microservice isolation.

---

## 📐 4. Code Quality & Standards

- **Strict TypeScript:** Avoid `any` in frontend code. Declare explicit types in `frontend/src/app/types/`.
- **Atomic Design:** Place reusable primitives in `atoms/`, composed fields in `molecules/`, and complex panels in `organisms/`.
- **Conventional Commits:**
  - `feat: add GlassCompact resume theme`
  - `fix: correct contact link grid layout in Puppeteer PDF`
  - `docs: update REST API documentation`
  - `refactor: optimize support ticket count queries`

---

## 🛠️ 5. Troubleshooting Common Issues

### Error: "Port 80 is already in use"
- **Cause:** Another service (IIS, Apache, or Skype) is bound to port 80.
- **Solution:** In [`../docker-compose.yml`](../docker-compose.yml), change Nginx host port mapping to `8080:80` and open `http://localhost:8080`.

### Error: "PrismaClientInitializationError: Cannot connect to PostgreSQL"
- **Cause:** PostgreSQL container is still initializing.
- **Solution:** Check status via `docker compose ps` and wait for `database system is ready to accept connections` in PostgreSQL logs.
