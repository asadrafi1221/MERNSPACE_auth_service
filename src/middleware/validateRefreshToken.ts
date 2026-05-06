import { Request, expressjwt } from 'express-jwt';
import { JwtPayload } from 'jsonwebtoken';
import { CONFIG } from '../config';
import createHttpError from 'http-errors';
import { AuthCookie } from '../types';
import { AppDataSource } from '../config/data-source';
import { RefreshToken } from '../entity/RefreshToken';
import logger from '../config/logger';

export default expressjwt({
    secret: CONFIG.REFRESH_TOKEN_SECRET!,
    algorithms: ['HS256'],
    getToken(req: Request) {
        const { refreshToken } = req.cookies as AuthCookie;
        if (!refreshToken) {
            const error = createHttpError(401, 'Refresh token required');
            throw error;
        }
        return refreshToken;
    },

    async isRevoked(request: Request, token) {
        let payload: JwtPayload | undefined;

        try {
            if (!token?.payload) {
                return true;
            }

            const refreshTokenRepository =
                AppDataSource.getRepository(RefreshToken);

            payload = token.payload as JwtPayload;

            const refreshToken = await refreshTokenRepository.findOne({
                where: {
                    id: Number(payload?.jti),
                    user: { id: Number(payload?.sub) },
                },
            });

            // If refresh token doesn't exist in database, it's revoked
            return !refreshToken;
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Unknown error';
            logger.error('Error while validating the refreshToken', {
                id: payload?.jti,
                error: errorMessage,
            });
            return true;
        }
    },
});
