import { Repository } from 'typeorm';
import { ITenantPayload } from '../types';
import { Tenant } from '../entity/Tenant';

export class TenantService {
    constructor(private tenantRepository: Repository<Tenant>) {}

    async create({ name, adress }: ITenantPayload) {
        return await this.tenantRepository.save({
            name,
            adress,
        });
    }
}
