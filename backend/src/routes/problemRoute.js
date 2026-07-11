import express from "express";
import { requireAuth } from "../middleware/auth.js";
import * as problemController from "../controllers/problemController.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const problemRouter = express.Router();
problemRouter.use(requireAuth);
problemRouter.post("/", requireAdmin, problemController.create);
problemRouter.get("/", problemController.fetch);
problemRouter.get("/:slug", problemController.getBySlug)
export default problemRouter;