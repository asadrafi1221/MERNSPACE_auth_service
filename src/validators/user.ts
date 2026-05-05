import Joi from 'joi';

export const registerUserSchema = Joi.object({
    firstName: Joi.string().min(2).max(50).required().messages({
        'string.empty': 'First name is required',
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name must not exceed 50 characters',
        'any.required': 'First name is required',
    }),
    lastName: Joi.string().min(2).max(50).required().messages({
        'string.empty': 'Last name is required',
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name must not exceed 50 characters',
        'any.required': 'Last name is required',
    }),
    email: Joi.string().email().required().messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).max(128).required().messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'any.required': 'Password is required',
    }),
});

export const loginUserSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).max(128).required().messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'any.required': 'Password is required',
    }),
});

export const createUserSchema = Joi.object({
    firstName: Joi.string().min(2).max(50).required().messages({
        'string.empty': 'First name is required',
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name must not exceed 50 characters',
        'any.required': 'First name is required',
    }),
    lastName: Joi.string().min(2).max(50).required().messages({
        'string.empty': 'Last name is required',
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name must not exceed 50 characters',
        'any.required': 'Last name is required',
    }),
    email: Joi.string().email().required().messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).max(128).required().messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'any.required': 'Password is required',
    }),
});

export const updateUserSchema = Joi.object({
    firstName: Joi.string().min(2).max(50).optional().messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name must not exceed 50 characters',
    }),
    lastName: Joi.string().min(2).max(50).optional().messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name must not exceed 50 characters',
    }),
    email: Joi.string().email().optional().messages({
        'string.email': 'Please provide a valid email address',
    }),
    password: Joi.string().min(6).max(128).optional().messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password must not exceed 128 characters',
    }),
    role: Joi.string()
        .valid('customer', 'admin', 'manager')
        .optional()
        .messages({
            'any.only': 'Role must be one of: customer, admin, manager',
        }),
});
