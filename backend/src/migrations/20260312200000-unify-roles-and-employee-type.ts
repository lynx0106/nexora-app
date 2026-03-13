import { MigrationInterface, QueryRunner } from 'typeorm';

export class UnifyRolesAndEmployeeType20260312200000
  implements MigrationInterface
{
  name = 'UnifyRolesAndEmployeeType20260312200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar columna employeeType para clasificación de empleados
    await queryRunner.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "employeeType" character varying(80)
    `);

    // 2. Migrar roles antiguos a los 4 nuevos
    // staff, doctor, support -> employee (preservar doctor como employeeType para sector salud)
    await queryRunner.query(`
      UPDATE users SET role = 'employee'
      WHERE role IN ('staff', 'support')
    `);

    await queryRunner.query(`
      UPDATE users u SET role = 'employee', "employeeType" = COALESCE(u."employeeType", 'medico')
      WHERE role = 'doctor'
    `);

    // user -> employee (usuarios internos) o client (si el negocio los trata como cliente)
    // Por defecto: user -> employee (era staff genérico)
    await queryRunner.query(`
      UPDATE users SET role = 'employee'
      WHERE role = 'user'
    `);

    // 3. Actualizar constraints de roles
    await queryRunner.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role_allowed
    `);
    await queryRunner.query(`
      ALTER TABLE users ADD CONSTRAINT chk_users_role_allowed
      CHECK (role IS NULL OR role IN ('superadmin','admin','employee','client'))
    `);

    // 4. Actualizar invitation_codes - constraint puede tener nombre auto o chk_invitations_role_allowed
    await queryRunner.query(`
      ALTER TABLE invitation_codes DROP CONSTRAINT IF EXISTS chk_invitations_role_allowed
    `);
    await queryRunner.query(`
      ALTER TABLE invitation_codes DROP CONSTRAINT IF EXISTS invitation_codes_role_check
    `);
    await queryRunner.query(`
      ALTER TABLE invitation_codes ADD CONSTRAINT chk_invitations_role_allowed
      CHECK (role IN ('client','employee'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE users DROP COLUMN IF EXISTS "employeeType"',
    );

    await queryRunner.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role_allowed
    `);
    await queryRunner.query(`
      ALTER TABLE users ADD CONSTRAINT chk_users_role_allowed
      CHECK (role IS NULL OR role IN ('superadmin','admin','user','staff','doctor','support','employee','client'))
    `);

    await queryRunner.query(`
      ALTER TABLE invitation_codes DROP CONSTRAINT IF EXISTS chk_invitations_role_allowed
    `);
    await queryRunner.query(`
      ALTER TABLE invitation_codes ADD CONSTRAINT chk_invitations_role_allowed
      CHECK (role IN ('client','employee','staff'))
    `);
  }
}
