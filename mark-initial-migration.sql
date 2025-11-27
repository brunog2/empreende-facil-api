-- Marcar a migration inicial como executada
INSERT INTO migrations (timestamp, name)
VALUES (1700000000000, 'CreateInitialTables1700000000000')
ON CONFLICT DO NOTHING;
