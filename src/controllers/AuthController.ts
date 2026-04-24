import fs from 'fs';

import { NextFunction, Response } from 'express';
import { RegisterUserRequest } from '../types';
import { UserService } from '../services/UserService';
import { Logger } from 'winston';
import { JwtPayload, sign } from 'jsonwebtoken';
import path from 'path';
import createHttpError from 'http-errors';
import { CONFIG } from '../config';

export class AuthController {
    userService: UserService;
    constructor(
        userService: UserService,
        private logger: Logger,
    ) {
        this.userService = userService;
    }
    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        const { firstName, lastName, email, password } = req.body;

        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
            });

            this.logger.info('User has been created', { id: user.id });

            let privateKey: Buffer;
            try {
                privateKey = fs.readFileSync(
                    path.join(__dirname, '../../certs/private.pem'),
                );
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (err) {
                const error = createHttpError(
                    500,
                    'Error while reading private key',
                );
                next(error);
                return;
            }

            const payload: JwtPayload = {
                sub: user?.id?.toString() || '',
                role: user.role,
            };

            const accessToken = sign(payload, privateKey, {
                expiresIn: '1h',
                algorithm: 'RS256',
                issuer: 'auth-service',
            });
            const refreshToken = sign(
                payload,
                CONFIG.REFRESH_TOKEN_SECRET as string,
                {
                    expiresIn: '1y',
                    algorithm: 'HS256',
                    issuer: 'auth-service',
                },
            );

            res.cookie('accessToken', accessToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60, // 1h
                httpOnly: true, // Very Important
            });

            res.cookie('refreshToken', refreshToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 365, // 1y
                httpOnly: true, // Very Important
            });

            res.status(201).send({
                id: user.id,
            });
        } catch (err) {
            next(err);
            return;
        }
    }
}
