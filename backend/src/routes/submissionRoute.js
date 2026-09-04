import express from "express";
import { requireAuth } from "../middleware/auth.js";
import * as submissionController from "../controllers/submissionController.js";

const submissionRouter = express.Router();

submissionRouter.use(requireAuth);

// Submit code for a problem
submissionRouter.post("/:slug", submissionController.submit);

// Get user's own submissions
submissionRouter.get("/my-submissions", submissionController.getMySubmissions);

// Get all submissions (paginated & filtered)
submissionRouter.get("/submissions", submissionController.getAll);

// Get submission by ID
submissionRouter.get("/submissions/:id", submissionController.getById);

export default submissionRouter;

