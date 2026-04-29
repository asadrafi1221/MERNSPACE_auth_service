import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { UserService } from '../services/UserService';
import { AppDataSource } from '../config/data-source';
import { User } from '../entity/User';
import logger from '../config/logger';
import { validate } from '../middleware/validation';
import { registerUserSchema } from '../validators/user';
import { RefreshToken } from '../entity/RefreshToken';
import { TokenService } from '../services/TokenService';

const authRouter = Router();
const userRepository = AppDataSource.getRepository(User);
const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
const userService = new UserService(userRepository);
const tokenService = new TokenService(refreshTokenRepository, logger);
const authController = new AuthController(userService, tokenService, logger);

authRouter.post('/register', validate(registerUserSchema), (req, res, next) =>
    authController.register(req, res, next),
);

export default authRouter;
