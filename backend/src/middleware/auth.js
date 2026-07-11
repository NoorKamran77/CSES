import jwt from "jsonwebtoken";
import userModel from "../models/user.js";

export async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization || req.headers.Authorization;

        const tokenFromHeader = authHeader?.startsWith("Bearer ")
            ? authHeader.slice(7).trim()
            : null;

        const tokenFromCookie =
            req.cookies?.accesstoken || req.cookies?.accessToken;

        const token = tokenFromHeader || tokenFromCookie;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const accessTokenSecret =
            process.env.ACCESS_TOKEN_SECRET ||
            process.env.JWT_SECRET ||
            process.env.jwt_secret;

        if (!accessTokenSecret) {
            return res
                .status(500)
                .json({ message: "Access token secret is not configured" });
        }

        const decoded = jwt.verify(token, accessTokenSecret);

        // Fetch the latest user from the database
        const user = await userModel
            .findById(decoded.userId)
            .select("-password");

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}