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
- `GET /api/products` - Listar produtos
- `GET /api/products/:id` - Obter produto
- `POST /api/products` - Criar produto
- `PATCH /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Excluir produto
- `GET /api/products/low-stock` - Produtos com estoque baixo

### Vendas
- `GET /api/sales` - Listar vendas
- `GET /api/sales/:id` - Obter venda
- `POST /api/sales` - Criar venda
- `PATCH /api/sales/:id` - Atualizar venda
- `DELETE /api/sales/:id` - Excluir venda
- `GET /api/sales/monthly-total` - Total mensal
- `GET /api/sales/top-products` - Produtos mais vendidos

### Clientes
- `GET /api/customers` - Listar clientes
- `GET /api/customers/:id` - Obter cliente
- `POST /api/customers` - Criar cliente
- `PATCH /api/customers/:id` - Atualizar cliente
- `DELETE /api/customers/:id` - Excluir cliente
- `GET /api/customers/search?q=...` - Buscar clientes

### Despesas
- `GET /api/expenses` - Listar despesas
- `GET /api/expenses/:id` - Obter despesa
- `POST /api/expenses` - Criar despesa
- `PATCH /api/expenses/:id` - Atualizar despesa
- `DELETE /api/expenses/:id` - Excluir despesa
- `GET /api/expenses/monthly-total` - Total mensal
- `GET /api/expenses/by-category` - Por categoria
- `GET /api/expenses/recurring` - Recorrentes

### Categorias
- `GET /api/categories` - Listar categorias
- `GET /api/categories/:id` - Obter categoria
- `POST /api/categories` - Criar categoria
- `PATCH /api/categories/:id` - Atualizar categoria
- `DELETE /api/categories/:id` - Excluir categoria
- `GET /api/categories/search?q=...` - Buscar categorias

## Autenticação

Todas as rotas (exceto `/api/auth/register` e `/api/auth/login`) requerem autenticação JWT.

Envie o token no header:
```
Authorization: Bearer <token>
```


