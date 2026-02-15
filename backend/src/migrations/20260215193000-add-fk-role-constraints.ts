import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFkRoleConstraints20260215193000 implements MigrationInterface {
  name = 'AddFkRoleConstraints20260215193000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS "passwordResetTokenHash" text',
    );
    await queryRunner.query(
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS "passwordResetTokenExpiresAt" timestamptz',
    );
    await queryRunner.query(
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS "publicTokenHash" text',
    );
    await queryRunner.query(
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS "publicTokenExpiresAt" timestamptz',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_orders_public_token_hash" ON orders ("publicTokenHash")',
    );

    const uuidConversionStatements = [
      `DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'userId'
      AND data_type IN ('character varying','text')
  ) THEN
    EXECUTE $sql$UPDATE orders SET "userId" = NULL WHERE "userId" = ''$sql$;
    EXECUTE $sql$ALTER TABLE orders ALTER COLUMN "userId" TYPE uuid USING (CASE WHEN "userId" IS NULL OR "userId" = '' THEN NULL WHEN "userId" ~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$' THEN "userId"::uuid ELSE NULL END)$sql$;
  END IF;
END $$;`,
      `DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'orderId'
      AND data_type IN ('character varying','text')
  ) THEN
    EXECUTE $sql$ALTER TABLE order_items ALTER COLUMN "orderId" TYPE uuid USING "orderId"::uuid$sql$;
  END IF;
END $$;`,
      `DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'productId'
      AND data_type IN ('character varying','text')
  ) THEN
    EXECUTE $sql$ALTER TABLE order_items ALTER COLUMN "productId" TYPE uuid USING "productId"::uuid$sql$;
  END IF;
END $$;`,
      `DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'doctorId'
      AND data_type IN ('character varying','text')
  ) THEN
    EXECUTE $sql$UPDATE appointments SET "doctorId" = NULL WHERE "doctorId" = ''$sql$;
    EXECUTE $sql$ALTER TABLE appointments ALTER COLUMN "doctorId" TYPE uuid USING (CASE WHEN "doctorId" IS NULL OR "doctorId" = '' THEN NULL WHEN "doctorId" ~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$' THEN "doctorId"::uuid ELSE NULL END)$sql$;
  END IF;
END $$;`,
      `DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'clientId'
      AND data_type IN ('character varying','text')
  ) THEN
    EXECUTE $sql$ALTER TABLE appointments ALTER COLUMN "clientId" TYPE uuid USING "clientId"::uuid$sql$;
  END IF;
END $$;`,
      `DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'serviceId'
      AND data_type IN ('character varying','text')
  ) THEN
    EXECUTE $sql$UPDATE appointments SET "serviceId" = NULL WHERE "serviceId" = ''$sql$;
    EXECUTE $sql$ALTER TABLE appointments ALTER COLUMN "serviceId" TYPE uuid USING (CASE WHEN "serviceId" IS NULL OR "serviceId" = '' THEN NULL WHEN "serviceId" ~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$' THEN "serviceId"::uuid ELSE NULL END)$sql$;
  END IF;
END $$;`,
      `DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'userId'
      AND data_type IN ('character varying','text')
  ) THEN
    EXECUTE $sql$UPDATE notifications SET "userId" = NULL WHERE "userId" = ''$sql$;
    EXECUTE $sql$ALTER TABLE notifications ALTER COLUMN "userId" TYPE uuid USING (CASE WHEN "userId" IS NULL OR "userId" = '' THEN NULL WHEN "userId" ~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$' THEN "userId"::uuid ELSE NULL END)$sql$;
  END IF;
END $$;`,
      `DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'senderId'
      AND data_type IN ('character varying','text')
  ) THEN
    EXECUTE $sql$UPDATE messages SET "senderId" = NULL WHERE "senderId" = ''$sql$;
    EXECUTE $sql$ALTER TABLE messages ALTER COLUMN "senderId" TYPE uuid USING (CASE WHEN "senderId" IS NULL OR "senderId" = '' THEN NULL WHEN "senderId" ~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$' THEN "senderId"::uuid ELSE NULL END)$sql$;
  END IF;
END $$;`,
      `DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'userId'
      AND data_type IN ('character varying','text')
  ) THEN
    EXECUTE $sql$UPDATE audit_logs SET "userId" = NULL WHERE "userId" = ''$sql$;
    EXECUTE $sql$ALTER TABLE audit_logs ALTER COLUMN "userId" TYPE uuid USING (CASE WHEN "userId" IS NULL OR "userId" = '' THEN NULL WHEN "userId" ~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$' THEN "userId"::uuid ELSE NULL END)$sql$;
  END IF;
END $$;`,
    ];

    for (const statement of uuidConversionStatements) {
      await queryRunner.query(statement);
    }

    await queryRunner.query(
      "ALTER TABLE users ADD CONSTRAINT chk_users_role_allowed CHECK (role IS NULL OR role IN ('superadmin','admin','user','staff','doctor','support','employee','client')) NOT VALID",
    );

    await queryRunner.query(
      'ALTER TABLE products ADD CONSTRAINT fk_products_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT NOT VALID',
    );
    await queryRunner.query(
      'ALTER TABLE orders ADD CONSTRAINT fk_orders_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT NOT VALID',
    );
    await queryRunner.query(
      'ALTER TABLE orders ADD CONSTRAINT fk_orders_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL NOT VALID',
    );
    await queryRunner.query(
      'ALTER TABLE order_items ADD CONSTRAINT fk_order_items_order FOREIGN KEY ("orderId") REFERENCES orders(id) ON DELETE CASCADE NOT VALID',
    );
    await queryRunner.query(
      'ALTER TABLE order_items ADD CONSTRAINT fk_order_items_product FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE RESTRICT NOT VALID',
    );
    await queryRunner.query(
      'ALTER TABLE appointments ADD CONSTRAINT fk_appointments_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT NOT VALID',
    );
    await queryRunner.query(
      'ALTER TABLE appointments ADD CONSTRAINT fk_appointments_doctor FOREIGN KEY ("doctorId") REFERENCES users(id) ON DELETE SET NULL NOT VALID',
    );
    await queryRunner.query(
      'ALTER TABLE appointments ADD CONSTRAINT fk_appointments_client FOREIGN KEY ("clientId") REFERENCES users(id) ON DELETE SET NULL NOT VALID',
    );
    await queryRunner.query(
      'ALTER TABLE appointments ADD CONSTRAINT fk_appointments_service FOREIGN KEY ("serviceId") REFERENCES products(id) ON DELETE SET NULL NOT VALID',
    );
    await queryRunner.query(
      'ALTER TABLE notifications ADD CONSTRAINT fk_notifications_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT NOT VALID',
    );
    await queryRunner.query(
      'ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL NOT VALID',
    );
    await queryRunner.query(
      'ALTER TABLE messages ADD CONSTRAINT fk_messages_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT NOT VALID',
    );
    await queryRunner.query(
      'ALTER TABLE messages ADD CONSTRAINT fk_messages_sender FOREIGN KEY ("senderId") REFERENCES users(id) ON DELETE SET NULL NOT VALID',
    );
    await queryRunner.query(
      'ALTER TABLE ai_usage ADD CONSTRAINT fk_ai_usage_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT NOT VALID',
    );
    await queryRunner.query(
      'ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT NOT VALID',
    );
    await queryRunner.query(
      'ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL NOT VALID',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS fk_audit_logs_user');
    await queryRunner.query('ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS fk_audit_logs_tenant');
    await queryRunner.query('ALTER TABLE ai_usage DROP CONSTRAINT IF EXISTS fk_ai_usage_tenant');
    await queryRunner.query('ALTER TABLE messages DROP CONSTRAINT IF EXISTS fk_messages_sender');
    await queryRunner.query('ALTER TABLE messages DROP CONSTRAINT IF EXISTS fk_messages_tenant');
    await queryRunner.query('ALTER TABLE notifications DROP CONSTRAINT IF EXISTS fk_notifications_user');
    await queryRunner.query('ALTER TABLE notifications DROP CONSTRAINT IF EXISTS fk_notifications_tenant');
    await queryRunner.query('ALTER TABLE appointments DROP CONSTRAINT IF EXISTS fk_appointments_service');
    await queryRunner.query('ALTER TABLE appointments DROP CONSTRAINT IF EXISTS fk_appointments_client');
    await queryRunner.query('ALTER TABLE appointments DROP CONSTRAINT IF EXISTS fk_appointments_doctor');
    await queryRunner.query('ALTER TABLE appointments DROP CONSTRAINT IF EXISTS fk_appointments_tenant');
    await queryRunner.query('ALTER TABLE order_items DROP CONSTRAINT IF EXISTS fk_order_items_product');
    await queryRunner.query('ALTER TABLE order_items DROP CONSTRAINT IF EXISTS fk_order_items_order');
    await queryRunner.query('ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_user');
    await queryRunner.query('ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_tenant');
    await queryRunner.query('ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_tenant');
    await queryRunner.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role_allowed');

    await queryRunner.query(
      'ALTER TABLE audit_logs ALTER COLUMN "userId" TYPE character varying USING "userId"::text',
    );
    await queryRunner.query(
      'ALTER TABLE messages ALTER COLUMN "senderId" TYPE character varying USING "senderId"::text',
    );
    await queryRunner.query(
      'ALTER TABLE notifications ALTER COLUMN "userId" TYPE character varying USING "userId"::text',
    );
    await queryRunner.query(
      'ALTER TABLE appointments ALTER COLUMN "serviceId" TYPE character varying USING "serviceId"::text',
    );
    await queryRunner.query(
      'ALTER TABLE appointments ALTER COLUMN "clientId" TYPE character varying USING "clientId"::text',
    );
    await queryRunner.query(
      'ALTER TABLE appointments ALTER COLUMN "doctorId" TYPE character varying USING "doctorId"::text',
    );
    await queryRunner.query(
      'ALTER TABLE order_items ALTER COLUMN "productId" TYPE character varying USING "productId"::text',
    );
    await queryRunner.query(
      'ALTER TABLE order_items ALTER COLUMN "orderId" TYPE character varying USING "orderId"::text',
    );
    await queryRunner.query(
      'ALTER TABLE orders ALTER COLUMN "userId" TYPE character varying USING "userId"::text',
    );

    await queryRunner.query('DROP INDEX IF EXISTS "IDX_orders_public_token_hash"');
    await queryRunner.query('ALTER TABLE orders DROP COLUMN IF EXISTS "publicTokenExpiresAt"');
    await queryRunner.query('ALTER TABLE orders DROP COLUMN IF EXISTS "publicTokenHash"');
    await queryRunner.query('ALTER TABLE users DROP COLUMN IF EXISTS "passwordResetTokenExpiresAt"');
    await queryRunner.query('ALTER TABLE users DROP COLUMN IF EXISTS "passwordResetTokenHash"');
  }
}
