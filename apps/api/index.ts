import morgan from "morgan";
import app from "./app.js";

// Vercel Express runtime entrypoint
app.use(morgan("dev"));

export default app;