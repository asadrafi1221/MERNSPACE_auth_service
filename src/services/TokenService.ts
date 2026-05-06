import fs from 'node:fs';
import path from 'node:path';
import { JwtPayload, sign, SignOptions } from 'jsonwebtoken';
import { Logger } from 'winston';
import createHttpError from 'http-errors';
import { CONFIG } from '../config';
import { User } from '../entity/User';
import { RefreshToken } from '../entity/RefreshToken';
import { Repository } from 'typeorm';

export class TokenService {
    constructor(
        private readonly refreshTokenRepository: Repository<RefreshToken>,
        private readonly logger: Logger,
    ) {}

    private readPrivateKey(): Buffer {
        if (process.env.PRIVATE_KEY) {
            const cleanPrivateKey = process.env.PRIVATE_KEY.replace(
                /\\n/g,
                '',
            ).replace(/\\r/g, '');

            return Buffer.from(cleanPrivateKey, 'utf-8');
        }

        try {
            return fs.readFileSync(
                path.join(__dirname, '../../certs/private.pem'),
            );
        } catch {
            const error = createHttpError(
                500,
                'Error while reading private key',
            );
            throw error;
        }
    }

    generateAccessToken(payload: JwtPayload): string {
        const privateKey = this.readPrivateKey();

        return sign(payload, privateKey, {
            expiresIn: '1h',
            algorithm: 'RS256',
            issuer: 'auth-service',
        });
    }

    generateRefreshToken(payload: JwtPayload, jti?: string): string {
        const signOptions: SignOptions = {
            expiresIn: '1y',
            algorithm: 'HS256',
            issuer: 'auth-service',
        };

        if (jti) {
            signOptions.jwtid = jti;
        }

        return sign(
            payload,
            CONFIG.REFRESH_TOKEN_SECRET as string,
            signOptions,
        );
    }

    async persistRefreshToken(user: User) {
        if (!user) {
            const error = createHttpError(500, 'Failed to create user');
            throw error;
        }

        try {
            const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365;

            const newRefreshToken = await this.refreshTokenRepository.save({
                user: user,
                expiresAt: new Date(Date.now() + MS_IN_YEAR),
            });

            return newRefreshToken;
        } catch {
            const error = createHttpError(
                500,
                'Failed to store the refreshToken in database ',
            );
            throw error;
        }
    }
    async deleteRefreshToken(tokenId: number) {
        return await this.refreshTokenRepository.delete({
            id: tokenId,
        });
    }
}
