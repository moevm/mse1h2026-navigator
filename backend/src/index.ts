import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { healthRouter } from "./routers/health";
import { habrRouter } from "./routers/habr";
import { wikipediaRouter } from "./routers/wikipedia";

dotenv.config();

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use("/health", healthRouter);
app.use("/habr", habrRouter);
app.use("/wikipedia", wikipediaRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
