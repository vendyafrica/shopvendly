import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { DATABASE_URL } from "./env";

const connectionString = DATABASE_URL;

// HTTP client for simple queries
const clientHttp = neon(connectionString);
export const db = drizzleHttp(clientHttp, { schema });

export const neonClient = clientHttp;