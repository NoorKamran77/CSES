import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import * as adminController from "../controllers/adminController.js";

const adminRouter = express.Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/stats", adminController.getStats);

export default adminRouter;
