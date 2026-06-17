import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma 7 config — connection URL for Migrate/CLI lives here (no longer in schema;
// `directUrl` was removed in v7). The runtime PrismaClient connects via a driver
// adapter using DATABASE_URL (see src/lib/prisma.ts).
//
// Migrations need a DIRECT (unpooled) connection. With a pooler like Neon's
// (-pooler host) the app uses the pooled DATABASE_URL, while the CLI uses
// DIRECT_DATABASE_URL here. Locally (no pooler) we fall back to DATABASE_URL.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? '',
  },
});
