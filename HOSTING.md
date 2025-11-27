# Opções Gratuitas para Hospedar a API e Banco de Dados

## 🚀 Melhores Opções (Recomendadas)

### 1. **Render** ⭐ (Mais Fácil)

**URL:** https://render.com

**Vantagens:**

- ✅ Deploy automático via GitHub
- ✅ PostgreSQL gratuito (1 GB)
- ✅ Suporte nativo a Node.js/NestJS
- ✅ SSL automático
- ✅ Sem necessidade de cartão de crédito
- ✅ Interface muito simples

**Limitações:**

- ⚠️ Serviços gratuitos "dormem" após 15 minutos de inatividade
- ⚠️ Primeira requisição após dormir pode demorar ~30 segundos
- ⚠️ 750 horas de CPU por mês (suficiente para projetos pequenos)

**Como usar:**

1. Conecte seu repositório GitHub
2. Crie um "Web Service" para a API
3. Crie um "PostgreSQL Database" separado
4. Configure as variáveis de ambiente

---

### 2. **Railway** ⭐ (Muito Popular)

**URL:** https://railway.app

**Vantagens:**

- ✅ Deploy muito rápido
- ✅ PostgreSQL incluído
- ✅ $5 de crédito grátis por mês (renovável)
- ✅ Suporte a Docker
- ✅ Deploy automático via GitHub

**Limitações:**

- ⚠️ Crédito pode acabar se houver muito tráfego
- ⚠️ Após usar os $5, precisa pagar

**Como usar:**

1. Conecte GitHub
2. Crie novo projeto
3. Adicione PostgreSQL e Web Service
4. Configure variáveis de ambiente

---

### 3. **Fly.io** ⚠️ (Não é mais totalmente gratuito)

**URL:** https://fly.io

**Situação Atual (2024):**

- ❌ **Não tem mais free tier contínuo**
- ✅ $5 de crédito inicial para testar
- ✅ Após usar o crédito, migra para plano "Hobby" ($5/mês com $5 de crédito incluído)
- ✅ 3 GB de volume persistente grátis (para PostgreSQL)
- ✅ Até 3 máquinas compartilhadas (256 MB RAM cada) no plano Hobby

**Vantagens:**

- ✅ Performance excelente
- ✅ Sem sleep (sempre ativo)
- ✅ Suporte a Docker
- ✅ Múltiplas regiões

**Limitações:**

- ⚠️ Requer cartão de crédito (para evitar abusos)
- ⚠️ Custa $5/mês após crédito inicial
- ⚠️ Configuração inicial um pouco mais complexa

**Como usar:**

1. Instale o CLI: `curl -L https://fly.io/install.sh | sh`
2. Crie `fly.toml` para a API
3. Deploy: `fly deploy`

**Nota:** Ainda é uma boa opção se você pode pagar $5/mês, mas não é mais gratuita.

---

### 4. **Neon.tech** (Apenas Banco de Dados)

**URL:** https://neon.tech

**Vantagens:**

- ✅ PostgreSQL serverless moderno
- ✅ 0.5 GB grátis
- ✅ Branching de banco de dados (como Git)
- ✅ Backups automáticos
- ✅ Sem sleep

**Ideal para:**

- Usar apenas o banco de dados (API em outro lugar)
- Desenvolvimento com branches de banco

---

### 5. **Supabase** (Tudo em Um)

**URL:** https://supabase.com

**Vantagens:**

- ✅ PostgreSQL + Backend completo
- ✅ 500 MB de banco grátis
- ✅ Autenticação incluída
- ✅ API REST automática
- ✅ Dashboard completo

**Limitações:**

- ⚠️ Você já tem backend NestJS, então pode ser redundante
- ⚠️ Melhor se quiser migrar tudo para Supabase

---

## 📊 Comparação Rápida

| Plataforma   | API | PostgreSQL   | Sleep  | Dificuldade | Recomendação    |
| ------------ | --- | ------------ | ------ | ----------- | --------------- |
| **Render**   | ✅  | ✅ (1GB)     | ⚠️ Sim | ⭐ Fácil    | ⭐⭐⭐⭐⭐      |
| **Railway**  | ✅  | ✅           | ❌ Não | ⭐ Fácil    | ⭐⭐⭐⭐        |
| **Fly.io**   | ✅  | ✅ (3GB vol) | ❌ Não | ⭐⭐ Média  | ⭐⭐⭐ ($5/mês) |
| **Neon**     | ❌  | ✅ (0.5GB)   | ❌ Não | ⭐ Fácil    | ⭐⭐⭐          |
| **Supabase** | ✅  | ✅ (0.5GB)   | ❌ Não | ⭐ Fácil    | ⭐⭐⭐          |

---

## 🎯 Recomendação Final

### ⭐ Opções REALMENTE Gratuitas (Sem Cartão):

1. **Render** - Mais fácil, tudo em um lugar (tem sleep mode)
2. **Neon.tech** - Apenas banco de dados (sem sleep)

### 💰 Opções com Crédito Inicial:

1. **Railway** - $5 grátis por mês (renovável, mas pode acabar)
2. **Fly.io** - $5 crédito inicial, depois $5/mês

### Para Começar Rápido:

**Render** - Mais fácil de configurar, tudo em um lugar

### Para Melhor Performance (Pago):

**Fly.io** - Sem sleep, sempre rápido ($5/mês após crédito inicial)

### Para Economizar:

**Railway** - $5 grátis por mês, suficiente para começar

---

## 📝 Configuração Básica para Render

### 1. Criar PostgreSQL no Render:

- New → PostgreSQL
- Nome: `empreende-facil-db`
- Copiar a **Internal Database URL**

### 2. Criar Web Service:

- New → Web Service
- Conectar repositório GitHub
- Build Command: `npm install && npm run build`
- Start Command: `npm run start:prod`
- Adicionar variáveis de ambiente:
  ```
  DB_HOST=<host-do-render>
  DB_PORT=5432
  DB_USERNAME=<user>
  DB_PASSWORD=<password>
  DB_DATABASE=<database>
  NODE_ENV=production
  PORT=10000
  JWT_SECRET=<sua-chave-secreta>
  JWT_REFRESH_SECRET=<sua-chave-refresh>
  ```

### 3. Executar Migrations:

Após o deploy, executar migrations manualmente ou criar um script de inicialização.

---

## 🔧 Dicas Importantes

1. **Variáveis de Ambiente:**
   - Nunca commite o arquivo `.env`
   - Configure todas as variáveis na plataforma

2. **Migrations:**
   - Execute após o primeiro deploy
   - Considere criar um script de inicialização

3. **Logs:**
   - Todas as plataformas oferecem logs
   - Use para debug

4. **Backups:**
   - Configure backups automáticos se disponível
   - Exporte dados importantes regularmente

5. **Monitoramento:**
   - Configure alertas se possível
   - Monitore uso de recursos

---

## 🚨 Limitações dos Planos Gratuitos

- **Tráfego limitado** - OK para projetos pessoais/pequenos
- **Recursos limitados** - CPU/RAM reduzidos
- **Sleep mode** - Algumas plataformas "dormem" após inatividade
- **Sem suporte prioritário** - Comunidade apenas

---

## 📚 Próximos Passos

1. Escolha uma plataforma
2. Configure o repositório
3. Faça o deploy
4. Configure variáveis de ambiente
5. Execute migrations
6. Teste a API

**Boa sorte com o deploy! 🚀**
