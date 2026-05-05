import Joi from 'joi';

export const createTenantSchema = Joi.object({
    name: Joi.string().required().messages({
        'string.empty': 'Tenant name is required',
        'any.required': 'Tenant name is required',
    }),
    adress: Joi.string().required().messages({
        'string.empty': 'Tenant adress is required',
        'any.required': 'Tenant adress is required',
    }),
});

export const updateTenantSchema = Joi.object({
    name: Joi.string().empty('').optional().messages({
        'string.empty': 'Tenant name is not allowed',
        'string.min': 'Tenant name must be at least 2 characters long',
        'string.max': 'Tenant name must not exceed 50 characters',
    }),
    adress: Joi.string().empty('').optional().messages({
        'string.empty': 'Tenant adress is not allowed',
        'string.min': 'Tenant adress must be at least 2 characters long',
        'string.max': 'Tenant adress must not exceed 50 characters',
    }),
});
