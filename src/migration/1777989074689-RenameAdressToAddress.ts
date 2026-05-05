import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameAdressToAddress1777989074689 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "tenants" RENAME COLUMN "adress" TO "address"`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "tenants" RENAME COLUMN "address" TO "adress"`,
        );
    }
}
