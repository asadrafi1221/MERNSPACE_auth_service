import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../types';
import createHttpError from 'http-errors';

export const canAccess = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const _req = req as AuthRequest;

            console.log('req.auth : ', _req.auth);

            if (!_req.auth) {
                console.log('req.auth is undefined!');
                const error = createHttpError(401, 'Authentication required');
                next(error);
                return;
            }

            const currentRole = _req.auth.role;

            console.log('currentRole : ', currentRole);

            if (!roles.includes(currentRole)) {
                const error = createHttpError(
                    403,
                    'You dont have permission to acess this route',
                );
                next(error);
                return;
            }
            next();
        } catch (err) {
            next(err);
        }
    };
};
