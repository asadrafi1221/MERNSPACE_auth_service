import { NextFunction, Response } from 'express';
import { LoginUserRequest, RegisterUserRequest } from '../types';
import { UserService } from '../services/UserService';
import { Logger } from 'winston';
import { JwtPayload } from 'jsonwebtoken';
import { TokenService } from '../services/TokenService';
import { setTokenCookies } from '../utils/cookieUtils';

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

            res.status(201).send({
                id: user.id,
            });
        } catch (err) {
            next(err);
            return;
        }
    }
    async login(req: LoginUserRequest, res: Response, next: NextFunction) {
        const { email, password } = req.body;

        try {
            const user = await this.userService.login({
                email,
                password,
            });

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
}
