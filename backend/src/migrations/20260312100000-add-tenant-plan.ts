import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantPlan20260312100000 implements MigrationInterface {
  name = 'AddTenantPlan20260312100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan text DEFAULT 'starter'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE tenants DROP COLUMN IF EXISTS plan');
  }
}
