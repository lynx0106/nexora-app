-- =====================================================
-- NEXORA APP - Initial Database Schema
-- Run this in Supabase SQL Editor to create all tables
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TENANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sector TEXT,
    "businessType" TEXT DEFAULT 'other' CHECK ("businessType" IN ('restaurant', 'hotel', 'clinic', 'retail', 'services', 'gym', 'salon', 'other')),
    country TEXT,
    city TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    "openingTime" TEXT DEFAULT '09:00',
    "closingTime" TEXT DEFAULT '18:00',
    "appointmentDuration" INTEGER DEFAULT 60,
    language TEXT,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    currency TEXT DEFAULT 'USD',
    "aiPromptCustomer" TEXT,
    "aiPromptSupport" TEXT,
    "aiPromptInternal" TEXT,
    "mercadoPagoAccessToken" TEXT,
    "mercadoPagoPublicKey" TEXT,
    "openaiApiKey" TEXT,
    "aiModel" TEXT DEFAULT 'gpt-3.5-turbo',
    "tablesCount" INTEGER,
    capacity INTEGER,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IDX_tenants_createdAt" ON tenants ("createdAt");

-- =====================================================
-- 2. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    "passwordHash" TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN DEFAULT TRUE,
    role TEXT CHECK (role IS NULL OR role IN ('superadmin','admin','user','staff','doctor','support','employee','client')),
    "tenantId" TEXT,
    "isAiChatActive" BOOLEAN DEFAULT TRUE,
    "passwordResetTokenHash" TEXT,
    "passwordResetTokenExpiresAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IDX_users_tenantId" ON users ("tenantId");
CREATE INDEX IF NOT EXISTS "IDX_users_role" ON users (role);
CREATE INDEX IF NOT EXISTS "IDX_users_isActive" ON users ("isActive");
CREATE INDEX IF NOT EXISTS "IDX_users_createdAt" ON users ("createdAt");

-- =====================================================
-- 3. PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tenantId" TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    duration INTEGER,
    "imageUrl" TEXT,
    stock INTEGER DEFAULT 0,
    cost DECIMAL(10, 2) DEFAULT 0,
    "minStock" INTEGER DEFAULT 0,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IDX_products_tenantId" ON products ("tenantId");
CREATE INDEX IF NOT EXISTS "IDX_products_isActive" ON products ("isActive");
CREATE INDEX IF NOT EXISTS "IDX_products_createdAt" ON products ("createdAt");
CREATE INDEX IF NOT EXISTS "IDX_products_minStock" ON products ("minStock");
CREATE INDEX IF NOT EXISTS "IDX_products_stock_minStock" ON products (stock, "minStock");

