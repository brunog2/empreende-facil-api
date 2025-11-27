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


