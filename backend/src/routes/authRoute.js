import express from "express";
import * as authController from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const authRouter = express.Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.refreshToken);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", requireAuth, authController.getMe);

export default authRouter;