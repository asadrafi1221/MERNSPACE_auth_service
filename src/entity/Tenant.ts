import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({
    name: 'tenants',
})
export class Tenant {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('varchar', { length: 100 })
    name!: string;

    @Column('varchar', { length: 100 })
    address!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
