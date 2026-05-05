import Joi from 'joi';

export const createTenantSchema = Joi.object({
    name: Joi.string().required().messages({
        'string.empty': 'Tenant name is required',
        'any.required': 'Tenant name is required',
    }),
    address: Joi.string().required().messages({
        'string.empty': 'Tenant address is required',
        'any.required': 'Tenant address is required',
    }),
});

export const updateTenantSchema = Joi.object({
    name: Joi.string().empty('').optional().messages({
        'string.empty': 'Tenant name is not allowed',
        'string.min': 'Tenant name must be at least 2 characters long',
        'string.max': 'Tenant name must not exceed 50 characters',
    }),
    address: Joi.string().empty('').optional().messages({
        'string.empty': 'Tenant address is not allowed',
        'string.min': 'Tenant address must be at least 2 characters long',
        'string.max': 'Tenant address must not exceed 50 characters',
    }),
});
