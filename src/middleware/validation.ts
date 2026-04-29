/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';

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

            // Return Joi validation error directly without passing to global error handler
            return res.status(400).json({
                errors: errorMessages.map((message) => ({
                    type: 'ValidationError',
                    message,
                    path: '',
                    location: '',
                })),
            });
        }

        // Replace req.body with validated and sanitized data
        req.body = validationResult.value as T;
        next();
    };
};
