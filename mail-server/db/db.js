import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {config} from "dotenv";

config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

export const db = drizzle(client);