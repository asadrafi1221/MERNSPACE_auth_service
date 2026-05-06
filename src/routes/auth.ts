import { RequestHandler, Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { UserService } from '../services/UserService';
import { CredentialService } from '../services/CredentialService';
import { AppDataSource } from '../config/data-source';
import { User } from '../entity/User';
import logger from '../config/logger';
import { validate } from '../middleware/validation';
import { loginUserSchema, registerUserSchema } from '../validators/user';
import { RefreshToken } from '../entity/RefreshToken';
import { TokenService } from '../services/TokenService';
import { AuthRequest } from '../types';
import { protect } from '../middleware/authenticate';
import validateRefreshToken from '../middleware/validateRefreshToken';

const authRouter = Router();
const userRepository = AppDataSource.getRepository(User);
const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
const credentialService = new CredentialService();
const userService = new UserService(userRepository, credentialService);
const tokenService = new TokenService(refreshTokenRepository, logger);
const authController = new AuthController(userService, tokenService, logger);

authRouter.post(
    '/register',
    validate(registerUserSchema),
    async (req, res, next) => {
        (await authController.register(
            req,
            res,
            next,
        )) as unknown as RequestHandler;
    },
);

authRouter.post('/login', validate(loginUserSchema), async (req, res, next) => {
    (await authController.login(req, res, next)) as unknown as RequestHandler;
});

authRouter.get('/self', protect, async (req, res) => {
    (await authController.self(
        req as AuthRequest,
        res,
    )) as unknown as RequestHandler;
});
authRouter.post('/refresh', validateRefreshToken, async (req, res, next) => {
    (await authController.refresh(
        req as AuthRequest,
        res,
        next,
    )) as unknown as RequestHandler;
});

export default authRouter;
