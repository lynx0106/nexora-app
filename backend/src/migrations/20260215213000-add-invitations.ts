import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvitations20260215213000 implements MigrationInterface {
  name = 'AddInvitations20260215213000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS invitations (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" text NOT NULL,
        email text NOT NULL,
        role text NOT NULL,
        "inviterUserId" uuid NULL,
        "tokenHash" text NOT NULL,
        "expiresAt" timestamptz NOT NULL,
        "acceptedAt" timestamptz NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_invitations_role_allowed CHECK (role IN ('superadmin','admin','user','staff','doctor','support','employee','client'))
      );
    `);

    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_invitations_token_hash" ON invitations ("tokenHash")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_invitations_tenant_email" ON invitations ("tenantId", email)',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_invitations_accepted_at" ON invitations ("acceptedAt")',
    );

    await queryRunner.query(
      'ALTER TABLE invitations ADD CONSTRAINT fk_invitations_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE CASCADE',
    );
    await queryRunner.query(
      'ALTER TABLE invitations ADD CONSTRAINT fk_invitations_inviter FOREIGN KEY ("inviterUserId") REFERENCES users(id) ON DELETE SET NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE invitations DROP CONSTRAINT IF EXISTS fk_invitations_inviter');
    await queryRunner.query('ALTER TABLE invitations DROP CONSTRAINT IF EXISTS fk_invitations_tenant');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_invitations_accepted_at"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_invitations_tenant_email"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_invitations_token_hash"');
    await queryRunner.query('DROP TABLE IF EXISTS invitations');
  }
}
