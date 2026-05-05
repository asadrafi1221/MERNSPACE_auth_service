import { Router } from 'express';
import { TenantController } from '../controllers/TenantController';
import { TenantService } from '../services/TenantService';
import { AppDataSource } from '../config/data-source';
import { Tenant } from '../entity/Tenant';
import logger from '../config/logger';
import { canAccess } from '../middleware/canAccess';
import { Roles } from '../constants';

const tenantRouter = Router();

const tenantRepository = AppDataSource.getRepository(Tenant);

const tenantService = new TenantService(tenantRepository);

const tenantController = new TenantController(tenantService, logger);

tenantRouter.post(
    '/create',
    canAccess([Roles.ADMIN]),
    async (req, res, next) => {
        await tenantController.create(req, res, next);
    },
);

export default tenantRouter;
