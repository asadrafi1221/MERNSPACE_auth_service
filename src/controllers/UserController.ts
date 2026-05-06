import { Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { UserService } from '../services/UserService';
import {
    CreateUserRequest,
    UpdateUserRequest,
    GetAllUsersRequest,
} from '../types';
import createHttpError from 'http-errors';

export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly logger: Logger,
    ) {}

    async create(req: CreateUserRequest, res: Response, next: NextFunction) {
        try {
            const { firstName, lastName, email, password, tenantId, role } =
                req.body;

            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
                tenantId,
                role,
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
            const { firstName, lastName, email, password, role, tenantId } =
                req.body;
            const userId = Number.parseInt((req.params.id as string) || '1');

            if (Number.isNaN(userId)) {
                const error = createHttpError(400, 'Invalid user ID format');
                return next(error);
            }

            await this.userService.updateUser(userId, {
                firstName,
                lastName,
                email,
                password,
                role,
                tenantId,
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
        req: GetAllUsersRequest,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const page = Number.parseInt(req.query.page || '1');
            const limit = Number.parseInt(req.query.limit || '10');
            const search = req.query.search;

            const result = await this.userService.getAllUsers({
                page,
                limit,
                search,
            });

            this.logger.info('Retrieved all users with pagination');

            return res.status(200).json(result);
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
            const userId = Number.parseInt((req.params.id as string) || '1');

            if (Number.isNaN(userId)) {
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
            const userId = Number.parseInt((req.params.id as string) || '1');

            if (Number.isNaN(userId)) {
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
