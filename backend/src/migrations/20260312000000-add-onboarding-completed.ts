import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOnboardingCompleted20260312000000 implements MigrationInterface {
  name = 'AddOnboardingCompleted20260312000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "onboardingCompleted" boolean DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE users DROP COLUMN IF EXISTS "onboardingCompleted"',
    );
  }
}
