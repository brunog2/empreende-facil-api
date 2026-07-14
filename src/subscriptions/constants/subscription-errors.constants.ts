export enum SubscriptionErrorCode {
  SubscriptionNotFound = 'SUBSCRIPTION_NOT_FOUND',
  SubscriptionExpired = 'SUBSCRIPTION_EXPIRED',
  SubscriptionSuspended = 'SUBSCRIPTION_SUSPENDED',
  SubscriptionPastDue = 'SUBSCRIPTION_PAST_DUE',
  FeatureNotIncluded = 'FEATURE_NOT_INCLUDED',
  PlanLimitReached = 'PLAN_LIMIT_REACHED',
  PlanNotFound = 'PLAN_NOT_FOUND',
  PlanInactive = 'PLAN_INACTIVE',
  CheckoutCreationFailed = 'CHECKOUT_CREATION_FAILED',
  PaymentConfirmationPending = 'PAYMENT_CONFIRMATION_PENDING',
}

export const SUBSCRIPTION_MESSAGES: Record<SubscriptionErrorCode, string> = {
  [SubscriptionErrorCode.SubscriptionNotFound]:
    'Nenhuma assinatura foi encontrada para esta conta.',
  [SubscriptionErrorCode.SubscriptionExpired]:
    'Seu período de teste ou assinatura terminou. Escolha um plano para continuar usando o Gestão Pro.',
  [SubscriptionErrorCode.SubscriptionSuspended]:
    'Sua assinatura está suspensa. Regularize o pagamento para recuperar o acesso aos recursos.',
  [SubscriptionErrorCode.SubscriptionPastDue]:
    'Não conseguimos confirmar o pagamento da sua assinatura. Regularize o pagamento para evitar a suspensão do acesso.',
  [SubscriptionErrorCode.FeatureNotIncluded]:
    'Este recurso não está incluído no seu plano atual.',
  [SubscriptionErrorCode.PlanLimitReached]:
    'Você atingiu o limite do seu plano.',
  [SubscriptionErrorCode.PlanNotFound]: 'Plano não encontrado.',
  [SubscriptionErrorCode.PlanInactive]:
    'Este plano não está disponível para contratação.',
  [SubscriptionErrorCode.CheckoutCreationFailed]:
    'Não foi possível iniciar o pagamento. Tente novamente.',
  [SubscriptionErrorCode.PaymentConfirmationPending]:
    'Estamos aguardando a confirmação do seu pagamento.',
};

export const FEATURE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  sales: 'Vendas',
  products: 'Produtos',
  categories: 'Categorias',
  customers: 'Clientes',
  expenses: 'Despesas',
  reports: 'Relatórios básicos',
  advancedReports: 'Relatórios avançados',
  dataExport: 'Exportação Excel/PDF',
  automaticBackup: 'Backup automático',
  userPermissions: 'Permissões por usuário',
  prioritySupport: 'Suporte prioritário',
  premiumSupport: 'Suporte premium',
};
