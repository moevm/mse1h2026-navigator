import express, { Request, Response } from "express";
import dotenv from "dotenv";
import "reflect-metadata";
import { healthRouter } from "./routers/health";
import { wikipediaRouter } from "./routers/wikipedia";
import { authRouter } from "./routers/auth";

dotenv.config();

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use("/health", healthRouter);
app.use("/wikipedia", wikipediaRouter);
app.use("/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