-- =====================================================
-- 4. ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tenantId" TEXT NOT NULL,
    "userId" UUID,
    "shippingAddress" JSONB,
    "customerEmail" TEXT,
    "customerName" TEXT,
    total DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'completed',
    "paymentStatus" TEXT DEFAULT 'pending',
    "paymentMethod" TEXT DEFAULT 'cash',
    "paymentLink" TEXT,
    "preferenceId" TEXT,
    "mpPaymentId" TEXT,
    "mpPaymentStatus" TEXT,
    "mpMetadata" JSONB,
    "publicTokenHash" TEXT,
    "publicTokenExpiresAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IDX_orders_tenantId_createdAt" ON orders ("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "IDX_orders_tenantId_status" ON orders ("tenantId", status);
CREATE INDEX IF NOT EXISTS "IDX_orders_tenantId_paymentStatus" ON orders ("tenantId", "paymentStatus");
CREATE INDEX IF NOT EXISTS "IDX_orders_tenantId_userId" ON orders ("tenantId", "userId");
CREATE INDEX IF NOT EXISTS "IDX_orders_publicTokenHash" ON orders ("publicTokenHash");

-- =====================================================
-- 5. ORDER_ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "orderId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_order_items_orderId" ON order_items ("orderId");
CREATE INDEX IF NOT EXISTS "IDX_order_items_productId" ON order_items ("productId");

-- =====================================================
-- 6. APPOINTMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tenantId" TEXT NOT NULL,
    "dateTime" TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    pax INTEGER,
    occasion TEXT,
    "doctorId" UUID,
    "clientId" UUID NOT NULL,
    "serviceId" UUID,
    "reminderSent24h" BOOLEAN DEFAULT FALSE,
    "reminderSent2h" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IDX_appointments_tenantId_dateTime" ON appointments ("tenantId", "dateTime");
CREATE INDEX IF NOT EXISTS "IDX_appointments_status" ON appointments (status);
CREATE INDEX IF NOT EXISTS "IDX_appointments_doctorId" ON appointments ("doctorId");
CREATE INDEX IF NOT EXISTS "IDX_appointments_clientId" ON appointments ("clientId");
CREATE INDEX IF NOT EXISTS "IDX_appointments_serviceId" ON appointments ("serviceId");

-- =====================================================
-- 7. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    link TEXT,
    "isRead" BOOLEAN DEFAULT FALSE,
    "tenantId" TEXT NOT NULL,
    "userId" UUID,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IDX_notifications_tenantId_createdAt" ON notifications ("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "IDX_notifications_tenantId_isRead" ON notifications ("tenantId", "isRead");
CREATE INDEX IF NOT EXISTS "IDX_notifications_userId_isRead" ON notifications ("userId", "isRead");

-- =====================================================
-- 8. MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "senderId" UUID,
    "tenantId" TEXT NOT NULL,
    scope TEXT DEFAULT 'INTERNAL' CHECK (scope IN ('INTERNAL', 'SUPPORT', 'CUSTOMER')),
    "targetUserId" TEXT,
    "mediaUrl" TEXT,
    type TEXT DEFAULT 'text',
    "isAi" BOOLEAN DEFAULT FALSE,
    "isRead" BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- 9. AUDIT_LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tenantId" TEXT NOT NULL,
    "userId" UUID,
    "userEmail" TEXT,
    action TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    details TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IDX_audit_logs_tenantId_createdAt" ON audit_logs ("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "IDX_audit_logs_entityType_entityId" ON audit_logs ("entityType", "entityId");

-- =====================================================
-- 10. INVITATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tenantId" TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('superadmin','admin','user','staff','doctor','support','employee','client')),
    "inviterUserId" UUID,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "acceptedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_invitations_tokenHash" ON invitations ("tokenHash");
CREATE INDEX IF NOT EXISTS "IDX_invitations_tenantId_email" ON invitations ("tenantId", email);
CREATE INDEX IF NOT EXISTS "IDX_invitations_acceptedAt" ON invitations ("acceptedAt");

-- =====================================================
-- 11. INVITATION_CODES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS invitation_codes (
    id UUID PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'employee', 'staff')),
    "createdBy" TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired')),
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "usedBy" TEXT,
    "usedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 12. AI_USAGE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tenantId" TEXT NOT NULL,
    provider TEXT DEFAULT 'openai',
    model TEXT NOT NULL,
    "inputTokens" INTEGER DEFAULT 0,
    "outputTokens" INTEGER DEFAULT 0,
    "totalTokens" INTEGER DEFAULT 0,
    scope TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Products -> Tenants
ALTER TABLE products 
    DROP CONSTRAINT IF EXISTS fk_products_tenant;
ALTER TABLE products 
    ADD CONSTRAINT fk_products_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT;

-- Orders -> Tenants, Users
ALTER TABLE orders 
    DROP CONSTRAINT IF EXISTS fk_orders_tenant;
ALTER TABLE orders 
    ADD CONSTRAINT fk_orders_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT;

ALTER TABLE orders 
    DROP CONSTRAINT IF EXISTS fk_orders_user;
ALTER TABLE orders 
    ADD CONSTRAINT fk_orders_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL;

-- Order Items -> Orders, Products
ALTER TABLE order_items 
    DROP CONSTRAINT IF EXISTS fk_order_items_order;
ALTER TABLE order_items 
    ADD CONSTRAINT fk_order_items_order FOREIGN KEY ("orderId") REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE order_items 
    DROP CONSTRAINT IF EXISTS fk_order_items_product;
