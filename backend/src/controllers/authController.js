import userModel from "../models/user.js";
import bcrypt from "bcrypt";
import Session from "../models/sessionModel.js";
import jwt from "jsonwebtoken";

function getTokenSecrets() {
    return {
        accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || process.env.jwt_secret,
        refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || process.env.jwt_secret
    };
}

export async function register(req, res) {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
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
                success: false,
                message: "Username or email already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await userModel.create({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully.",
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

export async function login(req, res) {
    try {
        const { accessTokenSecret, refreshTokenSecret } = getTokenSecrets();
        if (!accessTokenSecret || !refreshTokenSecret) {
            return res.status(500).json({
                success: false,
                message: 'Token secrets are not configured in environment variables'
            });
        }

        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await userModel.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            });
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
            ip: req.ip || req.connection.remoteAddress || "127.0.0.1",
            userAgent: req.get('User-Agent') || "unknown"
        });

        const accesstoken = jwt.sign(
            { userId: user._id, sessionId: session._id, role: user.role },
            accessTokenSecret,
            { expiresIn: '15m' }
        );

        res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                solvedProblemsCount: user.solvedProblems?.length || 0
            },
            accesstoken
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
}

export async function refreshToken(req, res) {
    try {
        const { accessTokenSecret, refreshTokenSecret } = getTokenSecrets();
        if (!accessTokenSecret || !refreshTokenSecret) {
            return res.status(500).json({
                success: false,
                message: 'Token secrets are not configured in environment variables'
            });
        }

        const token = req.cookies.refreshtoken || req.body.refreshToken;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token missing'
            });
        }

        const decoded = jwt.verify(token, refreshTokenSecret);
        const user = await userModel.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        const activeSessions = await Session.find({ userId: decoded.userId, revoked: false }).sort({ createdAt: -1 });
        let matchedSession = null;

        for (const session of activeSessions) {
            const isTokenMatch = await bcrypt.compare(token, session.refreshTokenhash);
            if (isTokenMatch) {
                matchedSession = session;
                break;
            }
        }

        if (!matchedSession) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or revoked session'
            });
        }

        const newAccessToken = jwt.sign(
            { userId: user._id, sessionId: matchedSession._id, role: user.role },
            accessTokenSecret,
            { expiresIn: '15m' }
        );

        return res.status(200).json({
            success: true,
            message: 'Access token refreshed successfully',
            accesstoken: newAccessToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token',
            error: error.message
        });
    }
}

export async function getMe(req, res) {
    try {
        const user = await userModel.findById(req.user._id)
            .select("-password")
            .populate("solvedProblems", "title slug difficulty");

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function logout(req, res) {
    try {
        const { refreshTokenSecret } = getTokenSecrets();
        if (!refreshTokenSecret) {
            return res.status(500).json({
                success: false,
                message: 'Refresh token secret is not configured in environment variables'
            });
        }

        const refreshTokenValue = req.cookies.refreshtoken || req.body?.refreshToken;
        if (refreshTokenValue) {
            try {
                const decoded = jwt.verify(refreshTokenValue, refreshTokenSecret);
                const activeSessions = await Session.find({ userId: decoded.userId, revoked: false }).sort({ createdAt: -1 });
                for (const session of activeSessions) {
                    const isTokenMatch = await bcrypt.compare(refreshTokenValue, session.refreshTokenhash);
                    if (isTokenMatch) {
                        session.revoked = true;
                        await session.save();
                        break;
                    }
                }
            } catch {
                // Ignore token decode errors on logout
            }
        }

        const isProduction = process.env.NODE_ENV === 'production';
        res.clearCookie('refreshtoken', {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax'
        });

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error logging out',
            error: error.message
        });
    }
}