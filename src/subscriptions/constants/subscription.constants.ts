export enum PlanFeature {
  Dashboard = 'dashboard',
  Sales = 'sales',
  Products = 'products',
  Categories = 'categories',
  Customers = 'customers',
  Expenses = 'expenses',
  Reports = 'reports',
  AdvancedReports = 'advancedReports',
  DataExport = 'dataExport',
  AutomaticBackup = 'automaticBackup',
  UserPermissions = 'userPermissions',
  PrioritySupport = 'prioritySupport',
  PremiumSupport = 'premiumSupport',
}

export enum PlanLimit {
  Products = 'products',
  Customers = 'customers',
  SalesPerMonth = 'salesPerMonth',
  Users = 'users',
}

export type PlanFeatures = Record<PlanFeature, boolean>;
export type PlanLimits = Record<PlanLimit, number | null>;

export enum SubscriptionStatus {
  Trialing = 'trialing',
  Active = 'active',
  PastDue = 'past_due',
  Suspended = 'suspended',
  Canceled = 'canceled',
  Expired = 'expired',
}

export enum BillingCycle {
  Monthly = 'monthly',
  Yearly = 'yearly',
}

export enum PaymentStatus {
  Pending = 'pending',
  Processing = 'processing',
  Paid = 'paid',
  Failed = 'failed',
  Refunded = 'refunded',
  Canceled = 'canceled',
}

export enum WebhookProcessingStatus {
  Processing = 'processing',
  Processed = 'processed',
  Failed = 'failed',
}

export const SUBSCRIPTION_ALLOWED_STATUSES = new Set<SubscriptionStatus>([
  SubscriptionStatus.Trialing,
  SubscriptionStatus.Active,
]);
