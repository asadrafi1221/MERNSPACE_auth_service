// src/middleware/protect.ts
import { expressjwt, Request } from 'express-jwt';
import JwksClient, { GetVerificationKey } from 'jwks-rsa';
import { CONFIG } from '../config';

export const protect = expressjwt({
    secret: JwksClient.expressJwtSecret({
        jwksUri: CONFIG.JWKS_URI!,
        cache: true,
        rateLimit: true,
    }) as GetVerificationKey,
    algorithms: ['RS256', 'HS256'],
    requestProperty: 'auth',
    credentialsRequired: true,
    getToken: (req: Request) => {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.split(' ')[1] !== 'undefined') {
            const token = authHeader.split(' ')[1];
            if (token) {
                return token;
            }
        }
        type AccessToken = {
            accessToken: string;
        };
        const { accessToken } = req.cookies as AccessToken;
        return accessToken;
    },
});
