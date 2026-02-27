import morgan from "morgan";
import { createApp } from "./app";

const app = createApp();

app.use(morgan("dev"));

export default app;
