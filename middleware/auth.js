const jwt = require('jsonwebtoken');

const apiSecret = process.env.STREAM_API_SECRET;

const authenticate = (req, res, next) => {
    if (!apiSecret) {
        return next(new Error('STREAM_API_SECRET is not configured'));
    }

    const authorization = req.get('authorization');
    const [scheme, token] = authorization?.split(' ') || [];

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const payload = jwt.verify(token, apiSecret, { algorithms: ['HS256'] });

        if (typeof payload === 'string' || typeof payload.user_id !== 'string' || !payload.user_id) {
            return res.status(401).json({ message: 'Invalid authentication token' });
        }

        req.user = { id: payload.user_id };
        return next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: 'Invalid authentication token' });
        }

        return next(error);
    }
};

module.exports = { authenticate };
