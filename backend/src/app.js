import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRoute.js";
import problemRouter from "./routes/problemRoute.js";
import submission from "./models/submission.js";
import submissionRouter from "./routes/submissionRoute.js";
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/auth", authRouter);
app.use("/problem", problemRouter);
app.use("/submit", submissionRouter)
export default app;