import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization header missing or invalid' });
        }

        const token = authHeader.split(' ')[1];
        const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || process.env.jwt_secret;

        if (!accessTokenSecret) {
            return res.status(500).json({ message: 'Access token secret is not configured in environment variables' });
        }

        const decoded = jwt.verify(token, accessTokenSecret);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid or expired access token' });
        }

        return res.status(500).json({ message: 'Failed to authenticate request', error: error.message });
    }
}