import { Router } from 'express';
import { TenantController } from '../controllers/TenantController';
import { TenantService } from '../services/TenantService';
import { AppDataSource } from '../config/data-source';
import { Tenant } from '../entity/Tenant';
import logger from '../config/logger';
import { canAccess } from '../middleware/canAccess';
import { Roles } from '../constants';
import { validate } from '../middleware/validation';
import { createTenantSchema, updateTenantSchema } from '../validators/tenant';

const tenantRouter = Router();

const tenantRepository = AppDataSource.getRepository(Tenant);

const tenantService = new TenantService(tenantRepository);

const tenantController = new TenantController(tenantService, logger);

tenantRouter.post(
    '/create',
    validate(createTenantSchema),
    canAccess([Roles.ADMIN]),
    async (req, res, next) => {
        await tenantController.create(req, res, next);
    },
);

tenantRouter.post(
    '/update/:id',
    validate(updateTenantSchema),
    canAccess([Roles.ADMIN]),
    async (req, res, next) => {
        await tenantController.update(req, res, next);
    },
);

tenantRouter.delete(
    '/delete/:id',
    canAccess([Roles.ADMIN]),
    async (req, res, next) => {
        await tenantController.delete(req, res, next);
    },
);

tenantRouter.get(
    '/',
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    async (req, res, next) => {
        await tenantController.getAllTenants(req, res, next);
    },
);

tenantRouter.get(
    '/:id',
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    async (req, res, next) => {
        await tenantController.getTenantById(req, res, next);
    },
);

export default tenantRouter;
