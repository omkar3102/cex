import "dotenv/config";
// Keep this config compatible with Prisma versions that do not export prisma/config.

export default {
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: process.env.DATABASE_URL,
  },
};