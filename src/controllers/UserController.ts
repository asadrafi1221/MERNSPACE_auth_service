import { Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { UserService } from '../services/UserService';
import { CreateUserRequest, UpdateUserRequest } from '../types';
import createHttpError from 'http-errors';
import { User } from '../entity/User';

export class UserController {
    constructor(
        private userService: UserService,
        private logger: Logger,
    ) {}

    async create(req: CreateUserRequest, res: Response, next: NextFunction) {
        try {
            const { firstName, lastName, email, password } = req.body;

            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
            });

            this.logger.info('User has been created');

            return res.status(201).json({
                id: user?.id,
            });
        } catch (err) {
            next(err);
        }
    }

    async update(req: UpdateUserRequest, res: Response, next: NextFunction) {
        try {
            const { firstName, lastName, email, password, role } = req.body;
            const userId = parseInt((req.params.id as string) || '1');

            if (isNaN(userId)) {
                const error = createHttpError(400, 'Invalid user ID format');
                return next(error);
            }

            await this.userService.updateUser(userId, {
                firstName,
                lastName,
                email,
                password,
                role,
            });

            this.logger.info('User has been updated');

            return res.status(200).json({
                id: userId,
            });
        } catch (err) {
            next(err);
        }
    }

    async getAllUsers(
        req: CreateUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const users = await this.userService.getAllUsers();

            this.logger.info('Retrieved all users');

            return res.status(200).json({
                users: users.map((user: User) => ({
                    ...user,
                    password: undefined,
                })),
            });
        } catch (err) {
            next(err);
        }
    }

    async getUserById(
        req: CreateUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const userId = parseInt((req.params.id as string) || '1');

            if (isNaN(userId)) {
                const error = createHttpError(400, 'Invalid user ID format');
                return next(error);
            }

            const user = await this.userService.findById(userId);

            if (!user) {
                const error = createHttpError(404, 'User not found');
                return next(error);
            }

            this.logger.info(`Retrieved user with ID: ${userId}`);

            return res.status(200).json({
                user: { ...user, password: undefined },
            });
        } catch (err) {
            next(err);
        }
    }

    async delete(req: CreateUserRequest, res: Response, next: NextFunction) {
        try {
            const userId = parseInt((req.params.id as string) || '1');

            if (isNaN(userId)) {
                const error = createHttpError(400, 'Invalid user ID format');
                return next(error);
            }

            await this.userService.deleteUser(userId);

            this.logger.info('User has been deleted');

            return res.status(200).json({
                id: userId,
            });
        } catch (err) {
            next(err);
        }
    }
}
