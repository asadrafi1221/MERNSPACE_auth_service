import { Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { TenantService } from '../services/TenantService';
import { CreateTenantRequest } from '../types';

export class TenantController {
    constructor(
        private tenantService: TenantService,
        private logger: Logger,
    ) {}

    async create(req: CreateTenantRequest, res: Response, next: NextFunction) {
        try {
            const { name, adress } = req.body;

            const tenant = await this.tenantService.create({
                name,
                adress,
            });

            this.logger.info('Tenant has been created');

            return res.status(201).json({
                id: tenant?.id,
            });
        } catch (err) {
            next(err);
        }
    }
    async update(req: CreateTenantRequest, res: Response, next: NextFunction) {
        try {
            const { name, adress } = req.body;
            const tenantId = parseInt((req.params.id as string) || '1');

            if (isNaN(tenantId)) {
                return res.status(400).json({
                    message: 'Invalid tenant ID format',
                });
            }

            await this.tenantService.updateTenant(tenantId, {
                name,
                adress,
            });

            this.logger.info('Tenant has been updated');

            return res.status(200).json({
                id: tenantId,
            });
        } catch (err) {
            next(err);
        }
    }

    async delete(req: CreateTenantRequest, res: Response, next: NextFunction) {
        try {
            const tenantId = parseInt((req.params.id as string) || '1');

            if (isNaN(tenantId)) {
                return res.status(400).json({
                    message: 'Invalid tenant ID format',
                });
            }

            await this.tenantService.deleteTenant(tenantId);

            this.logger.info('Tenant has been deleted');

            return res.status(200).json({
                id: tenantId,
            });
        } catch (err) {
            next(err);
        }
    }

    async getAllTenants(
        req: CreateTenantRequest,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const tenants = await this.tenantService.getTenants();

            this.logger.info('Retrieved all tenants');

            return res.status(200).json({
                tenants,
            });
        } catch (err) {
            next(err);
        }
    }

    async getTenantById(
        req: CreateTenantRequest,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const tenantId = parseInt((req.params.id as string) || '1');

            if (isNaN(tenantId)) {
                return res.status(400).json({
                    message: 'Invalid tenant ID format',
                });
            }

            const tenant = await this.tenantService.getTenantById(tenantId);

            if (!tenant) {
                return res.status(404).json({
                    message: 'Tenant not found',
                });
            }

            this.logger.info(`Retrieved tenant with ID: ${tenantId}`);

            return res.status(200).json({
                tenant,
            });
        } catch (err) {
            next(err);
        }
    }
}
