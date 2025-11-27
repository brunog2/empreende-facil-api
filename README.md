# Empreende Fácil - Backend

Backend NestJS para a aplicação Empreende Fácil.

## Tecnologias

- NestJS
- TypeORM
- PostgreSQL
- JWT Authentication
- Docker

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e configure as variáveis:

```bash
cp .env.example .env
```

### 3. Iniciar PostgreSQL com Docker

```bash
cd docker
docker-compose up -d
```

### 4. Executar migrations

```bash
npm run migration:run
```

### 5. Iniciar o servidor

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

## Estrutura

```
backend/
├── src/
│   ├── auth/          # Módulo de autenticação
│   ├── users/         # Módulo de usuários
│   ├── products/      # Módulo de produtos
│   ├── sales/         # Módulo de vendas
│   ├── customers/     # Módulo de clientes
│   ├── expenses/      # Módulo de despesas
│   ├── categories/    # Módulo de categorias
│   ├── common/        # Utilitários comuns
│   └── database/      # Configuração do banco de dados
├── docker/            # Docker Compose
└── package.json
```

## Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar token
- `GET /api/auth/me` - Obter usuário atual

### Produtos
- `GET /api/products` - Listar produtos (com paginação e filtros)
  - Query params: `page`, `limit`, `search`, `categories[]`, `lowStock`, `minSalePrice`, `maxSalePrice`, `minCostPrice`, `maxCostPrice`
- `GET /api/products/:id` - Obter produto
- `POST /api/products` - Criar produto
- `PATCH /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Excluir produto (soft delete)
- `DELETE /api/products/bulk` - Excluir múltiplos produtos (soft delete)
- `GET /api/products/low-stock` - Produtos com estoque baixo

### Vendas
- `GET /api/sales` - Listar vendas (com paginação e filtros)
  - Query params: `page`, `limit`, `search`, `categories[]`, `products[]`, `startDate`, `endDate`
- `GET /api/sales/:id` - Obter venda
- `POST /api/sales` - Criar venda
- `PATCH /api/sales/:id` - Atualizar venda
- `DELETE /api/sales/:id` - Excluir venda
- `DELETE /api/sales/bulk` - Excluir múltiplas vendas
- `GET /api/sales/monthly-total` - Total mensal
- `GET /api/sales/top-products` - Produtos mais vendidos

### Clientes
- `GET /api/customers` - Listar clientes (com paginação e filtros)
  - Query params: `page`, `limit`, `search`
- `GET /api/customers/:id` - Obter cliente
- `POST /api/customers` - Criar cliente
- `PATCH /api/customers/:id` - Atualizar cliente
- `DELETE /api/customers/:id` - Excluir cliente
- `DELETE /api/customers/bulk` - Excluir múltiplos clientes
- `GET /api/customers/search?q=...` - Buscar clientes

### Despesas
- `GET /api/expenses` - Listar despesas
- `GET /api/expenses/:id` - Obter despesa
- `POST /api/expenses` - Criar despesa
- `PATCH /api/expenses/:id` - Atualizar despesa
- `DELETE /api/expenses/:id` - Excluir despesa
- `DELETE /api/expenses/bulk` - Excluir múltiplas despesas
- `GET /api/expenses/monthly-total` - Total mensal
- `GET /api/expenses/by-category` - Por categoria
- `GET /api/expenses/recurring` - Recorrentes

### Categorias
- `GET /api/categories` - Listar categorias (com paginação e filtros)
  - Query params: `page`, `limit`, `search`
- `GET /api/categories/:id` - Obter categoria
- `POST /api/categories` - Criar categoria
- `PATCH /api/categories/:id` - Atualizar categoria
- `DELETE /api/categories/:id` - Excluir categoria (remove referências em produtos)
- `DELETE /api/categories/bulk` - Excluir múltiplas categorias
- `GET /api/categories/search?q=...` - Buscar categorias

## Funcionalidades

### Paginação
Todos os endpoints de listagem suportam paginação via query params:
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10, máximo: 100)

Resposta formatada:
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Filtros
Endpoints de listagem suportam filtros específicos via query params (veja documentação de cada endpoint acima).

### Soft Delete
Produtos usam soft delete (campo `deletedAt`). Produtos deletados não aparecem nas listagens, mas permanecem no banco para manter integridade referencial com vendas.

### Bulk Delete
Endpoints de exclusão em massa disponíveis para: produtos, vendas, categorias, clientes e despesas.
- Body: `{ "ids": ["uuid1", "uuid2", ...] }`

## Autenticação

Todas as rotas (exceto `/api/auth/register` e `/api/auth/login`) requerem autenticação JWT.

Envie o token no header:
```
Authorization: Bearer <token>
```

## Migrations

As migrations são executadas automaticamente na inicialização da aplicação. A migration inicial verifica se as tabelas já existem antes de criá-las, permitindo execução segura em bancos parcialmente configurados.

### Executar migrations manualmente

```bash
# Executar todas as migrations pendentes
npm run migration:run

# Reverter última migration
npm run migration:revert

# Gerar nova migration (após alterar entidades)
npm run migration:generate -- -n NomeDaMigration
```

## Denormalização de Dados

A aplicação utiliza denormalização para preservar dados históricos:
- **Vendas (`sale_items`)**: Armazena `product_name` e `product_price` no momento da venda
- Isso garante que mesmo se um produto for deletado (soft delete), as informações da venda permanecem legíveis

## Integridade de Dados

### Soft Delete em Produtos
- Produtos deletados não aparecem nas listagens
- Produtos com vendas associadas não podem ser deletados (erro retornado)
- Ao deletar uma categoria, produtos que a utilizam têm a categoria definida como `null`

### Exclusão de Vendas
- Ao excluir uma venda, o estoque dos produtos é restaurado automaticamente
- Ao atualizar uma venda, apenas a diferença de quantidade é validada contra o estoque disponível

## Desenvolvimento

### Estrutura de Módulos
Cada módulo segue o padrão:
- `entities/` - Entidades TypeORM
- `dto/` - Data Transfer Objects (validação)
- `repositories/` - Camada de acesso a dados
- `*.service.ts` - Lógica de negócio
- `*.controller.ts` - Endpoints HTTP

### Validação
Todos os DTOs usam `class-validator` para validação automática de entrada.

### Tratamento de Erros
- Filtro global de exceções HTTP (`HttpExceptionFilter`)
- Interceptor de transformação de respostas (`TransformInterceptor`)

## Deploy

### Variáveis de Ambiente Necessárias
- `DB_HOST` - Host do PostgreSQL
- `DB_PORT` - Porta do PostgreSQL (padrão: 5432)
- `DB_USERNAME` - Usuário do banco
- `DB_PASSWORD` - Senha do banco
- `DB_DATABASE` - Nome do banco de dados
- `JWT_SECRET` - Chave secreta para JWT
- `JWT_EXPIRES_IN` - Tempo de expiração do token (ex: "1h")
- `JWT_REFRESH_SECRET` - Chave secreta para refresh token
- `JWT_REFRESH_EXPIRES_IN` - Tempo de expiração do refresh token (ex: "7d")
- `NODE_ENV` - Ambiente (development/production)
- `PORT` - Porta do servidor (padrão: 3000)

### SSL em Produção
A conexão com o banco usa SSL quando `NODE_ENV=production`:
```typescript
ssl: {
  rejectUnauthorized: false
}
```

## Testes

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Cobertura
npm run test:cov
```

