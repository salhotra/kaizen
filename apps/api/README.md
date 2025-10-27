# Kaizen API

Backend API for the Kaizen gym tracking application.

## Tech Stack

- **Framework:** Fastify 5.6
- **API:** tRPC 11.6
- **Database:** PostgreSQL + Prisma 6.18
- **Language:** TypeScript 5.9

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment

```bash
cp .env.example .env
# Edit .env with your database URL
```

### 3. Set up database

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database (dev)
pnpm db:push

# OR run migrations (production)
pnpm db:migrate
```

### 4. Start development server

```bash
pnpm dev
```

Server will be available at http://localhost:3000

## Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm deploy` - Deploy to production (runs migrations + starts server)
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm lint` - Run ESLint
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema to database (dev only, no migrations)
- `pnpm db:migrate` - Create and apply migration (dev)
- `pnpm db:deploy` - Apply migrations (production)
- `pnpm db:studio` - Open Prisma Studio

> **📖 See [MIGRATIONS.md](./MIGRATIONS.md) for detailed migration workflow and best practices**

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /trpc` - tRPC endpoint
- `GET /trpc/healthCheck` - tRPC health check

## Project Structure

```
apps/api/
├── prisma/
│   └── schema.prisma    # Database schema
├── src/
│   ├── lib/
│   │   ├── context.ts   # tRPC context
│   │   ├── prisma.ts    # Prisma client
│   │   └── trpc.ts      # tRPC initialization
│   ├── routers/         # tRPC routers (add your business logic here)
│   ├── services/        # Business logic services
│   ├── router.ts        # Main tRPC router
│   └── server.ts        # Fastify server
├── package.json
└── tsconfig.json
```

## Adding New Features

### 1. Define your database schema

Edit `prisma/schema.prisma`:

```prisma
model YourModel {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
}
```

Then run:
```bash
pnpm db:push
```

### 2. Create a router

Create `src/routers/your-feature.ts`:

```typescript
import { z } from 'zod'
import { router, publicProcedure } from '../lib/trpc.js'

export const yourFeatureRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.yourModel.findMany()
  }),
  
  create: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.yourModel.create({ data: input })
    }),
})
```

### 3. Add router to main router

Edit `src/router.ts`:

```typescript
import { yourFeatureRouter } from './routers/your-feature.js'

export const appRouter = router({
  yourFeature: yourFeatureRouter,
})
```

That's it! Your new API endpoints are now available to your frontend.

