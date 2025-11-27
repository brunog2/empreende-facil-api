-- Script para marcar a migration inicial como executada
-- Execute este script no banco de dados antes de rodar as migrations

-- Verificar se a tabela migrations existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'migrations') THEN
    CREATE TABLE migrations (
      id SERIAL PRIMARY KEY,
      timestamp BIGINT NOT NULL,
      name VARCHAR NOT NULL
    );
  END IF;
END $$;

-- Marcar a migration inicial como executada (se ainda não estiver)
INSERT INTO migrations (timestamp, name)
VALUES (1700000000000, 'CreateInitialTables1700000000000')
ON CONFLICT DO NOTHING;

