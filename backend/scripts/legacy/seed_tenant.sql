INSERT INTO tenants (id, name, "createdAt", "updatedAt") VALUES ('belleza-plus', 'Belleza Plus', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
