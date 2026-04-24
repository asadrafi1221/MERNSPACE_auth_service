/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import createHttpError from 'http-errors';

export const validate = <T = any>(schema: Schema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const validationResult = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (validationResult.error) {
            const errorMessages = validationResult.error.details.map(
                (detail) => detail.message,
            );
            const validationError = createHttpError(400, 'Validation failed', {
                details: errorMessages,
            });
            return next(validationError);
        }

        // Replace req.body with validated and sanitized data
        req.body = validationResult.value as T;
        next();
    };
};
