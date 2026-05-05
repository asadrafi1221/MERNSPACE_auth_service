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
    async getTenants() {
        return await this.tenantRepository.find();
    }
    async getTenantById(id: number) {
        return await this.tenantRepository.findOne({
            where: {
                id: id,
            },
        });
    }
    async updateTenant(id: number, payload: ITenantPayload) {
        const tenant = await this.tenantRepository
            .createQueryBuilder()
            .update(Tenant)
            .set(payload)
            .where('id = :id', { id: id })
            .execute();

        return tenant;
    }
    async deleteTenant(id: number) {
        return await this.tenantRepository.delete({
            id: id,
        });
    }
}
