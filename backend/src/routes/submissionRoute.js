import express from "express";
import { requireAuth } from "../middleware/auth.js"
import * as submissionController from "../controllers/submissionController.js"
const submissionRouter = express.Router();

submissionRouter.use(requireAuth);

submissionRouter.post("/:slug/submit", submissionController.submit);
submissionRouter.get("/submissions", submissionController.getAll);
submissionRouter.get("/submissions/:id", submissionController.getById);
export default submissionRouter;