ALTER TABLE order_items 
    ADD CONSTRAINT fk_order_items_product FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE RESTRICT;

-- Appointments -> Tenants, Users, Products
ALTER TABLE appointments 
    DROP CONSTRAINT IF EXISTS fk_appointments_tenant;
ALTER TABLE appointments 
    ADD CONSTRAINT fk_appointments_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT;

ALTER TABLE appointments 
    DROP CONSTRAINT IF EXISTS fk_appointments_doctor;
ALTER TABLE appointments 
    ADD CONSTRAINT fk_appointments_doctor FOREIGN KEY ("doctorId") REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE appointments 
    DROP CONSTRAINT IF EXISTS fk_appointments_client;
ALTER TABLE appointments 
    ADD CONSTRAINT fk_appointments_client FOREIGN KEY ("clientId") REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE appointments 
    DROP CONSTRAINT IF EXISTS fk_appointments_service;
ALTER TABLE appointments 
    ADD CONSTRAINT fk_appointments_service FOREIGN KEY ("serviceId") REFERENCES products(id) ON DELETE SET NULL;

-- Notifications -> Tenants, Users
ALTER TABLE notifications 
    DROP CONSTRAINT IF EXISTS fk_notifications_tenant;
ALTER TABLE notifications 
    ADD CONSTRAINT fk_notifications_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT;

ALTER TABLE notifications 
    DROP CONSTRAINT IF EXISTS fk_notifications_user;
ALTER TABLE notifications 
    ADD CONSTRAINT fk_notifications_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL;

-- Messages -> Tenants, Users
ALTER TABLE messages 
    DROP CONSTRAINT IF EXISTS fk_messages_tenant;
ALTER TABLE messages 
    ADD CONSTRAINT fk_messages_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT;

ALTER TABLE messages 
    DROP CONSTRAINT IF EXISTS fk_messages_sender;
ALTER TABLE messages 
    ADD CONSTRAINT fk_messages_sender FOREIGN KEY ("senderId") REFERENCES users(id) ON DELETE SET NULL;

-- AI Usage -> Tenants
ALTER TABLE ai_usage 
    DROP CONSTRAINT IF EXISTS fk_ai_usage_tenant;
ALTER TABLE ai_usage 
    ADD CONSTRAINT fk_ai_usage_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT;

-- Audit Logs -> Tenants, Users
ALTER TABLE audit_logs 
    DROP CONSTRAINT IF EXISTS fk_audit_logs_tenant;
ALTER TABLE audit_logs 
    ADD CONSTRAINT fk_audit_logs_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT;

ALTER TABLE audit_logs 
    DROP CONSTRAINT IF EXISTS fk_audit_logs_user;
ALTER TABLE audit_logs 
    ADD CONSTRAINT fk_audit_logs_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL;

-- Invitations -> Tenants, Users
ALTER TABLE invitations 
    DROP CONSTRAINT IF EXISTS fk_invitations_tenant;
ALTER TABLE invitations 
    ADD CONSTRAINT fk_invitations_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE invitations 
    DROP CONSTRAINT IF EXISTS fk_invitations_inviter;
ALTER TABLE invitations 
    ADD CONSTRAINT fk_invitations_inviter FOREIGN KEY ("inviterUserId") REFERENCES users(id) ON DELETE SET NULL;

-- Invitation Codes -> Tenants, Users
ALTER TABLE invitation_codes 
    DROP CONSTRAINT IF EXISTS fk_invitation_codes_tenant;
ALTER TABLE invitation_codes 
    ADD CONSTRAINT fk_invitation_codes_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE CASCADE;

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert demo tenants
INSERT INTO tenants (id, name, sector, "businessType", country, city, currency, "createdAt", "updatedAt")
VALUES 
    ('mi-empresa-saas', 'Mi Empresa SaaS', 'services', 'services', 'Ecuador', 'Quito', 'USD', NOW(), NOW()),
    ('clinica-sonrisas', 'Clínica Sonrisas', 'health', 'clinic', 'Ecuador', 'Guayaquil', 'USD', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Note: Superadmin and demo users will be created via API endpoint
-- as password hashing should be done in the application layer
