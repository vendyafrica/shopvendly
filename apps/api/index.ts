import morgan from "morgan";
import { createApp } from "./app";

const app = createApp();

// Vercel Express runtime entrypoint
app.use(morgan("dev"));

export default app;