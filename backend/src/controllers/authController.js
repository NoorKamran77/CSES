import userModel from "../models/user.js";
import bcrypt from "bcrypt";
import Session from "../models/sessionModel.js";
import jwt from "jsonwebtoken";
function getTokenSecrets() {
    return {
        accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || process.env.jwt_secret,
        refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || process.env.jwt_secret
    };
}
export async function register(req, res) {
    try {

        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Username, email and password are required."
            });
        }

        const existingUser = await userModel.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Username or email already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await userModel.create({
            username,
            email: email.toLowerCase(),
            password: hashedPassword
        });

        return res.status(201).json({
            message: "User registered successfully.",
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email
            }
        });

    } catch (err) {

        return res.status(500).json({
            message: err.message
        });

    }
}
export async function login(req, res) {
    try {
        const { accessTokenSecret, refreshTokenSecret } = getTokenSecrets();
        if (!accessTokenSecret || !refreshTokenSecret) {
            return res.status(500).json({ message: 'Token secrets are not configured in environment variables' });
        }
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const normalizedEmail = email.toLowerCase();

        const user = await userModel.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const refreshtoken = jwt.sign({ userId: user._id }, refreshTokenSecret, { expiresIn: '7d' });
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('refreshtoken', refreshtoken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        const refreshtokenhash = await bcrypt.hash(refreshtoken, 10);
        const session = await Session.create({
            userId: user._id,
            refreshTokenhash: refreshtokenhash,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        await session.save();
        const accesstoken = jwt.sign({ userId: user._id, sessionId: session._id }, accessTokenSecret, { expiresIn: '15m' });

        res.status(200).json({ message: 'Logged in successfully', user: { username: user.username, email: user.email }, accesstoken });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
}
export async function logout(req, res) {
    try {
        const { refreshTokenSecret } = getTokenSecrets();
        if (!refreshTokenSecret) {
            return res.status(500).json({ message: 'Refresh token secret is not configured in environment variables' });
        }

        const refreshToken = req.cookies.refreshtoken;
        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token missing' });
        }

        const decoded = jwt.verify(refreshToken, refreshTokenSecret);

        const activeSessions = await Session.find({ userId: decoded.userId, revoked: false }).sort({ createdAt: -1 });
        for (const session of activeSessions) {
            const isTokenMatch = await bcrypt.compare(refreshToken, session.refreshTokenhash);
            if (isTokenMatch) {
                session.revoked = true;
                await session.save();
                break;
            }
        }

        const isProduction = process.env.NODE_ENV === 'production';
        res.clearCookie('refreshtoken', {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax'
        });
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        }

        res.status(500).json({ message: 'Error logging out', error: error.message });
    }
}