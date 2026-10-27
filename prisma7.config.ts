import { config } from "dotenv";
import { expand } from "dotenv-expand";
import { defineConfig } from "prisma/config";

// dotenv itself does not substitute ${VAR} references, so POSTGRES_URI needs expanding
expand(config({ quiet: true }));

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["POSTGRES_URI"],
  },
});
