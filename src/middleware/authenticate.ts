// src/middleware/protect.ts
import { expressjwt, Request } from 'express-jwt';
import { CONFIG } from '../config';
import { AuthCookie } from '../types';
import logger from '../config/logger';

// Use public key from environment variables
const publicKey = CONFIG.PUBLIC_KEY || CONFIG.PRIVATE_KEY;

if (!publicKey) {
    throw new Error(
        'PUBLIC_KEY or PRIVATE_KEY environment variable is required for JWT verification',
    );
}

export const protect = expressjwt({
    secret: publicKey,
    algorithms: ['RS256'],
    requestProperty: 'auth',
    credentialsRequired: true,
    getToken: (req: Request) => {
        try {
            const authHeader = req.headers.authorization;

            if (authHeader) {
                const parts = authHeader.split(' ');

                if (parts.length === 2 && parts[1] !== 'undefined') {
                    return parts[1];
                }
            }

            const { accessToken } = req.cookies as AuthCookie;

            return accessToken;
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Unknown error';
            logger.error('Error while validating the refreshToken : ', {
                error: errorMessage,
            });
        }
    },
});
