import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMpMetadata20260215223000 implements MigrationInterface {
  name = 'AddMpMetadata20260215223000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS "mpPaymentId" text',
    );
    await queryRunner.query(
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS "mpPaymentStatus" text',
    );
    await queryRunner.query(
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS "mpMetadata" jsonb',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE orders DROP COLUMN IF EXISTS "mpMetadata"');
    await queryRunner.query('ALTER TABLE orders DROP COLUMN IF EXISTS "mpPaymentStatus"');
    await queryRunner.query('ALTER TABLE orders DROP COLUMN IF EXISTS "mpPaymentId"');
  }
}
