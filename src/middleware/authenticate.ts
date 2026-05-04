// src/middleware/protect.ts
import { expressjwt, Request } from 'express-jwt';
import fs from 'fs';
import path from 'path';
import { AuthCookie } from '../types';
import logger from '../config/logger';

// Read public key directly instead of using JWKS
const publicKey = fs.readFileSync(
    path.join(__dirname, '../../certs/public.pem'),
);

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
            logger.error('Error while validating the refreshToken', {
                error: errorMessage,
            });
        }
    },
});
