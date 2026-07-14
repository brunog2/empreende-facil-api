export enum UserRole {
  Admin = 'admin',
  Customer = 'customer',
}

export enum UserPermission {
  Dashboard = 'dashboard',
  Sales = 'sales',
  Products = 'products',
  Categories = 'categories',
  Customers = 'customers',
  Expenses = 'expenses',
  Reports = 'reports',
}

export const DEFAULT_USER_PERMISSIONS = Object.values(UserPermission);
