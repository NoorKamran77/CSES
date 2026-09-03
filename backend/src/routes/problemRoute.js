import express from "express";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import * as problemController from "../controllers/problemController.js";

const problemRouter = express.Router();

// Public routes
problemRouter.get("/", problemController.fetch);
problemRouter.get("/grouped", optionalAuth, problemController.getGrouped);
problemRouter.get("/:slug", problemController.getBySlug);
problemRouter.get("/:slug/samples", problemController.getSamples);


// Admin-only routes
problemRouter.post("/", requireAuth, requireAdmin, problemController.create);
problemRouter.put("/:slug", requireAuth, requireAdmin, problemController.update);
problemRouter.delete("/:slug", requireAuth, requireAdmin, problemController.deleteProblem);
problemRouter.post("/:slug/testcases", requireAuth, requireAdmin, problemController.saveTestcases);

export default problemRouter;