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

## Administração da plataforma

O painel administrativo usa uma conta com papel `admin`, separada das contas
de clientes. Em ambiente local, configure as credenciais no `.env`:

```env
ADMIN_EMAIL=adm@adm.com
ADMIN_PASSWORD=123456
ADMIN_NAME=Administrador
```

Quando essas variáveis estão presentes, a conta administrativa é criada de
forma idempotente na inicialização. O painel fica disponível em
`/admin/login` no front-end.

Principais endpoints administrativos:

- `GET /api/admin/overview` - indicadores de contas cadastradas
- `GET /api/admin/users` - listagem paginada com busca e status
- `GET /api/admin/users/:id` - detalhes de uma conta
- `PATCH /api/admin/users/:id` - dados, status e permissões
- `DELETE /api/admin/users/:id` - exclusão da conta e dados relacionados

As permissões disponíveis são: `dashboard`, `sales`, `products`,
`categories`, `customers`, `expenses` e `reports`. Elas são validadas no front-end
e também nas rotas da API.

## Assinaturas SaaS

Cada cliente possui uma assinatura atual vinculada por `subscriptions.user_id`.
O vínculo foi isolado no módulo `subscriptions` para permitir a troca futura de
`user_id` por `account_id` sem migrar agora os dados operacionais existentes.

O acesso a produtos, vendas, clientes, categorias e despesas exige, em conjunto:

- usuário administrativamente ativo;
- permissão individual para o módulo;
- assinatura válida (`trialing`, `active` ou `past_due` dentro da tolerância);
- feature habilitada no plano.

Os limites de produtos, clientes e vendas mensais são contados e validados pela
API antes da criação. Produtos em soft delete não entram na contagem.

### Endpoints de planos e cliente

- `GET /api/plans`
- `GET /api/plans/:code`
- `GET /api/subscriptions/me`
- `GET /api/subscriptions/me/usage`
- `GET /api/subscriptions/me/payments`
- `POST /api/subscriptions/checkout`
- `POST /api/subscriptions/change-plan`
- `POST /api/subscriptions/cancel`
- `POST /api/subscriptions/reactivate`

### Endpoints administrativos de assinatura

- `GET /api/admin/subscriptions`
- `GET /api/admin/subscriptions/metrics`
- `GET /api/admin/subscriptions/:id`
- `PATCH /api/admin/subscriptions/:id`
- `POST /api/admin/subscriptions/:id/extend-trial`
- `POST /api/admin/subscriptions/:id/change-plan`
- `POST /api/admin/subscriptions/:id/suspend`
- `POST /api/admin/subscriptions/:id/reactivate`
- `GET /api/admin/plans`
- `POST /api/admin/plans`
- `PATCH /api/admin/plans/:id`
- `GET /api/admin/payments`

### Planos iniciais

Os preços e regras ficam no PostgreSQL, nunca espalhados pelo front-end:

- `trial`: gratuito por 14 dias;
- `starter`: R$ 49,90/mês, 1 usuário, até 500 produtos, 500 clientes e 1.000 vendas/mês;
- `pro`: R$ 79,90/mês, até 5 usuários, 5.000 produtos, 5.000 clientes e 10.000 vendas/mês;
- `business`: R$ 129,90/mês, usuários, produtos, clientes e vendas ilimitados;
- `founder`: R$ 39,90/mês para sempre para contratos feitos durante o lançamento, com recursos e limites do Pro.

O Starter inclui relatórios básicos. Pro acrescenta relatórios avançados,
exportação Excel/PDF, backup automático, permissões por usuário e suporte
prioritário. Business acrescenta suporte premium e remove os limites. O preço
do Plano Fundador é gravado na assinatura quando o pagamento é confirmado,
portanto alterações futuras no preço do catálogo não afetam o contrato já
ativado.

Use a tela `/admin/planos` para editar preços, features, limites, disponibilidade
e destaque. Também é possível usar `PATCH /api/admin/plans/:id`.

### Cadastro e compatibilidade

O cadastro de cliente cria usuário e teste gratuito na mesma transação. As
contas antigas recebem o plano `trial` no backfill. Administradores não recebem
assinatura.

Para testar, cadastre uma nova conta no front-end, abra `/assinatura` e confirme
o status `Em teste`, os 14 dias e os limites. Para simular suspensão, acesse
`/admin/assinaturas`, use a ação **Suspender** e tente abrir um módulo do negócio
com o cliente. Perfil, planos e `/assinatura` continuam acessíveis. Use
**Reativar** para restaurar o acesso.

### Pagamento e webhook

O adaptador padrão `mock` cria somente pagamentos `pending`. A assinatura nunca
é ativada por uma informação enviada pelo front-end. A confirmação acontece
exclusivamente em um webhook autenticado e idempotente:

```text
POST /api/webhooks/payments/:provider
X-Payment-Signature: sha256=<hmac-do-corpo-bruto>
```

Configure `PAYMENT_PROVIDER` e a credencial correspondente. Para o mock local,
use `MOCK_PAYMENT_WEBHOOK_SECRET`. Eventos processados são registrados em
`payment_webhook_events` por provedor e ID do evento.

Para integrar Mercado Pago, Asaas, Stripe ou Pagar.me, implemente a interface
`PaymentProvider`, registre o adaptador no `PaymentProviderRegistry` e mantenha
no adaptador a validação de assinatura, tradução de status e IDs externos.

### Exclusão de conta e histórico financeiro

Os dados operacionais continuam seguindo a exclusão atual. A chave estrangeira
de `subscriptions.user_id` usa `ON DELETE SET NULL`, preservando assinatura e
pagamentos sem manter o vínculo com o usuário excluído. Esta é a política da
primeira versão; requisitos fiscais futuros devem definir retenção e anonimização
adicionais antes de produção.

## Migrations

As migrations são executadas automaticamente na inicialização da aplicação. A migration inicial verifica se as tabelas já existem antes de criá-las, permitindo execução segura em bancos parcialmente configurados.

As migrations de assinatura criam planos, assinaturas, pagamentos, eventos de
webhook, seed/backfill e convertem datas contratuais para `timestamptz`.

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
