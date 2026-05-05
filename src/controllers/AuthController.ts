import { NextFunction, Response } from 'express';
import { AuthRequest, LoginUserRequest, RegisterUserRequest } from '../types';
import { UserService } from '../services/UserService';
import { Logger } from 'winston';
import { JwtPayload } from 'jsonwebtoken';
import { TokenService } from '../services/TokenService';
import { setTokenCookies } from '../utils/cookieUtils';
import createHttpError from 'http-errors';

export class AuthController {
    constructor(
        private userService: UserService,
        private tokenService: TokenService,
        private logger: Logger,
    ) {}
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

            const payload: JwtPayload = {
                sub: user.id?.toString() || '',
                role: user.role,
            };

            const accessToken = this.tokenService.generateAccessToken(payload);
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user);
            const refreshToken = this.tokenService.generateRefreshToken(
                payload,
                newRefreshToken.id.toString(),
            );

            setTokenCookies(res, accessToken, refreshToken);

            this.logger.info('User has been logged in', {
                id: user?.id,
            });

            res.status(201).json({ id: user?.id });
        } catch (err) {
            next(err);
            return;
        }
    }
    async login(req: LoginUserRequest, res: Response, next: NextFunction) {
        const { email, password } = req.body;

        try {
            const user = await this.userService.findByEmail(email);

            if (!user) {
                const error = createHttpError(401, 'Invalid credentials');
                return next(error);
            }

            const isPasswordValid =
                await this.userService.credentialServiceInstance.comparePassword(
                    password,
                    user.password,
                );

            if (!isPasswordValid) {
                const error = createHttpError(401, 'Invalid credentials');
                return next(error);
            }

            this.logger.info('User logged in successfully', { id: user.id });

            const payload: JwtPayload = {
                sub: user.id?.toString() || '',
                role: user.role,
            };

            const accessToken = this.tokenService.generateAccessToken(payload);
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user);
            const refreshToken = this.tokenService.generateRefreshToken(
                payload,
                newRefreshToken.id.toString(),
            );

            setTokenCookies(res, accessToken, refreshToken);

            res.status(200).send({
                id: user.id,
            });
        } catch (err) {
            next(err);
            return;
        }
    }
    async self(req: AuthRequest, res: Response) {
        const user = await this.userService.findById(Number(req?.auth?.sub));

        res.json({ ...user, password: undefined });
    }
    async refresh(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { auth } = req;

            const payload: JwtPayload = {
                sub: auth?.sub?.toString() || '',
                role: auth?.role,
            };

            const user = await this.userService.findById(Number(auth?.sub));
            if (!user) {
                const err = createHttpError(
                    404,
                    'User with this data not found',
                );
                next(err);
                return;
            }

            const accessToken = this.tokenService.generateAccessToken(payload);
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user);

            await this.tokenService.deleteRefreshToken(Number(auth?.jti));
            const refreshToken = this.tokenService.generateRefreshToken(
                payload,
                newRefreshToken.id.toString(),
            );

            setTokenCookies(res, accessToken, refreshToken);

            this.logger.info('User has been logged in : ', {
                id: user?.id,
            });

            res.json({ id: user?.id });
        } catch (err) {
            next(err);
        }
    }
}
