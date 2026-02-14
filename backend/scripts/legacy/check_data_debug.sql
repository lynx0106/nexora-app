SELECT id, "firstName", role, length(role) as role_len, "tenantId", length("tenantId") as tenant_len FROM users WHERE "tenantId" LIKE 'clinica%';
SELECT id, name, "tenantId", length("tenantId") as tenant_len FROM products WHERE "tenantId" LIKE 'clinica%';
