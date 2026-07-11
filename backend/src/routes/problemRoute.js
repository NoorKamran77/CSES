import express from "express";
import { requireAuth } from "../middleware/auth.js"
import * as problemController from "../controllers/problemController.js"
const problemRouter = express.Router(); 0

problemRouter.get("/", requireAuth, problemController.get)