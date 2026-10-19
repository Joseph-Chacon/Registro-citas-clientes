import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.db_citas) {
    throw new Error(
      "Cloudflare D1 binding `db_citas` is unavailable. Set the `d1` field in .openai/hosting.json to `db_citas` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.db_citas, { schema });
}
