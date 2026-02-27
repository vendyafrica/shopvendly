import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import path from "path";

const envPath = path.resolve(process.cwd(), "../../.env");
config({ path: envPath });

if (!process.env.DATABASE_URL) {
    config({ path: path.resolve(process.cwd(), ".env") });
}

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
}

const sql = neon(process.env.DATABASE_URL);

async function reset() {
    console.log("Resetting database (dropping public schema)...");
    try {
        await sql`DROP SCHEMA IF EXISTS public CASCADE`;
        await sql`CREATE SCHEMA public`;
        await sql`GRANT ALL ON SCHEMA public TO public`;
        await sql`COMMENT ON SCHEMA public IS 'standard public schema';`;
    } catch (error) {
        console.error("Failed to reset database:", error);
        process.exit(1);
    }
}

reset();
