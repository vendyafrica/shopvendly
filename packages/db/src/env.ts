import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

export const DATABASE_URL = process.env.DATABASE_URL;
