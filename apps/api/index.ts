import morgan from "morgan";
import { createApp } from "./app.js";

const app = createApp();

// Vercel Express runtime entrypoint
app.use(morgan("dev"));

export default app;