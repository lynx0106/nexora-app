INSERT INTO tenants (id, name, "createdAt", "updatedAt") VALUES ('clinica-dental-vital', 'Clínica Dental Vital', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
