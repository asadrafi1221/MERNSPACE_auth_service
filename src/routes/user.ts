import { RequestHandler, Router } from 'express';
import { UserController } from '../controllers/UserController';
import { UserService } from '../services/UserService';
import { AppDataSource } from '../config/data-source';
import { User } from '../entity/User';
import { CredentialService } from '../services/CredentialService';
import logger from '../config/logger';
import { canAccess } from '../middleware/canAccess';
import { Roles } from '../constants';
import { validate, validateQuery } from '../middleware/validation';
import {
    createUserSchema,
    updateUserSchema,
    getAllUsersSchema,
} from '../validators/user';

const userRouter = Router();

const userRepository = AppDataSource.getRepository(User);
const credentialService = new CredentialService();
const userService = new UserService(userRepository, credentialService);
const userController = new UserController(userService, logger);

userRouter.post(
    '/create',
    validate(createUserSchema),
    canAccess([Roles.ADMIN]),
    async (req, res, next) => {
        (await userController.create(
            req,
            res,
            next,
        )) as unknown as RequestHandler;
    },
);

userRouter.post(
    '/update/:id',
    validate(updateUserSchema),
    canAccess([Roles.ADMIN]),
    async (req, res, next) => {
        (await userController.update(
            req,
            res,
            next,
        )) as unknown as RequestHandler;
    },
);

userRouter.get(
    '/',
    validateQuery(getAllUsersSchema),
    canAccess([Roles.ADMIN]),
    async (req, res, next) => {
        (await userController.getAllUsers(
            req,
            res,
            next,
        )) as unknown as RequestHandler;
    },
);

userRouter.get('/:id', canAccess([Roles.ADMIN]), async (req, res, next) => {
    (await userController.getUserById(
        req,
        res,
        next,
    )) as unknown as RequestHandler;
});

userRouter.delete(
    '/delete/:id',
    canAccess([Roles.ADMIN]),
    async (req, res, next) => {
        (await userController.delete(
            req,
            res,
            next,
        )) as unknown as RequestHandler;
    },
);

export default userRouter;
