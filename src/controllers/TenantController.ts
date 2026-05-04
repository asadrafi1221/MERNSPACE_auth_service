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
}
