import "dotenv/config";
import { defineConfig } from "prisma/config";

const USER = process.env.POSTGRES_USER || "root";
const PASSWORD = process.env.POSTGRES_PASSWORD || "123456";
const HOST = process.env.POSTGRES_HOST || "localhost";
const PORT = process.env.POSTGRES_PORT || "5434";
const DB = process.env.POSTGRES_DB || "v23";

const dbUrl = `postgresql://${USER}:${PASSWORD}@${HOST}:${PORT}/${DB}?schema=public`;
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: dbUrl,
  },
});
